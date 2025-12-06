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

    // Get the base URL from the request
    // In production (Vercel), use the actual request origin
    const origin = request.headers.get('origin') || request.nextUrl.origin
    const redirectUri = `${origin}/api/youtube/callback`
    
    // Log for debugging (remove in production if needed)
    console.log("YouTube OAuth - Redirect URI:", redirectUri)
    console.log("YouTube OAuth - Client ID:", clientId?.substring(0, 20) + "...") // Log partial for security
    
    // Validate Client ID format
    if (!clientId.includes('.apps.googleusercontent.com')) {
      console.error("Invalid Client ID format - should end with .apps.googleusercontent.com")
      return NextResponse.json(
        { error: "Invalid Client ID format" },
        { status: 500 }
      )
    }
    
    const authUrl = getYouTubeAuthUrl(redirectUri, clientId)

    return NextResponse.json({ authUrl, redirectUri }) // Include redirectUri for debugging
  } catch (error: any) {
    console.error("YouTube auth error:", error)
    return NextResponse.json(
      { error: "Failed to initiate YouTube auth", details: error.message },
      { status: 500 }
    )
  }
}


