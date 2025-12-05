-- Viral Clip Analyses table
-- Stores AI-generated analysis of YouTube videos to identify viral clip segments

CREATE TABLE IF NOT EXISTS viral_clip_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default',
  video_id TEXT NOT NULL,
  video_url TEXT,
  video_title TEXT,
  clips JSONB DEFAULT '[]'::jsonb,
  video_summary TEXT,
  overall_viral_potential INTEGER CHECK (overall_viral_potential >= 1 AND overall_viral_potential <= 10),
  target_audience TEXT,
  content_category TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by video_id
CREATE INDEX IF NOT EXISTS idx_viral_clip_analyses_video_id ON viral_clip_analyses(video_id);
CREATE INDEX IF NOT EXISTS idx_viral_clip_analyses_user_id ON viral_clip_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_viral_clip_analyses_created_at ON viral_clip_analyses(created_at DESC);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_viral_clip_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_viral_clip_analyses_updated_at ON viral_clip_analyses;
CREATE TRIGGER trigger_viral_clip_analyses_updated_at
  BEFORE UPDATE ON viral_clip_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_viral_clip_analyses_updated_at();

-- Comment on table
COMMENT ON TABLE viral_clip_analyses IS 'Stores AI-generated viral clip analysis for YouTube videos';
COMMENT ON COLUMN viral_clip_analyses.clips IS 'JSON array of identified viral clips with timestamps, scores, and metadata';
