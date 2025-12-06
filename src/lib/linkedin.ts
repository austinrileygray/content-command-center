/**
 * LinkedIn API Client
 * Handles OAuth authentication and content publishing to LinkedIn
 * 
 * API Docs: https://docs.microsoft.com/en-us/linkedin/
 */

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'
const LINKEDIN_OAUTH_BASE = 'https://www.linkedin.com/oauth/v2/authorization'
const LINKEDIN_TOKEN_BASE = 'https://www.linkedin.com/oauth/v2/accessToken'

interface LinkedInAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes?: string[]
}

interface LinkedInPostMetadata {
  text: string
  visibility?: 'PUBLIC' | 'CONNECTIONS'
  mediaCategory?: 'IMAGE' | 'VIDEO'
}

/**
 * Generate LinkedIn OAuth authorization URL
 */
export function getLinkedInAuthUrl(redirectUri: string, clientId: string): string {
  const scopes = [
    'r_liteprofile',
    'r_emailaddress',
    'w_member_social',
    'w_organization_social',
  ].join(' ')

  const params = new URLSearchParams()
  params.append('response_type', 'code')
  params.append('client_id', clientId)
  params.append('redirect_uri', redirectUri)
  params.append('state', generateRandomState())
  params.append('scope', scopes)

  return `${LINKEDIN_OAUTH_BASE}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeLinkedInCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams()
  params.append('grant_type', 'authorization_code')
  params.append('code', code)
  params.append('redirect_uri', redirectUri)
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)

  const response = await fetch(LINKEDIN_TOKEN_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  return response.json()
}

/**
 * Upload video to LinkedIn
 * Note: LinkedIn requires multi-step process: register upload, upload video, then share
 */
export async function uploadLinkedInVideo(
  accessToken: string,
  videoFileUrl: string,
  metadata: LinkedInPostMetadata
): Promise<{ videoId: string; videoUrl: string }> {
  // Step 1: Register video upload
  const registerResponse = await fetch(
    `${LINKEDIN_API_BASE}/assets?action=registerUpload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
          owner: `urn:li:person:${await getLinkedInPersonId(accessToken)}`,
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          }],
        },
      }),
    }
  )

  if (!registerResponse.ok) {
    const error = await registerResponse.json()
    throw new Error(`Failed to register upload: ${JSON.stringify(error)}`)
  }

  const registerData = await registerResponse.json()
  const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
  const asset = registerData.value.asset

  // Step 2: Download and upload video file
  const videoResponse = await fetch(videoFileUrl)
  if (!videoResponse.ok) {
    throw new Error("Failed to download video file")
  }

  const videoBlob = await videoResponse.blob()

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: videoBlob,
  })

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload video')
  }

  // Step 3: Create a post with the video
  const postResponse = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:person:${await getLinkedInPersonId(accessToken)}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: metadata.text || '',
          },
          shareMediaCategory: 'VIDEO',
          media: [{
            status: 'READY',
            description: {
              text: metadata.text || '',
            },
            media: asset,
            title: {
              text: metadata.text || '',
            },
          }],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': metadata.visibility || 'PUBLIC',
      },
    }),
  })

  if (!postResponse.ok) {
    const error = await postResponse.json()
    throw new Error(`Failed to create post: ${JSON.stringify(error)}`)
  }

  const postData = await postResponse.json()
  const postId = postData.id

  return {
    videoId: postId,
    videoUrl: `https://www.linkedin.com/feed/update/${postId}`,
  }
}

/**
 * Get LinkedIn person ID from access token
 */
async function getLinkedInPersonId(accessToken: string): Promise<string> {
  const response = await fetch(
    `${LINKEDIN_API_BASE}/me`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get LinkedIn profile')
  }

  const data = await response.json()
  return data.id
}

/**
 * Generate random state for CSRF protection
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}








