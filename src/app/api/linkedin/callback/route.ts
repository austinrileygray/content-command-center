import { NextRequest, NextResponse } from "next/server"
import { exchangeLinkedInCode } from "@/lib/linkedin"
import { getBaseUrl } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/linkedin/callback
 * Handle LinkedIn OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(
        `${getBaseUrl()}/settings?error=linkedin_auth_failed&error_description=${error}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${getBaseUrl()}/settings?error=linkedin_auth_failed`
      )
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${getBaseUrl()}/settings?error=linkedin_not_configured`
      )
    }

    const baseUrl = getBaseUrl()
    const redirectUri = `${baseUrl}/api/linkedin/callback`

    const tokens = await exchangeLinkedInCode(code, clientId, clientSecret, redirectUri)

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
            linkedin: {
              access_token: tokens.access_token,
              expires_at: new Date(Date.now() + (tokens.expires_in || 0) * 1000).toISOString(),
            },
          },
        })
        .eq("id", profiles.id)
    }

    return NextResponse.redirect(`${getBaseUrl()}/settings?success=linkedin_connected`)
  } catch (error: any) {
    console.error("LinkedIn callback error:", error)
    return NextResponse.redirect(
      `${getBaseUrl()}/settings?error=linkedin_callback_failed&error_description=${encodeURIComponent(error.message)}`
    )
  }
}








