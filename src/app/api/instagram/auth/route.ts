import { NextRequest, NextResponse } from "next/server"
import { getInstagramAuthUrl } from "@/lib/instagram"
import { getBaseUrl } from "@/lib/utils"

/**
 * GET /api/instagram/auth
 * Initiate Instagram OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const appId = process.env.INSTAGRAM_APP_ID

    if (!appId) {
      return NextResponse.json(
        { error: "Instagram App ID not configured" },
        { status: 500 }
      )
    }

    const baseUrl = getBaseUrl()
    const redirectUri = `${baseUrl}/api/instagram/callback`

    const authUrl = getInstagramAuthUrl(redirectUri, appId)

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error("Instagram auth error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to initiate Instagram OAuth" },
      { status: 500 }
    )
  }
}








