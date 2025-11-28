# Fixing YouTube OAuth 400 Error

## The Problem

A **400 Bad Request** error from Google OAuth means the redirect URI in your request doesn't match what's configured in Google Cloud Console.

## Quick Fix Steps

### Step 1: Check What Redirect URI is Being Sent

1. Open your browser's Developer Console (F12)
2. Go to Settings → Integrations → Click "Connect" for YouTube
3. Before it redirects, check the Console tab
4. You should see: `Redirect URI being used: https://...`
5. **Copy that exact URL**

### Step 2: Verify in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Click Edit
4. Check the **Authorized redirect URIs** list
5. **The URL from Step 1 must match EXACTLY** (including `https://`, no trailing slash)

### Step 3: Add the Correct Redirect URI

If the URL doesn't match:

1. In Google Cloud Console, under **Authorized redirect URIs**
2. Click **+ ADD URI**
3. Paste the **exact URL** from the console log
4. Click **SAVE**

## Common Issues

### Issue 1: URL Mismatch
- **Problem:** The redirect URI being sent doesn't match Google Cloud Console
- **Solution:** Add the exact URL that appears in the browser console

### Issue 2: HTTP vs HTTPS
- **Problem:** Using `http://` in production or `https://` in local
- **Solution:** 
  - Production must use `https://`
  - Local development can use `http://localhost:3000`

### Issue 3: Trailing Slash
- **Problem:** URL has or doesn't have a trailing slash
- **Solution:** The redirect URI should be: `https://your-domain.com/api/youtube/callback` (no trailing slash)

### Issue 4: Wrong Domain
- **Problem:** Using a different Vercel deployment URL
- **Solution:** Use your current production URL (check Vercel dashboard)

## Current Production URL

Your current deployment: `https://content-command-center-cm7icysrt-austins-projects-c461c44a.vercel.app`

So the redirect URI should be:
```
https://content-command-center-cm7icysrt-austins-projects-c461c44a.vercel.app/api/youtube/callback
```

## Verification

After adding the redirect URI:

1. Wait 1-2 minutes for Google to update
2. Try connecting again
3. Check browser console for the redirect URI being used
4. If it still fails, verify the URL matches character-for-character

## Debugging

To see what's being sent:

1. Open browser console (F12)
2. Go to Network tab
3. Click "Connect" for YouTube
4. Look for the request to `/api/youtube/auth`
5. Check the response - it should include `redirectUri` in the JSON
6. Compare that with what's in Google Cloud Console

## Still Not Working?

If you've verified the redirect URI matches exactly:

1. Check that **YouTube Data API v3** is enabled in Google Cloud Console
2. Verify the **Client ID** matches: `66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com`
3. Make sure you're using the correct Google account in Google Cloud Console
4. Try clearing browser cache and cookies
5. Wait a few minutes after adding the redirect URI (Google needs time to propagate)
