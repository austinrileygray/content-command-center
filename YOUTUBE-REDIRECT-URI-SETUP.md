# How to Configure YouTube OAuth Redirect URI

## Step-by-Step Instructions

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with the Google account that created the OAuth credentials
3. Select the project that contains your OAuth 2.0 Client ID

### Step 2: Navigate to Credentials

1. In the left sidebar, click **APIs & Services**
2. Click **Credentials** (or go directly to: https://console.cloud.google.com/apis/credentials)

### Step 3: Find Your OAuth Client

1. Look for your OAuth 2.0 Client ID in the list:
   - **Client ID:** `66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com`
2. Click on the **pencil icon** (Edit) or click on the Client ID name

### Step 4: Add Authorized Redirect URIs

1. Scroll down to the **Authorized redirect URIs** section
2. Click **+ ADD URI** button
3. Add these two URIs (one at a time):

   **Production (Vercel):**
   ```
   https://content-command-center-ew6bkbv58-austins-projects-c461c44a.vercel.app/api/youtube/callback
   ```

   **Local Development:**
   ```
   http://localhost:3000/api/youtube/callback
   ```

4. After adding each URI, click **+ ADD URI** again to add the next one

### Step 5: Save Changes

1. Scroll to the bottom of the page
2. Click **SAVE** button
3. Wait for the confirmation message

### Step 6: Verify

1. The redirect URIs should now appear in the list
2. Make sure both URIs are exactly as shown above (no trailing slashes, correct protocol)

## Important Notes

⚠️ **Exact Match Required:**
- The redirect URI must match **exactly** (case-sensitive, no trailing slashes)
- `https://` vs `http://` matters
- The path `/api/youtube/callback` must be exact

⚠️ **Production URL:**
- Your Vercel production URL may change with each deployment
- If you have a custom domain, use that instead
- Or use your main Vercel project URL (check Vercel dashboard)

## Troubleshooting

### If you can't find your OAuth Client:
- Make sure you're in the correct Google Cloud project
- Check that you're signed in with the correct Google account
- The Client ID should start with `66319413166-`

### If the redirect URI doesn't work:
- Double-check for typos (especially `https://` vs `http://`)
- Make sure there are no trailing slashes
- Wait a few minutes after saving (Google may need time to propagate)
- Check that YouTube Data API v3 is enabled in the same project

### To find your exact Vercel URL:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **content-command-center**
3. Check the **Production** deployment URL
4. Use that exact URL in the redirect URI

## Quick Checklist

- [ ] Signed in to Google Cloud Console
- [ ] Selected correct project
- [ ] Found OAuth 2.0 Client ID
- [ ] Added production redirect URI
- [ ] Added local development redirect URI
- [ ] Saved changes
- [ ] Verified URIs are in the list

## After Configuration

Once configured, you can:
1. Go to your app: Settings → Integrations
2. Click "Connect" next to YouTube
3. You'll be redirected to Google for authorization
4. After authorizing, you'll be redirected back to your app

The redirect URI you configured is where Google will send users after they authorize your app.
