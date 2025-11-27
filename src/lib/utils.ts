import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
  if (num >= 1000) return (num / 1000).toFixed(1) + "K"
  return num.toString()
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    idea: "bg-zinc-500/20 text-zinc-400",
    selected: "bg-blue-500/20 text-blue-400",
    guest_outreach: "bg-yellow-500/20 text-yellow-400",
    scheduled: "bg-purple-500/20 text-purple-400",
    recording: "bg-red-500/20 text-red-400",
    processing: "bg-orange-500/20 text-orange-400",
    ready_to_publish: "bg-teal-500/20 text-teal-400",
    published: "bg-green-500/20 text-green-400",
    archived: "bg-zinc-500/20 text-zinc-400",
  }
  return colors[status] || colors.idea
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    idea: "Idea",
    selected: "Selected",
    guest_outreach: "Guest Outreach",
    scheduled: "Scheduled",
    recording: "Recording",
    processing: "Processing",
    ready_to_publish: "Ready",
    published: "Published",
    archived: "Archived",
  }
  return labels[status] || status
}
