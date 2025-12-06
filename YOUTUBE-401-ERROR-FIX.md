# Fixing YouTube OAuth 401: invalid_client Error

## The Problem

**Error 401: invalid_client** means Google cannot find the OAuth client ID you're using. This usually means:

1. The Client ID is incorrect or has a typo
2. The Client ID doesn't exist in Google Cloud Console
3. The Client ID is from a different Google Cloud project
4. The Client ID is not being sent correctly

## Important: Check Your Redirect URI

I notice your redirect URI in the screenshot appears to be truncated. Make sure it's the **complete URL**:

**Should be:**
```
https://content-command-center-lvoldojv2-austins-projects-c461c44a.vercel.app/api/youtube/callback
```

**Not:**
```
https://content-command-center-lvoldojv2-austins-projects-c461c44a.
```

Make sure the redirect URI ends with `/api/youtube/callback` and includes the full domain.

## Quick Fix Steps

### Step 1: Verify Your Client ID

**Your Client ID should be:**
```
66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com
```

### Step 2: Check Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Make sure you're in the **correct project**
3. Go to **APIs & Services** → **Credentials**
4. Look for your OAuth 2.0 Client ID
5. **Verify the Client ID matches exactly:**
   - `66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com`

### Step 3: Check Environment Variables

**In Vercel:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **content-command-center**
3. Go to **Settings** → **Environment Variables**
4. Find `YOUTUBE_CLIENT_ID`
5. **Verify it matches exactly** (no extra spaces, correct format)

**In Local (.env.local):**
```bash
YOUTUBE_CLIENT_ID=66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com
```

### Step 4: Verify Client ID is Being Sent

1. Open browser Developer Console (F12)
2. Go to **Network** tab
3. Click "Connect" for YouTube
4. Look for the request to `/api/youtube/auth`
5. Check the response - it should include the Client ID in the auth URL
6. Or check the **Console** tab for: `YouTube OAuth - Client ID: ...`

## Common Issues

### Issue 1: Client ID Typo
- **Problem:** Extra space, missing character, or typo
- **Solution:** Copy-paste the exact Client ID from Google Cloud Console

### Issue 2: Wrong Google Cloud Project
- **Problem:** Client ID is from a different project
- **Solution:** Make sure you're using the Client ID from the correct project

### Issue 3: Client ID Not Created
- **Problem:** OAuth client doesn't exist
- **Solution:** Create a new OAuth 2.0 Client ID in Google Cloud Console

### Issue 4: Environment Variable Not Set
- **Problem:** `YOUTUBE_CLIENT_ID` not in Vercel
- **Solution:** Add it to Vercel environment variables

## How to Recreate OAuth Client (If Needed)

If the Client ID doesn't exist or is wrong:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Application type: **Web application**
6. Name: **Content Command Center**
7. **Authorized redirect URIs:**
   - `https://content-command-center-cgzljcbxn-austins-projects-c461c44a.vercel.app/api/youtube/callback`
   - `http://localhost:3000/api/youtube/callback`
8. Click **CREATE**
9. **Copy the Client ID** (not the Client Secret yet)
10. Update your `.env.local` and Vercel with the new Client ID

## Verification Checklist

- [ ] Client ID exists in Google Cloud Console
- [ ] Client ID matches exactly (no typos)
- [ ] `YOUTUBE_CLIENT_ID` is set in Vercel
- [ ] `YOUTUBE_CLIENT_ID` is set in `.env.local`
- [ ] Using the correct Google Cloud project
- [ ] YouTube Data API v3 is enabled
- [ ] Redirect URI is configured in Google Cloud Console

## Still Not Working?

If you've verified everything:

1. **Double-check the Client ID** - Copy it directly from Google Cloud Console
2. **Check Vercel logs** - See if the Client ID is being read correctly
3. **Try creating a new OAuth client** - Sometimes recreating fixes issues
4. **Make sure YouTube Data API v3 is enabled** in the same project

## Debugging

To see what Client ID is being used:

1. Open browser console (F12)
2. Go to Settings → Integrations → Click "Connect"
3. Check Console tab for: `YouTube OAuth - Client ID: ...`
4. Compare with what's in Google Cloud Console

The Client ID in the console log should match exactly what's in Google Cloud Console.


