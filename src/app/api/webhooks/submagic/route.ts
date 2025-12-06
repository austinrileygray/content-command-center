import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for webhook handlers (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SubmagicWebhookPayload {
  event: 'project.completed' | 'magic_clips.completed' | 'project.failed'
  projectId: string
  status: 'completed' | 'failed'
  // For magic_clips.completed
  clips?: Array<{
    id: string
    title: string
    downloadUrl: string
    thumbnailUrl?: string
    duration: number
    viralityScore?: number
    transcript?: string
  }>
  // For project.completed (single video processing)
  downloadUrl?: string
  transcript?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const payload: SubmagicWebhookPayload = await request.json()
    
    console.log('Submagic webhook received:', payload.event, payload.projectId)

    // Find the content idea associated with this Submagic project
    const { data: contentIdea, error: findError } = await supabase
      .from('content_ideas')
      .select('*')
      .eq('submagic_project_id', payload.projectId)
      .single()

    if (findError || !contentIdea) {
      console.error('Content idea not found for Submagic project:', payload.projectId)
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 })
    }

    // Handle different webhook events
    switch (payload.event) {
      case 'magic_clips.completed':
        await handleMagicClipsCompleted(contentIdea.id, payload)
        break
      
      case 'project.completed':
        await handleProjectCompleted(contentIdea.id, payload)
        break
      
      case 'project.failed':
        await handleProjectFailed(contentIdea.id, payload)
        break
      
      default:
        console.log('Unknown Submagic event:', payload.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submagic webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleMagicClipsCompleted(
  contentIdeaId: string,
  payload: SubmagicWebhookPayload
) {
  if (!payload.clips || payload.clips.length === 0) {
    console.log('No clips in Magic Clips response')
    return
  }

  // Create asset records for each clip
  const assets = payload.clips.map((clip, index) => ({
    content_idea_id: contentIdeaId,
    type: 'clip' as const,
    status: 'ready' as const,  // Ready for review
    title: clip.title || `Clip ${index + 1}`,
    file_url: clip.downloadUrl,
    thumbnail_url: clip.thumbnailUrl || null,
    duration: clip.duration,
    virality_score: clip.viralityScore || null,
    submagic_clip_id: clip.id,
    metadata: {
      transcript: clip.transcript,
      suggestedTitle: clip.title,
    },
    platform: 'submagic',
  }))

  // Insert all clips as assets
  const { error: insertError } = await supabase
    .from('assets')
    .insert(assets)

  if (insertError) {
    console.error('Error inserting clip assets:', insertError)
    throw insertError
  }

  // Update content idea status to ready_to_publish
  await supabase
    .from('content_ideas')
    .update({ 
      status: 'ready_to_publish',
      updated_at: new Date().toISOString()
    })
    .eq('id', contentIdeaId)

  console.log(`Created ${assets.length} clip assets for content idea ${contentIdeaId}`)
}

async function handleProjectCompleted(
  contentIdeaId: string,
  payload: SubmagicWebhookPayload
) {
  // Single video processing completed (captions added, etc.)
  // Update the content idea with the processed video URL
  await supabase
    .from('content_ideas')
    .update({
      recording_url: payload.downloadUrl,
      transcript: payload.transcript || null,
      status: 'processing', // Still processing if we're waiting for clips
      updated_at: new Date().toISOString()
    })
    .eq('id', contentIdeaId)

  console.log(`Updated processed video for content idea ${contentIdeaId}`)
}

async function handleProjectFailed(
  contentIdeaId: string,
  payload: SubmagicWebhookPayload
) {
  console.error('Submagic processing failed:', payload.error)

  // Create a failed asset record for tracking
  await supabase
    .from('assets')
    .insert({
      content_idea_id: contentIdeaId,
      type: 'clip',
      status: 'failed',
      title: 'Processing Failed',
      metadata: { error: payload.error },
      platform: 'submagic',
    })

  // Update content idea status
  await supabase
    .from('content_ideas')
    .update({
      status: 'recording', // Revert to recording status so user can retry
      updated_at: new Date().toISOString()
    })
    .eq('id', contentIdeaId)
}


