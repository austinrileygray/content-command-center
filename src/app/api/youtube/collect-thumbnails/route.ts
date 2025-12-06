import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getYouTubeChannel, refreshYouTubeToken } from "@/lib/youtube"

/**
 * POST /api/youtube/collect-thumbnails
 * Collect thumbnails from high-performing YouTube videos
 */
export async function POST(request: NextRequest) {
  try {
    const { category, limit = 20 } = await request.json()

    if (!category || !["youtube", "short_form"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'youtube' or 'short_form'" },
        { status: 400 }
      )
    }

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
            ...profile.metadata,
            youtube: {
              ...youtubeTokens,
              access_token: refreshed.access_token,
              expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            },
          },
        })
        .eq("id", profile.id)
    }

    // Get channel info
    const channel = await getYouTubeChannel(accessToken)

    // Fetch videos from the channel, sorted by view count
    // For Shorts, filter by duration < 60 seconds
    const isShorts = category === "short_form"

    // Get channel's uploads playlist
    const uploadsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channel.id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!uploadsResponse.ok) {
      const errorData = await uploadsResponse.json()
      throw new Error(`Failed to get channel uploads: ${JSON.stringify(errorData)}`)
    }

    const channelData = await uploadsResponse.json()
    const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      return NextResponse.json(
        { error: "Could not find uploads playlist" },
        { status: 404 }
      )
    }

    // Get videos from uploads playlist (get more to filter)
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!videosResponse.ok) {
      const errorData = await videosResponse.json()
      throw new Error(`Failed to get videos: ${JSON.stringify(errorData)}`)
    }

    const videosData = await videosResponse.json()
    const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(",")

    if (!videoIds) {
      return NextResponse.json(
        { error: "No videos found in channel" },
        { status: 404 }
      )
    }

    // Get video details with statistics
    const videoDetailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!videoDetailsResponse.ok) {
      const errorData = await videoDetailsResponse.json()
      throw new Error(`Failed to get video details: ${JSON.stringify(errorData)}`)
    }

    const videoDetails = await videoDetailsResponse.json()

    // Filter and sort videos
    let filteredVideos = videoDetails.items

    // Filter by duration for Shorts
    if (isShorts) {
      filteredVideos = filteredVideos.filter((video: any) => {
        const duration = video.contentDetails.duration
        // Parse ISO 8601 duration (e.g., PT1M30S = 1 minute 30 seconds)
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
        if (!match) return false
        const hours = parseInt(match[1] || "0")
        const minutes = parseInt(match[2] || "0")
        const seconds = parseInt(match[3] || "0")
        const totalSeconds = hours * 3600 + minutes * 60 + seconds
        return totalSeconds <= 60 // Shorts are <= 60 seconds
      })
    }

    // Sort by view count (highest performing)
    filteredVideos.sort((a: any, b: any) => {
      const viewsA = parseInt(a.statistics.viewCount || "0")
      const viewsB = parseInt(b.statistics.viewCount || "0")
      return viewsB - viewsA
    })

    // Take top N videos
    const topVideos = filteredVideos.slice(0, limit)

    // Get existing thumbnails to avoid duplicates
    const { data: existingThumbnails } = await supabase
      .from("thumbnail_training")
      .select("source_video_id")
      .eq("category", category)
      .eq("approved", true)

    const existingVideoIds = new Set(existingThumbnails?.map(t => t.source_video_id).filter(Boolean) || [])

    // Save thumbnails to database
    const newThumbnails = []
    for (const video of topVideos) {
      if (existingVideoIds.has(video.id)) continue

      const thumbnailUrl = video.snippet.thumbnails.maxres?.url || 
                          video.snippet.thumbnails.high?.url ||
                          video.snippet.thumbnails.medium?.url

      if (!thumbnailUrl) continue

      const views = parseInt(video.statistics.viewCount || "0")
      const likes = parseInt(video.statistics.likeCount || "0")
      const comments = parseInt(video.statistics.commentCount || "0")
      const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0

      const { data, error } = await supabase
        .from("thumbnail_training")
        .insert({
          user_id: profile.id,
          category,
          image_url: thumbnailUrl,
          source_type: "youtube_auto",
          source_video_id: video.id,
          source_video_title: video.snippet.title,
          source_video_url: `https://www.youtube.com/watch?v=${video.id}`,
          performance_metrics: {
            views,
            likes,
            comments,
            engagement_rate: engagementRate,
          },
          approved: true,
        })
        .select()
        .single()

      if (!error && data) {
        newThumbnails.push(data)
      }
    }

    return NextResponse.json({
      thumbnails: newThumbnails,
      collected: newThumbnails.length,
      total: topVideos.length,
    })
  } catch (error: any) {
    console.error("Collect thumbnails error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to collect thumbnails" },
      { status: 500 }
    )
  }
}


