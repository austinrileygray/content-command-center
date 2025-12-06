# 🎯 Content Idea Generator Based on Highest Performing Videos
## Build Plan & Requirements

---

## 📋 OVERVIEW

Build an AI-powered content idea generator that analyzes your highest-performing YouTube videos and generates new content ideas based on proven patterns, topics, and formats that work for your channel.

---

## 🗄️ DATABASE CHANGES NEEDED

### 1. New Table: `youtube_videos`
Store fetched YouTube video data and analytics:
```sql
CREATE TABLE youtube_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL UNIQUE, -- YouTube video ID
  title TEXT NOT NULL,
  description TEXT,
  published_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  
  -- Performance Metrics (from YouTube Analytics API)
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  watch_time_seconds INTEGER DEFAULT 0,
  average_view_duration_seconds INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,2), -- CTR percentage
  engagement_rate DECIMAL(5,2), -- (likes + comments + shares) / views
  
  -- Calculated Performance Score
  performance_score DECIMAL(10,2), -- Weighted score based on multiple metrics
  
  -- Video Metadata
  category_id TEXT,
  tags TEXT[],
  language TEXT,
  
  -- Analysis Data
  topics TEXT[], -- Extracted topics/themes
  format_type TEXT, -- solo_youtube, guest_interview, etc.
  hook_pattern TEXT, -- Pattern identified in title/hook
  thumbnail_style TEXT, -- Style analysis
  
  -- Timestamps
  last_analytics_fetch TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_youtube_videos_user ON youtube_videos(user_id);
CREATE INDEX idx_youtube_videos_performance ON youtube_videos(performance_score DESC);
CREATE INDEX idx_youtube_videos_published ON youtube_videos(published_at DESC);
```

### 2. New Table: `content_patterns`
Store AI-analyzed patterns from high-performing videos:
```sql
CREATE TABLE content_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'topic', 'format', 'hook', 'thumbnail', 'title_structure'
  pattern_name TEXT NOT NULL,
  pattern_data JSONB NOT NULL, -- Detailed pattern information
  performance_impact TEXT, -- How this pattern affects performance
  video_count INTEGER, -- Number of videos using this pattern
  average_performance_score DECIMAL(10,2),
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_patterns_user ON content_patterns(user_id);
CREATE INDEX idx_content_patterns_type ON content_patterns(pattern_type);
```

---

## 🔌 API ENDPOINTS TO BUILD

### 1. `/api/youtube/videos/fetch` (POST)
**Purpose:** Fetch videos from user's YouTube channel
- Uses YouTube Data API v3
- Fetches channel videos (up to 50 most recent)
- Stores basic video metadata
- Returns list of fetched videos

**Required Scopes:**
- `https://www.googleapis.com/auth/youtube.readonly` (already have via `youtube` scope)

**YouTube API Endpoints Used:**
- `GET /youtube/v3/channels?part=contentDetails&mine=true` - Get channel uploads playlist
- `GET /youtube/v3/playlistItems?part=snippet&playlistId={uploadsPlaylistId}` - Get videos
- `GET /youtube/v3/videos?part=snippet,statistics,contentDetails&id={videoIds}` - Get video details

### 2. `/api/youtube/analytics/fetch` (POST)
**Purpose:** Fetch analytics data for videos
- Uses YouTube Analytics API v2
- Fetches views, watch time, engagement metrics
- Updates `youtube_videos` table with performance data
- Calculates performance scores

**Required Scopes:**
- `https://www.googleapis.com/auth/yt-analytics.readonly` (NEW - need to add to OAuth)

**YouTube Analytics API Endpoints Used:**
- `GET /youtube/analytics/v2/reports?metrics=views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration&dimensions=video&ids=channel=={channelId}`

### 3. `/api/youtube/videos/analyze` (POST)
**Purpose:** Analyze high-performing videos and extract patterns
- Identifies top N videos (configurable, default: top 10)
- Uses Claude Opus 4.5 to analyze:
  - Common topics/themes
  - Title patterns and hooks
  - Description structures
  - Thumbnail styles
  - Format types
