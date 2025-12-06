import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role for generating signed URLs
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
 * POST /api/recordings/get-upload-url
 * Generate a signed upload URL for direct Supabase Storage upload
 * This bypasses Vercel's body size limits
 */
export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType, fileSize } = await request.json()

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "File name and content type are required" },
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

    // Generate unique file path
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const fileExt = fileName.split(".").pop()
    const filePath = `${userId}/recordings/${timestamp}-${randomId}.${fileExt}`

    // Note: For large files, we'll use direct client-side upload
    // This endpoint returns the file path that should be used
    return NextResponse.json({
      filePath,
      success: true,
      message: "Use direct client-side Supabase Storage upload"
    })
  } catch (error: any) {
    console.error("Get upload URL error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}








