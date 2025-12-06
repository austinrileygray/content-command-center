# 🔍 Debug: YouTube OAuth 400 Bad Request

## What the Error Means

The `400 Bad Request` error from Google OAuth means the request is malformed. Most common causes:

1. **Redirect URI mismatch** (most common - 90% of cases)
2. Client ID doesn't match
3. Missing or invalid scopes
4. OAuth consent screen not configured

## Critical: Redirect URI Must Match EXACTLY

The redirect URI in your OAuth request **MUST match EXACTLY** what's configured in Google Cloud Console.

### What Should Be Configured in Google Cloud Console:

1. Go to: https://console.cloud.google.com/
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID: `YOUR_YOUTUBE_CLIENT_ID_HERE`
4. Check "Authorized redirect URIs" section

**You MUST have EXACTLY this URI:**
```
https://contentmotor.co/api/youtube/callback
```

**Check for these common mistakes:**
- ❌ `https://contentmotor.co/api/youtube/callback/` (trailing slash)
- ❌ `https://www.contentmotor.co/api/youtube/callback` (www prefix)
- ❌ `http://contentmotor.co/api/youtube/callback` (http instead of https)
- ❌ `https://contentmotor.co/api/youtube/callback ` (extra space)
- ✅ `https://contentmotor.co/api/youtube/callback` (CORRECT - no trailing slash)

## What the App Is Sending

The app is now configured to send:
```
https://contentmotor.co/api/youtube/callback
```

## Steps to Fix

### 1. Verify Google Cloud Console Configuration

1. Open: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Click to edit it
4. Under "Authorized redirect URIs", you should see:
   - `https://contentmotor.co/api/youtube/callback`
   - `http://localhost:3000/api/youtube/callback`
5. **If either is missing or different**, update it
6. Click "Save"

### 2. Verify Environment Variables

Check in Vercel:
- `NEXT_PUBLIC_APP_URL` = `https://contentmotor.co` ✅ (just updated)
- `YOUTUBE_CLIENT_ID` = `YOUR_YOUTUBE_CLIENT_ID_HERE` ✅
- `YOUTUBE_CLIENT_SECRET` = `YOUR_YOUTUBE_CLIENT_SECRET_HERE` ✅

### 3. Check Browser Console

When you click "Connect" on YouTube:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for log messages like:
   - `[YouTube OAuth] Using production redirect URI: https://contentmotor.co/api/youtube/callback`
   - `[YouTube OAuth] Redirect URI (must match Google Cloud): ...`

### 4. Verify Client ID

The Client ID must be EXACTLY:
```
YOUR_YOUTUBE_CLIENT_ID_HERE
```

## Most Likely Fix

**The redirect URI in Google Cloud Console doesn't match what the app is sending.**

### Action:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs":
   - Delete ALL existing URIs
   - Add ONLY these two:
     - `https://contentmotor.co/api/youtube/callback`
     - `http://localhost:3000/api/youtube/callback`
4. Save
5. Wait 1-2 minutes (propagation delay)
6. Try connecting again

## After Fixing

The app has been updated to:
- ✅ Always use `https://contentmotor.co/api/youtube/callback` for production
- ✅ Log the redirect URI for debugging
- ✅ Ensure proper URL encoding

**After updating Google Cloud Console, try connecting YouTube again!**








