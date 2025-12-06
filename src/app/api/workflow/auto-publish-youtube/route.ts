import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadYouTubeVideo, refreshYouTubeToken } from "@/lib/youtube"
import { validateYouTubeCredentials } from "@/lib/youtube-utils"

/**
 * POST /api/workflow/auto-publish-youtube
 * Automatically publish an approved asset to YouTube
 */
export const maxDuration = 300
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { assetId, contentIdeaId } = await request.json()

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get asset
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("*, content_idea:content_ideas(*)")
      .eq("id", assetId)
      .single()

    if (assetError || !asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      )
    }

    if (!asset.file_url) {
      return NextResponse.json(
        { error: "Asset has no file URL" },
        { status: 400 }
      )
    }

    // Get user's YouTube tokens
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, metadata")
      .limit(1)

    if (!profiles || profiles.length === 0 || !profiles[0]?.metadata?.youtube) {
      return NextResponse.json(
        { error: "YouTube not connected. Please connect in Settings." },
        { status: 401 }
      )
    }

    const profile = profiles[0]
    const youtubeTokens = profile.metadata.youtube
    let accessToken = youtubeTokens.access_token

    // Check if token is expired and refresh if needed
    if (youtubeTokens.expires_at && new Date(youtubeTokens.expires_at) < new Date()) {
      const credentials = validateYouTubeCredentials()

      if (!credentials.valid) {
        return NextResponse.json(
          { error: credentials.error || "YouTube credentials not configured" },
          { status: 500 }
        )
      }

      const refreshed = await refreshYouTubeToken(
        youtubeTokens.refresh_token,
        credentials.clientId!,
        credentials.clientSecret!
      )

      accessToken = refreshed.access_token

      // Update stored token
      await supabase
        .from("profiles")
        .update({
          metadata: {
            ...(profile.metadata || {}),
            youtube: {
              ...youtubeTokens,
              access_token: refreshed.access_token,
              expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            },
          },
        })
        .eq("id", profile.id)
    }

    // Get content idea for title/description
    const contentIdea = asset.content_idea || null
    const title = asset.title || contentIdea?.title || "Untitled Video"
    const description = asset.metadata?.transcript || contentIdea?.description || ""
    
    // Add Owner Ops Pro CTA to description if available
    const cta = "\n\n🚀 Join Owner Ops Pro: https://ownerops.pro"
    const fullDescription = description + cta

    // Upload to YouTube
    const result = await uploadYouTubeVideo(accessToken, asset.file_url, {
      title,
      description: fullDescription,
      tags: contentIdea?.seo_keywords || ["business", "entrepreneurship", "owner ops"],
      privacyStatus: "unlisted", // Start as unlisted for review
      thumbnailUrl: asset.thumbnail_url || undefined,
    })

    // Update asset with published URL
    await supabase
      .from("assets")
      .update({
        published_url: result.videoUrl,
        published_at: new Date().toISOString(),
        status: "published",
      })
      .eq("id", assetId)

    // Update publishing queue if exists
    const { data: queueItem } = await supabase
      .from("publishing_queue")
      .select("id")
      .eq("asset_id", assetId)
      .eq("platform", "youtube")
      .eq("status", "pending")
      .single()

    if (queueItem) {
      await supabase
        .from("publishing_queue")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          published_url: result.videoUrl,
        })
        .eq("id", queueItem.id)
    }

    console.log(`Auto-published asset ${assetId} to YouTube: ${result.videoUrl}`)

    return NextResponse.json({
      success: true,
      videoId: result.videoId,
      videoUrl: result.videoUrl,
      message: "Video auto-published successfully to YouTube (unlisted)",
    })
  } catch (error: any) {
    console.error("Auto-publish YouTube error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to auto-publish to YouTube" },
      { status: 500 }
    )
  }
}





