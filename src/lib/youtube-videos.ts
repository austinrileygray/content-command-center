/**
 * YouTube Videos API Client
 * Handles fetching videos from user's channel and calculating performance scores
 * 
 * API Docs: https://developers.google.com/youtube/v3/docs
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  durationSeconds: number
  categoryId?: string
  tags?: string[]
  language?: string
}

export interface YouTubeVideoWithMetrics extends YouTubeVideo {
  views: number
  likes: number
  comments: number
  shares: number
  watchTimeSeconds: number
  averageViewDurationSeconds: number
  clickThroughRate?: number
  engagementRate?: number
  performanceScore?: number
}

/**
 * Get user's YouTube channel ID
 */
export async function getYouTubeChannelId(accessToken: string): Promise<string> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=id&mine=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get channel ID: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return data.items[0]?.id || ''
}

/**
 * Get channel's uploads playlist ID
 */
export async function getUploadsPlaylistId(accessToken: string, channelId: string): Promise<string> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get uploads playlist: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return data.items[0]?.contentDetails?.relatedPlaylists?.uploads || ''
}

/**
 * Fetch videos from channel's uploads playlist
 */
export async function fetchChannelVideos(
  accessToken: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  try {
    // Get channel ID
    const channelId = await getYouTubeChannelId(accessToken)
    if (!channelId) {
      throw new Error('Channel ID not found')
    }

    // Get uploads playlist ID
    const uploadsPlaylistId = await getUploadsPlaylistId(accessToken, channelId)
    if (!uploadsPlaylistId) {
      throw new Error('Uploads playlist not found')
    }

    // Fetch playlist items
    const videos: YouTubeVideo[] = []
    let nextPageToken: string | undefined = undefined

    do {
      const params = new URLSearchParams({
        part: 'snippet,contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults: Math.min(50, maxResults - videos.length).toString(),
      })

      if (nextPageToken) {
        params.append('pageToken', nextPageToken)
      }

      const response = await fetch(
        `${YOUTUBE_API_BASE}/playlistItems?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to fetch videos: ${JSON.stringify(error)}`)
      }

      const data = await response.json()

      // Get video IDs from playlist items
      const videoIds = data.items
        .map((item: any) => item.snippet.resourceId.videoId)
        .filter(Boolean)

      if (videoIds.length === 0) break

      // Fetch detailed video information
      const videoDetailsResponse = await fetch(
        `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoIds.join(',')}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!videoDetailsResponse.ok) {
        const error = await videoDetailsResponse.json()
        throw new Error(`Failed to fetch video details: ${JSON.stringify(error)}`)
      }

      const videoDetailsData = await videoDetailsResponse.json()

      // Parse video details
      for (const video of videoDetailsData.items) {
        const duration = parseDuration(video.contentDetails.duration)
        videos.push({
          videoId: video.id,
          title: video.snippet.title,
          description: video.snippet.description || '',
          publishedAt: video.snippet.publishedAt,
          thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url || '',
          durationSeconds: duration,
          categoryId: video.snippet.categoryId,
          tags: video.snippet.tags || [],
          language: video.snippet.defaultLanguage || video.snippet.defaultAudioLanguage,
        })
      }

      nextPageToken = data.nextPageToken
    } while (nextPageToken && videos.length < maxResults)

    return videos
  } catch (error: any) {
    console.error('Error fetching channel videos:', error)
    throw error
  }
}

/**
 * Parse ISO 8601 duration (PT15M33S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Calculate performance score based on weighted metrics
 * Default weights: Views (40%), Engagement (30%), Watch Time (20%), CTR (10%)
 */
export function calculatePerformanceScore(
  video: {
    views: number
    engagementRate?: number
    watchTimeSeconds: number
    averageViewDurationSeconds: number
    durationSeconds: number
    clickThroughRate?: number
  },
  weights: {
    views?: number
    engagement?: number
    watchTime?: number
    ctr?: number
  } = {}
): number {
  const defaultWeights = {
    views: 0.4,
    engagement: 0.3,
    watchTime: 0.2,
    ctr: 0.1,
  }

  const finalWeights = { ...defaultWeights, ...weights }
  const totalWeight = Object.values(finalWeights).reduce((a, b) => a + b, 0)

  // Normalize to ensure weights sum to 1
  const normalizedWeights = {
    views: finalWeights.views! / totalWeight,
    engagement: finalWeights.engagement! / totalWeight,
    watchTime: finalWeights.watchTime! / totalWeight,
    ctr: finalWeights.ctr! / totalWeight,
  }

  // Normalize metrics (0-1 scale)
  // For views, engagement, watch time: use log scale for better distribution
  const normalizedViews = Math.log10(video.views + 1) / 10 // Assuming max ~1B views
  const normalizedEngagement = video.engagementRate ? video.engagementRate / 100 : 0
  const normalizedWatchTime = video.durationSeconds > 0 
    ? Math.min(video.averageViewDurationSeconds / video.durationSeconds, 1)
    : 0
  const normalizedCTR = video.clickThroughRate ? video.clickThroughRate / 100 : 0

  // Calculate weighted score
  const score =
    normalizedViews * normalizedWeights.views +
    normalizedEngagement * normalizedWeights.engagement +
    normalizedWatchTime * normalizedWeights.watchTime +
    normalizedCTR * normalizedWeights.ctr

  // Scale to 0-100
  return Math.round(score * 100 * 100) / 100
}

/**
 * Get top N performing videos
 */
export function getTopPerformingVideos(
  videos: YouTubeVideoWithMetrics[],
  limit: number = 10
): YouTubeVideoWithMetrics[] {
  return videos
    .filter(v => v.performanceScore !== undefined)
    .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
    .slice(0, limit)
}
