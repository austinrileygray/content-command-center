# Vercel Environment Variables

## Required Environment Variables

Add these to your Vercel project settings (Settings → Environment Variables):

### Already Configured
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

### ⚠️ NEW - Add These

**`SUBMAGIC_API_KEY`**
- Value: `sk-d01c7b0df4c8176e104c910caa63d9b83185d37e384f80649a3918c56d60d3b4`
- Environment: Production, Preview, Development (all)
- Description: Submagic API key for Magic Clips generation

**`ANTHROPIC_API_KEY`** ✅ NEW - Already Added to Vercel
- Value: (stored securely in Vercel - see `.env.local` for local development)
- Environment: Production, Preview, Development (all)
- Description: Anthropic Claude API key for AI-powered idea generation
- Status: ✅ Added to Vercel production environment

## How to Add

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select the "Content Command Center" project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Name: `SUBMAGIC_API_KEY`
6. Value: `sk-d01c7b0df4c8176e104c910caa63d9b83185d37e384f80649a3918c56d60d3b4`
7. Select all environments (Production, Preview, Development)
8. Click **Save**
9. **Redeploy** your application for the changes to take effect

## After Adding

Once added:
- ✅ Submagic Magic Clips integration will be fully functional
- ✅ AI-powered idea generation will work with Claude API

## Quick Add via CLI

You can also add via CLI (if you have Vercel CLI installed):
```bash
npx vercel env add ANTHROPIC_API_KEY production
# When prompted, paste your Anthropic API key
```

**Note:** The `ANTHROPIC_API_KEY` has already been added to Vercel production environment. ✅

**`YOUTUBE_CLIENT_ID`** ✅ NEW
- Value: `66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com`
- Environment: Production, Preview, Development (all)
- Description: YouTube OAuth Client ID for video publishing
- Status: ✅ Added to .env.local - needs to be added to Vercel

**`YOUTUBE_CLIENT_SECRET`** ✅ NEW - Already Added to Vercel
- Value: (stored securely in Vercel - see `.env.local` for local development)
- Environment: Production, Preview, Development (all)
- Description: YouTube OAuth Client Secret (required for OAuth flow)
- Status: ✅ Added to Vercel production environment



