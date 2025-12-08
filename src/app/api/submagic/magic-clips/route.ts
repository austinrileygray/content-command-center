import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubmagicClient } from '@/lib/submagic'

/**
 * POST /api/submagic/magic-clips
 * Sends a recording to Submagic for Magic Clips generation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { contentIdeaId, templateName = 'Hormozi 2' } = await request.json()

    // Get the content idea with recording URL
    const { data: contentIdea, error: fetchError } = await supabase
      .from('content_ideas')
      .select('*')
      .eq('id', contentIdeaId)
      .single()

    if (fetchError || !contentIdea) {
      return NextResponse.json(
        { error: 'Content idea not found' },
        { status: 404 }
      )
    }

    if (!contentIdea.recording_url) {
      return NextResponse.json(
        { error: 'No recording URL found for this content idea' },
        { status: 400 }
      )
    }

    // Send to Submagic
    const submagic = getSubmagicClient()
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/submagic`

    const response = await submagic.createMagicClips({
      title: contentIdea.title,
      language: 'en',
      videoUrl: contentIdea.recording_url,
      templateName,
      webhookUrl,
    })

    // Update content idea with Submagic project ID
    await supabase
      .from('content_ideas')
      .update({
        submagic_project_id: response.id,
        submagic_template: templateName,
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contentIdeaId)

    return NextResponse.json({
      success: true,
      projectId: response.id,
      message: 'Video sent to Submagic for clip generation. You will be notified when clips are ready.',
    })
  } catch (error) {
    console.error('Magic Clips API error:', error)
    return NextResponse.json(
      { error: 'Failed to create Magic Clips project' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/submagic/magic-clips?projectId=xxx
 * Check status of a Magic Clips project
 */
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    const submagic = getSubmagicClient()
    const response = await submagic.getMagicClips(projectId)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Magic Clips status error:', error)
    return NextResponse.json(
      { error: 'Failed to get Magic Clips status' },
      { status: 500 }
    )
  }
}



