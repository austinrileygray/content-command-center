# 🔄 Workflow Sequence - Fixed & Enhanced

## New Workflow Flow

### Complete Sequence:
```
1. Upload Recording
   ↓
2. Create Editing Job & Link to Prompt
   ↓
3. [IF API KEY CONFIGURED] Send to Editing Service
   - Uses video-specific prompt or master prompt
   - Generates multiple versions
   - Webhook callback when complete
   ↓
4. [IF NO EDITING] OR After Editing Complete → Send to Submagic
   - Generates clips from edited video (or original if no editing)
   ↓
5. Clips Ready → Generate Thumbnails
   ↓
6. Review & Approve (Manual)
   ↓
7. Publish to Platforms
```

---

## Implementation Details

### Files Created/Updated:

1. **`src/lib/editing-service.ts`** ✅ NEW
   - Service-agnostic editing client
   - Supports Descript, RunwayML, or custom services
   - Handles job submission, status checking, version retrieval

2. **`src/app/api/webhooks/editing-service/route.ts`** ✅ NEW
   - Webhook handler for editing service callbacks
   - Updates `video_editing_jobs` with versions
   - Triggers next workflow step (Submagic) after editing completes

3. **`src/app/api/workflow/process-recording/route.ts`** ✅ UPDATED
   - Now checks for editing job first
   - Sends to editing service if configured
   - Falls back to Submagic if editing not available

4. **`src/app/api/workflow/process-clips/route.ts`** ✅ NEW
   - Separate endpoint for clip generation step
   - Called after editing completes
   - Can also be called directly if editing is skipped

---

## How It Works

### Step-by-Step:

1. **Upload Recording:**
   - User uploads via `/api/recordings/upload` or `/api/recordings/create-from-url`
   - Recording entry created
   - Editing job created and linked
   - If `autoProcess=true`, workflow triggered

2. **Editing Step (NEW):**
   - Workflow checks for editing job
   - Gets prompt (video-specific or master)
   - Submits to editing service with prompt
   - Stores external job ID in `video_editing_jobs.editing_job_id`
   - Status: `processing`

3. **Editing Complete (Webhook):**
   - Editing service calls `/api/webhooks/editing-service`
   - Updates `video_editing_jobs` with versions array
   - Updates `content_ideas.recording_url` to edited video URL
   - Status: `ready_for_review`
   - Automatically triggers `/api/workflow/process-clips`

4. **Clip Generation:**
   - Called by editing webhook OR directly from workflow if no editing
   - Sends (edited) video to Submagic
   - Status: `processing`

5. **Clips Ready (Webhook):**
   - Submagic calls `/api/webhooks/submagic`
   - Creates asset entries for each clip
   - Generates thumbnail concepts
   - Status: `ready` (for manual review)

---

## Configuration

### Environment Variables Needed:

```env
# Editing Service (CRITICAL for editing to work)
DESCRIPT_API_KEY=your-descript-api-key
# OR
RUNWAY_API_KEY=your-runway-api-key
# OR
EDITING_SERVICE_API_KEY=your-custom-service-key

# Optional: Customize service
EDITING_SERVICE_TYPE=descript  # descript, runway, custom
EDITING_SERVICE_BASE_URL=https://api.descript.com/v1
```

---

## Current Status

- ✅ **Structure Complete:** All code in place
- ⚠️ **API Key Needed:** Requires Descript API key (or alternative)
- ✅ **Fallback Works:** If no API key, workflow continues directly to Submagic
- ✅ **Webhook Ready:** Webhook handler ready to receive editing completion callbacks
- ✅ **Version Support:** Multiple versions/renders supported in database

---

## Next Steps

1. **Get Editing Service API Key** (See `NEEDED-API-KEYS.md`)
2. **Configure Webhook URL** in editing service:
   - `https://contentmotor.co/api/webhooks/editing-service`
3. **Test Workflow:**
   - Upload a recording
   - Verify editing job created
   - Verify editing service submission
   - Verify webhook receives completion
   - Verify clips generated from edited video

---

## Error Handling

- ✅ If editing service not configured → Falls back to direct Submagic
- ✅ If editing fails → Error logged, continues to Submagic
- ✅ If editing webhook fails → Manual retry available
- ✅ All errors logged for debugging

---

**Status:** ✅ Structure complete, awaiting API key configuration









