# 🎥 YouTube API Setup Instructions - URGENT MVP SETUP

## Step-by-Step Setup Guide

### 1. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account (the one connected to your YouTube channel)

### 2. Create or Select a Project
1. Click the project dropdown at the top
2. Either select an existing project OR click "New Project"
3. If creating new: Name it "Content Command Center" and click "Create"

### 3. Enable YouTube Data API v3
1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click on it and click **"Enable"**

### 4. Enable YouTube Analytics API v2
1. Still in "APIs & Services" → "Library"
2. Search for **"YouTube Analytics API v2"**
3. Click on it and click **"Enable"**

### 5. Create OAuth 2.0 Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen first:
   - User Type: **External** (unless you have Google Workspace)
   - App name: **Content Command Center**
   - User support email: **Your email**
   - Developer contact: **Your email**
   - Click "Save and Continue"
   - Scopes: Click "Add or Remove Scopes" → Add:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube`
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/yt-analytics.readonly`
   - Click "Save and Continue"
   - Test users: Add your email
   - Click "Save and Continue"
   - Click "Back to Dashboard"

4. Now create the OAuth client:
   - Application type: **"Web application"**
   - Name: **"Content Command Center Web Client"**
   - **Authorized redirect URIs** - ADD ONLY THESE TWO (NO WILDCARDS):
     ```
     https://contentmotor.co/api/youtube/callback
     http://localhost:3000/api/youtube/callback
     ```
   - **CRITICAL**: YouTube does NOT allow wildcards (*) in redirect URIs. 
   - ⚠️ **DO NOT** add: `https://content-command-center-*.vercel.app/api/youtube/callback` (the wildcard will cause an error)
   - Click **"Create"**

### 6. Copy Your Credentials
1. You'll see a popup with:
   - **Client ID**: Copy this (looks like: `xxxxx.apps.googleusercontent.com`)
   - **Client Secret**: Copy this (click "Show" if hidden)

### 7. Add to Vercel Environment Variables
1. Go to: https://vercel.com/dashboard
2. Select your **"Content Command Center"** project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:
   - **Name**: `YOUTUBE_CLIENT_ID`
     **Value**: `[Your Client ID from step 6]`
   - **Name**: `YOUTUBE_CLIENT_SECRET`
     **Value**: `[Your Client Secret from step 6]`
5. Make sure to select **Production**, **Preview**, and **Development**
6. Click **"Save"**

### 8. Redeploy Your App
1. Go to your Vercel project dashboard
2. Click **"Deployments"**
3. Click the **"..."** menu on the latest deployment
4. Click **"Redeploy"**

### 9. Connect YouTube in Your App
1. Visit: https://contentmotor.co/settings
2. Go to **"Integrations"** tab
3. Find **"YouTube"** section
4. Click **"Connect"** button
5. Authorize the app with your Google account
6. You should see "Connected ✓"

## ✅ Verification Checklist

- [ ] YouTube Data API v3 enabled
- [ ] YouTube Analytics API v2 enabled
- [ ] OAuth 2.0 Client ID created
- [ ] Client ID added to Vercel environment variables
- [ ] Client Secret added to Vercel environment variables
- [ ] Redirect URIs configured (production, Vercel, localhost)
- [ ] App redeployed on Vercel
- [ ] YouTube connected in Settings page

## 🔗 Important URLs

- **Your Production App**: https://contentmotor.co
- **YouTube Redirect URI**: `https://contentmotor.co/api/youtube/callback`
- **Google Cloud Console**: https://console.cloud.google.com/
- **Vercel Dashboard**: https://vercel.com/dashboard

## ⚠️ Common Issues

### "Error 401: invalid_client"
- **Fix**: Make sure redirect URI in Google Cloud Console matches EXACTLY
- Must include: `https://contentmotor.co/api/youtube/callback`

### "Redirect URI mismatch"
- **Fix**: Add specific redirect URIs to Google Cloud Console (no wildcards allowed):
  - Production: `https://contentmotor.co/api/youtube/callback`
  - Local development: `http://localhost:3000/api/youtube/callback`
  - **Note**: YouTube doesn't allow wildcards (*). For preview deployments, you'll need to add each specific Vercel URL individually, or just test with production/localhost.

### "API not enabled"
- **Fix**: Make sure both YouTube Data API v3 and YouTube Analytics API v2 are enabled

---

**Need Help?** Check the error message and verify all steps above. Most issues are from:
1. Missing redirect URI configuration
2. API not enabled
3. Environment variables not set in Vercel





