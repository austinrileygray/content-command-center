import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Increase timeout for Vercel
export const maxDuration = 60
export const runtime = 'nodejs'

/**
 * POST /api/thumbnails/prompts/update
 * Update existing prompt template with new mega prompt
 * Creates a new version
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] Starting prompt update...`)
  
  try {
    const { category, megaPrompt } = await request.json()

    if (!category || !["youtube", "short_form"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'youtube' or 'short_form'" },
        { status: 400 }
      )
    }

    if (!megaPrompt || typeof megaPrompt !== "string" || megaPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Mega prompt is required" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get user profile
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const userId = profiles[0].id

    // Check if template exists
    const { data: existing } = await supabase
      .from("thumbnail_prompt_templates")
      .select("id, version_number")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("is_active", true)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: "No active prompt template found. Please initialize first." },
        { status: 404 }
      )
    }

    // Use Claude to break the mega prompt into modular sections
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "Anthropic API key not configured",
          details: "Please add ANTHROPIC_API_KEY to your Vercel environment variables"
        },
        { status: 500 }
      )
    }

    if (!apiKey.startsWith("sk-ant-")) {
      return NextResponse.json(
        { 
          error: "Invalid Anthropic API key format",
          details: "API key should start with 'sk-ant-'"
        },
        { status: 500 }
      )
    }

    const modelsToTry = [
      "claude-opus-4-5-20251101",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620",
    ]

    let lastError: any = null
    let response: Response | null = null
    let data: any = null

    for (const model of modelsToTry) {
      try {
        const modelStartTime = Date.now()
        console.log(`[${new Date().toISOString()}] Trying model: ${model}`)
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 16000,
            messages: [
              {
                role: "user",
                content: `You are analyzing a comprehensive thumbnail generation prompt for ${category} content. Your task is to break this mega prompt into logical, independent modular sections.

MEGA PROMPT:
${megaPrompt}

INSTRUCTIONS:
Break this prompt into logical, independent sections that can be updated separately. Focus on extracting the thumbnail-specific content. Common sections include:
- color_palette: Color schemes, brand colors, contrast requirements, specific hex codes
- text_style: Font choices, text placement, word limits, capitalization rules
- layout: Composition rules, element placement, rule of thirds, positioning guidelines
- visual_elements: Subject positioning, background style, props, equipment visuals
- emotion_tone: Emotional impact, mood, energy level, facial expressions
- technical_specs: Resolution, aspect ratio, file format requirements
- best_practices: General guidelines, what to avoid, proven patterns
- thumbnail_formulas: Specific formulas and structures (e.g., Style A, Style B, Style C)
- element_library: Visual elements to include (equipment, software, etc.)
- language_guidelines: Industry-specific terminology and preferred wording

CRITICAL: Return ONLY a valid JSON object with this exact structure:
{
  "sections": {
    "section_name": {
      "content": "Detailed content for this section extracted from the prompt...",
      "last_updated": "${new Date().toISOString()}",
      "updated_by": "user"
    }
  }
}

Do NOT include any markdown formatting, code blocks, or explanatory text. Return ONLY the raw JSON object.`,
              },
            ],
          }),
        })

        if (response.ok) {
          data = await response.json()
          const modelDuration = ((Date.now() - modelStartTime) / 1000).toFixed(2)
          console.log(`✅ Success with model: ${model} (took ${modelDuration}s)`)
          break
        } else {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: { message: errorText } }
          }
          lastError = errorData
          console.log(`❌ Model ${model} failed:`, errorData.error?.message)
        }
      } catch (error: any) {
        lastError = error
        console.log(`❌ Model ${model} threw error:`, error.message)
      }
    }

    if (!data || !response || !response.ok) {
      console.error("All models failed. Last error:", lastError)
      const errorMessage = lastError?.error?.message || lastError?.message || "Unknown error"
      
      let userFriendlyMessage = "Failed to analyze prompt"
      if (errorMessage.includes("not_found") || errorMessage.includes("model")) {
        userFriendlyMessage = "Model not available. Please check your Anthropic API plan and model access."
      } else if (errorMessage.includes("authentication") || errorMessage.includes("api_key")) {
        userFriendlyMessage = "API key authentication failed. Please verify your ANTHROPIC_API_KEY in Vercel."
      } else if (errorMessage.includes("rate_limit") || errorMessage.includes("quota")) {
        userFriendlyMessage = "API rate limit exceeded. Please try again in a moment."
      }
      
      return NextResponse.json(
        { 
          error: userFriendlyMessage,
          details: errorMessage,
          triedModels: modelsToTry,
        },
        { status: 500 }
      )
    }

    const content = data.content[0].text

    // Parse the JSON response
    let parsedSections
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedSections = JSON.parse(jsonMatch[0])
      } else {
        parsedSections = JSON.parse(content)
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json(
        { 
          error: "Failed to parse prompt sections",
          details: parseError instanceof Error ? parseError.message : "Invalid JSON response",
          rawContent: content.substring(0, 1000)
        },
        { status: 500 }
      )
    }

    // Deactivate old template
    await supabase
      .from("thumbnail_prompt_templates")
      .update({ is_active: false })
      .eq("id", existing.id)

    // Create new version
    const newVersionNumber = existing.version_number + 1
    const { data: template, error: templateError } = await supabase
      .from("thumbnail_prompt_templates")
      .insert({
        user_id: userId,
        category,
        sections: parsedSections.sections,
        version_number: newVersionNumber,
        is_active: true,
      })
      .select()
      .single()

    if (templateError) {
      console.error("Template creation error:", templateError)
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      )
    }

    // Save to version history
    await supabase.from("thumbnail_prompt_versions").insert({
      user_id: userId,
      category,
      sections: parsedSections.sections,
      version_number: newVersionNumber,
      change_summary: `Updated prompt template to version ${newVersionNumber}`,
      change_type: "update",
      changed_sections: Object.keys(parsedSections.sections),
      created_by: "user",
    })

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[${new Date().toISOString()}] ✅ Prompt update complete (took ${totalDuration}s)`)
    
    return NextResponse.json({
      success: true,
      template,
      sections: parsedSections.sections,
      message: `Prompt updated successfully to version ${newVersionNumber}`,
      duration: totalDuration,
    })
  } catch (error: any) {
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error(`[${new Date().toISOString()}] ❌ Prompt update error (after ${totalDuration}s):`, error)
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to update prompt",
        details: error.stack || "Unknown error occurred",
        duration: totalDuration
      },
      { status: 500 }
    )
  }
}


