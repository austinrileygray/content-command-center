# Thumbnail Prompt System

## Overview

This system manages AI prompts for thumbnail generation with:
- **Modular sections** that update independently
- **Monthly updates** combining analytics + notes
- **Review/approve workflow** for all changes
- **Version history** with revert capability
- **Separate prompts** for YouTube and Short Form

## Database Schema

### `thumbnail_prompt_templates`
Stores the current active prompt template with modular sections.

**Structure:**
```json
{
  "sections": {
    "color_palette": {
      "content": "Use vibrant oranges (#f15e13) and high contrast...",
      "last_updated": "2024-01-15T10:00:00Z",
      "updated_by": "analytics"
    },
    "text_style": {
      "content": "Bold, sans-serif fonts. Maximum 5 words...",
      "last_updated": "2024-01-10T14:30:00Z",
      "updated_by": "notes"
    },
    "layout": {
      "content": "Subject on left, text on right. Rule of thirds...",
      "last_updated": "2024-01-01T09:00:00Z",
      "updated_by": "initial"
    }
  }
}
```

### `thumbnail_prompt_versions`
Full version history for reverting.

### `thumbnail_prompt_recommendations`
Pending recommendations awaiting approval.

### `thumbnail_notes_analysis`
Weekly notes analysis before monthly combination.

## Workflow

### 1. Initial Setup
- User provides base "mega prompt"
- System breaks it into modular sections
- Saves as version 1

### 2. Weekly Notes Analysis
- Every week: Analyze all new notes from thumbnail uploads
- Extract patterns and suggest updates
- Store in `thumbnail_notes_analysis`

### 3. Monthly Combined Analysis
- End of month: Combine analytics + notes
- Generate recommendations
- User reviews and approves/rejects

### 4. Prompt Updates
- Approved changes update active template
- New version saved to history
- Old version preserved for revert

## Metrics Tracked

- **Click-through rate (CTR)**
- **Views**
- **Engagement rate**
- **Watch time**

## API Endpoints

- `POST /api/thumbnails/prompts/initialize` - Set initial prompt
- `GET /api/thumbnails/prompts/current` - Get current prompt
- `POST /api/thumbnails/prompts/analyze-notes` - Weekly notes analysis
- `POST /api/thumbnails/prompts/analyze-monthly` - Monthly combined analysis
- `GET /api/thumbnails/prompts/recommendations` - Get pending recommendations
- `POST /api/thumbnails/prompts/approve` - Approve recommendations
- `GET /api/thumbnails/prompts/versions` - Get version history
- `POST /api/thumbnails/prompts/revert` - Revert to previous version



