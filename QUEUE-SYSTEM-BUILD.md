# 🎬 Queue & Review System - Complete Build

## Overview

A comprehensive queue system for reviewing edited episodes, requesting changes, and managing video-specific prompts. Built to handle both long-form edited videos and short-form clips.

## Database Schema

### New Tables Created

#### 1. `video_specific_prompts`
- Stores video-specific editing prompts (copied from master prompts)
- Each video gets its own prompt that can be modified independently
- Tracks version history and edit notes
- Links to master prompt it was based on

#### 2. `video_editing_jobs`
- Tracks the editing workflow for each recording
- Stores multiple renderings/versions
- Tracks status (processing, ready_for_review, needs_edits, approved)
- Contains edit history with notes and timestamps
- Links to approved asset when finalized

### Updated Tables
- `recordings` - Added `editing_job_id` column

## Pages & Components

### 1. `/queue` - Queue & Review Page
**Features:**
- ✅ Tabbed interface:
  - **Ready for Review** - Videos ready for your review
  - **Processing** - Currently being edited
  - **Needs Edits** - Videos awaiting re-processing
  - **Approved** - Approved videos
  - **Short-Form Clips** - Generated clips for social media

### 2. Video Preview Cards
**Shows:**
- ✅ Video preview player (with thumbnail support)
- ✅ Original recording info with link
- ✅ Editing prompt used (master or video-specific)
- ✅ Processing status badge
- ✅ Version selector (if multiple versions)
- ✅ Edit history/comments
- ✅ Download button
- ✅ Request Edits button
- ✅ Approve button (when ready)

### 3. Edit Request Dialog
**Features:**
- ✅ View current video-specific prompt
- ✅ Add edit notes/instructions
- ✅ Option to update master prompt (for all videos)
- ✅ Automatically creates new video-specific prompt version
- ✅ Incorporates edit notes into prompt
- ✅ Triggers re-processing workflow

### 4. Clip Preview Cards
- ✅ Grid view of short-form clips
- ✅ Video preview with player
- ✅ Virality score display
- ✅ Link to source content idea
- ✅ Status badges
- ✅ Download button

## API Endpoints

### 1. `POST /api/queue/request-edit`
**Purpose:** Request edits for a video

**Flow:**
1. Creates/updates video-specific prompt
2. Copies from master prompt if first edit
3. Appends edit notes to prompt text
4. Creates new version of video-specific prompt
5. Optionally updates master prompt (if checkbox checked)
6. Updates editing job status
7. Triggers re-processing workflow

### 2. `POST /api/queue/approve`
**Purpose:** Approve a video and move to assets

**Flow:**
1. Creates asset entry in `assets` table (type: `edited_episode`)
2. Links to approved version
3. Updates editing job status to "approved"
4. Stores approved asset ID

## Video-Specific Prompt System

### How It Works

1. **Initial Upload:**
   - Recording is uploaded with master prompt selected
   - Video editing job is created
   - Master prompt is referenced

2. **First Edit Request:**
   - System copies master prompt
   - Creates new `video_specific_prompt` record
   - Adds edit notes as additional instructions
   - Video-specific prompt is linked to editing job

3. **Subsequent Edit Requests:**
   - Creates new version of video-specific prompt
   - Appends new edit notes
   - Maintains history through version numbers

4. **Master Prompt Updates:**
   - Only when checkbox is checked
   - Creates new master prompt version
   - Future videos use new master version
   - Existing video-specific prompts remain unchanged

### Example Flow:

```
Master Prompt: "Edit podcast with pacing..."
↓
Video Upload → Uses Master Prompt
↓
Edit Request: "Remove all silence over 2 seconds"
↓
Video-Specific Prompt Created:
  "Edit podcast with pacing...
  
  ---
  
  Additional Instructions:
  Remove all silence over 2 seconds"
↓
Re-process video with video-specific prompt
↓
Edit Request #2: "Lower background music volume"
↓
Video-Specific Prompt v2:
  "Edit podcast with pacing...
  
  ---
  
  Additional Instructions (v1):
  Remove all silence over 2 seconds
  
  ---
  
  Additional Instructions (v2):
  Lower background music volume"
```

## Status Workflow

```
Upload Recording
  ↓
Processing (editing job created, workflow triggered)
  ↓
Ready for Review (editing complete, versions available)
  ↓
  ├─→ Approve → Approved (moved to assets table)
  └─→ Request Edits → Needs Edits → Processing (re-processing)
                          ↓
                    Ready for Review (again)
```

## Integration Points

### Upload Flow
- When recording is uploaded, editing job is automatically created
- Links to master prompt
- Status set to "processing"
- Workflow triggered if autoProcess enabled

### Workflow Processing
- Currently uses Submagic for clip generation
- **TODO:** Integrate long-form editing service (see EDITING-SERVICE-RECOMMENDATION.md)
- After editing, creates versions array in editing job
- Status updated to "ready_for_review"

### Re-Processing
- Edit request triggers workflow re-run
- Uses video-specific prompt instead of master
- Creates new version in versions array
- Maintains edit history

## Navigation

- ✅ **Sidebar:** "Queue" link added
- ✅ **Command Palette:** ⌘K Q → Go to Queue

## What's Displayed

### Video Preview Card Shows:
1. ✅ Video preview player (full video playback)
2. ✅ Original recording info (link to source)
3. ✅ Editing prompt used (master or video-specific)
4. ✅ Processing status badge
5. ✅ Edit history/comments
6. ✅ Version selector (if multiple versions)
7. ✅ Download button
8. ✅ Request Edits button
9. ✅ Approve button

### Short-Form Clips Tab Shows:
- ✅ Grid of clip preview cards
- ✅ Video player for each clip
- ✅ Virality scores
- ✅ Source content idea
- ✅ Status badges

## Next Steps

1. **Run Migration:** Execute `migrations/create-video-editing-queue-system.sql` in Supabase

2. **Integrate Editing Service:** 
   - Choose editing service (see EDITING-SERVICE-RECOMMENDATION.md)
   - Add API credentials
   - Implement editing API client
   - Add webhook handler for completed edits
   - Update workflow to call editing service

3. **Test Flow:**
   - Upload a recording
   - Verify editing job is created
   - Simulate editing completion (update versions manually for testing)
   - Test edit request flow
   - Test approval flow

## Files Created

1. `migrations/create-video-editing-queue-system.sql` - Database schema
2. `src/app/(dashboard)/queue/page.tsx` - Main queue page
3. `src/app/(dashboard)/queue/queue-client.tsx` - Queue UI with tabs
4. `src/app/(dashboard)/queue/video-preview-card.tsx` - Video preview component
5. `src/app/(dashboard)/queue/clip-preview-card.tsx` - Clip preview component
6. `src/app/(dashboard)/queue/edit-request-dialog.tsx` - Edit request dialog
7. `src/app/api/queue/request-edit/route.ts` - Edit request API
8. `src/app/api/queue/approve/route.ts` - Approval API
9. `src/components/shared/video-player.tsx` - Reusable video player

## Files Updated

1. `src/app/api/recordings/upload/route.ts` - Creates editing jobs on upload
2. `src/components/layout/sidebar.tsx` - Added Queue navigation
3. `src/components/layout/command-palette.tsx` - Added Queue command

---

**Status:** ✅ Complete and ready for editing service integration!








