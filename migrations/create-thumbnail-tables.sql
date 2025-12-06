-- Create thumbnail_training and thumbnail_training_insights tables
-- This migration creates the tables needed for thumbnail training

-- ============================================
-- THUMBNAIL TRAINING DATA
-- ============================================
CREATE TABLE IF NOT EXISTS thumbnail_training (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('youtube', 'short_form')),
  image_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'youtube_auto', 'external')),
  source_video_id TEXT, -- YouTube video ID if auto-collected
  source_video_title TEXT,
  source_video_url TEXT,
  performance_metrics JSONB, -- views, engagement, etc. if from YouTube
  tags TEXT[],
  notes TEXT,
  approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- THUMBNAIL TRAINING INSIGHTS
-- ============================================
CREATE TABLE IF NOT EXISTS thumbnail_training_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('youtube', 'short_form')),
  learned_patterns JSONB NOT NULL, -- Extracted patterns from notes
  preferences JSONB, -- User preferences (likes, dislikes)
  requirements JSONB, -- Technical requirements (resolution, etc.)
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_thumbnail_training_category ON thumbnail_training(category);
CREATE INDEX IF NOT EXISTS idx_thumbnail_training_user ON thumbnail_training(user_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_training_approved ON thumbnail_training(approved);
CREATE INDEX IF NOT EXISTS idx_thumbnail_insights_user_category ON thumbnail_training_insights(user_id, category);

-- Create updated_at triggers
CREATE TRIGGER thumbnail_training_updated_at BEFORE UPDATE ON thumbnail_training FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER thumbnail_training_insights_updated_at BEFORE UPDATE ON thumbnail_training_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at();


