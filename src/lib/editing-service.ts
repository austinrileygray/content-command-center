/**
 * Editing Service Client
 * Handles long-form video editing integration (Descript or alternative)
 * 
 * This is a service-agnostic client that can be adapted to:
 * - Descript API
 * - RunwayML
 * - Custom editing service
 * - Any other long-form editing service
 */

const EDITING_SERVICE_BASE = process.env.EDITING_SERVICE_BASE_URL || 'https://api.descript.com/v1'

export interface EditingServiceRequest {
  videoUrl: string
  prompt: string
  projectId?: string
  webhookUrl?: string
  options?: {
    generateVersions?: number // Number of versions to generate
    outputFormat?: string
    quality?: string
  }
}

export interface EditingServiceResponse {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  projectId?: string
  webhookUrl?: string
}

export interface EditingServiceVersion {
  version: number
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  metadata?: Record<string, any>
}

export interface EditingServiceStatus {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  versions?: EditingServiceVersion[]
  progress?: number
  error?: string
}

class EditingServiceClient {
  private apiKey: string | null
  private serviceType: 'descript' | 'runway' | 'custom'

  constructor() {
    // Support multiple editing services
    this.apiKey = process.env.DESCRIPT_API_KEY || 
                   process.env.RUNWAY_API_KEY || 
                   process.env.EDITING_SERVICE_API_KEY || 
                   null
    this.serviceType = (process.env.EDITING_SERVICE_TYPE || 'descript') as 'descript' | 'runway' | 'custom'
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Editing service API key not configured. Add DESCRIPT_API_KEY or EDITING_SERVICE_API_KEY to environment variables.')
    }

    const response = await fetch(`${EDITING_SERVICE_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Editing service API error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Submit a video for editing based on a prompt
   */
  async submitEditingJob(data: EditingServiceRequest): Promise<EditingServiceResponse> {
    if (!this.apiKey) {
      throw new Error('Editing service API key not configured')
    }

    // This will be implemented based on the actual service API
    // For now, return a placeholder structure
    return this.request('/editing/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Check the status of an editing job
   */
  async getJobStatus(jobId: string): Promise<EditingServiceStatus> {
    if (!this.apiKey) {
      throw new Error('Editing service API key not configured')
    }

    return this.request(`/editing/jobs/${jobId}`)
  }

  /**
   * Get available versions/renders for a completed job
   */
  async getVersions(jobId: string): Promise<EditingServiceVersion[]> {
    if (!this.apiKey) {
      throw new Error('Editing service API key not configured')
    }

    const status = await this.getJobStatus(jobId)
    return status.versions || []
  }
}

// Singleton instance
let editingServiceClient: EditingServiceClient | null = null

export function getEditingServiceClient(): EditingServiceClient {
  if (!editingServiceClient) {
    editingServiceClient = new EditingServiceClient()
  }
  return editingServiceClient
}

// Types are already exported as interfaces above, no need to re-export






