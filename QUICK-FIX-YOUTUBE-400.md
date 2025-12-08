# ⚡ QUICK FIX: YouTube 400 Bad Request Error

## The Problem

Google OAuth is rejecting the request with `400 Bad Request`. This means the redirect URI doesn't match.

## ✅ IMMEDIATE FIX (2 minutes)

### Step 1: Check Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find OAuth 2.0 Client ID: `YOUR_YOUTUBE_CLIENT_ID_HERE`
3. Click to edit it
4. Look at "Authorized redirect URIs"

### Step 2: Ensure Exact Match

**You MUST have EXACTLY this URI (copy-paste this):**
```
https://contentmotor.co/api/youtube/callback
```

**Common mistakes to avoid:**
- ❌ NO trailing slash: `https://contentmotor.co/api/youtube/callback/`
- ❌ NO www: `https://www.contentmotor.co/api/youtube/callback`
- ❌ NO http: `http://contentmotor.co/api/youtube/callback`
- ❌ NO spaces before/after

### Step 3: Update if Needed

If the URI is wrong:
1. Click the X to delete the wrong URI
2. Click "+ Add URI"
3. Type EXACTLY: `https://contentmotor.co/api/youtube/callback`
4. Click "Save"

### Step 4: Wait & Retry

1. Wait 1-2 minutes for Google to propagate changes
2. Go to: https://contentmotor.co/settings
3. Click "Integrations" tab
4. Click "Connect" on YouTube
5. Should work now!

## What We Fixed in Code

✅ Hardcoded redirect URI to: `https://contentmotor.co/api/youtube/callback`
✅ Added better logging
✅ Updated environment variables
✅ Deployed to production

## Still Not Working?

Check browser console (F12 → Console) for log messages:
- `[YouTube OAuth] Using production redirect URI: ...`
- Compare it to what's in Google Cloud Console
- They must match EXACTLY

---

**The redirect URI in Google Cloud Console MUST match exactly what the app sends. Check both and ensure they're identical!**









