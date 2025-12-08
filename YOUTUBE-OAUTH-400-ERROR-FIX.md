# 🔧 Fix: YouTube OAuth 400 Bad Request Error

## The Problem

You're getting a `400 Bad Request` error when trying to connect YouTube. This usually means:

1. **Redirect URI mismatch** - The redirect URI in the OAuth request doesn't match what's configured in Google Cloud Console
2. **Client ID mismatch** - The Client ID doesn't match the OAuth client in Google Cloud

## Quick Checks

### 1. Verify Redirect URI in Google Cloud Console

Go to: https://console.cloud.google.com/ → APIs & Services → Credentials

Click on your OAuth 2.0 Client ID (`YOUR_YOUTUBE_CLIENT_ID_HERE`)

**Make sure you have EXACTLY these redirect URIs:**

```
https://contentmotor.co/api/youtube/callback
http://localhost:3000/api/youtube/callback
```

**The URLs must match EXACTLY** - including:
- ✅ Protocol (`https://` vs `http://`)
- ✅ Domain name (exactly `contentmotor.co`)
- ✅ Path (exactly `/api/youtube/callback`)
- ✅ No trailing slashes
- ✅ No wildcards

### 2. Verify Client ID

Make sure the Client ID in Vercel environment variables matches Google Cloud:

**Should be:**
```
YOUR_YOUTUBE_CLIENT_ID_HERE
```

### 3. Common Issues

#### Issue: Redirect URI doesn't match
**Fix**: 
- In Google Cloud Console, check the "Authorized redirect URIs" section
- Make sure `https://contentmotor.co/api/youtube/callback` is there EXACTLY
- No extra characters, no trailing slash

#### Issue: Using wrong Client ID
**Fix**:
- Verify Client ID in Vercel matches Google Cloud Console
- Make sure you're using the Client ID for a "Web application" (not iOS/Android)

#### Issue: OAuth consent screen not configured
**Fix**:
- Go to OAuth consent screen in Google Cloud Console
- Make sure it's configured (can be "Testing" mode)
- Add your email as a test user

## Debug Steps

1. **Check what redirect URI is being used:**
   - Open browser console (F12)
   - Try connecting YouTube
   - Look for console.log output showing the redirect URI
   - Compare it to what's in Google Cloud Console

2. **Check environment variables:**
   - Verify `NEXT_PUBLIC_APP_URL=https://contentmotor.co` in Vercel
   - Verify `YOUTUBE_CLIENT_ID` matches Google Cloud

3. **Test with exact URL:**
   - The redirect URI should be EXACTLY: `https://contentmotor.co/api/youtube/callback`
   - Not: `https://contentmotor.co/api/youtube/callback/`
   - Not: `https://www.contentmotor.co/api/youtube/callback`

## Most Likely Fix

**The redirect URI in Google Cloud Console doesn't match what the app is sending.**

1. Open Google Cloud Console
2. Go to your OAuth 2.0 Client ID
3. Delete ALL redirect URIs
4. Add ONLY these two:
   - `https://contentmotor.co/api/youtube/callback`
   - `http://localhost:3000/api/youtube/callback`
5. Save
6. Try connecting again

---

**After fixing, try connecting YouTube again in your app!**