- Saves patterns to `content_patterns` table

### 4. `/api/ai/generate-ideas-from-videos` (POST)
**Purpose:** Generate new content ideas based on analyzed patterns
- Takes optional user prompt/topic
- Analyzes stored patterns from high-performing videos
- Uses Claude Opus 4.5 to generate ideas that:
  - Match proven patterns
  - Use successful title/hook structures
  - Target similar topics that performed well
  - Include confidence score based on pattern match
- Returns 3-5 ideas with reasoning

---

## 🎨 UI COMPONENTS TO BUILD

### 1. Enhanced AI Idea Generator Component
**File:** `src/components/ideas/ai-idea-generator.tsx` (UPDATE)

**New Features:**
- Toggle: "Generate from my top videos" checkbox
- Video selection: Show top 10 videos, allow user to select which to analyze
- Pattern display: Show detected patterns before generating
- Pattern-based confidence: Show why each idea has high confidence

**UI Flow:**
1. User clicks "Generate Ideas"
2. Dialog opens with two tabs:
   - Tab 1: "From Topic" (existing functionality)
   - Tab 2: "From My Top Videos" (NEW)
3. In "From My Top Videos" tab:
   - Button: "Fetch & Analyze My Videos" (if not done)
   - Shows list of top performing videos
   - Checkbox to select which videos to use
   - Optional: Text input for topic focus
   - "Generate Ideas" button

### 2. Video Performance Dashboard Component
**File:** `src/components/ideas/video-performance-dashboard.tsx` (NEW)

**Purpose:** Display fetched videos with performance metrics
- Table/cards showing:
  - Video thumbnail
  - Title
  - Views, Likes, Comments
  - Performance Score
  - Published Date
- Sortable by performance score
- Filter by date range
- "Use for Idea Generation" button

### 3. Pattern Insights Component
**File:** `src/components/ideas/pattern-insights.tsx` (NEW)

**Purpose:** Display analyzed patterns
- Shows detected patterns:
  - Top performing topics
  - Successful title structures
  - Hook patterns
  - Format preferences
- Visual indicators for pattern strength
- "Generate Ideas Using These Patterns" button

---

## 🔧 LIBRARY FUNCTIONS TO BUILD

### 1. YouTube Videos Fetcher
**File:** `src/lib/youtube-videos.ts` (NEW)

**Functions:**
- `fetchChannelVideos(accessToken, maxResults = 50)` - Fetch videos from channel
- `fetchVideoAnalytics(accessToken, channelId, videoIds)` - Fetch analytics for videos
- `calculatePerformanceScore(video)` - Calculate weighted performance score
- `getTopPerformingVideos(videos, limit = 10)` - Get top N videos

**Performance Score Formula:**
```
score = (views_weight * normalized_views) + 
        (engagement_weight * normalized_engagement) + 
        (watch_time_weight * normalized_watch_time) + 
        (ctr_weight * normalized_ctr)
```

### 2. Pattern Analyzer
**File:** `src/lib/pattern-analyzer.ts` (NEW)

**Functions:**
- `analyzeVideoPatterns(videos)` - Use Claude to analyze patterns
- `extractTopics(videos)` - Extract common topics
- `identifyTitlePatterns(videos)` - Identify successful title structures
- `identifyHookPatterns(videos)` - Identify hook patterns
- `savePatterns(userId, patterns)` - Save to database

### 3. Idea Generator (Enhanced)
**File:** `src/lib/idea-generator.ts` (NEW or UPDATE existing)

**Functions:**
- `generateIdeasFromPatterns(patterns, userPrompt?, count = 3)` - Generate ideas using patterns
- `calculateIdeaConfidence(idea, patterns)` - Calculate confidence based on pattern match

---

## 📊 DATA FLOW

### Step 1: Fetch Videos
```
User clicks "Fetch My Videos"
  → POST /api/youtube/videos/fetch
  → YouTube Data API: Get channel videos
  → Store in youtube_videos table
  → Return success with video count
```

