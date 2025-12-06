# 📋 Complete Workflow: What Happens After File Upload

## 🎬 Current Upload & Processing Flow

### **STEP 1: File Upload** 
**Location:** `/recordings` page upload form

When you upload a podcast episode or solo YouTube video:

1. **File Size Check**
   - If file < 50MB: Uploads via API route `/api/recordings/upload`
   - If file > 50MB: Uploads directly to Supabase Storage (bypasses Vercel)

2. **File Storage**
   - File saved to Supabase Storage bucket: `recordings`
   - Path format: `{userId}/recordings/{timestamp}-{randomId}.{ext}`
   - Public URL generated for the file

---

### **STEP 2: Database Records Created**
**Location:** `/api/recordings/upload` or `/api/recordings/create-from-url`

3. **Content Idea Created/Updated**
   - If no idea linked: Creates new `content_ideas` entry
     - Title: Filename (without extension)
     - Format: `guest_interview` (podcast) or `solo_youtube`
     - Status: `"recording"`
     - `recording_url`: Public URL to uploaded file
   - If idea linked: Updates existing idea with `recording_url`

4. **Recording Entry Created**
   - New row in `recordings` table:
     - `content_idea_id`: Links to the content idea
     - `platform`: `"manual"` (since you uploaded it)
     - `external_url`: Public URL to the file
     - `status`: `"completed"`
     - `editing_prompt_id`: Links to your selected editing prompt
     - `recording_urls`: JSON object with the URL

5. **Video Editing Job Created**
   - New row in `video_editing_jobs` table:
     - `recording_id`: Links to the recording
     - `content_idea_id`: Links to the content idea
     - `master_prompt_id`: Links to your editing prompt
     - `status`: `"processing"`
     - `processing_started_at`: Current timestamp

6. **Recording Linked to Editing Job**
   - Updates `recordings` table:
     - `editing_job_id`: Links back to the editing job

---

### **STEP 3: Automation Workflow Triggered** (if `autoProcess = true`)
**Location:** `/api/workflow/process-recording`

