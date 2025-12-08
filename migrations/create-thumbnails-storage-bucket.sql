-- Migration: Create Supabase Storage Bucket for Thumbnails
-- Run this in your Supabase SQL Editor or use the Storage UI

-- Note: This SQL creates the bucket via the storage API
-- You can also create it manually in Supabase Dashboard:
-- 1. Go to Storage
-- 2. Click "New bucket"
-- 3. Name: "thumbnails"
-- 4. Public: Yes (to allow public access to images)
-- 5. File size limit: 10MB
-- 6. Allowed MIME types: image/*

-- If using SQL, you'll need to use the Supabase Storage API or create via Dashboard

-- Storage bucket configuration:
-- Name: thumbnails
-- Public: true
-- File size limit: 10485760 (10MB)
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Storage policies (run after creating bucket):
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- Allow public read access
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);