### Step 2: Fetch Analytics
```
User clicks "Get Performance Data"
  → POST /api/youtube/analytics/fetch
  → YouTube Analytics API: Get metrics
  → Calculate performance scores
  → Update youtube_videos table
  → Return top performing videos
```

### Step 3: Analyze Patterns
```
User clicks "Analyze Patterns"
  → POST /api/youtube/videos/analyze
  → Get top 10 videos from database
  → Send to Claude Opus 4.5 for analysis
  → Extract patterns (topics, titles, hooks, formats)
  → Save to content_patterns table
  → Return pattern summary
```

### Step 4: Generate Ideas
```
User clicks "Generate Ideas from Top Videos"
  → POST /api/ai/generate-ideas-from-videos
  → Load patterns from content_patterns
  → Load top videos data
  → Send to Claude Opus 4.5 with:
    - Pattern analysis
    - Top video examples
    - User's optional topic/prompt
  → Generate 3-5 ideas matching patterns
  → Return ideas with confidence scores
```

---

## 🔑 REQUIRED CREDENTIALS & PERMISSIONS

### YouTube API Scopes (Need to Add)
Currently have:
- ✅ `https://www.googleapis.com/auth/youtube.upload`
- ✅ `https://www.googleapis.com/auth/youtube`

**Need to Add:**
- ⚠️ `https://www.googleapis.com/auth/youtube.readonly` (for fetching videos)
- ⚠️ `https://www.googleapis.com/auth/yt-analytics.readonly` (for analytics)

**Action Required:**
1. Update OAuth scopes in `src/lib/youtube.ts`
2. User will need to re-authorize YouTube connection
3. Update redirect URI if needed

---

## 📁 FILES TO CREATE/MODIFY

### New Files:
1. `migrations/create-youtube-videos-tables.sql` - Database schema
2. `src/lib/youtube-videos.ts` - Video fetching functions
3. `src/lib/youtube-analytics.ts` - Analytics fetching functions
4. `src/lib/pattern-analyzer.ts` - Pattern analysis functions
5. `src/app/api/youtube/videos/fetch/route.ts` - Fetch videos endpoint
6. `src/app/api/youtube/analytics/fetch/route.ts` - Fetch analytics endpoint
7. `src/app/api/youtube/videos/analyze/route.ts` - Analyze patterns endpoint
8. `src/app/api/ai/generate-ideas-from-videos/route.ts` - Generate ideas endpoint
9. `src/components/ideas/video-performance-dashboard.tsx` - Video dashboard
10. `src/components/ideas/pattern-insights.tsx` - Pattern display
11. `src/app/(dashboard)/ideas/videos/page.tsx` - Videos management page (optional)

### Files to Modify:
1. `src/lib/youtube.ts` - Add new scopes and video fetching functions
2. `src/components/ideas/ai-idea-generator.tsx` - Add "From Top Videos" tab
3. `src/app/api/youtube/auth/route.ts` - Update scopes in OAuth URL
4. `src/types/database.ts` - Add YouTube video and pattern types

---

## 🎯 FEATURES BREAKDOWN

### Phase 1: Video Fetching & Storage
- [ ] Add YouTube Data API integration for fetching videos
- [ ] Create `youtube_videos` table
- [ ] Build video fetch endpoint
- [ ] Store video metadata (title, description, thumbnail, etc.)
- [ ] Display fetched videos in UI

### Phase 2: Analytics Integration
- [ ] Add YouTube Analytics API integration
- [ ] Fetch performance metrics (views, engagement, watch time, CTR)
- [ ] Calculate performance scores
- [ ] Update videos with analytics data
- [ ] Display performance metrics in UI

### Phase 3: Pattern Analysis
- [ ] Build Claude AI analysis endpoint
- [ ] Analyze top 10 videos for patterns
- [ ] Extract topics, title structures, hooks, formats
- [ ] Create `content_patterns` table
- [ ] Store and display patterns

