-- ============================================
-- RECORDING EDITING PROMPTS SYSTEM
-- ============================================
-- Stores prompts for podcast and solo YouTube video editing workflows

CREATE TABLE IF NOT EXISTS recording_editing_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('podcast', 'solo_youtube')),
  name TEXT NOT NULL, -- User-friendly name (e.g., "Podcast Editing V1", "Solo YouTube Editing")
  prompt_text TEXT NOT NULL, -- The full editing prompt
  is_active BOOLEAN DEFAULT false,
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_recording_prompts_user_category ON recording_editing_prompts(user_id, category);
CREATE INDEX IF NOT EXISTS idx_recording_prompts_active ON recording_editing_prompts(user_id, category, is_active) WHERE is_active = true;

-- Unique constraint: Only one active prompt per category per user
-- Use a partial unique index for conditional uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_recording_prompts_one_active_per_category 
  ON recording_editing_prompts(user_id, category) 
  WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER recording_editing_prompts_updated_at 
  BEFORE UPDATE ON recording_editing_prompts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- Add prompt_id to recordings table to link recordings to prompts
ALTER TABLE recordings 
  ADD COLUMN IF NOT EXISTS editing_prompt_id UUID REFERENCES recording_editing_prompts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recordings_prompt ON recordings(editing_prompt_id);








