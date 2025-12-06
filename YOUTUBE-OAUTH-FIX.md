# 🔧 Fix YouTube OAuth "Error 401: invalid_client"

## Problem
You're seeing "Error 401: invalid_client" when trying to connect YouTube. This means the redirect URI in Google Cloud Console doesn't match what the app is using.

## Solution

### Step 1: Get Your Current Deployment URL
Your latest production URL is: **https://content-command-center-e0ynu10og-austins-projects-c461c44a.vercel.app**

However, Vercel uses dynamic URLs. You need to configure the redirect URI for your **main domain** (if you have one) or use a wildcard pattern.

### Step 2: Configure Redirect URIs in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one with Client ID: `66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v`)
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add these URIs:

```
https://content-command-center-*.vercel.app/api/youtube/callback
http://localhost:3000/api/youtube/callback
```

**OR** if you have a custom domain, add:
```
https://your-custom-domain.com/api/youtube/callback
http://localhost:3000/api/youtube/callback
```

**OR** add all your Vercel deployment URLs individually:
```
https://content-command-center-e0ynu10og-austins-projects-c461c44a.vercel.app/api/youtube/callback
https://content-command-center-10c87hit8-austins-projects-c461c44a.vercel.app/api/youtube/callback
http://localhost:3000/api/youtube/callback
```

6. Click **Save**

### Step 3: Verify Environment Variables

Your environment variables are set in Vercel:
- ✅ `YOUTUBE_CLIENT_ID` - Set
- ✅ `YOUTUBE_CLIENT_SECRET` - Set

### Step 4: Verify Client ID Format

Your Client ID should end with `.apps.googleusercontent.com`. The format looks correct based on the code validation.

### Step 5: Check OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Make sure:
   - App is in **Testing** or **Production** mode
   - Your email (`austin@ownrops.com`) is added as a test user (if in Testing mode)
   - Required scopes are added:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube`
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/yt-analytics.readonly`

### Step 6: Alternative Solution - Use Production Domain

If you have a custom domain:
1. Add it to Vercel project settings
2. Use that domain's redirect URI in Google Cloud Console
3. This is more stable than dynamic Vercel URLs

## Quick Test

After updating redirect URIs:
1. Wait 1-2 minutes for Google to propagate changes
2. Try connecting YouTube again
3. If it still fails, check the browser console for the exact redirect URI being used

## Debugging

To see what redirect URI the app is using:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Connect YouTube" button
4. Look at the request to `/api/youtube/auth`
5. Check the response - it should include `redirectUri` in the JSON
6. Make sure that exact URI is in Google Cloud Console

## Common Issues

1. **Redirect URI mismatch**: The most common issue - make sure the URI in Google Cloud Console matches exactly (including `https://` and trailing `/api/youtube/callback`)

2. **Client ID not found**: Double-check the Client ID in Vercel matches the one in Google Cloud Console

3. **OAuth consent screen not configured**: Make sure the consent screen is set up and published

4. **API not enabled**: Ensure YouTube Data API v3 and YouTube Analytics API are enabled in Google Cloud Console





