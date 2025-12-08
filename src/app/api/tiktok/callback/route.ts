import { NextRequest, NextResponse } from "next/server"
import { exchangeTikTokCode } from "@/lib/tiktok"
import { getBaseUrl } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/tiktok/callback
 * Handle TikTok OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(
        `${getBaseUrl()}/settings?error=tiktok_auth_failed&error_description=${error}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${getBaseUrl()}/settings?error=tiktok_auth_failed`
      )
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET

    if (!clientKey || !clientSecret) {
      return NextResponse.redirect(
        `${getBaseUrl()}/settings?error=tiktok_not_configured`
      )
    }

    const baseUrl = getBaseUrl()
    const redirectUri = `${baseUrl}/api/tiktok/callback`

    const tokens = await exchangeTikTokCode(code, clientKey, clientSecret, redirectUri)

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
            tiktok: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            },
          },
        })
        .eq("id", profiles.id)
    }

    return NextResponse.redirect(`${getBaseUrl()}/settings?success=tiktok_connected`)
  } catch (error: any) {
    console.error("TikTok callback error:", error)
    return NextResponse.redirect(
      `${getBaseUrl()}/settings?error=tiktok_callback_failed&error_description=${encodeURIComponent(error.message)}`
    )
  }
}









