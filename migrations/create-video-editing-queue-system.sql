-- ============================================
-- VIDEO EDITING QUEUE SYSTEM
-- ============================================
-- Handles video editing jobs, versions, reviews, and video-specific prompts

-- Video-specific prompts (copied from master prompts for individual videos)
CREATE TABLE IF NOT EXISTS video_specific_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  content_idea_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
  based_on_prompt_id UUID REFERENCES recording_editing_prompts(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('podcast', 'solo_youtube')),
  name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  edit_notes TEXT, -- User's edit notes/instructions
  version_number INTEGER DEFAULT 1,
  is_master_update BOOLEAN DEFAULT false, -- If true, this update should also update master
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video editing jobs (tracks the editing workflow for each recording)
CREATE TABLE IF NOT EXISTS video_editing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  content_idea_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
  master_prompt_id UUID REFERENCES recording_editing_prompts(id) ON DELETE SET NULL,
  video_specific_prompt_id UUID REFERENCES video_specific_prompts(id) ON DELETE SET NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready_for_review', 'needs_edits', 'approved')),
  
  -- Editing service info
  editing_service TEXT, -- 'submagic', 'descript', 'custom', etc.
  editing_job_id TEXT, -- External service job ID
  editing_service_url TEXT, -- URL to editing service dashboard
  
  -- Multiple renderings/versions
  versions JSONB DEFAULT '[]'::jsonb, -- Array of { version: number, file_url: string, thumbnail_url: string, created_at: string }
  selected_version INTEGER, -- Which version is currently selected for review
  
  -- Review info
  final_approved_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL, -- Once approved, link to assets table
  
  -- Edit history
  edit_history JSONB DEFAULT '[]'::jsonb, -- Array of edit requests with notes, timestamps, etc.
  
  -- Metadata
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_specific_prompts_recording ON video_specific_prompts(recording_id);
CREATE INDEX IF NOT EXISTS idx_video_specific_prompts_content_idea ON video_specific_prompts(content_idea_id);
CREATE INDEX IF NOT EXISTS idx_video_editing_jobs_recording ON video_editing_jobs(recording_id);
CREATE INDEX IF NOT EXISTS idx_video_editing_jobs_content_idea ON video_editing_jobs(content_idea_id);
CREATE INDEX IF NOT EXISTS idx_video_editing_jobs_status ON video_editing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_editing_jobs_prompt ON video_editing_jobs(video_specific_prompt_id);

-- Triggers
CREATE TRIGGER video_specific_prompts_updated_at 
  BEFORE UPDATE ON video_specific_prompts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER video_editing_jobs_updated_at 
  BEFORE UPDATE ON video_editing_jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- Add editing_job_id to recordings for easy lookup
ALTER TABLE recordings 
  ADD COLUMN IF NOT EXISTS editing_job_id UUID REFERENCES video_editing_jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recordings_editing_job ON recordings(editing_job_id);









