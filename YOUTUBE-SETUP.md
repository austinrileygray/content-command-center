# YouTube API Integration Setup

## ✅ Current Status

**Client ID:** ✅ Configured  
**Client Secret:** ⏳ Still needed  
**OAuth Flow:** ✅ Implemented  
**Video Publishing:** ✅ Ready (needs Client Secret)

## 📋 What's Been Built

### 1. YouTube API Client (`src/lib/youtube.ts`)
- OAuth authorization URL generation
- Token exchange and refresh
- Video upload functionality
- Channel information retrieval

### 2. OAuth Flow
- **Auth Endpoint:** `/api/youtube/auth` - Initiates OAuth flow
- **Callback Endpoint:** `/api/youtube/callback` - Handles OAuth callback
- **Token Storage:** Stored in `profiles.metadata.youtube`

### 3. Publishing
- **Publish Endpoint:** `/api/youtube/publish` - Uploads videos to YouTube
- **Publish Queue:** "Publish Now" button for YouTube items
- **Auto Token Refresh:** Automatically refreshes expired tokens

### 4. UI Integration
- **Settings Page:** "Connect" button for YouTube
- **Publish Queue:** "Publish Now" button for pending YouTube items
- **Status Indicators:** Shows connection status

## 🔧 Setup Instructions

### Step 1: Get Client Secret

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID: `66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com`
5. Click on it to view details
6. Copy the **Client Secret**

### Step 2: Configure Redirect URI

1. In Google Cloud Console, edit your OAuth 2.0 Client
2. Under **Authorized redirect URIs**, add:
   - **Production:** `https://your-vercel-app.vercel.app/api/youtube/callback`
   - **Local:** `http://localhost:3000/api/youtube/callback`
3. Save changes

### Step 3: Add Environment Variables

**Local Development (.env.local):**
```bash
YOUTUBE_CLIENT_ID=66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your-client-secret-here
```

**Vercel Production:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `YOUTUBE_CLIENT_ID` (already added ✅)
3. Add `YOUTUBE_CLIENT_SECRET` with your secret value
4. Redeploy

### Step 4: Enable YouTube Data API v3

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click **Enable**

## 🚀 How to Use

### Connect YouTube Account

1. Go to **Settings** → **Integrations** tab
2. Find **YouTube** section
3. Click **Connect** button
4. Authorize the application in Google
5. You'll be redirected back with a success message

### Publish a Video

1. Go to **Assets** page
2. Find an approved clip/asset
3. Click the dropdown menu (⋮)
4. Select **Publish to YouTube**
5. Go to **Publish** page
6. Find the item in the queue
7. Click **Publish Now** button
8. Video will be uploaded to YouTube (unlisted by default)

## 📝 Notes

- **Privacy Status:** Videos are published as "unlisted" by default
- **Token Storage:** OAuth tokens are stored in `profiles.metadata.youtube`
- **Token Refresh:** Tokens are automatically refreshed when expired
- **Video Metadata:** Uses asset title, transcript, and suggested hashtags

## ⚠️ Important

- **Client Secret** is required for the OAuth flow to work
- Make sure **YouTube Data API v3** is enabled in Google Cloud Console
- **Redirect URI** must match exactly in Google Cloud Console
- Tokens are stored in the database - ensure proper security

## 🔒 Security

- Client Secret should NEVER be committed to git
- Store securely in Vercel environment variables
- Tokens are stored in database metadata (consider dedicated table for production)
