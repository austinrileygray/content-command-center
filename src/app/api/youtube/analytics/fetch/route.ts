import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { refreshYouTubeToken } from "@/lib/youtube"
import { fetchVideoAnalytics } from "@/lib/youtube-analytics"
import { calculatePerformanceScore } from "@/lib/youtube-videos"

/**
 * POST /api/youtube/analytics/fetch
 * Fetch analytics data for videos and update performance scores
 */
export const maxDuration = 60 // Vercel Pro plan max
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user's YouTube tokens
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, metadata, youtube_channel_id")
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

    // Get channel ID
    const channelId = profile.youtube_channel_id || profile.metadata?.youtube_channel_id
    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID not found. Please fetch videos first." },
        { status: 400 }
      )
    }

    // Get all videos for this user that need analytics
    const { data: videos, error: videosError } = await supabase
      .from("youtube_videos")
      .select("id, video_id, duration_seconds, title, description, published_at, thumbnail_url")
      .eq("user_id", profile.id)

    if (videosError || !videos || videos.length === 0) {
      return NextResponse.json(
        { error: "No videos found. Please fetch videos first." },
        { status: 404 }
      )
    }

    // Fetch analytics for all videos
    const videoIds = videos.map(v => v.video_id)
    const analyticsMap = await fetchVideoAnalytics(accessToken, channelId, videoIds)

    // Update videos with analytics data and calculate performance scores
    const updates = videos
      .map(video => {
        const analytics = analyticsMap.get(video.video_id)
        if (!analytics) return null

        const videoWithMetrics = {
          views: analytics.views,
          engagementRate: analytics.engagementRate || 0,
          watchTimeSeconds: analytics.watchTimeSeconds,
          averageViewDurationSeconds: analytics.averageViewDurationSeconds,
          durationSeconds: video.duration_seconds || 0,
          clickThroughRate: analytics.clickThroughRate,
        }

        const performanceScore = calculatePerformanceScore(videoWithMetrics)

        return {
          id: video.id,
          views: analytics.views,
          likes: analytics.likes,
          comments: analytics.comments,
          shares: analytics.shares,
          watch_time_seconds: analytics.watchTimeSeconds,
          average_view_duration_seconds: analytics.averageViewDurationSeconds,
          engagement_rate: analytics.engagementRate || null,
          click_through_rate: analytics.clickThroughRate || null,
          performance_score: performanceScore,
          last_analytics_fetch: new Date().toISOString(),
        }
      })
      .filter((update): update is NonNullable<typeof update> => update !== null)

    // Batch update videos
    for (const update of updates) {
      await supabase
        .from("youtube_videos")
        .update(update)
        .eq("id", update.id)
    }

    return NextResponse.json({
      success: true,
      videosUpdated: updates.length,
      message: `Successfully updated analytics for ${updates.length} videos`,
    })
  } catch (error: any) {
    console.error("YouTube analytics fetch error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics from YouTube" },
      { status: 500 }
    )
  }
}



