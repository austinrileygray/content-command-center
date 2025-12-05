import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * GET /api/auth/youtube/callback
 * Handles the OAuth callback from Google after user authorizes
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Handle OAuth errors
  if (error) {
    console.error("YouTube OAuth error:", error)
    return NextResponse.redirect(
      `${appUrl}/settings?youtube=error&message=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/settings?youtube=error&message=${encodeURIComponent("No authorization code received")}`
    )
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/settings?youtube=error&message=${encodeURIComponent("YouTube OAuth not configured")}`
    )
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${appUrl}/api/auth/youtube/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("Token exchange failed:", errorData)
      return NextResponse.redirect(
        `${appUrl}/settings?youtube=error&message=${encodeURIComponent("Failed to exchange authorization code")}`
      )
    }

    const tokens = await tokenResponse.json()

    // Fetch channel info to get channel ID and name
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    )

    if (!channelResponse.ok) {
      console.error("Failed to fetch channel info")
      return NextResponse.redirect(
        `${appUrl}/settings?youtube=error&message=${encodeURIComponent("Failed to fetch YouTube channel info")}`
      )
    }

    const channelData = await channelResponse.json()
    const channel = channelData.items?.[0]

    if (!channel) {
      return NextResponse.redirect(
        `${appUrl}/settings?youtube=error&message=${encodeURIComponent("No YouTube channel found for this account")}`
      )
    }

    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Store the YouTube connection in the database
    const { error: upsertError } = await supabase
      .from("youtube_connections")
      .upsert({
        id: "default", // Single-user mode for now
        channel_id: channel.id,
        channel_title: channel.snippet.title,
        channel_thumbnail: channel.snippet.thumbnails?.default?.url || null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "id"
      })

    if (upsertError) {
      console.error("Failed to store YouTube connection:", upsertError)
      return NextResponse.redirect(
        `${appUrl}/settings?youtube=error&message=${encodeURIComponent("Failed to save connection")}`
      )
    }

    // Redirect back to settings with success message
    return NextResponse.redirect(
      `${appUrl}/settings?youtube=success&channel=${encodeURIComponent(channel.snippet.title)}`
    )
  } catch (err: any) {
    console.error("YouTube OAuth callback error:", err)
    return NextResponse.redirect(
      `${appUrl}/settings?youtube=error&message=${encodeURIComponent(err.message || "Unknown error")}`
    )
  }
}
