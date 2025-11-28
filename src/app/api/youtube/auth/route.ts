import { NextRequest, NextResponse } from "next/server"
import { getYouTubeAuthUrl } from "@/lib/youtube"

/**
 * GET /api/youtube/auth
 * Initiate YouTube OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID

    if (!clientId) {
      return NextResponse.json(
        { error: "YouTube Client ID not configured" },
        { status: 500 }
      )
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/youtube/callback`
    const authUrl = getYouTubeAuthUrl(redirectUri, clientId)

    return NextResponse.json({ authUrl })
  } catch (error: any) {
    console.error("YouTube auth error:", error)
    return NextResponse.json(
      { error: "Failed to initiate YouTube auth" },
      { status: 500 }
    )
  }
}
