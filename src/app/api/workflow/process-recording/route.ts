import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSubmagicClient } from "@/lib/submagic"

/**
 * POST /api/workflow/process-recording
 * Automated workflow: Upload → Edit → Submagic → Thumbnails → Review
 * 
 * This endpoint:
 * 1. Sends recording to Editing Service for long-form editing (if editing job exists)
 * 2. After editing completes (via webhook), sends edited video to Submagic for clip generation
 * 3. After clips are ready (via webhook), generates thumbnails
 * 4. Clips ready for manual review and approval
 * 
 * Note: If editing service is not configured, falls back to direct Submagic processing
 */
export const maxDuration = 300 // 5 minutes
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { contentIdeaId, recordingId, editingJobId } = await request.json()

    if (!contentIdeaId) {
      return NextResponse.json(
        { error: "Content idea ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get content idea and recording
    const { data: contentIdea, error: ideaError } = await supabase
      .from("content_ideas")
      .select("*")
      .eq("id", contentIdeaId)
      .single()

    if (ideaError || !contentIdea) {
      return NextResponse.json(
        { error: "Content idea not found" },
        { status: 404 }
      )
    }

    if (!contentIdea.recording_url) {
      return NextResponse.json(
        { error: "No recording URL found for this content idea" },
        { status: 400 }
      )
    }

    // Get recording with editing job and prompt if available
    let editingJob = null
    let editingPrompt = null
    if (recordingId) {
      const { data: recording } = await supabase
        .from("recordings")
        .select("editing_prompt_id, editing_job_id, editing_prompt:recording_editing_prompts(*), editing_job:video_editing_jobs(*)")
        .eq("id", recordingId)
        .single()

      if (recording?.editing_prompt) {
        editingPrompt = Array.isArray(recording.editing_prompt) 
          ? recording.editing_prompt[0] 
          : recording.editing_prompt
      }
      if (recording?.editing_job) {
        editingJob = Array.isArray(recording.editing_job) 
          ? recording.editing_job[0] 
          : recording.editing_job
      }
    }

    // STEP 1: Send to Editing Service for long-form editing (if editing job exists and not already processed)
    if (editingJobId || editingJob) {
      const jobId = editingJobId || (editingJob && typeof editingJob === 'object' && 'id' in editingJob ? editingJob.id : null)
      
      // Check if editing is already completed
      if (editingJob?.status === 'ready_for_review' && editingJob?.versions && Array.isArray(editingJob.versions) && editingJob.versions.length > 0) {
        // Editing already complete, skip to Submagic
        console.log('Editing already completed, proceeding to clip generation')
      } else {
        // Submit to editing service
        try {
          const { getEditingServiceClient } = await import('@/lib/editing-service')
          const editingClient = getEditingServiceClient()
          
          // Get the prompt to use (video-specific or master)
          const promptToUse = editingJob?.video_specific_prompt_id 
            ? await supabase.from('video_specific_prompts').select('prompt_text').eq('id', editingJob.video_specific_prompt_id).single()
            : editingPrompt 
              ? { data: { prompt_text: editingPrompt.prompt_text } }
              : null

          if (promptToUse?.data?.prompt_text) {
            const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://contentmotor.co'}/api/webhooks/editing-service`
            
            const editingResponse = await editingClient.submitEditingJob({
              videoUrl: contentIdea.recording_url,
              prompt: promptToUse.data.prompt_text,
              webhookUrl,
              options: {
                generateVersions: 3, // Generate 3 versions
              }
            })

            // Update editing job with external service job ID
            const editingServiceBase = process.env.EDITING_SERVICE_BASE_URL || 'https://api.descript.com/v1'
            await supabase
              .from('video_editing_jobs')
              .update({
                editing_service: process.env.EDITING_SERVICE_TYPE || 'descript',
                editing_job_id: editingResponse.jobId,
                editing_service_url: editingResponse.projectId ? `${editingServiceBase}/projects/${editingResponse.projectId}` : null,
                status: 'processing',
                processing_started_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', jobId)

            return NextResponse.json({
              success: true,
              message: "Recording sent to editing service. Will proceed to clip generation after editing completes.",
              editingJobId: editingResponse.jobId,
              workflow: {
                step1: "✅ Sent to Editing Service",
                step2: "⏳ Waiting for editing to complete...",
                step3: "⏳ Will generate clips after editing",
                step4: "⏳ Will generate thumbnails after clips",
              },
            })
          }
        } catch (editingError: any) {
          console.error("Editing service error:", editingError)
          // If editing service is not configured or fails, continue to Submagic
          console.log("Editing service not available, proceeding directly to clip generation")
          // Don't return error - continue to Submagic as fallback
        }
      }
    }

    // STEP 2: Send to Submagic for Magic Clips generation (or STEP 1 if no editing)
    const submagic = getSubmagicClient()
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://contentmotor.co'}/api/webhooks/submagic`

    try {
      const submagicResponse = await submagic.createMagicClips({
        title: contentIdea.title,
        language: "en",
        videoUrl: contentIdea.recording_url,
        templateName: "Hormozi 2", // Default template
        webhookUrl,
      })

      // Update content idea with Submagic project ID
      await supabase
        .from("content_ideas")
        .update({
          submagic_project_id: submagicResponse.id,
          submagic_template: "Hormozi 2",
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentIdeaId)

      // Trigger Zapier webhook for workflow started
      const { triggerZapierWebhookAsync } = await import("@/lib/zapier")
      triggerZapierWebhookAsync('workflow.started', {
        contentIdeaId,
        recordingId,
        workflowType: 'submagic_clips',
        submagicProjectId: submagicResponse.id,
      })

      return NextResponse.json({
        success: true,
        message: "Automated workflow started! Recording sent to Submagic for clip generation.",
        submagicProjectId: submagicResponse.id,
        workflow: {
          step1: "✅ Sent to Submagic",
          step2: "⏳ Waiting for clips...",
          step3: "⏳ Will generate thumbnails after clips",
          step4: "⏳ Will publish to YouTube after approval",
        },
      })
    } catch (submagicError: any) {
      console.error("Submagic error:", submagicError)
      return NextResponse.json(
        { 
          error: "Failed to send to Submagic",
          details: submagicError.message 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Workflow processing error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process recording" },
      { status: 500 }
    )
  }
}



