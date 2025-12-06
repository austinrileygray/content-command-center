/**
 * YouTube Analytics API Client
 * Handles fetching analytics data for videos
 * 
 * API Docs: https://developers.google.com/youtube/analytics/v2
 */

const YOUTUBE_ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2'

export interface YouTubeAnalyticsMetrics {
  views: number
  likes: number
  comments: number
  shares: number
  watchTimeSeconds: number
  averageViewDurationSeconds: number
  clickThroughRate?: number
  engagementRate?: number
}

/**
 * Fetch analytics metrics for specific videos
 */
export async function fetchVideoAnalytics(
  accessToken: string,
  channelId: string,
  videoIds: string[],
  startDate?: string,
  endDate?: string
): Promise<Map<string, YouTubeAnalyticsMetrics>> {
  // Default to last 365 days if no dates provided
  const end = endDate || new Date().toISOString().split('T')[0]
  const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const metrics = new Map<string, YouTubeAnalyticsMetrics>()

  // YouTube Analytics API requires fetching data per video
  // Batch requests in groups of 10 to avoid rate limits
  const batchSize = 10
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize)

    for (const videoId of batch) {
      try {
        const params = new URLSearchParams({
          ids: `channel==${channelId}`,
          metrics: 'views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration',
          dimensions: 'video',
          filters: `video==${videoId}`,
          startDate: start,
          endDate: end,
        })

        const response = await fetch(
          `${YOUTUBE_ANALYTICS_BASE}/reports?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!response.ok) {
          // If analytics not available for this video, skip it
          if (response.status === 403 || response.status === 404) {
            console.warn(`Analytics not available for video ${videoId}`)
            continue
          }
          const error = await response.json()
          throw new Error(`Failed to fetch analytics: ${JSON.stringify(error)}`)
        }

        const data = await response.json()

        if (data.rows && data.rows.length > 0) {
          const row = data.rows[0]
          const headers = data.columnHeaders || []

          // Map column headers to values
          const getValue = (headerName: string) => {
            const index = headers.findIndex((h: any) => h.name === headerName)
            return index >= 0 ? parseFloat(row[index] || 0) : 0
          }

          const views = getValue('views')
          const likes = getValue('likes')
          const comments = getValue('comments')
          const shares = getValue('shares')
          const estimatedMinutesWatched = getValue('estimatedMinutesWatched')
          const averageViewDuration = getValue('averageViewDuration')

          // Calculate engagement rate
          const engagementRate = views > 0 ? ((likes + comments + shares) / views) * 100 : 0

          metrics.set(videoId, {
            views: Math.round(views),
            likes: Math.round(likes),
            comments: Math.round(comments),
            shares: Math.round(shares),
            watchTimeSeconds: Math.round(estimatedMinutesWatched * 60),
            averageViewDurationSeconds: Math.round(averageViewDuration),
            engagementRate: Math.round(engagementRate * 100) / 100,
            clickThroughRate: undefined, // CTR requires impressions data which isn't available here
          })
        }
      } catch (error: any) {
        console.error(`Error fetching analytics for video ${videoId}:`, error)
        // Continue with other videos
      }
    }

    // Small delay to avoid rate limits
    if (i + batchSize < videoIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return metrics
}

/**
 * Calculate click-through rate (CTR) from impressions and views
 * Note: YouTube Analytics API doesn't provide impressions directly
 * This would need to be fetched separately or estimated
 */
export function calculateCTR(views: number, impressions?: number): number | undefined {
  if (!impressions || impressions === 0) return undefined
  return Math.round((views / impressions) * 100 * 100) / 100
}


