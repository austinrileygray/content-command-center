"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Video, Clock, CheckCircle, AlertCircle, Edit, Play, MessageSquare, Download } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { EditRequestDialog } from "./edit-request-dialog"
import { VideoPreviewCard } from "./video-preview-card"
import { ClipPreviewCard } from "./clip-preview-card"

interface EditingJob {
  id: string
  recording_id: string
  content_idea_id: string
  status: "processing" | "ready_for_review" | "needs_edits" | "approved"
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
  processing_started_at?: string
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
    version_number: number
  }
  video_specific_prompt?: {
    id: string
    name: string
    prompt_text: string
    edit_notes?: string
    version_number: number
  }
  content_idea?: {
    id: string
    title: string
    format: string
    recording_url?: string
  }
}

interface Clip {
  id: string
  content_idea_id: string
  title: string | null
  file_url: string | null
  thumbnail_url: string | null
  duration: number | null
  virality_score: number | null
  status: string
  created_at: string
  content_idea?: {
    id: string
    title: string
    format: string
  }
}

interface QueueClientProps {
  editingJobs: EditingJob[]
  clips: Clip[]
}

export function QueueClient({ editingJobs, clips }: QueueClientProps) {
  const [selectedJob, setSelectedJob] = useState<EditingJob | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processing: { label: "Processing", variant: "secondary" as const, icon: Clock },
      ready_for_review: { label: "Ready for Review", variant: "default" as const, icon: Play },
      needs_edits: { label: "Needs Edits", variant: "destructive" as const, icon: AlertCircle },
      approved: { label: "Approved", variant: "default" as const, icon: CheckCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const processingJobs = (editingJobs || []).filter(job => job.status === "processing")
  const reviewJobs = (editingJobs || []).filter(job => job.status === "ready_for_review")
  const needsEditsJobs = (editingJobs || []).filter(job => job.status === "needs_edits")
  const approvedJobs = (editingJobs || []).filter(job => job.status === "approved")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="review" className="space-y-4">
        <TabsList>
          <TabsTrigger value="review">
            Ready for Review ({reviewJobs.length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing ({processingJobs.length})
          </TabsTrigger>
          <TabsTrigger value="needs-edits">
            Needs Edits ({needsEditsJobs.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="clips">
            Short-Form Clips ({clips.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          {reviewJobs.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No videos ready for review"
              description="Videos that have finished processing will appear here."
            />
          ) : (
            <div className="grid gap-4">
              {reviewJobs.map(job => (
                <VideoPreviewCard
                  key={job.id}
                  job={job}
                  onRequestEdit={() => {
                    setSelectedJob(job)
                    setEditDialogOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {processingJobs.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No videos processing"
              description="Videos currently being edited will appear here."
            />
          ) : (
            <div className="grid gap-4">
              {processingJobs.map(job => (
                <Card key={job.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center">
                        <Clock className="w-8 h-8 text-muted-foreground animate-spin" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {job.content_idea?.title || job.recording?.content_idea?.title || "Untitled"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Started: {job.processing_started_at ? new Date(job.processing_started_at).toLocaleString() : "N/A"}
                        </p>
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="needs-edits" className="space-y-4">
          {needsEditsJobs.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No videos need edits"
              description="Videos that need revisions will appear here."
            />
          ) : (
            <div className="grid gap-4">
              {needsEditsJobs.map(job => (
                <VideoPreviewCard
                  key={job.id}
                  job={job}
                  onRequestEdit={() => {
                    setSelectedJob(job)
                    setEditDialogOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedJobs.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No approved videos"
              description="Videos you've approved will appear here."
            />
          ) : (
            <div className="grid gap-4">
              {approvedJobs.map(job => (
                <VideoPreviewCard
                  key={job.id}
                  job={job}
                  onRequestEdit={() => {
                    setSelectedJob(job)
                    setEditDialogOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clips" className="space-y-4">
          {clips.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No clips ready"
              description="Short-form clips generated from your episodes will appear here."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clips.map(clip => (
                <ClipPreviewCard key={clip.id} clip={clip} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedJob && (
        <EditRequestDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          job={selectedJob}
        />
      )}
    </div>
  )
}








