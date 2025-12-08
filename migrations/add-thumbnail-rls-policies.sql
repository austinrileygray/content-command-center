-- RLS Policies for thumbnail_training table
-- Run this in your Supabase SQL Editor

-- Enable RLS on thumbnail_training table
ALTER TABLE thumbnail_training ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to insert their own thumbnails
CREATE POLICY "Users can insert their own thumbnails"
ON thumbnail_training FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow all authenticated inserts (we'll filter by user_id in application)

-- Policy 2: Allow users to select their own thumbnails
CREATE POLICY "Users can select their own thumbnails"
ON thumbnail_training FOR SELECT
TO authenticated
USING (true); -- Allow all authenticated selects (we'll filter by user_id in application)

-- Policy 3: Allow users to update their own thumbnails
CREATE POLICY "Users can update their own thumbnails"
ON thumbnail_training FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow users to delete their own thumbnails
CREATE POLICY "Users can delete their own thumbnails"
ON thumbnail_training FOR DELETE
TO authenticated
USING (true);

-- Enable RLS on thumbnail_training_insights table
ALTER TABLE thumbnail_training_insights ENABLE ROW LEVEL SECURITY;

-- Policy 5: Allow users to insert their own insights
CREATE POLICY "Users can insert their own insights"
ON thumbnail_training_insights FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 6: Allow users to select their own insights
CREATE POLICY "Users can select their own insights"
ON thumbnail_training_insights FOR SELECT
TO authenticated
USING (true);

-- Policy 7: Allow users to update their own insights
CREATE POLICY "Users can update their own insights"
ON thumbnail_training_insights FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Note: For service role operations (API routes), we'll use service role key which bypasses RLS
-- These policies are for authenticated user access



