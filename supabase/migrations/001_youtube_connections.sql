-- YouTube OAuth Connections Table
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS youtube_connections (
  id TEXT PRIMARY KEY DEFAULT 'default',  -- Single-user mode: 'default' or user_id for multi-user
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  channel_thumbnail TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_youtube_connections_channel_id ON youtube_connections(channel_id);

-- Enable Row Level Security (RLS)
ALTER TABLE youtube_connections ENABLE ROW LEVEL SECURITY;

-- For single-user mode, allow all operations
-- TODO: Update this policy when multi-user auth is implemented
CREATE POLICY "Allow all operations for authenticated users" ON youtube_connections
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access to the service role
GRANT ALL ON youtube_connections TO service_role;
GRANT ALL ON youtube_connections TO anon;
GRANT ALL ON youtube_connections TO authenticated;

COMMENT ON TABLE youtube_connections IS 'Stores YouTube OAuth tokens for channel integration';
COMMENT ON COLUMN youtube_connections.id IS 'Primary key - use "default" for single-user mode or user_id for multi-user';
COMMENT ON COLUMN youtube_connections.channel_id IS 'YouTube channel ID (UC...)';
COMMENT ON COLUMN youtube_connections.channel_title IS 'Display name of the YouTube channel';
COMMENT ON COLUMN youtube_connections.access_token IS 'OAuth access token for API calls';
COMMENT ON COLUMN youtube_connections.refresh_token IS 'OAuth refresh token for getting new access tokens';
COMMENT ON COLUMN youtube_connections.token_expires_at IS 'When the access token expires';
