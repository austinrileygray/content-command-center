import { NextRequest, NextResponse } from "next/server"
import { getLinkedInAuthUrl } from "@/lib/linkedin"
import { getBaseUrl } from "@/lib/utils"

/**
 * GET /api/linkedin/auth
 * Initiate LinkedIn OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID

    if (!clientId) {
      return NextResponse.json(
        { error: "LinkedIn Client ID not configured" },
        { status: 500 }
      )
    }

    const baseUrl = getBaseUrl()
    const redirectUri = `${baseUrl}/api/linkedin/callback`

    const authUrl = getLinkedInAuthUrl(redirectUri, clientId)

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error("LinkedIn auth error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to initiate LinkedIn OAuth" },
      { status: 500 }
    )
  }
}








