import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenAI } from "@google/genai"

interface GenerateRequest {
  prompt: string
  ingredientIds?: string[]
  aspectRatio?: string
  contentIdeaId?: string
  style?: string
}

const MODEL_ID = "gemini-3-pro-image-preview"

/**
 * POST /api/thumbnails/generate
 * Generate a thumbnail using Google's Gemini 3 Pro Image (Nano Banana Pro)
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { prompt, ingredientIds = [], aspectRatio = "16:9", contentIdeaId, style } = body

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "Prompt must be at least 3 characters" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Add GEMINI_API_KEY to your .env.local" },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Initialize Google GenAI
    const ai = new GoogleGenAI({ apiKey })

    // Fetch ingredient images if provided
    let ingredientImages: { base64: string; mimeType: string; name: string }[] = []

    if (ingredientIds.length > 0) {
      const { data: ingredients } = await supabase
        .from("thumbnail_ingredients")
        .select("*")
        .in("id", ingredientIds)

      if (ingredients && ingredients.length > 0) {
        for (const ingredient of ingredients) {
          try {
            const response = await fetch(ingredient.file_url)
            const arrayBuffer = await response.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString("base64")
            const mimeType = response.headers.get("content-type") || "image/jpeg"

            ingredientImages.push({
              base64,
              mimeType,
              name: ingredient.name,
            })
          } catch (err) {
            console.error(`Failed to fetch ingredient ${ingredient.id}:`, err)
          }
        }
      }
    }

    // Build the prompt
    let fullPrompt = `Create a YouTube thumbnail: ${prompt}`

    if (style && style !== "default") {
      fullPrompt += ` Style: ${style}.`
    }

    if (ingredientImages.length > 0) {
      fullPrompt += ` Use the provided reference images.`
    }

    fullPrompt += ` Make it eye-catching, high contrast, bold readable text.`

    // Build contents array - text first, then images (matching working example)
    const contents: any[] = [
      { text: fullPrompt },
    ]

    // Add reference images
    for (const img of ingredientImages) {
      contents.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      })
    }

    // Call the model using SDK (matching working example exactly)
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: contents,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "2K",
        },
      },
    })

    // Extract generated image from response
    let generatedImageBase64: string | null = null
    let generatedImageMimeType: string = "image/png"

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data || null
          generatedImageMimeType = part.inlineData.mimeType || "image/png"
          break
        }
      }
    }

    if (!generatedImageBase64) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      )
    }

    // Only save to database after successful generation
    const { data: thumbnailRecord, error: insertError } = await supabase
      .from("generated_thumbnails")
      .insert({
        user_id: "default",
        content_idea_id: contentIdeaId || null,
        prompt: prompt,
        style: style || null,
        aspect_ratio: aspectRatio,
        ingredients_used: ingredientIds,
        status: "completed",
        metadata: {
          ingredient_count: ingredientImages.length,
          full_prompt: fullPrompt,
        },
      })
      .select()
      .single()

    if (insertError) {
      console.error("Failed to create thumbnail record:", insertError)
    }

    // Upload to Supabase Storage
    const fileExt = generatedImageMimeType.split("/")[1] || "png"
    const fileName = `thumbnails/${thumbnailRecord?.id || Date.now()}.${fileExt}`
    const imageBuffer = Buffer.from(generatedImageBase64, "base64")

    const { error: uploadError } = await supabase.storage
      .from("generated-content")
      .upload(fileName, imageBuffer, {
        contentType: generatedImageMimeType,
        upsert: true,
      })

    let resultUrl: string | null = null

    if (uploadError) {
      console.error("Failed to upload to storage:", uploadError)
      resultUrl = `data:${generatedImageMimeType};base64,${generatedImageBase64}`
    } else {
      const { data: urlData } = supabase.storage
        .from("generated-content")
        .getPublicUrl(fileName)
      resultUrl = urlData.publicUrl
    }

    // Update record with result URL
    if (thumbnailRecord) {
      await supabase
        .from("generated_thumbnails")
        .update({
          result_url: resultUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", thumbnailRecord.id)
    }

    return NextResponse.json({
      success: true,
      thumbnailId: thumbnailRecord?.id,
      imageUrl: resultUrl,
      imageBase64: generatedImageBase64,
      mimeType: generatedImageMimeType,
    })
  } catch (error: any) {
    console.error("Thumbnail generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate thumbnail" },
      { status: 500 }
    )
  }
}
