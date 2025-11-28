# Supabase Storage Setup - Step by Step

## What You Need to Do

I need you to create a storage bucket in your Supabase project. Here's exactly what to do:

## Option 1: Using Supabase Dashboard (Easiest - 2 minutes)

### Step 1: Access Your Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project (the one for Content Command Center)

### Step 2: Create the Storage Bucket
1. In the left sidebar, click **"Storage"**
2. Click the **"New bucket"** button (top right)
3. Fill in the form:
   - **Name:** `thumbnails` (must be exactly this, lowercase)
   - **Public bucket:** ✅ **Check this box** (very important!)
   - **File size limit:** `10485760` (this is 10MB in bytes)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
4. Click **"Create bucket"**

### Step 3: Set Up Storage Policies
After creating the bucket, you need to add policies so users can upload files:

1. Still in Storage, click on the **"thumbnails"** bucket you just created
2. Click the **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow Authenticated Uploads
- **Policy name:** `Allow authenticated uploads`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **Policy definition:**
```sql
(bucket_id = 'thumbnails')
```

#### Policy 2: Allow Public Read Access
- **Policy name:** `Allow public read`
- **Allowed operation:** `SELECT`
- **Target roles:** `public`
- **Policy definition:**
```sql
(bucket_id = 'thumbnails')
```

#### Policy 3: Allow Users to Delete Own Files (Optional but recommended)
- **Policy name:** `Allow users to delete own files`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`
- **Policy definition:**
```sql
(bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text)
```

## Option 2: Using SQL Editor (Alternative)

If you prefer SQL, you can run this in the Supabase SQL Editor:

### Step 1: Create the Bucket
```sql
-- Note: Bucket creation via SQL requires using the Storage API
-- It's easier to use the Dashboard, but if you have Supabase CLI:
-- supabase storage create thumbnails --public
```

Actually, bucket creation via SQL is complex. **Use Option 1 (Dashboard) instead.**

### Step 2: Add Policies via SQL
After creating the bucket via Dashboard, you can add policies via SQL:

```sql
-- Policy 1: Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- Policy 2: Allow public read access
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Policy 3: Allow users to delete own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Option 3: Using Supabase CLI (If you have it installed)

If you have Supabase CLI installed and authenticated:

```bash
# Create the bucket
supabase storage create thumbnails --public

# The policies will need to be added via Dashboard or SQL Editor
```

## Verification

After setup, verify it works:

1. Go to Storage > thumbnails bucket
2. You should see it's marked as "Public"
3. Try uploading a thumbnail in the app
4. Check that the file appears in the bucket

## What I Need From You

After you complete the setup, just let me know:
- ✅ "Done" or "Bucket created"
- Or if you encounter any errors, share the error message

That's it! The app will automatically use the bucket once it exists.

## Troubleshooting

### Error: "Bucket not found"
- Make sure the bucket is named exactly `thumbnails` (lowercase, no spaces)
- Verify you're in the correct Supabase project

### Error: "Permission denied"
- Make sure the bucket is marked as "Public"
- Verify the storage policies are set up correctly
- Check that you're using the correct Supabase project

### Files not displaying
- Ensure the bucket is public
- Check that the public URL is accessible
- Verify CORS settings (should be automatic for public buckets)

## Quick Checklist

- [ ] Created bucket named `thumbnails`
- [ ] Marked bucket as **Public**
- [ ] Set file size limit to 10MB
- [ ] Added INSERT policy for authenticated users
- [ ] Added SELECT policy for public access
- [ ] (Optional) Added DELETE policy for users

Once you've checked all these, you're done! 🎉
