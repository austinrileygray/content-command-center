-- Add source_video_id column to content_ideas table
-- Run this migration in Supabase SQL Editor

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS source_video_id TEXT;

-- Index for looking up ideas by source video
CREATE INDEX IF NOT EXISTS idx_content_ideas_source_video_id
ON content_ideas(source_video_id)
WHERE source_video_id IS NOT NULL;

COMMENT ON COLUMN content_ideas.source_video_id IS 'YouTube video ID that inspired this idea (from analytics-based generation)';
