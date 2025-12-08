/**
 * Zapier/Make Webhook Integration
 * Utility functions to trigger external webhooks at key workflow events
 */

/**
 * Trigger a Zapier webhook with an event
 */
export async function triggerZapierWebhook(
  event: 'asset.approved' | 'asset.published' | 'idea.created' | 'recording.uploaded' | 'workflow.started' | 'clips.generated',
  data: any,
  webhookUrl?: string
): Promise<void> {
  // If webhook URL not provided, fetch from profile metadata
  if (!webhookUrl) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('metadata')
        .limit(1)
        .single()

      webhookUrl = profiles?.metadata?.zapier?.webhook_url
    } catch (error) {
      console.error('Failed to fetch Zapier webhook URL:', error)
      return
    }
  }

  if (!webhookUrl) {
    // Webhook not configured, silently skip
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      }),
    })

    if (!response.ok) {
      console.error(`Zapier webhook failed for event ${event}:`, response.status, await response.text())
    }
  } catch (error) {
    console.error(`Failed to trigger Zapier webhook for event ${event}:`, error)
    // Don't throw - webhook failures shouldn't break the workflow
  }
}

/**
 * Trigger webhook asynchronously (fire and forget)
 */
export function triggerZapierWebhookAsync(
  event: 'asset.approved' | 'asset.published' | 'idea.created' | 'recording.uploaded' | 'workflow.started' | 'clips.generated',
  data: any,
  webhookUrl?: string
): void {
  // Fire and forget - don't wait for response
  triggerZapierWebhook(event, data, webhookUrl).catch(error => {
    console.error(`Async Zapier webhook failed for event ${event}:`, error)
  })
}









