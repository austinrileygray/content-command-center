# 🔑 Required API Keys & Credentials

This document lists all external services that require API keys, OAuth credentials, or webhook URLs to enable full functionality.

## ✅ Already Configured

- **Submagic API Key** - ✅ Configured in `.env.local`
  - ⚠️ **Action Required:** Add `SUBMAGIC_API_KEY` to Vercel environment variables
  - Get from: https://app.submagic.co → Settings → API

## 🔒 Required for Full Functionality

### 1. YouTube API (OAuth) ✅ FULLY CONFIGURED
**Purpose:** Direct publishing of videos and clips to YouTube  
**Status:** ✅ Complete - Ready to use  
**Required:**
- ✅ OAuth 2.0 Client ID: `66319413166-14e0viqsh4hefie1q2nqu62u1rkn0j0v.apps.googleusercontent.com`
- ✅ OAuth 2.0 Client Secret: Configured
- ✅ YouTube Data API v3 enabled (assumed)
- ✅ Redirect URI: `/api/youtube/callback`

**Setup:**
1. ✅ Client ID added to `.env.local` and Vercel
2. ✅ Client Secret added to `.env.local` and Vercel
3. ⚠️ **Action Required:** Configure Redirect URI in Google Cloud Console:
   - Go to APIs & Services → Credentials
   - Edit your OAuth 2.0 Client ID
   - Add Authorized redirect URI: `https://your-vercel-app.vercel.app/api/youtube/callback`
   - Add local redirect URI: `http://localhost:3000/api/youtube/callback`
   - Save changes

**Files Created:**
- ✅ `src/lib/youtube.ts` (YouTube API client)
- ✅ `src/app/api/youtube/auth/route.ts` (OAuth initiation)
- ✅ `src/app/api/youtube/callback/route.ts` (OAuth callback)
- ✅ `src/app/api/youtube/publish/route.ts` (Video publishing)
- ✅ `src/app/(dashboard)/settings/page.tsx` (Connect button)
- ✅ `src/app/(dashboard)/publish/publish-client.tsx` (Publish Now button)

**Environment Variables:**
- ✅ `YOUTUBE_CLIENT_ID` - Added to `.env.local` and Vercel
- ✅ `YOUTUBE_CLIENT_SECRET` - Added to `.env.local` and Vercel

---

### 2. LinkedIn API (OAuth)
**Purpose:** Publishing content to LinkedIn  
**Status:** ⏳ Not configured  
**Required:**
- LinkedIn OAuth Client ID
- LinkedIn OAuth Client Secret
- Redirect URI configured

**Setup:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Request access to "Share on LinkedIn" and "Read and write posts" permissions
4. Add credentials to Settings → Integrations page

**Files to update:**
- `src/app/(dashboard)/settings/page.tsx` (add LinkedIn OAuth fields)
- `src/lib/linkedin.ts` (create LinkedIn API client)
- Environment variables: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`

---

### 3. Twitter/X API (OAuth)
**Purpose:** Publishing content to Twitter/X  
**Status:** ⏳ Not configured  
**Required:**
- Twitter API Key
- Twitter API Secret
- Twitter Bearer Token
- OAuth 1.0a or OAuth 2.0 credentials

**Setup:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Generate API keys and tokens
4. Add credentials to Settings → Integrations page

**Files to update:**
- `src/app/(dashboard)/settings/page.tsx` (add Twitter OAuth fields)
- `src/lib/twitter.ts` (create Twitter API client)
- Environment variables: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_BEARER_TOKEN`

---

### 4. OpenAI/Claude API (AI Idea Generation)
**Purpose:** AI-powered content idea generation  
**Status:** ⏳ Not configured  
**Required:**
- OpenAI API Key OR
- Anthropic (Claude) API Key

**Setup:**
1. **OpenAI:** Go to [OpenAI Platform](https://platform.openai.com/) → API Keys
2. **Claude:** Go to [Anthropic Console](https://console.anthropic.com/) → API Keys
3. Add API key to Settings → API Keys page

**Files to update:**
- `src/app/(dashboard)/settings/page.tsx` (add AI API key field)
- `src/lib/ai-ideas.ts` (create AI idea generation client)
- Environment variables: `OPENAI_API_KEY` OR `ANTHROPIC_API_KEY`

**Note:** Choose one provider (OpenAI or Claude) or support both

---

### 5. Zapier Webhook URL
**Purpose:** Trigger Zapier workflows for automation  
**Status:** ⏳ Not configured  
**Required:**
- Zapier Webhook URL (from your Zap)

**Setup:**
1. Create a Zap in Zapier
2. Use "Webhooks by Zapier" as the trigger
3. Copy the webhook URL
4. Add URL to Settings → Integrations page

**Files to update:**
- `src/app/(dashboard)/settings/page.tsx` (add Zapier webhook URL field)
- `src/lib/zapier.ts` (create Zapier webhook client)
- Environment variables: `ZAPIER_WEBHOOK_URL` (optional, can be stored in database)

---

## 📋 Summary Checklist

- [ ] Add `SUBMAGIC_API_KEY` to Vercel environment variables
- [ ] Configure YouTube OAuth (Client ID, Client Secret)
- [ ] Configure LinkedIn OAuth (Client ID, Client Secret)
- [ ] Configure Twitter/X API (API Key, API Secret, Bearer Token)
- [ ] Add OpenAI or Claude API key for AI idea generation
- [ ] Configure Zapier webhook URL (optional)

---

## 🚀 Implementation Priority

1. **High Priority:**
   - Submagic API Key (already in `.env.local`, needs Vercel)
   - YouTube API (core publishing functionality)

2. **Medium Priority:**
   - LinkedIn API (social publishing)
   - Twitter/X API (social publishing)

3. **Low Priority:**
   - OpenAI/Claude API (nice-to-have feature)
   - Zapier webhook (optional automation)

---

## 📝 Notes

- All OAuth credentials should be stored securely in environment variables
- Never commit API keys to version control
- Use Supabase Vault or similar for sensitive credentials if needed
- Test all integrations in development before deploying to production



