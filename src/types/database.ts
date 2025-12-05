export type ContentStatus =
  | "idea"
  | "selected"
  | "guest_outreach"
  | "scheduled"
  | "recording"
  | "processing"
  | "ready_to_publish"
  | "published"
  | "archived"

export type ContentFormat = "solo_youtube" | "guest_interview" | "live_stream"

export type RecordingPlatform = "loom" | "squadcast" | "restream"

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  youtube_channel_id: string | null
  metadata?: {
    youtube?: {
      access_token: string
      refresh_token: string
      expires_at: string
    }
    [key: string]: any
  } | null
  created_at: string
  updated_at: string
}

export interface ContentIdea {
  id: string
  user_id: string
  title: string
  hook: string | null
  description: string | null
  format: ContentFormat
  status: ContentStatus
  confidence_score: number | null
  estimated_length: number | null
  script: ScriptData | null
  thumbnail_concept: ThumbnailConcept | null
  seo_keywords: string[] | null
  why_this_will_work: string | null
  source_inspiration: string | null
  source_video_id: string | null      // YouTube video ID that inspired this idea
  guest_id: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  recording_url: string | null
  recording_platform: RecordingPlatform | null
  submagic_project_id: string | null  // Submagic Magic Clips project ID
  submagic_template: string | null     // Caption template used
  transcript: string | null
  created_at: string
  updated_at: string
  selected_at: string | null
  recorded_at: string | null
  published_at: string | null
  week_generated: string | null
  // Joined data
  guest?: Guest | null
}

export interface Guest {
  id: string
  user_id: string
  name: string
  email: string | null
  linkedin_url: string | null
  twitter_handle: string | null
  title: string | null
  company: string | null
  expertise: string[] | null
  status: string
  relevance_score: number | null
  notes: string | null
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  confirmed_at: string | null
}

export interface Recording {
  id: string
  content_idea_id: string
  platform: RecordingPlatform
  external_id: string | null
  external_url: string | null
  status: string
  scheduled_start: string | null
  actual_start: string | null
  actual_end: string | null
  duration: number | null
  recording_urls: Record<string, string> | null
  transcript_url: string | null
  webhook_payload: any | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  content_idea_id: string
  type: "clip" | "thumbnail" | "blog" | "social_post" | "newsletter"
  status: "generating" | "ready" | "approved" | "published" | "failed"
  title: string | null
  file_url: string | null
  thumbnail_url: string | null
  duration: number | null           // For clips: duration in seconds
  virality_score: number | null     // Submagic's AI virality prediction
  metadata: AssetMetadata | null
  platform: string | null
  published_url: string | null
  submagic_clip_id: string | null   // Reference to Submagic clip
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface AssetMetadata {
  // For clips from Submagic
  transcript?: string
  suggestedTitle?: string
  suggestedHashtags?: string[]
  // For thumbnails
  imagePrompt?: string
  // For blog/newsletter
  content?: string
  wordCount?: number
  generatedFrom?: string
  // Generic
  sourceTimestamp?: { start: number; end: number }
}

export interface ScriptData {
  hook: string
  intro: string
  mainPoints: {
    point: string
    talkingPoints: string[]
    estimatedDuration: number
  }[]
  callToAction: string
  outro: string
}

export interface ThumbnailConcept {
  mainText: string
  subText?: string
  visualDescription: string
  emotionToConvey: string
  colorScheme: string[]
}

// From master branch - Thumbnail Training
export interface ThumbnailTraining {
  id: string
  user_id: string
  category: "youtube" | "short_form"
  image_url: string
  source_type: "manual" | "youtube_auto" | "external"
  source_video_id: string | null
  source_video_title: string | null
  source_video_url: string | null
  performance_metrics: {
    views?: number
    likes?: number
    comments?: number
    engagement_rate?: number
    ctr?: number
    [key: string]: any
  } | null
  tags: string[] | null
  notes: string | null
  approved: boolean
  created_at: string
  updated_at: string
}

// From master branch - YouTube Video Analytics
export interface YouTubeVideo {
  id: string
  user_id: string
  video_id: string
  title: string
  description: string | null
  published_at: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  views: number
  likes: number
  comments: number
  shares: number
  watch_time_seconds: number
  average_view_duration_seconds: number
  click_through_rate: number | null
  engagement_rate: number | null
  performance_score: number | null
  category_id: string | null
  tags: string[] | null
  language: string | null
  topics: string[] | null
  format_type: string | null
  hook_pattern: string | null
  thumbnail_style: string | null
  last_analytics_fetch: string | null
  created_at: string
  updated_at: string
}

// From master branch - Content Patterns
export interface ContentPattern {
  id: string
  user_id: string
  pattern_type: 'topic' | 'format' | 'hook' | 'thumbnail' | 'title_structure'
  pattern_name: string
  pattern_data: Record<string, any>
  performance_impact: string | null
  video_count: number | null
  average_performance_score: number | null
  last_analyzed_at: string
  created_at: string
  updated_at: string
}

// YouTube OAuth Connection
export interface YouTubeConnection {
  id: string
  channel_id: string
  channel_title: string
  channel_thumbnail: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string
  scope: string | null
  created_at: string
  updated_at: string
}

// Thumbnail Generation Types
export type IngredientType = 'face' | 'inspiration' | 'logo' | 'background' | 'other'

export interface ThumbnailIngredient {
  id: string
  user_id: string
  name: string
  type: IngredientType
  file_url: string
  thumbnail_url: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type ThumbnailStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface GeneratedThumbnail {
  id: string
  user_id: string
  content_idea_id: string | null
  prompt: string
  style: string | null
  aspect_ratio: string
  ingredients_used: string[]
  result_url: string | null
  result_thumbnail_url: string | null
  status: ThumbnailStatus
  error_message: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// Viral Clip Analysis Types
export type ViralClipAnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ViralClip {
  startTime: number
  endTime: number
  duration: number
  score: number
  reason: string
  hook: string
  suggestedCaption: string
  emotionalPeak: string
  thumbnailTimestamp: number
}

export interface ViralClipAnalysis {
  id: string
  user_id: string
  video_id: string
  video_url: string | null
  video_title: string | null
  clips: ViralClip[]
  video_summary: string | null
  overall_viral_potential: number | null
  target_audience: string | null
  content_category: string | null
  status: ViralClipAnalysisStatus
  error_message: string | null
  created_at: string
  updated_at: string
}
