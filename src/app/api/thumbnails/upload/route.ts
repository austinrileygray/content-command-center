import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/thumbnails/upload
 * Upload a thumbnail for training
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = formData.get("category") as string
    const notes = formData.get("notes") as string | null

    if (!file || !category) {
      return NextResponse.json(
        { error: "File and category are required" },
        { status: 400 }
      )
    }

    if (!["youtube", "short_form"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'youtube' or 'short_form'" },
        { status: 400 }
      )
    }

    // For now, convert to base64 data URL
    // In production, upload to Supabase Storage or another service
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const imageUrl = `data:${file.type};base64,${base64}`

    const supabase = await createClient()

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

    // Save to database
    const { data, error } = await supabase
      .from("thumbnail_training")
      .insert({
        user_id: profiles[0].id,
        category,
        image_url: imageUrl,
        source_type: "manual",
        approved: true,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to save thumbnail" },
        { status: 500 }
      )
    }

    return NextResponse.json({ thumbnail: data })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload thumbnail" },
      { status: 500 }
    )
  }
}
