/**
 * TikTok API Client
 * Handles OAuth authentication and video publishing to TikTok
 * 
 * API Docs: https://developers.tiktok.com/doc
 */

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2'
const TIKTOK_OAUTH_BASE = 'https://www.tiktok.com/v2/auth/authorize'
const TIKTOK_TOKEN_BASE = 'https://open.tiktokapis.com/v2/oauth/token'

interface TikTokAuthConfig {
  clientKey: string
  clientSecret: string
  redirectUri: string
  scopes?: string[]
}

interface TikTokVideoMetadata {
  title: string
  description?: string
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'
  disableDuet?: boolean
  disableComment?: boolean
  disableStitch?: boolean
  videoCoverTimestampMs?: number
}

/**
 * Generate TikTok OAuth authorization URL
 */
export function getTikTokAuthUrl(redirectUri: string, clientKey: string): string {
  const scopes = [
    'user.info.basic',
    'video.upload',
    'video.publish',
  ].join(',') // TikTok uses comma-separated scopes

  const params = new URLSearchParams()
  params.append('client_key', clientKey)
  params.append('redirect_uri', redirectUri)
  params.append('scope', scopes)
  params.append('response_type', 'code')
  params.append('state', generateRandomState()) // CSRF protection

  return `${TIKTOK_OAUTH_BASE}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeTikTokCode(
  code: string,
  clientKey: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch(TIKTOK_TOKEN_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  const data = await response.json()
  
  // TikTok returns different structure, map it
  return {
    access_token: data.data.access_token,
    refresh_token: data.data.refresh_token || '',
    expires_in: data.data.expires_in || 0,
  }
}

/**
 * Refresh TikTok access token
 */
export async function refreshTikTokToken(
  refreshToken: string,
  clientKey: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(TIKTOK_TOKEN_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  const data = await response.json()
  return {
    access_token: data.data.access_token,
    expires_in: data.data.expires_in || 0,
  }
}

/**
 * Upload video to TikTok
 * Note: TikTok requires a 2-step process: initialize upload, then upload in chunks
 */
export async function uploadTikTokVideo(
  accessToken: string,
  videoFileUrl: string,
  metadata: TikTokVideoMetadata
): Promise<{ videoId: string; videoUrl: string }> {
  // Step 1: Download video file
  const videoResponse = await fetch(videoFileUrl)
  if (!videoResponse.ok) {
    throw new Error("Failed to download video file")
  }

  const videoBlob = await videoResponse.blob()
  
  // Step 2: Initialize upload (TikTok requires this)
  const initResponse = await fetch(`${TIKTOK_API_BASE}/video/init/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoBlob.size,
        chunk_size: 10000000, // 10MB chunks
        total_chunk_count: Math.ceil(videoBlob.size / 10000000),
      },
      post_info: {
        title: metadata.title,
        description: metadata.description || '',
        privacy_level: metadata.privacyLevel || 'PUBLIC_TO_EVERYONE',
        disable_duet: metadata.disableDuet || false,
        disable_comment: metadata.disableComment || false,
        disable_stitch: metadata.disableStitch || false,
        video_cover_timestamp_ms: metadata.videoCoverTimestampMs || 1000,
      },
    }),
  })

  if (!initResponse.ok) {
    const error = await initResponse.json()
    throw new Error(`Failed to initialize upload: ${JSON.stringify(error)}`)
  }

  const initData = await initResponse.json()
  const uploadUrl = initData.data.upload_url
  const publishId = initData.data.publish_id

  // Step 3: Upload video in chunks
  const chunkSize = 10000000 // 10MB
  const totalChunks = Math.ceil(videoBlob.size / chunkSize)

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, videoBlob.size)
    const chunk = videoBlob.slice(start, end)

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${start}-${end - 1}/${videoBlob.size}`,
      },
      body: chunk,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload chunk ${i + 1}`)
    }
  }

  // Step 4: Publish video
  const publishResponse = await fetch(`${TIKTOK_API_BASE}/video/publish/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publish_id: publishId,
    }),
  })

  if (!publishResponse.ok) {
    const error = await publishResponse.json()
    throw new Error(`Failed to publish video: ${JSON.stringify(error)}`)
  }

  const publishData = await publishResponse.json()
  const videoId = publishData.data.video_id

  return {
    videoId,
    videoUrl: `https://www.tiktok.com/@your_username/video/${videoId}`,
  }
}

/**
 * Generate random state for CSRF protection
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}









