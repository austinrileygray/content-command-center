import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role for uploads to bypass RLS
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

/**
 * POST /api/thumbnails/upload
 * Upload a thumbnail for training using Supabase Storage
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS
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

    // Generate unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/${category}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = fileName

    // Convert File to ArrayBuffer for Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("thumbnails")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      
      // If bucket doesn't exist, try to create it (this might fail if no permissions)
      // For now, return a helpful error
      if (uploadError.message.includes("Bucket not found")) {
        return NextResponse.json(
          { 
            error: "Storage bucket 'thumbnails' not found. Please create it in Supabase Storage.",
            details: "Go to Supabase Dashboard > Storage > Create bucket named 'thumbnails' with public access"
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("thumbnails")
      .getPublicUrl(filePath)

    const imageUrl = urlData.publicUrl

    // Save to database with notes
    const { data, error: dbError } = await supabase
      .from("thumbnail_training")
      .insert({
        user_id: userId,
        category,
        image_url: imageUrl,
        source_type: "manual",
        approved: true,
        notes: notes?.trim() || null, // Ensure notes are saved properly
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("thumbnails").remove([filePath])
      
      return NextResponse.json(
        { error: `Failed to save thumbnail: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Trigger AI training analysis if notes are provided
    if (notes && notes.trim().length > 0) {
      // Analyze training data asynchronously (don't wait for it)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/analyze-thumbnail-training`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      }).catch(err => {
        console.error("Failed to trigger AI training analysis:", err)
        // Don't fail the upload if analysis fails
      })
    }

    return NextResponse.json({ 
      thumbnail: data,
      success: true,
      message: "Thumbnail uploaded and notes saved successfully. AI training analysis started."
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload thumbnail" },
      { status: 500 }
    )
  }
}


