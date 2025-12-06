"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface EditingJob {
  id: string
  recording_id: string
  content_idea_id: string
  master_prompt?: {
    id: string
    name: string
    category: string
  }
  video_specific_prompt?: {
    id: string
    name: string
    prompt_text: string
    edit_notes?: string
  }
}

interface EditRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: EditingJob
}

export function EditRequestDialog({ open, onOpenChange, job }: EditRequestDialogProps) {
  const router = useRouter()
  const [editNotes, setEditNotes] = useState("")
  const [updateMasterPrompt, setUpdateMasterPrompt] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!editNotes.trim()) {
      toast.error("Please provide edit notes/instructions")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/queue/request-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editingJobId: job.id,
          recordingId: job.recording_id,
          contentIdeaId: job.content_idea_id,
          editNotes: editNotes.trim(),
          updateMasterPrompt: updateMasterPrompt,
          videoSpecificPromptId: job.video_specific_prompt?.id,
          masterPromptId: job.master_prompt?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit edit request")
      }

      toast.success("Edit request submitted! Video will be re-processed with updated prompt.")
      setEditNotes("")
      setUpdateMasterPrompt(false)
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      console.error("Error submitting edit request:", error)
      toast.error(error.message || "Failed to submit edit request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Edits</DialogTitle>
          <DialogDescription>
            Add edit notes and instructions. These will update the video-specific prompt for this video.
            {job.video_specific_prompt ? (
              <span className="block mt-2 text-xs text-muted-foreground">
                Current prompt: {job.video_specific_prompt.name}
              </span>
            ) : (
              <span className="block mt-2 text-xs text-muted-foreground">
                A new video-specific prompt will be created based on: {job.master_prompt?.name || "master prompt"}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Prompt Display */}
          {job.video_specific_prompt && (
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium mb-2 block">Current Video-Specific Prompt:</Label>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                {job.video_specific_prompt.prompt_text}
              </div>
              {job.video_specific_prompt.edit_notes && (
                <div className="mt-3 pt-3 border-t">
                  <Label className="text-xs font-medium mb-1 block">Previous Edit Notes:</Label>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {job.video_specific_prompt.edit_notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">
              Edit Notes & Instructions *
            </Label>
            <Textarea
              id="edit-notes"
              placeholder="Describe what changes you want. For example: 'Remove all silence over 2 seconds', 'Increase pacing by 10%', 'Add more transitions', 'Lower background music volume', etc. These notes will be incorporated into the editing prompt."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what you want changed. The AI will incorporate these instructions into the editing prompt.
            </p>
          </div>

          {/* Update Master Prompt Option */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg bg-amber-500/5 border-amber-500/20">
            <Checkbox
              id="update-master"
              checked={updateMasterPrompt}
              onCheckedChange={(checked) => setUpdateMasterPrompt(checked === true)}
            />
            <div className="flex-1">
              <Label
                htmlFor="update-master"
                className="text-sm font-medium cursor-pointer"
              >
                Also update the master prompt
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Check this if you want these changes applied to ALL future videos, not just this one.
                The master prompt will be updated with these instructions.
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
            <div className="text-xs text-foreground">
              <strong>Note:</strong> Requesting edits will re-process the video using the updated prompt.
              The editing process may take 10-30 minutes depending on video length.
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!editNotes.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Edit Request"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}








