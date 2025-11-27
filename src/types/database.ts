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
  guest_id: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  recording_url: string | null
  recording_platform: RecordingPlatform | null
  opus_project_id: string | null
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
  status: "generating" | "ready" | "published" | "failed"
  title: string | null
  file_url: string | null
  metadata: any | null
  platform: string | null
  published_url: string | null
  created_at: string
  updated_at: string
  published_at: string | null
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
