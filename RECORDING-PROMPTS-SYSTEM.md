# 🎬 Recording Editing Prompts System

## Overview

The system now supports two types of long-form content uploads with linked editing prompts:

1. **Podcast Episodes** - Uses podcast editing prompts
2. **Solo YouTube Videos** - Uses solo YouTube editing prompts

## Database Schema

### `recording_editing_prompts` Table

```sql
CREATE TABLE recording_editing_prompts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  category TEXT CHECK (category IN ('podcast', 'solo_youtube')),
  name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Updated `recordings` Table

Added `editing_prompt_id` column to link recordings to prompts.

## Pages Created

### 1. `/prompts` - Recording Editing Prompts Page
- Manage podcast editing prompts
- Manage solo YouTube editing prompts
- Version control (updates create new versions)
- Edit/update prompts

### 2. Enhanced `/recordings` Page
- Two upload sections:
  - **Podcast Episode Upload**
    - Select podcast editing prompt (required)
    - Upload audio/video file
    - Link to content idea (optional)
    - Auto-process workflow toggle
  - **Solo YouTube Video Upload**
    - Select solo YouTube editing prompt (required)
    - Upload video file
    - Link to content idea (optional)
    - Auto-process workflow toggle

## Features

### Prompt Management
- ✅ Create prompts for podcast and solo YouTube
- ✅ Edit/update prompts (creates new version)
- ✅ View active prompt version
- ✅ Link prompts to recordings

### Upload Flow
1. User selects content type (Podcast or Solo YouTube)
2. User must select an editing prompt
3. User uploads file
4. Optional: Link to existing content idea
5. Enable auto-process to start workflow
6. Recording is linked to the selected prompt

### Workflow Integration
- Recordings store `editing_prompt_id`
- Workflow can access prompt via recording
- Prompt guides automated editing process

## Navigation

- **Sidebar**: "Prompts" link → `/prompts`
- **Command Palette**: ⌘K M → Go to Prompts
- **Recordings Page**: "Manage Prompts" buttons link to `/prompts`

## Next Steps

The prompts are now stored and linked. The actual editing workflow that uses these prompts will be built next when implementing the editing automation.

---

**Status**: ✅ Database schema created, pages built, upload flow complete!









