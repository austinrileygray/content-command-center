-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  youtube_channel_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTENT IDEAS (the heart of the system)
-- ============================================
CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hook TEXT,
  description TEXT,
  format TEXT NOT NULL DEFAULT 'solo_youtube',
  status TEXT DEFAULT 'idea',
  confidence_score INTEGER,
  estimated_length INTEGER,
  script JSONB,
  thumbnail_concept JSONB,
  seo_keywords TEXT[],
  why_this_will_work TEXT,
  source_inspiration TEXT,
  guest_id UUID,
  scheduled_date DATE,
  scheduled_time TIME,
  recording_url TEXT,
  recording_platform TEXT,
  opus_project_id TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  selected_at TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  week_generated DATE
);

-- ============================================
-- GUESTS
-- ============================================
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,
  title TEXT,
  company TEXT,
  expertise TEXT[],
  status TEXT DEFAULT 'prospect',
  relevance_score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ
);

-- Add foreign key for guest
ALTER TABLE content_ideas ADD CONSTRAINT fk_guest FOREIGN KEY (guest_id) REFERENCES guests(id);

-- ============================================
-- RECORDINGS
-- ============================================
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_idea_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_id TEXT,
  external_url TEXT,
  status TEXT DEFAULT 'scheduled',
  scheduled_start TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration INTEGER,
  recording_urls JSONB,
  transcript_url TEXT,
  webhook_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GENERATED ASSETS (clips, thumbnails, etc.)
-- ============================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_idea_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'generating',
  title TEXT,
  file_url TEXT,
  metadata JSONB,
  platform TEXT,
  published_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- ============================================
-- PUBLISHING QUEUE
-- ============================================
CREATE TABLE publishing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_idea_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_url TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS SNAPSHOTS
-- ============================================
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  platform TEXT NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_content_ideas_status ON content_ideas(status);
CREATE INDEX idx_content_ideas_user ON content_ideas(user_id);
CREATE INDEX idx_content_ideas_week ON content_ideas(week_generated);
CREATE INDEX idx_guests_status ON guests(status);
CREATE INDEX idx_recordings_content ON recordings(content_idea_id);
CREATE INDEX idx_assets_content ON assets(content_idea_id);
CREATE INDEX idx_publishing_status ON publishing_queue(status);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER content_ideas_updated_at BEFORE UPDATE ON content_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER guests_updated_at BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER recordings_updated_at BEFORE UPDATE ON recordings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INSERT DEFAULT USER (for testing)
-- ============================================
INSERT INTO profiles (email, name) VALUES ('owner@theownerop.com', 'The Owner Operator');

-- ============================================
-- INSERT SAMPLE IDEAS (for UI testing)
-- ============================================
INSERT INTO content_ideas (user_id, title, hook, description, format, status, confidence_score, estimated_length, why_this_will_work)
SELECT 
  id,
  'How I Built a $100k/yr Business with AI Automation',
  'What if I told you I spend less than 2 hours a week on this business?',
  'Deep dive into the exact AI tools and workflows I use to automate content creation and business operations.',
  'solo_youtube',
  'idea',
  92,
  18,
  'Automation content performs 3x better than average. AI + passive income is trending.'
FROM profiles LIMIT 1;

INSERT INTO content_ideas (user_id, title, hook, description, format, status, confidence_score, estimated_length, why_this_will_work)
SELECT 
  id,
  'I Analyzed 50 Successful YouTube Channels - Here''s What They Do Differently',
  'I spent 100 hours studying the fastest-growing channels. The patterns are obvious once you see them.',
  'Data-driven breakdown of what separates channels that blow up from those that don''t.',
  'solo_youtube',
  'selected',
  88,
  22,
  'Research-backed content gets shared more. "I analyzed" format proven to work.'
FROM profiles LIMIT 1;

INSERT INTO content_ideas (user_id, title, hook, description, format, status, confidence_score, estimated_length, why_this_will_work)
SELECT 
  id,
  'The Boring Business That Makes $50k/Month (Interview)',
  'He bought a laundromat for $80k. Now it prints $50k/month. Here''s how.',
  'Interview with a boring business owner who built serious cash flow.',
  'guest_interview',
  'scheduled',
  85,
  45,
  'Boring business content is hot. Interview format builds credibility.'
FROM profiles LIMIT 1;

SELECT 'Database setup complete!' as status;
