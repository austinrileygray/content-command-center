"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Video, Edit, CheckCircle, Download, FileText, Clock, MessageSquare, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { VideoPlayer } from "@/components/shared/video-player"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface EditingJob {
  id: string
  status: string
  versions: Array<{
    version: number
    file_url: string
    thumbnail_url?: string
    created_at: string
  }>
  selected_version?: number
  edit_history: Array<{
    timestamp: string
    notes: string
    status: string
  }>
  processing_completed_at?: string
  reviewed_at?: string
  recording?: {
    id: string
    platform: string
    external_url?: string
    content_idea?: {
      id: string
      title: string
      format: string
    }
  }
  master_prompt?: {
    id: string
    name: string
    category: string
  }
  video_specific_prompt?: {
    id: string
    name: string
    edit_notes?: string
    version_number: number
  }
  content_idea?: {
    id: string
    title: string
    format: string
  }
}

interface VideoPreviewCardProps {
  job: EditingJob
  onRequestEdit: () => void
}

function ApproveButtonComponent({ jobId, version }: { jobId: string; version?: number }) {
  const router = useRouter()
  const [approving, setApproving] = useState(false)

  const handleApprove = async () => {
    setApproving(true)
    try {
      const response = await fetch("/api/queue/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editingJobId: jobId, version }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve video")
      }

      toast.success("Video approved and added to assets!")
      router.refresh()
    } catch (error: any) {
      console.error("Approve error:", error)
      toast.error(error.message || "Failed to approve video")
    } finally {
      setApproving(false)
    }
  }

  return (
    <Button size="sm" onClick={handleApprove} disabled={approving}>
      {approving ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Approving...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </>
      )}
    </Button>
  )
}

export function VideoPreviewCard({ job, onRequestEdit }: VideoPreviewCardProps) {
  const versions = job.versions || []
  const currentVersion = versions.length > 0 
    ? (job.selected_version 
        ? versions.find(v => v.version === job.selected_version)
        : versions[versions.length - 1]) // Latest version
    : null

  const title = job.content_idea?.title || job.recording?.content_idea?.title || "Untitled"
  const format = job.content_idea?.format || job.recording?.content_idea?.format || "unknown"

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      processing: { label: "Processing", variant: "secondary" },
      ready_for_review: { label: "Ready for Review", variant: "default" },
      needs_edits: { label: "Needs Edits", variant: "destructive" },
      approved: { label: "Approved", variant: "outline" },
    }

    const config = statusConfig[status] || statusConfig.processing
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              {getStatusBadge(job.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="capitalize">{format.replace("_", " ")}</span>
              {job.processing_completed_at && (
                <span>Completed {formatDistanceToNow(new Date(job.processing_completed_at), { addSuffix: true })}</span>
              )}
              {versions.length > 0 && (
                <span>{versions.length} version{versions.length > 1 ? "s" : ""}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {currentVersion && (
              <Button variant="outline" size="sm" asChild>
                <a href={currentVersion.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onRequestEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Request Edits
            </Button>
            {job.status === "ready_for_review" && (
              <ApproveButtonComponent jobId={job.id} version={currentVersion?.version} />
            )}
          </div>
        </div>

        {/* Video Preview */}
        {currentVersion?.file_url ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <VideoPlayer 
              src={currentVersion.file_url}
              thumbnail={currentVersion.thumbnail_url}
              autoPlay={false}
              controls
            />
          </div>
        ) : (
          <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
            <Video className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Version Selector */}
        {versions.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {versions.map((version) => (
              <Button
                key={version.version}
                variant={job.selected_version === version.version ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  // TODO: Update selected version
                  console.log("Select version", version.version)
                }}
              >
                Version {version.version}
              </Button>
            ))}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Editing Prompt</div>
            <div className="font-medium">
              {job.video_specific_prompt?.name || job.master_prompt?.name || "No prompt"}
            </div>
            {job.video_specific_prompt && (
              <div className="text-xs text-muted-foreground mt-1">
                Video-specific (v{job.video_specific_prompt.version_number})
              </div>
            )}
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Original Recording</div>
            {job.recording?.external_url ? (
              <a 
                href={job.recording.external_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                View Original
              </a>
            ) : (
              <div className="text-muted-foreground">N/A</div>
            )}
          </div>
        </div>

        {/* Edit History */}
        {job.edit_history && job.edit_history.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Edit History</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {job.edit_history.slice(-3).map((edit, idx) => (
                <div key={idx} className="text-xs text-muted-foreground border-l-2 pl-2">
                  <div className="font-medium">{new Date(edit.timestamp).toLocaleString()}</div>
                  <div className="mt-1">{edit.notes}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}