7. **Workflow Endpoint Called**
   - Asynchronously triggers (doesn't block upload)
   - Receives: `contentIdeaId`, `recordingId`, `editingJobId`

8. **Content Idea Retrieved**
   - Fetches content idea with recording URL
   - Gets editing prompt from recording (if available)

9. **Submagic Magic Clips Request**
   - Calls Submagic API: `POST /magic-clips`
   - Sends:
     - Video URL from `content_ideas.recording_url`
     - Title from content idea
     - Template: `"Hormozi 2"` (default)
     - Webhook URL: `https://contentmotor.co/api/webhooks/submagic`

10. **Content Idea Status Updated**
    - Updates `content_ideas` table:
      - `submagic_project_id`: Submagic's project ID
      - `submagic_template`: `"Hormozi 2"`
      - `status`: `"processing"`

**Status Now:** Recording is being processed by Submagic (can take 5-30 minutes)

---

### **STEP 4: Submagic Processing** ⏳
**Location:** Submagic servers

11. **Submagic Processes Video**
    - Analyzes video content
    - Generates 20+ short-form clips
    - Adds captions using "Hormozi 2" template
    - Scores clips for virality
    - Extracts transcripts

**You'll see in Queue page:**
- Editing job status: `"processing"`
- Content idea status: `"processing"`
- Editing job appears in "Processing" tab

---

### **STEP 5: Webhook Received** (when Submagic finishes)
**Location:** `/api/webhooks/submagic`

12. **Webhook Endpoint Receives Event**
    - Submagic calls: `POST /api/webhooks/submagic`
    - Payload contains: `event`, `projectId`, `clips[]`

13. **Content Idea Found**
    - Looks up content idea by `submagic_project_id`
    - Matches the project ID from Step 9

14. **Event Handler: `magic_clips.completed`**
    - Receives array of 20+ generated clips
    - Each clip contains:
      - `downloadUrl`: Direct link to video file
      - `thumbnailUrl`: Clip thumbnail image
      - `title`: Auto-generated title
      - `duration`: Length in seconds
      - `viralityScore`: 0-100 score
      - `transcript`: Text transcript

15. **Assets Created**
    - For each clip, creates new row in `assets` table:
      - `content_idea_id`: Links to content idea
      - `type`: `"clip"`
      - `status`: `"ready"` (ready for review)
      - `title`: Clip title from Submagic
      - `file_url`: Download URL
      - `thumbnail_url`: Thumbnail image URL
      - `duration`: Clip length
      - `virality_score`: Submagic's score
      - `submagic_clip_id`: Submagic's clip ID
      - `metadata`: Contains transcript and suggested title
      - `platform`: `"submagic"`

16. **Content Idea Status Updated**
    - Updates `content_ideas`:
      - `status`: `"ready_to_publish"`

**Status Now:** Clips are ready for review!

---

### **STEP 6: Review & Approval** 👀
**Location:** Dashboard pages

17. **Assets Page** (`/assets`)
    - All 20+ clips appear as individual assets
    - Status: `"ready"`
    - Shows: Thumbnail, title, duration, virality score
    - You can preview, approve, or reject each clip

18. **Queue Page** (`/queue`)
    - Editing job appears in "Processing" tab initially
    - Once clips are ready, you can review:
      - Video preview player
      - Original recording info
      - Editing prompt used
      - Processing status
      - Edit history
    - After review, you can:
      - **Approve** → Creates asset, moves to "Approved" tab
      - **Request Edits** → Creates video-specific prompt, re-processes

---

### **STEP 7: Publishing** (Manual - Not Yet Automated)
**Location:** Assets page or Publishing Queue

19. **Approve Clips**
    - Select clips you want to publish
    - Click "Approve" or add to publishing queue

20. **Queue for Publishing**
    - Clips added to `publishing_queue` table
    - Status: `"pending"`
    - Can schedule for specific date/time

21. **Publish to Platforms** (when implemented)
    - YouTube, TikTok, Instagram, etc.
    - Status updates to `"published"`
    - `published_url` saved
    - `published_at` timestamp recorded

---

## 📊 Current Status Tracking

### **Where You Can See Progress:**

1. **Queue Page** (`/queue`)
   - **Processing Tab:** Shows editing jobs with status "processing"
   - **Ready for Review Tab:** Shows jobs with status "ready_for_review"
   - **Needs Edits Tab:** Shows jobs requiring changes
   - **Approved Tab:** Shows finalized videos

2. **Assets Page** (`/assets`)
   - All generated clips appear here
   - Filter by content idea
   - Sort by virality score, duration, date
   - Preview and approve/reject

3. **Content Ideas Page** (`/ideas`)
   - Status column shows: `recording` → `processing` → `ready_to_publish`
   - Click to see full details

---

## ⚠️ Current Gaps / Not Yet Implemented

1. **Long-Form Video Editing**
   - Editing prompt is stored but not yet used
   - No integration with editing service (Descript recommended)
   - Editing job stays in "processing" until manually updated

2. **Automatic Thumbnail Generation**
   - Mentioned in workflow but not implemented yet
   - Would generate thumbnails after clips are ready

3. **Automatic Publishing**
   - Clips must be manually approved and queued
   - Publishing to YouTube/TikTok requires manual action

4. **Editing Service Integration**
   - Need to integrate Descript (or similar) for long-form editing
   - Would use the stored editing prompt
   - Would generate multiple versions/renderings
   - Would update editing job with results

---

## ✅ What Works Right Now

- ✅ File upload (small and large files)
- ✅ Recording entry creation
- ✅ Editing job creation
- ✅ Linking to editing prompts
- ✅ Automatic Submagic clip generation
- ✅ Webhook receiving clips
- ✅ Assets creation from clips
- ✅ Status tracking in Queue page
- ✅ Clip preview and review

---

## 🎯 Summary: Complete Flow Diagram

```
UPLOAD FILE
    ↓
[File Saved to Supabase Storage]
    ↓
[Content Idea Created/Updated]
    ↓
[Recording Entry Created]
    ↓
[Video Editing Job Created - status: "processing"]
    ↓
IF autoProcess = true:
    ↓
[Workflow Triggered]
    ↓
[Sent to Submagic for Magic Clips]
    ↓
[Status: "processing" - waiting...]
    ↓
⏳ (Submagic processes - 5-30 min)
    ↓
[Webhook Received: magic_clips.completed]
    ↓
[20+ Assets Created from Clips]
    ↓
[Content Idea Status: "ready_to_publish"]
    ↓
[Clips Appear in Assets Page]
    ↓
[You Review & Approve Clips]
    ↓
[Publish to Platforms]
```

---

**Next Steps to Complete Full Automation:**
1. Integrate editing service (Descript) for long-form editing
2. Generate thumbnails automatically after clips ready
3. Auto-approve high-scoring clips
4. Auto-publish approved clips to platforms








