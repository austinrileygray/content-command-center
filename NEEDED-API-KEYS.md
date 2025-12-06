# 🔑 API Keys Needed for Full Functionality

This document tracks all API keys and credentials needed to complete the MVP and enable full functionality.

## 🔥 CRITICAL - Blocks MVP Completion

### 1. Descript API Key (or Alternative Editing Service)
**Purpose:** Long-form video editing for podcasts and solo YouTube videos  
**Status:** ⚠️ NEEDED  
**Impact:** **BLOCKS MVP** - Cannot edit long-form content without this  
**Where to get:**
- Descript: https://www.descript.com/api
- Alternative options: RunwayML, Custom API

**What it enables:**
- Automated editing based on prompts
- Multiple video versions/renders
- Queue review system functionality

---

## 🟡 HIGH PRIORITY - Enhances Features

### 2. Anthropic Claude API Key OR OpenAI API Key
**Purpose:** AI-powered content idea generation  
**Status:** ⚠️ NEEDED  
**Impact:** AI idea generator currently UI-only  
**Where to get:**
- Anthropic: https://console.anthropic.com/
- OpenAI: https://platform.openai.com/api-keys

**What it enables:**
- Generate content ideas from top performing videos
- Analyze patterns and suggest content
- Template-based idea generation

---

## 🟢 MEDIUM PRIORITY - Multi-Platform Publishing

### 3. TikTok API Credentials
**Purpose:** Direct publishing to TikTok  
**Status:** ⚠️ NEEDED  
**Impact:** Multi-platform distribution  
**Where to get:** https://developers.tiktok.com/

**What's Ready:**
- ✅ API client (`src/lib/tiktok.ts`)
- ✅ OAuth auth route (`src/app/api/tiktok/auth/route.ts`)
- ✅ OAuth callback route (`src/app/api/tiktok/callback/route.ts`)

**Environment Variables Needed:**
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`

---

### 4. Instagram Business API Credentials
**Purpose:** Direct publishing to Instagram  
**Status:** ⚠️ NEEDED  
**Impact:** Multi-platform distribution  
**Where to get:** https://developers.facebook.com/docs/instagram-api/

**What's Ready:**
- ✅ API client (`src/lib/instagram.ts`)
- ✅ OAuth auth route (`src/app/api/instagram/auth/route.ts`)
- ✅ OAuth callback route (`src/app/api/instagram/callback/route.ts`)

**Environment Variables Needed:**
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`

---

### 5. LinkedIn OAuth Credentials
**Purpose:** Direct publishing to LinkedIn  
**Status:** ⚠️ NEEDED  
**Impact:** Multi-platform distribution  
**Where to get:** https://www.linkedin.com/developers/

**What's Ready:**
- ✅ API client (`src/lib/linkedin.ts`)
- ✅ OAuth auth route (`src/app/api/linkedin/auth/route.ts`)
- ✅ OAuth callback route (`src/app/api/linkedin/callback/route.ts`)

**Environment Variables Needed:**
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`

---

## 🔵 NICE TO HAVE - Enhanced Features

### 6. DALL-E / Image Generation API
**Purpose:** AI thumbnail generation from concepts  
**Status:** ⚠️ OPTIONAL  
**Impact:** Automated thumbnail creation  
**Options:**
- OpenAI DALL-E API
- Midjourney API
- Stable Diffusion API

---

## ✅ Already Configured

- ✅ **Submagic API Key** - Configured in `.env.local`, needs Vercel deployment
- ✅ **YouTube API** - OAuth fully configured and ready
- ✅ **Multi-Platform OAuth Structures** - TikTok, Instagram, LinkedIn OAuth flows created and ready

---

## 📝 How to Add API Keys

1. **Add to `.env.local` for local development:**
   ```env
   DESCRIPT_API_KEY=your-key-here
   ANTHROPIC_API_KEY=your-key-here
   # etc...
   ```

2. **Add to Vercel Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add each key for Production, Preview, and Development environments

3. **Restart the application** after adding new keys

---

**Priority Order:**
1. Descript API Key (CRITICAL for MVP)
2. Anthropic/OpenAI API Key (AI features)
3. Multi-platform APIs (expansion)








