-- Thumbnail Ingredients Library
-- Stores reusable assets like faces, logos, inspiration images
CREATE TABLE IF NOT EXISTS thumbnail_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('face', 'inspiration', 'logo', 'background', 'other')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_thumbnail_ingredients_user_type
ON thumbnail_ingredients(user_id, type);

-- Generated Thumbnails
CREATE TABLE IF NOT EXISTS generated_thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default',
  content_idea_id UUID REFERENCES content_ideas(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  style TEXT,
  aspect_ratio TEXT DEFAULT '16:9',
  ingredients_used UUID[] DEFAULT '{}',
  result_url TEXT,
  result_thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for content idea lookups
CREATE INDEX IF NOT EXISTS idx_generated_thumbnails_idea
ON generated_thumbnails(content_idea_id);

-- Enable RLS
ALTER TABLE thumbnail_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_thumbnails ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now, refine when auth is added)
CREATE POLICY "Allow all on thumbnail_ingredients" ON thumbnail_ingredients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on generated_thumbnails" ON generated_thumbnails
  FOR ALL USING (true) WITH CHECK (true);

-- Grant access
GRANT ALL ON thumbnail_ingredients TO service_role, anon, authenticated;
GRANT ALL ON generated_thumbnails TO service_role, anon, authenticated;

COMMENT ON TABLE thumbnail_ingredients IS 'Reusable assets for thumbnail generation (faces, logos, inspiration)';
COMMENT ON TABLE generated_thumbnails IS 'AI-generated thumbnails using Nano Banana Pro';
