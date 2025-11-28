# YouTube OAuth Verification Checklist

## ✅ Client ID Confirmed

**Your Client ID:**
```
66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com
```

This matches what's in your code and environment variables.

## 🔍 Complete Verification Steps

### Step 1: Verify Client ID in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Make sure you're in the **correct project**
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. **Verify it matches exactly:**
   - `66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com`
6. Click on it to view/edit

### Step 2: Verify Redirect URIs

In the OAuth client settings, under **Authorized redirect URIs**, you should have:

**Production:**
```
https://content-command-center-lvoldojv2-austins-projects-c461c44a.vercel.app/api/youtube/callback
```

**Local:**
```
http://localhost:3000/api/youtube/callback
```

**Important:**
- Must include the full path: `/api/youtube/callback`
- No trailing slash
- Exact match required

### Step 3: Verify JavaScript Origins (Optional but Recommended)

Under **Authorized JavaScript origins**, add:

**Production:**
```
https://content-command-center-lvoldojv2-austins-projects-c461c44a.vercel.app
```

**Local:**
```
http://localhost:3000
```

**Important:**
- No path (just the domain)
- No trailing slash

### Step 4: Verify YouTube Data API v3 is Enabled

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Make sure it shows **ENABLED**
4. If not, click **ENABLE**

### Step 5: Verify Environment Variables

**In Vercel:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **content-command-center**
3. Go to **Settings** → **Environment Variables**
4. Verify `YOUTUBE_CLIENT_ID` is set to:
   ```
   66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com
   ```
5. Verify `YOUTUBE_CLIENT_SECRET` is set

**In Local (.env.local):**
```bash
YOUTUBE_CLIENT_ID=66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=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
```

## 🐛 Troubleshooting 401 Error

If you're still getting "401: invalid_client", check:

### 1. Project Mismatch
- Make sure the Client ID is in the **same Google Cloud project** you're viewing
- The Client ID might exist in a different project

### 2. Client ID Deleted/Recreated
- If the Client ID was deleted and recreated, you need to use the new one
- Old Client IDs won't work

### 3. Wrong Google Account
- Make sure you're signed into the correct Google account in Google Cloud Console
- The Client ID might belong to a different account

### 4. API Not Enabled
- YouTube Data API v3 must be enabled in the same project
- Go to APIs & Services → Library → Enable YouTube Data API v3

### 5. Wait for Propagation
- After making changes, wait 1-2 minutes
- Google needs time to propagate changes

## ✅ Test After Configuration

1. Save all changes in Google Cloud Console
2. Wait 1-2 minutes
3. Try connecting again in your app
4. Check browser console for any errors
5. Check Vercel function logs if it still fails

## 📝 Current Production URL

Your latest deployment:
```
https://content-command-center-lvoldojv2-austins-projects-c461c44a.vercel.app
```

Make sure this exact URL (with `/api/youtube/callback` path) is in your redirect URIs.
