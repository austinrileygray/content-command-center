import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { refreshYouTubeToken, getYouTubeChannel } from "@/lib/youtube"
import { fetchChannelVideos } from "@/lib/youtube-videos"

/**
 * POST /api/youtube/videos/fetch
 * Fetch videos from user's YouTube channel
 */
export const maxDuration = 60 // Vercel Pro plan max
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { maxResults = 50 } = await request.json()
    const supabase = await createClient()

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

    // Get channel info to store channel ID
    const channel = await getYouTubeChannel(accessToken)

    // Fetch videos from channel
    const videos = await fetchChannelVideos(accessToken, maxResults)

    // Store videos in database
    const videosToInsert = videos.map(video => ({
      user_id: profile.id,
      video_id: video.videoId,
      title: video.title,
      description: video.description || null,
      published_at: video.publishedAt || null,
      thumbnail_url: video.thumbnailUrl || null,
      duration_seconds: video.durationSeconds || null,
      category_id: video.categoryId || null,
      tags: video.tags || null,
      language: video.language || null,
      views: 0, // Will be updated when analytics are fetched
      likes: 0,
      comments: 0,
      shares: 0,
      watch_time_seconds: 0,
      average_view_duration_seconds: 0,
      performance_score: null,
    }))

    // Upsert videos (update if exists, insert if new)
    const { error: upsertError } = await supabase
      .from("youtube_videos")
      .upsert(videosToInsert, {
        onConflict: "user_id,video_id",
        ignoreDuplicates: false,
      })

    if (upsertError) {
      console.error("Error upserting videos:", upsertError)
      return NextResponse.json(
        { error: "Failed to save videos to database" },
        { status: 500 }
      )
    }

    // Update profile with channel ID if not set
    if (!profile.metadata?.youtube_channel_id) {
      await supabase
        .from("profiles")
        .update({
          youtube_channel_id: channel.id,
          metadata: {
            ...(profile.metadata || {}),
            youtube_channel_id: channel.id,
          },
        })
        .eq("id", profile.id)
    }

    return NextResponse.json({
      success: true,
      videosFetched: videos.length,
      message: `Successfully fetched ${videos.length} videos from your channel`,
    })
  } catch (error: any) {
    console.error("YouTube videos fetch error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch videos from YouTube" },
      { status: 500 }
    )
  }
}
