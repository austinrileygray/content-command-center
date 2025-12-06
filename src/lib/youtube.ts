/**
 * YouTube API Client
 * Handles OAuth authentication and video publishing to YouTube
 * 
 * API Docs: https://developers.google.com/youtube/v3
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const YOUTUBE_OAUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth'
const YOUTUBE_TOKEN_BASE = 'https://oauth2.googleapis.com/token'

interface YouTubeAuthConfig {
  clientId: string
  clientSecret?: string
  redirectUri: string
  scopes?: string[]
}

interface YouTubeVideoMetadata {
  title: string
  description?: string
  tags?: string[]
  categoryId?: string
  privacyStatus?: 'private' | 'unlisted' | 'public'
  thumbnailUrl?: string
}

/**
 * Generate YouTube OAuth authorization URL
 */
export function getYouTubeAuthUrl(redirectUri: string, clientId: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly', // For fetching videos
    'https://www.googleapis.com/auth/yt-analytics.readonly', // For analytics data
  ].join(' ')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
  })

  return `${YOUTUBE_OAUTH_BASE}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeYouTubeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch(YOUTUBE_TOKEN_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  return response.json()
}

/**
 * Refresh YouTube access token
 */
export async function refreshYouTubeToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(YOUTUBE_TOKEN_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  return response.json()
}

/**
 * Upload video to YouTube
 * Note: This function expects a File or Blob that can be read in Node.js
 * For server-side uploads, we'll need to fetch the file from a URL first
 */
export async function uploadYouTubeVideo(
  accessToken: string,
  videoFileUrl: string,
  metadata: YouTubeVideoMetadata
): Promise<{ videoId: string; videoUrl: string }> {
  // First, download the video file from the URL
  const videoResponse = await fetch(videoFileUrl)
  if (!videoResponse.ok) {
    throw new Error("Failed to download video file")
  }

  const videoBlob = await videoResponse.blob()
  
  // Create video snippet
  const snippet = {
    title: metadata.title,
    description: metadata.description || '',
    tags: metadata.tags || [],
    categoryId: metadata.categoryId || '22', // People & Blogs
  }

  const status = {
    privacyStatus: metadata.privacyStatus || 'unlisted',
    selfDeclaredMadeForKids: false,
  }

  // Create multipart upload body
  const formData = new FormData()
  const metadataPart = JSON.stringify({
    snippet,
    status,
  })

  formData.append('metadata', new Blob([metadataPart], { type: 'application/json' }))
  formData.append('media', videoBlob)

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?uploadType=multipart&part=snippet,status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to upload video: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  const videoId = data.id

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  }
}

/**
 * Get YouTube channel information
 */
export async function getYouTubeChannel(accessToken: string): Promise<{
  id: string
  title: string
  description: string
  customUrl: string
  thumbnailUrl: string
}> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet&mine=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get channel: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  const channel = data.items[0]

  return {
    id: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    customUrl: channel.snippet.customUrl || '',
    thumbnailUrl: channel.snippet.thumbnails.default.url,
  }
}