### Phase 4: Idea Generation
- [ ] Build idea generation endpoint using patterns
- [ ] Generate ideas matching proven patterns
- [ ] Calculate confidence scores
- [ ] Display ideas with pattern-based reasoning
- [ ] Allow saving generated ideas

### Phase 5: UI Enhancement
- [ ] Add "From Top Videos" tab to idea generator
- [ ] Create video performance dashboard
- [ ] Add pattern insights display
- [ ] Add refresh/refetch buttons
- [ ] Add date range filters

---

## 🚨 POTENTIAL CHALLENGES & SOLUTIONS

### Challenge 1: YouTube Analytics API Access
**Issue:** YouTube Analytics API requires additional OAuth scope
**Solution:** 
- Add `yt-analytics.readonly` scope
- User re-authorizes connection
- Handle scope errors gracefully

### Challenge 2: Rate Limiting
**Issue:** YouTube API has rate limits (10,000 units/day)
**Solution:**
- Batch video fetches
- Cache analytics data (refresh weekly)
- Show rate limit status to user

### Challenge 3: Performance Score Calculation
**Issue:** Need fair weighting of different metrics
**Solution:**
- Make weights configurable
- Default: Views (40%), Engagement (30%), Watch Time (20%), CTR (10%)
- Allow user to adjust weights

### Challenge 4: Pattern Analysis Quality
**Issue:** Claude needs good context to identify patterns
**Solution:**
- Provide full video titles, descriptions, and metrics
- Use structured prompts with examples
- Iterate on prompt engineering

---

## 📝 USER WORKFLOW

1. **First Time Setup:**
   - User clicks "Connect YouTube" (if not connected)
   - Authorizes with new scopes (videos + analytics)
   - System fetches videos automatically

2. **Fetch Videos:**
   - User clicks "Fetch My Videos" button
   - System fetches last 50 videos from channel
   - Stores in database

3. **Get Analytics:**
   - User clicks "Get Performance Data"
   - System fetches analytics for all videos
   - Calculates performance scores
   - Shows top performing videos

4. **Analyze Patterns:**
   - User clicks "Analyze Top Videos"
   - System analyzes top 10 videos with Claude
   - Extracts patterns and saves them
   - Shows pattern insights

5. **Generate Ideas:**
   - User goes to "Generate Ideas" dialog
   - Selects "From My Top Videos" tab
   - Optionally enters a topic focus
   - Clicks "Generate Ideas"
   - Gets 3-5 ideas based on proven patterns
   - Saves ideas to content pipeline

---

## ✅ APPROVAL CHECKLIST

Please review and approve/modify:

- [ ] Database schema (youtube_videos, content_patterns tables)
- [ ] API endpoints list and functionality
- [ ] UI components and user flow
- [ ] Performance score calculation formula
- [ ] Pattern analysis approach
- [ ] Required YouTube API scopes
- [ ] Feature prioritization (Phase 1-5)

---

## 🎨 UI MOCKUP CONCEPT

**Generate Ideas Dialog - New Tab:**
```
┌─────────────────────────────────────────┐
│ AI Idea Generator                       │
├─────────────────────────────────────────┤
│ [From Topic] [From My Top Videos] ← NEW │
├─────────────────────────────────────────┤
│                                         │
│ 📊 Your Top Performing Videos           │
│ ┌─────────────────────────────────────┐ │
│ │ [✓] "How I Built $100k Business"   │ │
│ │     2.5M views • 95% performance   │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [✓] "I Analyzed 50 Channels"        │ │
│ │     1.8M views • 88% performance   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Optional: Focus on specific topic       │
│ [Text input for topic]                  │
│                                         │
│ [Analyze Patterns] [Generate Ideas]     │
└─────────────────────────────────────────┘
```

---

## 📋 NEXT STEPS AFTER APPROVAL

1. Create database migration
2. Build YouTube video fetching
3. Build analytics integration
4. Build pattern analysis
5. Build idea generation
6. Build UI components
7. Test end-to-end flow
8. Deploy to production

---

**Ready for your review and approval!** 🚀


