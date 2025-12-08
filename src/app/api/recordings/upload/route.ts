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
 * POST /api/recordings/upload
 * Upload a recording file to Supabase Storage and create recording entry
 */
export const maxDuration = 540 // 9 minutes for large video uploads (Vercel Pro max is 60s on free tier, but we'll try)
export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const contentIdeaId = formData.get("contentIdeaId") as string
    const contentType = formData.get("contentType") as string // "podcast" or "solo_youtube"
    const editingPromptId = formData.get("editingPromptId") as string
    const platform = formData.get("platform") || "manual"
    const autoProcess = formData.get("autoProcess") === "true"

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      )
    }

    // Validate editing prompt is provided
    if (!editingPromptId) {
      return NextResponse.json(
        { error: "Editing prompt is required. Please select a prompt for podcast or solo YouTube editing." },
        { status: 400 }
      )
    }

    // Validate content type
    if (!contentType || !["podcast", "solo_youtube"].includes(contentType)) {
      return NextResponse.json(
        { error: "Content type must be 'podcast' or 'solo_youtube'" },
        { status: 400 }
      )
    }

    // Validate file type (video or audio files)
    const validVideoTypes = [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
      "video/mov"
    ]
    
    const validAudioTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/m4a",
      "audio/aac"
    ]

    const isValidVideo = validVideoTypes.includes(file.type)
    const isValidAudio = validAudioTypes.includes(file.type)

    if (!isValidVideo && !isValidAudio) {
      return NextResponse.json(
        { error: "File must be a video (mp4, mov, avi, webm) or audio (mp3, wav, m4a) file" },
        { status: 400 }
      )
    }

    // Validate file size (max 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 2GB" },
        { status: 400 }
      )
    }

    // Check Vercel body size limits (50MB on Pro, 4.5MB on Free)
    // For files > 50MB, we should use direct Supabase upload instead
    const vercelLimit = 50 * 1024 * 1024 // 50MB
    if (file.size > vercelLimit) {
      return NextResponse.json(
        { 
          error: "File too large for direct upload",
          message: `Files larger than 50MB cannot be uploaded through this method. File size: ${(file.size / 1024 / 1024).toFixed(2)} MB. Please use direct Supabase Storage upload.`,
          fileSize: file.size,
          limit: vercelLimit,
          requiresDirectUpload: true
        },
        { status: 413 } // Payload Too Large
      )
    }

    // Use admin client
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
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const fileName = `${userId}/recordings/${timestamp}-${randomId}.${fileExt}`
    const filePath = fileName

    // Convert File to ArrayBuffer for Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("recordings")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      
      if (uploadError.message.includes("Bucket not found")) {
        return NextResponse.json(
          { 
            error: "Storage bucket 'recordings' not found. Please create it in Supabase Storage.",
            details: "Go to Supabase Dashboard > Storage > Create bucket named 'recordings' with public access"
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
      .from("recordings")
      .getPublicUrl(filePath)

    const recordingUrl = urlData.publicUrl

    // Create or get content idea
    let ideaId = contentIdeaId
    
    if (!ideaId) {
      // Create a new content idea from filename
      const format = contentType === "podcast" ? "guest_interview" : "solo_youtube"
      const { data: newIdea, error: ideaError } = await supabase
        .from("content_ideas")
        .insert({
          user_id: userId,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          format: format,
          status: "recording",
          recording_platform: platform as string,
        })
        .select()
        .single()

      if (ideaError || !newIdea) {
        // Clean up uploaded file
        await supabase.storage.from("recordings").remove([filePath])
        return NextResponse.json(
          { error: "Failed to create content idea" },
          { status: 500 }
        )
      }
      
      ideaId = newIdea.id
    } else {
      // Update existing idea with recording URL
      await supabase
        .from("content_ideas")
        .update({
          recording_url: recordingUrl,
          recording_platform: platform as string,
          status: "recording",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ideaId)
    }

    // Create recording entry with editing prompt link
    const recordingData: any = {
      content_idea_id: ideaId,
      platform: platform as string,
      external_url: recordingUrl,
      status: "completed",
      actual_end: new Date().toISOString(),
      recording_urls: {
        manual: recordingUrl,
      },
    }

    // Link to editing prompt if provided
    if (editingPromptId) {
      recordingData.editing_prompt_id = editingPromptId
    }

    const { data: recording, error: recordingError } = await supabase
      .from("recordings")
      .insert(recordingData)
      .select()
      .single()

    if (recordingError) {
      console.error("Recording creation error:", recordingError)
      // Don't clean up file - it's uploaded successfully
      return NextResponse.json(
        { error: "Failed to create recording entry" },
        { status: 500 }
      )
    }

    // Create video editing job
    const { data: editingJob, error: editingJobError } = await supabase
      .from("video_editing_jobs")
      .insert({
        recording_id: recording.id,
        content_idea_id: ideaId,
        master_prompt_id: editingPromptId || null,
        status: "processing",
        processing_started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (editingJobError) {
      console.error("Editing job creation error:", editingJobError)
      // Continue - don't fail the upload if editing job creation fails
    } else {
      // Link editing job to recording
      await supabase
        .from("recordings")
        .update({ editing_job_id: editingJob.id })
        .eq("id", recording.id)
    }

    // If autoProcess is enabled, trigger the automated workflow
    if (autoProcess) {
      // Trigger workflow asynchronously (don't wait)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/workflow/process-recording`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contentIdeaId: ideaId,
          recordingId: recording.id,
          editingJobId: editingJob?.id,
        }),
      }).catch(err => {
        console.error("Failed to trigger automated workflow:", err)
        // Don't fail the upload if workflow trigger fails
      })
    }

    return NextResponse.json({ 
      recording,
      contentIdeaId: ideaId,
      recordingUrl,
      success: true,
      message: autoProcess 
        ? "Recording uploaded and automated workflow started!" 
        : "Recording uploaded successfully"
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    
    // Ensure we always return JSON, even on unexpected errors
    try {
      return NextResponse.json(
        { 
          error: error.message || "Failed to upload recording",
          details: error.stack || undefined 
        },
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    } catch (jsonError) {
      // If even JSON serialization fails, return plain text with JSON wrapper
      return new NextResponse(
        JSON.stringify({ error: "Internal server error", details: "Failed to serialize error response" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }
  }
}






