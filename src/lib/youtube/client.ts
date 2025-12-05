import { createClient } from "@supabase/supabase-js"
import { YouTubeConnection } from "@/types/database"

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

interface YouTubeTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
  token_type: string
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: connection, error } = await supabase
    .from("youtube_connections")
    .select("*")
    .eq("id", "default")
    .single()

  if (error || !connection) {
    console.error("No YouTube connection found")
    return null
  }

  // Check if token is still valid (with 5 minute buffer)
  const expiresAt = new Date(connection.token_expires_at)
  const bufferTime = 5 * 60 * 1000 // 5 minutes

  if (expiresAt.getTime() - bufferTime > Date.now()) {
    return connection.access_token
  }

  // Token expired or expiring soon - refresh it
  if (!connection.refresh_token) {
    console.error("No refresh token available")
    return null
  }

  const newTokens = await refreshAccessToken(connection.refresh_token)
  if (!newTokens) {
    return null
  }

  // Update tokens in database
  const { error: updateError } = await supabase
    .from("youtube_connections")
    .update({
      access_token: newTokens.access_token,
      token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default")

  if (updateError) {
    console.error("Failed to update tokens:", updateError)
  }

  return newTokens.access_token
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<YouTubeTokens | null> {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error("YouTube OAuth credentials not configured")
    return null
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Token refresh failed:", error)
      return null
    }

    return await response.json()
  } catch (err) {
    console.error("Token refresh error:", err)
    return null
  }
}

/**
 * Make an authenticated request to the YouTube API
 */
export async function youtubeApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const accessToken = await getValidAccessToken()

  if (!accessToken) {
    console.error("No valid access token available")
    return null
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${YOUTUBE_API_BASE}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`YouTube API error (${response.status}):`, error)
      return null
    }

    return await response.json()
  } catch (err) {
    console.error("YouTube API fetch error:", err)
    return null
  }
}

/**
 * Get the connected YouTube channel info
 */
export async function getChannelInfo() {
  return youtubeApiFetch<{
    items: Array<{
      id: string
      snippet: {
        title: string
        description: string
        thumbnails: {
          default: { url: string }
          medium: { url: string }
          high: { url: string }
        }
      }
      statistics: {
        viewCount: string
        subscriberCount: string
        videoCount: string
      }
    }>
  }>("/channels?part=snippet,statistics&mine=true")
}

/**
 * Get channel videos
 */
export async function getChannelVideos(maxResults = 10) {
  return youtubeApiFetch<{
    items: Array<{
      id: { videoId: string }
      snippet: {
        title: string
        description: string
        publishedAt: string
        thumbnails: {
          default: { url: string }
          medium: { url: string }
          high: { url: string }
        }
      }
    }>
  }>(`/search?part=snippet&forMine=true&type=video&maxResults=${maxResults}`)
}

/**
 * Get video analytics (requires yt-analytics scope)
 */
export async function getVideoAnalytics(videoId: string, startDate: string, endDate: string) {
  const url = `https://youtubeanalytics.googleapis.com/v2/reports?` +
    `ids=channel==MINE&` +
    `startDate=${startDate}&` +
    `endDate=${endDate}&` +
    `metrics=views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration&` +
    `filters=video==${videoId}&` +
    `dimensions=day`

  return youtubeApiFetch<{
    rows: Array<[string, number, number, number, number, number, number]>
    columnHeaders: Array<{ name: string; columnType: string; dataType: string }>
  }>(url)
}
