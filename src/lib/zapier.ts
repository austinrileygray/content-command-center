// Placeholder for Zapier webhook integration
// TODO: Implement actual Zapier integration

export async function triggerZapierWebhookAsync(
  event: string,
  data: Record<string, any>
) {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL

  if (!webhookUrl) {
    console.log("Zapier webhook not configured. Event:", event, "Data:", data)
    return
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...data }),
    })
  } catch (error) {
    console.error("Failed to trigger Zapier webhook:", error)
  }
}
