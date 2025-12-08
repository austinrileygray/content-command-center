/**
 * Instagram Business API Client
 * Handles OAuth authentication and content publishing to Instagram
 * 
 * API Docs: https://developers.facebook.com/docs/instagram-api
 */

const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v18.0'
const INSTAGRAM_OAUTH_BASE = 'https://www.facebook.com/v18.0/dialog/oauth'
const INSTAGRAM_TOKEN_BASE = 'https://graph.facebook.com/v18.0/oauth/access_token'

interface InstagramAuthConfig {
  appId: string
  appSecret: string
  redirectUri: string
  scopes?: string[]
}

interface InstagramPostMetadata {
  caption?: string
  locationId?: string
  userTags?: Array<{ username: string; x: number; y: number }>
  productTags?: Array<{ productId: string; x: number; y: number }>
}

/**
 * Generate Instagram OAuth authorization URL
 * Note: Instagram uses Facebook OAuth flow
 */
export function getInstagramAuthUrl(redirectUri: string, appId: string): string {
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
  ].join(',')

  const params = new URLSearchParams()
  params.append('client_id', appId)
  params.append('redirect_uri', redirectUri)
  params.append('scope', scopes)
  params.append('response_type', 'code')
  params.append('state', generateRandomState())

  return `${INSTAGRAM_OAUTH_BASE}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeInstagramCode(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(`${INSTAGRAM_TOKEN_BASE}?${new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  })}`)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  return response.json()
}

/**
 * Get user's Instagram Business Account ID
 */
export async function getInstagramBusinessAccount(
  accessToken: string,
  pageId: string
): Promise<{ id: string; username: string }> {
  const response = await fetch(
    `${INSTAGRAM_API_BASE}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
  )

  if (!response.ok) {
    throw new Error('Failed to get Instagram Business Account')
  }

  const data = await response.json()
  const igAccountId = data.instagram_business_account.id

  // Get account details
  const accountResponse = await fetch(
    `${INSTAGRAM_API_BASE}/${igAccountId}?fields=username&access_token=${accessToken}`
  )

  const accountData = await accountResponse.json()

  return {
    id: igAccountId,
    username: accountData.username,
  }
}

/**
 * Create video media container (step 1 of Instagram publishing)
 */
export async function createInstagramVideoContainer(
  accessToken: string,
  igAccountId: string,
  videoUrl: string,
  metadata: InstagramPostMetadata
): Promise<{ id: string }> {
  const response = await fetch(
    `${INSTAGRAM_API_BASE}/${igAccountId}/media?` +
    new URLSearchParams({
      media_type: 'REELS', // or 'VIDEO' for regular posts
      video_url: videoUrl,
      caption: metadata.caption || '',
      access_token: accessToken,
    })
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create container: ${JSON.stringify(error)}`)
  }

  return response.json()
}

/**
 * Publish video container (step 2 of Instagram publishing)
 */
export async function publishInstagramVideo(
  accessToken: string,
  igAccountId: string,
  creationId: string
): Promise<{ id: string }> {
  const response = await fetch(
    `${INSTAGRAM_API_BASE}/${igAccountId}/media_publish?` +
    new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    })
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to publish: ${JSON.stringify(error)}`)
  }

  return response.json()
}

/**
 * Upload video to Instagram
 * Note: Instagram requires 2-step process: create container, then publish
 */
export async function uploadInstagramVideo(
  accessToken: string,
  igAccountId: string,
  videoFileUrl: string,
  metadata: InstagramPostMetadata
): Promise<{ videoId: string; videoUrl: string }> {
  // Step 1: Create media container
  const container = await createInstagramVideoContainer(
    accessToken,
    igAccountId,
    videoFileUrl,
    metadata
  )

  // Wait for container to be ready (Instagram requires processing time)
  // Poll status until ready
  let status = 'IN_PROGRESS'
  let attempts = 0
  while (status === 'IN_PROGRESS' && attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
    
    const statusResponse = await fetch(
      `${INSTAGRAM_API_BASE}/${container.id}?fields=status_code&access_token=${accessToken}`
    )
    const statusData = await statusResponse.json()
    status = statusData.status_code
    
    attempts++
  }

  if (status !== 'FINISHED') {
    throw new Error(`Container not ready after ${attempts} attempts. Status: ${status}`)
  }

  // Step 2: Publish the container
  const publishResult = await publishInstagramVideo(
    accessToken,
    igAccountId,
    container.id
  )

  return {
    videoId: publishResult.id,
    videoUrl: `https://www.instagram.com/reel/${publishResult.id}/`,
  }
}

/**
 * Generate random state for CSRF protection
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}









