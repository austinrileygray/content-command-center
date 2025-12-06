import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Webhook endpoint for Zapier/Make integrations
 * Allows external services to trigger actions in the Content Command Center
 * 
 * Events supported:
 * - asset.approved - When an asset is approved
 * - asset.published - When an asset is published
 * - idea.created - When a content idea is created
 * - recording.uploaded - When a recording is uploaded
 * - workflow.started - When a workflow is started
 */

interface ZapierWebhookPayload {
  event: 'asset.approved' | 'asset.published' | 'idea.created' | 'recording.uploaded' | 'workflow.started'
  data: any
  webhookUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const payload: ZapierWebhookPayload = await request.json()
    
    console.log('Zapier webhook received:', payload.event)

    const supabase = await createClient()

    // Get user's Zapier webhook URL from profile metadata
    const { data: profiles } = await supabase
      .from('profiles')
      .select('metadata')
      .limit(1)
      .single()

    const zapierWebhookUrl = profiles?.metadata?.zapier?.webhook_url

    if (!zapierWebhookUrl) {
      return NextResponse.json(
        { error: 'Zapier webhook URL not configured in user settings' },
        { status: 400 }
      )
    }

    // Forward the event to Zapier
    try {
      const response = await fetch(zapierWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: payload.event,
          timestamp: new Date().toISOString(),
          data: payload.data,
        }),
      })

      if (!response.ok) {
        throw new Error(`Zapier webhook failed: ${response.status}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Event forwarded to Zapier',
      })
    } catch (error: any) {
      console.error('Failed to forward to Zapier:', error)
      return NextResponse.json(
        { error: 'Failed to forward event to Zapier', details: error.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Zapier webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/zapier
 * Test endpoint to verify webhook configuration
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: profiles } = await supabase
      .from('profiles')
      .select('metadata')
      .limit(1)
      .single()

    const zapierWebhookUrl = profiles?.metadata?.zapier?.webhook_url

    return NextResponse.json({
      configured: !!zapierWebhookUrl,
      webhookUrl: zapierWebhookUrl || null,
      message: zapierWebhookUrl
        ? 'Zapier webhook is configured'
        : 'Zapier webhook URL not configured. Add it in Settings → Integrations.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check webhook configuration' },
      { status: 500 }
    )
  }
}








