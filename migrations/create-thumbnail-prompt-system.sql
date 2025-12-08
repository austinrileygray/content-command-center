-- ============================================
-- THUMBNAIL PROMPT SYSTEM
-- ============================================

-- Table to store the current active prompt template (modular sections)
CREATE TABLE IF NOT EXISTS thumbnail_prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('youtube', 'short_form')),
  
  -- Modular sections stored as JSONB
  -- Structure: { "section_name": { "content": "...", "last_updated": "...", "updated_by": "analytics|notes|manual" } }
  sections JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  version_number INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, category, version_number)
);

-- Table to store prompt version history (for reverting)
CREATE TABLE IF NOT EXISTS thumbnail_prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('youtube', 'short_form')),
  
  -- Full prompt template at this version
  sections JSONB NOT NULL,
  version_number INTEGER NOT NULL,
  
  -- Change metadata
  change_summary TEXT, -- What changed in this version
  change_type TEXT CHECK (change_type IN ('initial', 'analytics', 'notes', 'manual', 'revert')),
  changed_sections TEXT[], -- Which sections were modified
  
  -- Performance metrics at time of change (for tracking if changes helped)
  baseline_metrics JSONB, -- { ctr, views, engagement_rate, watch_time } at time of change
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system' -- 'system', 'user', 'analytics', 'notes'
);

-- Table to store pending prompt recommendations (awaiting approval)
CREATE TABLE IF NOT EXISTS thumbnail_prompt_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('youtube', 'short_form')),
  
  -- Recommended changes
  recommended_sections JSONB NOT NULL, -- { "section_name": { "current": "...", "proposed": "...", "reason": "..." } }
  
  -- Analysis data that generated the recommendation
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('analytics', 'notes', 'combined')),
  analysis_period_start TIMESTAMPTZ NOT NULL,
  analysis_period_end TIMESTAMPTZ NOT NULL,
  
  -- Supporting data
  analytics_summary JSONB, -- Key metrics and insights
  notes_summary JSONB, -- Summary of notes analyzed
  reasoning TEXT, -- Why these changes are recommended
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'modified')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track weekly notes analysis (before monthly combination)
CREATE TABLE IF NOT EXISTS thumbnail_notes_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('youtube', 'short_form')),
  
  -- Analysis period
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL,
  
  -- Analysis results
  extracted_patterns JSONB NOT NULL, -- Patterns extracted from notes
  suggested_updates JSONB, -- Suggested prompt updates based on notes
  notes_count INTEGER DEFAULT 0, -- How many notes were analyzed
  
  -- Status
  processed BOOLEAN DEFAULT false,
  included_in_monthly BOOLEAN DEFAULT false, -- Whether this was included in monthly analysis
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_category ON thumbnail_prompt_templates(user_id, category, is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_user_category ON thumbnail_prompt_versions(user_id, category, version_number);
CREATE INDEX IF NOT EXISTS idx_prompt_recommendations_user_category ON thumbnail_prompt_recommendations(user_id, category, status);
CREATE INDEX IF NOT EXISTS idx_notes_analysis_user_category ON thumbnail_notes_analysis(user_id, category, week_start);

-- Updated_at triggers
CREATE TRIGGER thumbnail_prompt_templates_updated_at BEFORE UPDATE ON thumbnail_prompt_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();



