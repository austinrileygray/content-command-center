# 🔄 Update YouTube OAuth Redirect URI for contentmotor.co

## ✅ Domain is Configured!

Your domain `contentmotor.co` is already set up in Vercel! 

## 🔧 Next Step: Update Google Cloud Console

Now you need to update the YouTube OAuth redirect URI in Google Cloud Console to use your custom domain instead of the dynamic Vercel URLs.

### Steps:

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Select your project (the one with Client ID: `66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v`)

2. **Edit OAuth 2.0 Client ID:**
   - Click on your OAuth 2.0 Client ID
   - Scroll to **Authorized redirect URIs**

3. **Add/Update Redirect URIs:**
   Remove the old Vercel URLs and add these:
   ```
   https://contentmotor.co/api/youtube/callback
   https://www.contentmotor.co/api/youtube/callback
   http://localhost:3000/api/youtube/callback
   ```

4. **Save Changes:**
   - Click **Save**
   - Wait 1-2 minutes for changes to propagate

5. **Test Connection:**
   - Go to your app: https://contentmotor.co/settings
   - Click "Connect YouTube"
   - It should work now! ✅

## 🎯 Why This Works Better

Using a custom domain (`contentmotor.co`) instead of dynamic Vercel URLs means:
- ✅ Stable redirect URI that doesn't change with each deployment
- ✅ Professional URL for your app
- ✅ Easier to remember and share
- ✅ No need to update redirect URIs every time you deploy

## 📝 Current Status

- ✅ Domain configured in Vercel: `contentmotor.co`
- ✅ App deployed to production
- ⏳ **Action Required:** Update Google Cloud Console redirect URIs (see steps above)

After updating the redirect URIs, your YouTube connection should work perfectly!





