/**
 * YouTube API Utility Functions
 * Centralized helpers for YouTube API operations
 */

/**
 * Get the base URL for the application
 * Prioritizes custom domain, then falls back to request origin
 */
export function getBaseUrl(request?: {
  headers?: Headers | { get: (key: string) => string | null }
  nextUrl?: { origin: string; host: string }
}): string {
  // First, check for explicit environment variable (priority)
  const customDomain = process.env.NEXT_PUBLIC_APP_URL
  
  // If custom domain is set and is a full URL, use it
  if (customDomain && customDomain.startsWith('http')) {
    return customDomain.replace(/\/$/, '') // Remove trailing slash
  }
  
  // If custom domain is just a domain name, add https
  if (customDomain && !customDomain.includes('://')) {
    return `https://${customDomain.replace(/\/$/, '')}`
  }
  
  // For production, always use contentmotor.co (hardcoded fallback)
  // This ensures consistency with Google Cloud Console configuration
  if (process.env.VERCEL_ENV === 'production' || !customDomain) {
    return 'https://contentmotor.co'
  }
  
  // Fall back to request origin for preview/local
  if (request) {
    const origin = request.headers?.get?.('origin') || request.nextUrl?.origin
    if (origin) {
      return origin.replace(/\/$/, '')
    }
  }
  
  // Final fallback
  return 'https://contentmotor.co'
}

/**
 * Get the YouTube OAuth redirect URI
 * Ensures proper formatting and encoding
 * CRITICAL: Must match EXACTLY what's configured in Google Cloud Console
 */
export function getYouTubeRedirectUri(request?: {
  headers?: Headers | { get: (key: string) => string | null }
  nextUrl?: { origin: string; host: string }
}): string {
  // ALWAYS check the request origin/hostname to determine correct redirect URI
  // This is the most reliable way to match what's configured in Google Cloud Console
  
  let hostname: string | null = null
  
  // Try to get hostname from request
  if (request?.nextUrl?.host) {
    hostname = request.nextUrl.host
  } else if (request?.headers?.get) {
    const host = request.headers.get('host')
    if (host) {
      hostname = host.split(':')[0] // Remove port if present
    }
  }
  
  // For production domain (contentmotor.co), always use the exact production URL
  // This MUST match exactly what's in Google Cloud Console
  if (hostname === 'contentmotor.co' || hostname?.endsWith('contentmotor.co')) {
    const productionRedirectUri = 'https://contentmotor.co/api/youtube/callback'
    console.log('[YouTube OAuth] ✅ Detected production domain:', hostname)
    console.log('[YouTube OAuth] ✅ Using production redirect URI:', productionRedirectUri)
    return productionRedirectUri
  }
  
  // For localhost, use localhost redirect URI
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const localRedirectUri = 'http://localhost:3000/api/youtube/callback'
    console.log('[YouTube OAuth] ✅ Detected localhost, using:', localRedirectUri)
    return localRedirectUri
  }
  
  // For Vercel preview URLs (any other hostname), default to production
  // This ensures consistency with Google Cloud Console configuration
  const productionRedirectUri = 'https://contentmotor.co/api/youtube/callback'
  console.log('[YouTube OAuth] ⚠️  Unknown hostname:', hostname)
  console.log('[YouTube OAuth] ✅ Defaulting to production redirect URI:', productionRedirectUri)
  return productionRedirectUri
}

/**
 * Validate YouTube OAuth credentials
 */
export function validateYouTubeCredentials(): {
  valid: boolean
  clientId?: string
  clientSecret?: string
  error?: string
} {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET

  if (!clientId) {
    return {
      valid: false,
      error: 'YOUTUBE_CLIENT_ID is not configured',
    }
  }

  if (!clientSecret) {
    return {
      valid: false,
      error: 'YOUTUBE_CLIENT_SECRET is not configured',
    }
  }

  if (!clientId.includes('.apps.googleusercontent.com')) {
    return {
      valid: false,
      error: 'Invalid Client ID format - should end with .apps.googleusercontent.com',
    }
  }

  return {
    valid: true,
    clientId,
    clientSecret,
  }
}



