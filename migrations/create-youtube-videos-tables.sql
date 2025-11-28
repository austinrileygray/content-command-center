-- ============================================
-- YOUTUBE VIDEOS TABLE
-- Stores fetched YouTube video data and analytics
-- ============================================
CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL, -- YouTube video ID
  title TEXT NOT NULL,
  description TEXT,
  published_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  
  -- Performance Metrics (from YouTube Analytics API)
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  watch_time_seconds INTEGER DEFAULT 0,
  average_view_duration_seconds INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,2), -- CTR percentage
  engagement_rate DECIMAL(5,2), -- (likes + comments + shares) / views
  
  -- Calculated Performance Score
  performance_score DECIMAL(10,2), -- Weighted score based on multiple metrics
  
  -- Video Metadata
  category_id TEXT,
  tags TEXT[],
  language TEXT,
  
  -- Analysis Data
  topics TEXT[], -- Extracted topics/themes
  format_type TEXT, -- solo_youtube, guest_interview, etc.
  hook_pattern TEXT, -- Pattern identified in title/hook
  thumbnail_style TEXT, -- Style analysis
  
  -- Timestamps
  last_analytics_fetch TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one video per user
  UNIQUE(user_id, video_id)
);

-- ============================================
-- CONTENT PATTERNS TABLE
-- Stores AI-analyzed patterns from high-performing videos
-- ============================================
CREATE TABLE IF NOT EXISTS content_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'topic', 'format', 'hook', 'thumbnail', 'title_structure'
  pattern_name TEXT NOT NULL,
  pattern_data JSONB NOT NULL, -- Detailed pattern information
  performance_impact TEXT, -- How this pattern affects performance
  video_count INTEGER, -- Number of videos using this pattern
  average_performance_score DECIMAL(10,2),
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_youtube_videos_user ON youtube_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_performance ON youtube_videos(performance_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_published ON youtube_videos(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_video_id ON youtube_videos(video_id);

CREATE INDEX IF NOT EXISTS idx_content_patterns_user ON content_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_content_patterns_type ON content_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_content_patterns_user_type ON content_patterns(user_id, pattern_type);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER youtube_videos_updated_at 
  BEFORE UPDATE ON youtube_videos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER content_patterns_updated_at 
  BEFORE UPDATE ON content_patterns 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_patterns ENABLE ROW LEVEL SECURITY;

-- Policies for youtube_videos
CREATE POLICY "Users can view their own videos"
  ON youtube_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
  ON youtube_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON youtube_videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON youtube_videos FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for content_patterns
CREATE POLICY "Users can view their own patterns"
  ON content_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patterns"
  ON content_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns"
  ON content_patterns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patterns"
  ON content_patterns FOR DELETE
  USING (auth.uid() = user_id);
