# Vercel Environment Variables - Update Required

## ✅ Dev Server Status
- **Local dev server**: Running in background on port 3000
- **.env.local**: Updated with new values

## 🔄 Environment Variables to Update in Vercel

You need to update these environment variables in your Vercel dashboard:

### 1. **YOUTUBE_CLIENT_ID** (Updated)
- **Old value**: (see `.env.local` for reference)
- **New value**: (see `.env.local` for current value)
- **Environments**: Production, Preview, Development

### 2. **YOUTUBE_CLIENT_SECRET** (Updated)
- **Old value**: (see `.env.local` for reference)
- **New value**: (see `.env.local` for current value)
- **Environments**: Production, Preview, Development

### 3. **GEMINI_API_KEY** (New - Add This!)
- **Value**: (see `.env.local` for current value)
- **Environments**: Production, Preview, Development

## 📝 How to Update in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project: **content-command-center**
3. Go to **Settings** → **Environment Variables**
4. For each variable above:
   - Click on the existing variable (or "Add New" for GEMINI_API_KEY)
   - Update/Add the new value
   - Ensure all environments are selected (Production, Preview, Development)
   - Click **Save**

## 🚀 After Updating

After updating the environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment (or create a new deployment)
3. Your changes will be live!

## 🔗 Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Environment Variables: https://vercel.com/[your-project]/settings/environment-variables

---

**Note**: Your local `.env.local` file has been updated. The dev server is running and will use these new values locally.







