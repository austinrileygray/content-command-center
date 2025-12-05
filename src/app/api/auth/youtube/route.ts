import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/auth/youtube
 * Initiates YouTube OAuth flow by redirecting to Google's OAuth consent screen
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!clientId) {
    return NextResponse.json(
      { error: "YouTube OAuth not configured" },
      { status: 500 }
    )
  }

  // OAuth 2.0 scopes for YouTube Data API
  const scopes = [
    "https://www.googleapis.com/auth/youtube.readonly",           // Read channel info
    "https://www.googleapis.com/auth/youtube.upload",             // Upload videos
    "https://www.googleapis.com/auth/youtube.force-ssl",          // Manage videos
    "https://www.googleapis.com/auth/yt-analytics.readonly",      // Read analytics
  ].join(" ")

  // Build the Google OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/youtube/callback`,
    response_type: "code",
    scope: scopes,
    access_type: "offline",     // Request refresh token
    prompt: "consent",          // Always show consent screen to ensure refresh token
    include_granted_scopes: "true",
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  // Redirect user to Google OAuth consent screen
  return NextResponse.redirect(authUrl)
}
