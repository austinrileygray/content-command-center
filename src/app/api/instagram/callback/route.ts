import { NextRequest, NextResponse } from "next/server"
import { exchangeInstagramCode } from "@/lib/instagram"
import { getBaseUrl } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/instagram/callback
 * Handle Instagram OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(
        `${getBaseUrl()}/settings?error=instagram_auth_failed&error_description=${error}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${getBaseUrl()}/settings?error=instagram_auth_failed`
      )
    }

    const appId = process.env.INSTAGRAM_APP_ID
    const appSecret = process.env.INSTAGRAM_APP_SECRET

    if (!appId || !appSecret) {
      return NextResponse.redirect(
        `${getBaseUrl()}/settings?error=instagram_not_configured`
      )
    }

    const baseUrl = getBaseUrl()
    const redirectUri = `${baseUrl}/api/instagram/callback`

    const tokens = await exchangeInstagramCode(code, appId, appSecret, redirectUri)

    // Store tokens in profile metadata
    const supabase = await createClient()
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, metadata")
      .limit(1)
      .single()

    if (profiles) {
      await supabase
        .from("profiles")
        .update({
          metadata: {
            ...(profiles.metadata || {}),
            instagram: {
              access_token: tokens.access_token,
              expires_at: new Date(Date.now() + (tokens.expires_in || 0) * 1000).toISOString(),
            },
          },
        })
        .eq("id", profiles.id)
    }

    return NextResponse.redirect(`${getBaseUrl()}/settings?success=instagram_connected`)
  } catch (error: any) {
    console.error("Instagram callback error:", error)
    return NextResponse.redirect(
      `${getBaseUrl()}/settings?error=instagram_callback_failed&error_description=${encodeURIComponent(error.message)}`
    )
  }
}








