import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Webhook handler for editing service (Descript, RunwayML, etc.)
 * Called when editing job is completed
 */

interface EditingServiceWebhookPayload {
  event: 'job.completed' | 'job.failed' | 'job.progress'
  jobId: string
  status: 'completed' | 'failed'
  versions?: Array<{
    version: number
    videoUrl: string
    thumbnailUrl?: string
    duration?: number
    metadata?: Record<string, any>
  }>
  error?: string
  progress?: number
}

export async function POST(request: NextRequest) {
  try {
    const payload: EditingServiceWebhookPayload = await request.json()
    
    console.log('Editing service webhook received:', payload.event, payload.jobId)

    const supabase = await createClient()

    // Find the editing job by external job ID (stored in editing_job_id field)
    const { data: editingJob, error: findError } = await supabase
      .from('video_editing_jobs')
      .select('*, recording:recordings(*), content_idea:content_ideas(*)')
      .eq('editing_job_id', payload.jobId)
      .single()

    if (findError || !editingJob) {
      console.error('Editing job not found for job ID:', payload.jobId)
      return NextResponse.json({ error: 'Editing job not found' }, { status: 404 })
    }

    // Handle different webhook events
    switch (payload.event) {
      case 'job.completed':
        await handleEditingCompleted(editingJob.id, payload)
        break
      
      case 'job.failed':
        await handleEditingFailed(editingJob.id, payload)
        break
      
      case 'job.progress':
        // Update progress if needed
        await supabase
          .from('video_editing_jobs')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingJob.id)
        break
      
      default:
        console.log('Unknown editing service event:', payload.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Editing service webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleEditingCompleted(
  editingJobId: string,
  payload: EditingServiceWebhookPayload
) {
  const supabase = await createClient()

  if (!payload.versions || payload.versions.length === 0) {
    console.log('No versions in editing completion payload')
    return
  }

  // Store versions in the editing job
  const versions = payload.versions.map(v => ({
    version: v.version,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl || null,
    duration: v.duration || null,
    metadata: v.metadata || {},
    created_at: new Date().toISOString(),
  }))

  // Update editing job with versions and status
  await supabase
    .from('video_editing_jobs')
    .update({
      status: 'ready_for_review',
      versions: versions,
      processing_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', editingJobId)

  // Get the content idea to trigger next workflow step (Submagic)
  const { data: editingJob } = await supabase
    .from('video_editing_jobs')
    .select('content_idea_id, recording_id')
    .eq('id', editingJobId)
    .single()

  if (editingJob) {
    // Update content idea with the first edited version URL
    const firstVersion = versions[0]
    if (firstVersion?.videoUrl) {
      await supabase
        .from('content_ideas')
        .update({
          recording_url: firstVersion.videoUrl, // Use edited version for Submagic
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingJob.content_idea_id)
    }

    // Trigger Submagic workflow with the edited video
    // This will generate clips from the edited long-form video
    const processUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://contentmotor.co'}/api/workflow/process-clips`
    fetch(processUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentIdeaId: editingJob.content_idea_id,
        recordingId: editingJob.recording_id,
      }),
    }).catch(err => {
      console.error("Failed to trigger clip generation:", err)
    })
  }

  console.log(`Editing job ${editingJobId} completed with ${versions.length} versions`)
}

async function handleEditingFailed(
  editingJobId: string,
  payload: EditingServiceWebhookPayload
) {
  const supabase = await createClient()

  // Update editing job status to failed
  await supabase
    .from('video_editing_jobs')
    .update({
      status: 'processing', // Reset to allow retry
      updated_at: new Date().toISOString(),
    })
    .eq('id', editingJobId)

  // Add error to edit history
  const { data: job } = await supabase
    .from('video_editing_jobs')
    .select('edit_history')
    .eq('id', editingJobId)
    .single()

  const editHistory = (job?.edit_history as any[]) || []
  editHistory.push({
    type: 'error',
    message: payload.error || 'Editing failed',
    timestamp: new Date().toISOString(),
  })

  await supabase
    .from('video_editing_jobs')
    .update({
      edit_history: editHistory,
    })
    .eq('id', editingJobId)

  console.error(`Editing job ${editingJobId} failed:`, payload.error)
}









