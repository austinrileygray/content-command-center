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
 * POST /api/recordings/create-from-url
 * Create recording entry after direct Supabase Storage upload
 * Used for large files that bypass Vercel's body size limits
 */
export async function POST(request: NextRequest) {
  try {
    const {
      recordingUrl,
      filePath,
      fileName,
      contentType,
      editingPromptId,
      contentIdeaId,
      platform = "manual",
      autoProcess = false,
    } = await request.json()

    if (!recordingUrl || !filePath || !editingPromptId || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields: recordingUrl, filePath, editingPromptId, contentType" },
        { status: 400 }
      )
    }

    if (!["podcast", "solo_youtube"].includes(contentType)) {
      return NextResponse.json(
        { error: "Content type must be 'podcast' or 'solo_youtube'" },
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

    // Create or get content idea
    let ideaId = contentIdeaId
    
    if (!ideaId) {
      // Create a new content idea from filename
      const format = contentType === "podcast" ? "guest_interview" : "solo_youtube"
      const { data: newIdea, error: ideaError } = await supabase
        .from("content_ideas")
        .insert({
          user_id: userId,
          title: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
          format: format,
          status: "recording",
          recording_platform: platform,
          recording_url: recordingUrl,
        })
        .select()
        .single()

      if (ideaError || !newIdea) {
        return NextResponse.json(
          { error: "Failed to create content idea", details: ideaError?.message },
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
          recording_platform: platform,
          status: "recording",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ideaId)
    }

    // Create recording entry with editing prompt link
    const recordingData: any = {
      content_idea_id: ideaId,
      platform: platform,
      external_url: recordingUrl,
      status: "completed",
      actual_end: new Date().toISOString(),
      recording_urls: {
        manual: recordingUrl,
      },
      editing_prompt_id: editingPromptId,
    }

    const { data: recording, error: recordingError } = await supabase
      .from("recordings")
      .insert(recordingData)
      .select()
      .single()

    if (recordingError) {
      console.error("Recording creation error:", recordingError)
      return NextResponse.json(
        { error: "Failed to create recording entry", details: recordingError.message },
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

    // Trigger Zapier webhook for recording uploaded
    const { triggerZapierWebhookAsync } = await import("@/lib/zapier")
    triggerZapierWebhookAsync('recording.uploaded', {
      recordingId: recording.id,
      contentIdeaId: ideaId,
      platform,
      filePath,
      fileName,
      contentType,
      autoProcess,
    })

    // If autoProcess is enabled, trigger the automated workflow
    if (autoProcess) {
      // Trigger workflow asynchronously (don't wait)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://contentmotor.co'}/api/workflow/process-recording`, {
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
    console.error("Create from URL error:", error)
    return NextResponse.json(
      { 
        error: error.message || "Failed to create recording",
        details: error.stack || undefined 
      },
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}








