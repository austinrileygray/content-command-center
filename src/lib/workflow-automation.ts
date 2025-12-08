/**
 * Workflow Automation Utilities
 * Handles automatic status transitions based on content idea state
 */

import { ContentIdea } from "@/types/database"

export type ContentStatus = ContentIdea["status"]

const STATUS_FLOW: ContentStatus[] = [
  "idea",
  "selected",
  "guest_outreach",
  "scheduled",
  "recording",
  "processing",
  "ready_to_publish",
  "published",
  "archived",
]

/**
 * Get the next status in the workflow
 */
export function getNextStatus(currentStatus: ContentStatus): ContentStatus | null {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus)
  return currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null
}

/**
 * Get the previous status in the workflow
 */
export function getPreviousStatus(currentStatus: ContentStatus): ContentStatus | null {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus)
  return currentIndex > 0 ? STATUS_FLOW[currentIndex - 1] : null
}

/**
 * Determine if an idea should automatically transition to the next status
 * based on its current state
 */
export function shouldAutoTransition(idea: ContentIdea): {
  shouldTransition: boolean
  nextStatus: ContentStatus | null
  reason: string | null
} {
  // Rule 1: If recording URL is added and status is "recording", move to "processing"
  if (idea.status === "recording" && idea.recording_url && !idea.submagic_project_id) {
    return {
      shouldTransition: true,
      nextStatus: "processing",
      reason: "Recording URL added, ready for processing",
    }
  }

  // Rule 2: If scheduled date/time is set and status is "guest_outreach", move to "scheduled"
  if (
    idea.status === "guest_outreach" &&
    idea.scheduled_date &&
    idea.guest_id
  ) {
    return {
      shouldTransition: true,
      nextStatus: "scheduled",
      reason: "Guest confirmed and scheduled",
    }
  }

  // Rule 3: If guest is confirmed and status is "selected", move to "guest_outreach"
  if (idea.status === "selected" && idea.guest_id) {
    // Check if guest status is confirmed (would need guest data, simplified here)
    return {
      shouldTransition: false, // Manual transition for now
      nextStatus: "guest_outreach",
      reason: null,
    }
  }

  // Rule 4: If assets are approved and status is "ready_to_publish", can move to "published"
  // This would require checking assets, so we'll handle it separately

  return {
    shouldTransition: false,
    nextStatus: null,
    reason: null,
  }
}

/**
 * Check if an idea can transition to a specific status
 */
export function canTransitionTo(
  currentStatus: ContentStatus,
  targetStatus: ContentStatus
): boolean {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus)
  const targetIndex = STATUS_FLOW.indexOf(targetStatus)

  // Can transition forward or backward, but not skip more than 2 steps
  const distance = Math.abs(targetIndex - currentIndex)
  return distance <= 2 || targetStatus === "archived" // Archived can be reached from anywhere
}

/**
 * Get all valid next statuses for an idea
 */
export function getValidNextStatuses(
  currentStatus: ContentStatus,
  idea?: Partial<ContentIdea>
): ContentStatus[] {
  const validStatuses: ContentStatus[] = []
  const currentIndex = STATUS_FLOW.indexOf(currentStatus)

  // Can always go to next status
  if (currentIndex < STATUS_FLOW.length - 1) {
    validStatuses.push(STATUS_FLOW[currentIndex + 1])
  }

  // Can go back one step
  if (currentIndex > 0) {
    validStatuses.push(STATUS_FLOW[currentIndex - 1])
  }

  // Can always archive
  if (currentStatus !== "archived") {
    validStatuses.push("archived")
  }

  // Special cases based on idea state
  if (idea) {
    // If has recording URL, can jump to processing
    if (idea.recording_url && currentIndex < STATUS_FLOW.indexOf("processing")) {
      if (!validStatuses.includes("processing")) {
        validStatuses.push("processing")
      }
    }

    // If has assets ready, can jump to ready_to_publish
    // (Would need to check assets separately)
  }

  return [...new Set(validStatuses)] // Remove duplicates
}

/**
 * Get workflow stage information
 */
export function getWorkflowStage(status: ContentStatus): {
  stage: string
  progress: number
  isComplete: boolean
} {
  const index = STATUS_FLOW.indexOf(status)
  const total = STATUS_FLOW.length - 1 // Exclude archived
  const progress = status === "archived" ? 100 : Math.round((index / total) * 100)

  const stages: Record<ContentStatus, string> = {
    idea: "Planning",
    selected: "Selected",
    guest_outreach: "Outreach",
    scheduled: "Scheduled",
    recording: "Recording",
    processing: "Processing",
    ready_to_publish: "Ready",
    published: "Published",
    archived: "Archived",
  }

  return {
    stage: stages[status] || status,
    progress,
    isComplete: status === "published" || status === "archived",
  }
}



