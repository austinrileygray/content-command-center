import { NextRequest, NextResponse } from "next/server"
import { getValidAccessToken } from "@/lib/youtube/client"

interface YouTubeVideo {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnail: string
  stats: {
    views: number
    likes: number
    comments: number
    duration: string
  }
  performanceScore: number
  engagementRate: number
}

/**
 * GET /api/youtube/top-videos
 * Fetches all videos from the connected YouTube channel with performance metrics
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get("limit") || "50")

  try {
    const accessToken = await getValidAccessToken()

    if (!accessToken) {
      return NextResponse.json(
        { error: "YouTube not connected or token expired" },
        { status: 401 }
      )
    }

    // Step 1: Get all video IDs from the channel (paginate through all)
    const allVideoIds: string[] = []
    let nextPageToken: string | null = null

    do {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search")
      searchUrl.searchParams.set("part", "id")
      searchUrl.searchParams.set("forMine", "true")
      searchUrl.searchParams.set("type", "video")
      searchUrl.searchParams.set("maxResults", "50")
      searchUrl.searchParams.set("order", "date")
      if (nextPageToken) {
        searchUrl.searchParams.set("pageToken", nextPageToken)
      }

      const searchResponse = await fetch(searchUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!searchResponse.ok) {
        const error = await searchResponse.text()
        console.error("YouTube search error:", error)
        break
      }

      const searchData = await searchResponse.json()
      const videoIds = searchData.items?.map((item: any) => item.id.videoId) || []
      allVideoIds.push(...videoIds)

      nextPageToken = searchData.nextPageToken || null

      // Safety limit to avoid infinite loops
      if (allVideoIds.length > 500) break
    } while (nextPageToken)

    if (allVideoIds.length === 0) {
      return NextResponse.json({ videos: [], total: 0 })
    }

    // Step 2: Get video details and statistics in batches of 50
    const allVideos: YouTubeVideo[] = []

    for (let i = 0; i < allVideoIds.length; i += 50) {
      const batchIds = allVideoIds.slice(i, i + 50)

      const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos")
      videosUrl.searchParams.set("part", "snippet,statistics,contentDetails")
      videosUrl.searchParams.set("id", batchIds.join(","))

      const videosResponse = await fetch(videosUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!videosResponse.ok) {
        console.error("YouTube videos error:", await videosResponse.text())
        continue
      }

      const videosData = await videosResponse.json()

      for (const video of videosData.items || []) {
        const views = parseInt(video.statistics?.viewCount || "0")
        const likes = parseInt(video.statistics?.likeCount || "0")
        const comments = parseInt(video.statistics?.commentCount || "0")

        // Calculate engagement rate (likes + comments per 100 views)
        const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0

        // Calculate performance score
        // Weighted formula: views (60%) + engagement normalized (30%) + recency bonus (10%)
        const daysSincePublished = Math.max(1,
          (Date.now() - new Date(video.snippet.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        const viewsPerDay = views / daysSincePublished

        // Normalize scores (these will be relative within the dataset)
        const performanceScore = Math.round(
          (views * 0.5) +
          (engagementRate * 10000 * 0.3) +
          (viewsPerDay * 100 * 0.2)
        )

        allVideos.push({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description?.substring(0, 200) || "",
          publishedAt: video.snippet.publishedAt,
          thumbnail: video.snippet.thumbnails?.medium?.url ||
                     video.snippet.thumbnails?.default?.url || "",
          stats: {
            views,
            likes,
            comments,
            duration: video.contentDetails?.duration || "PT0S",
          },
          performanceScore,
          engagementRate: Math.round(engagementRate * 100) / 100,
        })
      }
    }

    // Step 3: Sort by performance score and limit results
    const sortedVideos = allVideos
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, limit)

    // Normalize performance scores to 0-100 for display
    const maxScore = sortedVideos[0]?.performanceScore || 1
    const normalizedVideos = sortedVideos.map(video => ({
      ...video,
      performanceScore: Math.round((video.performanceScore / maxScore) * 100),
    }))

    return NextResponse.json({
      videos: normalizedVideos,
      total: allVideoIds.length,
    })
  } catch (err: any) {
    console.error("YouTube top videos error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to fetch videos" },
      { status: 500 }
    )
  }
}
