# Testing YouTube Integration

## ✅ Setup Complete

All configuration is done:
- ✅ Client ID configured
- ✅ Client Secret configured  
- ✅ Redirect URI configured
- ✅ Environment variables set in Vercel

## 🧪 How to Test

### Step 1: Connect YouTube Account

1. Go to your app: **Settings** → **Integrations** tab
2. Find the **YouTube** section
3. Click the **"Connect"** button
4. You'll be redirected to Google's authorization page
5. Sign in with your Google account (the one with the YouTube channel)
6. Review the permissions requested:
   - Upload videos to YouTube
   - Manage your YouTube account
7. Click **"Allow"** or **"Continue"**
8. You'll be redirected back to your app
9. You should see a success message: "YouTube connected successfully!"
10. The button should now show "Connected" with a checkmark

### Step 2: Test Video Publishing

1. Go to **Assets** page
2. Find an approved clip/asset (or approve one if needed)
3. Click the dropdown menu (⋮) on the asset
4. Select **"Publish to YouTube"**
5. Go to **Publish** page
6. Find the item in the queue (status: "pending")
7. Click **"Publish Now"** button
8. The status will change to "processing"
9. Wait for upload to complete (may take a few minutes depending on video size)
10. Status should change to "published"
11. You'll see a link icon to view the published video

## 🔍 What to Check

### Connection Status
- ✅ Button shows "Connected" with checkmark
- ✅ No error messages in Settings page
- ✅ Success toast notification appears

### Publishing
- ✅ Queue item status updates correctly
- ✅ Video appears on your YouTube channel (unlisted)
- ✅ Published URL is saved and clickable
- ✅ Asset status updates to "published"

## ⚠️ Troubleshooting

### If "Connect" button doesn't work:
- Check browser console for errors
- Verify redirect URI matches exactly in Google Cloud Console
- Make sure YouTube Data API v3 is enabled
- Try clearing browser cache

### If connection fails:
- Check that you're using the correct Google account
- Verify the OAuth client is in the correct Google Cloud project
- Check that redirect URI is saved in Google Cloud Console
- Wait a few minutes after adding redirect URI (propagation delay)

### If publishing fails:
- Check that the asset has a valid `file_url`
- Verify the video file is accessible
- Check Vercel function logs for errors
- Make sure tokens are stored correctly (check database)

### Common Errors:

**"redirect_uri_mismatch"**
- Redirect URI doesn't match exactly
- Check Google Cloud Console → Credentials → OAuth Client
- Make sure production URL matches your Vercel deployment

**"invalid_client"**
- Client ID or Secret is incorrect
- Verify environment variables in Vercel
- Check `.env.local` for local development

**"access_denied"**
- User cancelled authorization
- Try connecting again

## 📝 Expected Behavior

### Successful Connection:
1. Click "Connect" → Redirects to Google
2. Authorize → Redirects back to app
3. Success message appears
4. Button shows "Connected"

### Successful Publishing:
1. Add to queue → Item appears in Publish page
2. Click "Publish Now" → Status: "processing"
3. Upload completes → Status: "published"
4. Video URL saved → Clickable link appears
5. Video on YouTube → Check your channel (unlisted videos)

## 🎯 Next Steps After Testing

Once everything works:
- ✅ You can publish clips directly from the app
- ✅ Videos will be uploaded as "unlisted" by default
- ✅ You can change privacy settings in the code if needed
- ✅ All published videos are tracked in the database

## 📊 Monitoring

Check these places for issues:
- **Vercel Logs:** Function execution logs
- **Browser Console:** Client-side errors
- **Database:** Check `profiles.metadata.youtube` for tokens
- **YouTube Studio:** Verify videos are uploaded

## 🚀 Production URL

Your app: https://content-command-center-ew6bkbv58-austins-projects-c461c44a.vercel.app

Go to: Settings → Integrations → YouTube → Connect



