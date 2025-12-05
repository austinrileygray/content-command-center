import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * GET /api/thumbnails/ingredients
 * List all thumbnail ingredients
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from("thumbnail_ingredients")
      .select("*")
      .order("created_at", { ascending: false })

    if (type) {
      query = query.eq("type", type)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ingredients: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch ingredients" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/thumbnails/ingredients
 * Upload a new ingredient
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const type = formData.get("type") as string

    if (!file || !name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: file, name, type" },
        { status: 400 }
      )
    }

    const validTypes = ["face", "inspiration", "logo", "background", "other"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `ingredients/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-content")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("generated-content")
      .getPublicUrl(fileName)

    // Create ingredient record
    const { data: ingredient, error: insertError } = await supabase
      .from("thumbnail_ingredients")
      .insert({
        user_id: "default",
        name,
        type,
        file_url: urlData.publicUrl,
        thumbnail_url: urlData.publicUrl,
        metadata: {
          original_filename: file.name,
          size: file.size,
          mime_type: file.type,
        },
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ingredient })
  } catch (error: any) {
    console.error("Ingredient upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload ingredient" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/thumbnails/ingredients
 * Delete an ingredient
 */
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Missing ingredient ID" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get ingredient to find file path
    const { data: ingredient } = await supabase
      .from("thumbnail_ingredients")
      .select("file_url")
      .eq("id", id)
      .single()

    // Delete from storage if possible
    if (ingredient?.file_url) {
      const path = ingredient.file_url.split("/generated-content/")[1]
      if (path) {
        await supabase.storage.from("generated-content").remove([path])
      }
    }

    // Delete record
    const { error } = await supabase
      .from("thumbnail_ingredients")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete ingredient" },
      { status: 500 }
    )
  }
}
