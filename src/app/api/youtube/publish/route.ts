import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadYouTubeVideo, refreshYouTubeToken, getYouTubeChannel } from "@/lib/youtube"

/**
 * POST /api/youtube/publish
 * Publish a video to YouTube
 */
export async function POST(request: NextRequest) {
  try {
    const { assetId, title, description, tags, privacyStatus } = await request.json()

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
      .select("*")
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
      const clientId = process.env.YOUTUBE_CLIENT_ID
      const clientSecret = process.env.YOUTUBE_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: "YouTube credentials not configured" },
          { status: 500 }
        )
      }

      const refreshed = await refreshYouTubeToken(
        youtubeTokens.refresh_token,
        clientId,
        clientSecret
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

    // Upload to YouTube (function handles downloading from URL)
    const result = await uploadYouTubeVideo(accessToken, asset.file_url, {
      title: title || asset.title || "Untitled Video",
      description: description || asset.metadata?.transcript || "",
      tags: tags || asset.metadata?.suggestedHashtags || [],
      privacyStatus: privacyStatus || "unlisted",
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

    return NextResponse.json({
      success: true,
      videoId: result.videoId,
      videoUrl: result.videoUrl,
      message: "Video published successfully to YouTube",
    })
  } catch (error: any) {
    console.error("YouTube publish error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to publish to YouTube" },
      { status: 500 }
    )
  }
}


