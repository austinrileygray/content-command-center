# Thumbnail Storage Setup Guide

## Overview
The thumbnail training system uses Supabase Storage to store uploaded thumbnail images. This guide will help you set up the storage bucket.

## Step 1: Create Storage Bucket

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name:** `thumbnails`
   - **Public bucket:** ✅ **Yes** (check this box)
   - **File size limit:** `10485760` (10MB)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
5. Click **"Create bucket"**

### Option B: Using SQL (Advanced)

Run the SQL migration file:
```sql
-- See: migrations/create-thumbnails-storage-bucket.sql
```

## Step 2: Set Up Storage Policies

After creating the bucket, set up these policies in the **Storage > Policies** section:

### Policy 1: Allow Authenticated Uploads
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');
```

### Policy 2: Allow Public Read Access
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');
```

### Policy 3: Allow Users to Delete Own Files
```sql
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Step 3: Verify Setup

1. Try uploading a thumbnail in the app
2. Check that the file appears in Storage > thumbnails bucket
3. Verify the image URL is accessible

## Troubleshooting

### Error: "Bucket not found"
- Make sure the bucket is named exactly `thumbnails` (lowercase)
- Verify the bucket exists in your Supabase project

### Error: "Permission denied"
- Check that the storage policies are set up correctly
- Ensure the bucket is marked as public if you want public access

### Error: "File too large"
- Default limit is 10MB
- Increase the file size limit in bucket settings if needed

### Files not displaying
- Check that the bucket is public
- Verify the public URL is accessible
- Check browser console for CORS errors

## File Structure

Uploaded files are stored with this structure:
```
thumbnails/
  └── {user_id}/
      └── {category}/
          └── {timestamp}-{random}.{ext}
```

Example:
```
thumbnails/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── youtube/
          └── 1701234567890-abc123.jpg
```

## Notes Storage

Notes are stored directly in the `thumbnail_training` table in the `notes` column. They are saved as plain text and used for AI training analysis.
