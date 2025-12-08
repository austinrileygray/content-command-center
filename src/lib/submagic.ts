/**
 * Submagic API Client
 * Handles all interactions with Submagic for video processing and clip generation
 * 
 * API Docs: https://docs.submagic.co
 * Features: Magic Clips, AI Captions, B-Roll, Auto-Zoom, Transitions
 */

const SUBMAGIC_API_BASE = 'https://api.submagic.co/v1'

interface SubmagicProjectRequest {
  title: string
  language?: string
  videoUrl: string
  templateName?: string
  webhookUrl?: string
  magicZooms?: boolean
  magicBrolls?: boolean
  magicBrollsPercentage?: number
  dictionary?: string[]
}

interface SubmagicMagicClipsRequest {
  title: string
  language?: string
  youtubeUrl?: string
  videoUrl?: string
  templateName?: string
  webhookUrl?: string
}

interface SubmagicProject {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  downloadUrl?: string
  transcript?: string
  createdAt: string
}

interface SubmagicClip {
  id: string
  title: string
  downloadUrl: string
  thumbnailUrl?: string
  duration: number
  viralityScore?: number
  transcript?: string
}

interface SubmagicMagicClipsResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  clips?: SubmagicClip[]
}

class SubmagicClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${SUBMAGIC_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Submagic API error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get available caption templates
   */
  async getTemplates(): Promise<{ templates: string[] }> {
    return this.request('/templates')
  }

  /**
   * Get supported languages
   */
  async getLanguages(): Promise<{ languages: { code: string; name: string }[] }> {
    return this.request('/languages')
  }

  /**
   * Create a new project for video processing (captions, effects, etc.)
   */
  async createProject(data: SubmagicProjectRequest): Promise<SubmagicProject> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Get project status and details
   */
  async getProject(projectId: string): Promise<SubmagicProject> {
    return this.request(`/projects/${projectId}`)
  }

  /**
   * Create Magic Clips - generates multiple short clips from a long video
   * This is the main method for content repurposing
   */
  async createMagicClips(data: SubmagicMagicClipsRequest): Promise<SubmagicMagicClipsResponse> {
    return this.request('/magic-clips', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Get Magic Clips project status and clips
   */
  async getMagicClips(projectId: string): Promise<SubmagicMagicClipsResponse> {
    return this.request(`/magic-clips/${projectId}`)
  }

  /**
   * Export a project (trigger final render)
   */
  async exportProject(projectId: string): Promise<{ downloadUrl: string }> {
    return this.request(`/projects/${projectId}/export`, {
      method: 'POST',
    })
  }
}

// Singleton instance
let submagicClient: SubmagicClient | null = null

export function getSubmagicClient(): SubmagicClient {
  if (!submagicClient) {
    const apiKey = process.env.SUBMAGIC_API_KEY
    if (!apiKey) {
      throw new Error('SUBMAGIC_API_KEY environment variable is not set')
    }
    submagicClient = new SubmagicClient(apiKey)
  }
  return submagicClient
}

export type {
  SubmagicProjectRequest,
  SubmagicMagicClipsRequest,
  SubmagicProject,
  SubmagicClip,
  SubmagicMagicClipsResponse,
}



