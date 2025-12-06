# 🔑 Quick Guide: Adding YouTube Client ID to Vercel

## Your YouTube Client ID:
```
YOUR_YOUTUBE_CLIENT_ID_HERE
```

## Steps to Add to Vercel:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: **"Content Command Center"**

2. **Navigate to Environment Variables**
   - Click **Settings** (top navigation)
   - Click **Environment Variables** (left sidebar)

3. **Add YouTube Client ID**
   - Click **Add New**
   - **Key**: `YOUTUBE_CLIENT_ID`
   - **Value**: `YOUR_YOUTUBE_CLIENT_ID_HERE`
   - Select all environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

4. **Add YouTube Client Secret** (if you have it)
   - Click **Add New** again
   - **Key**: `YOUTUBE_CLIENT_SECRET`
   - **Value**: `[Your Client Secret from Google Cloud Console]`
   - Select all environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

5. **Redeploy Your App**
   - Go to **Deployments** tab
   - Click the **"..."** menu on the latest deployment
   - Click **Redeploy**
   - Wait for deployment to complete

## ⚠️ Important Notes:

- **Client Secret**: You'll need to get this from Google Cloud Console if you don't have it yet
- **Both Required**: Both `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET` are required
- **Redeploy**: Environment variables only take effect after redeploying

## Where to Find Client Secret:

1. Go to: https://console.cloud.google.com/
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Copy the **Client Secret** value

## After Adding Variables:

1. ✅ Variables added to Vercel
2. ✅ App redeployed
3. ✅ Go to https://contentmotor.co/settings
4. ✅ Click "Connect" on YouTube integration
5. ✅ Authorize the app

---

**Need help?** Check the full setup guide: `YOUTUBE-API-SETUP-INSTRUCTIONS.md`








