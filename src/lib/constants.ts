export const CONTENT_FORMATS = [
  { value: "solo_youtube", label: "Solo YouTube", icon: "Video", platform: "loom" },
  { value: "guest_interview", label: "Guest Interview", icon: "Users", platform: "squadcast" },
  { value: "live_stream", label: "Live Stream", icon: "Radio", platform: "restream" },
] as const

export const CONTENT_STATUSES = [
  { value: "idea", label: "Idea", color: "zinc" },
  { value: "selected", label: "Selected", color: "blue" },
  { value: "guest_outreach", label: "Guest Outreach", color: "yellow" },
  { value: "scheduled", label: "Scheduled", color: "purple" },
  { value: "recording", label: "Recording", color: "red" },
  { value: "processing", label: "Processing", color: "orange" },
  { value: "ready_to_publish", label: "Ready to Publish", color: "teal" },
  { value: "published", label: "Published", color: "green" },
  { value: "archived", label: "Archived", color: "zinc" },
] as const

export const RECORDING_PLATFORMS = {
  loom: {
    name: "Loom",
    description: "Solo educational content",
    url: "https://www.loom.com/record",
  },
  squadcast: {
    name: "SquadCast",
    description: "Guest interviews",
    url: "https://app.squadcast.fm",
  },
  restream: {
    name: "Restream",
    description: "Live streaming",
    url: "https://app.restream.io/studio",
  },
} as const

// Submagic caption templates (popular ones)
export const SUBMAGIC_TEMPLATES = [
  { value: "Hormozi 1", label: "Hormozi Style 1", description: "Bold, high-contrast captions" },
  { value: "Hormozi 2", label: "Hormozi Style 2", description: "Clean professional look" },
  { value: "Beast", label: "MrBeast Style", description: "Energetic, colorful captions" },
  { value: "Ali", label: "Ali Abdaal Style", description: "Minimal, educational look" },
  { value: "Sara", label: "Sara (Default)", description: "Balanced, versatile style" },
] as const
