import { NextRequest, NextResponse } from "next/server"
import { exchangeYouTubeCode } from "@/lib/youtube"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/youtube/callback
 * Handle YouTube OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=no_code", request.url)
      )
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || request.nextUrl.host
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
    const redirectUri = `${baseUrl}/api/youtube/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/settings?error=not_configured", request.url)
      )
    }

    // Exchange code for tokens
    const tokens = await exchangeYouTubeCode(code, clientId, clientSecret, redirectUri)

    // Store tokens in database
    // For now, we'll store in a simple way - in production you'd want a proper oauth_tokens table
    const supabase = await createClient()
    
    // Get current user profile (using first profile for now)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    if (profiles && profiles.length > 0) {
      const profile = profiles[0]
      
      // Get existing metadata or create new
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("metadata")
        .eq("id", profile.id)
        .single()

      const existingMetadata = existingProfile?.metadata || {}

      // Store tokens in profile metadata
      // Note: In production, use a dedicated oauth_tokens table for better security
      await supabase
        .from("profiles")
        .update({
          metadata: {
            ...existingMetadata,
            youtube: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            },
          },
        })
        .eq("id", profile.id)
    }

    return NextResponse.redirect(new URL("/settings?youtube_connected=true", request.url))
  } catch (error: any) {
    console.error("YouTube callback error:", error)
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}
