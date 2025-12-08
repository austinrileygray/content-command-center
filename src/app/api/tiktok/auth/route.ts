import { NextRequest, NextResponse } from "next/server"
import { getTikTokAuthUrl } from "@/lib/tiktok"
import { getBaseUrl } from "@/lib/utils"

/**
 * GET /api/tiktok/auth
 * Initiate TikTok OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY

    if (!clientKey) {
      return NextResponse.json(
        { error: "TikTok Client Key not configured" },
        { status: 500 }
      )
    }

    const baseUrl = getBaseUrl()
    const redirectUri = `${baseUrl}/api/tiktok/callback`

    const authUrl = getTikTokAuthUrl(redirectUri, clientKey)

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error("TikTok auth error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to initiate TikTok OAuth" },
      { status: 500 }
    )
  }
}









