# ✅ YouTube Redirect URI Fix

## ⚠️ IMPORTANT: YouTube Does NOT Allow Wildcards

The error you're seeing is because **YouTube API does not allow wildcards (*) in redirect URIs**.

## ✅ Correct Redirect URIs to Add

In Google Cloud Console → APIs & Services → Credentials → Your OAuth 2.0 Client ID:

**Add ONLY these two URLs (no wildcards):**

```
https://contentmotor.co/api/youtube/callback
http://localhost:3000/api/youtube/callback
```

## ❌ DO NOT Add This (It Has Wildcards):

```
❌ https://content-command-center-*.vercel.app/api/youtube/callback
```

## Steps to Fix:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Navigate to: **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID (the one with Client ID: `YOUR_YOUTUBE_CLIENT_ID_HERE`)

2. **Remove Any Wildcard URLs**
   - Delete any redirect URI that contains `*`

3. **Add Only These Two URLs:**
   - Click **"+ Add URI"**
   - Add: `https://contentmotor.co/api/youtube/callback`
   - Click **"+ Add URI"** again
   - Add: `http://localhost:3000/api/youtube/callback`

4. **Click "Save"**

5. **Test the Connection**
   - Go to: https://contentmotor.co/settings
   - Click "Integrations" tab
   - Find "YouTube" section
   - Click "Connect"

## For Preview Deployments:

If you need to test with Vercel preview URLs, you'll need to:
- Add each specific preview URL individually (e.g., `https://content-command-center-abc123.vercel.app/api/youtube/callback`)
- OR just use production and localhost for testing

---

**Status**: Once you update the redirect URIs (removing wildcards), the YouTube connection should work!









