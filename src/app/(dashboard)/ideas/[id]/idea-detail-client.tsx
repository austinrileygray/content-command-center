"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getStatusColor, getStatusLabel, formatDuration } from "@/lib/utils"
import { shouldAutoTransition, getWorkflowStage } from "@/lib/workflow-automation"
import { ContentIdea } from "@/types/database"
import { IdeaForm } from "@/components/ideas/idea-form"
import { BlogGenerator } from "@/components/content/blog-generator"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Edit, Trash2, ArrowRight, Calendar, Clock, Video, Users, Radio, Scissors, Sparkles, ExternalLink, TrendingUp, Play, Image } from "lucide-react"
import { CONTENT_STATUSES, SUBMAGIC_TEMPLATES } from "@/lib/constants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface IdeaDetailClientProps {
  idea: ContentIdea
}

const formatIcons = {
  solo_youtube: Video,
  guest_interview: Users,
  live_stream: Radio,
}

const statusColors: Record<string, string> = {
  generating: "bg-yellow-500/20 text-yellow-400",
  ready: "bg-teal-500/20 text-teal-400",
  approved: "bg-blue-500/20 text-blue-400",
  published: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
}

export function IdeaDetailClient({ idea: initialIdea }: IdeaDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [idea, setIdea] = useState(initialIdea)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showGenerateClips, setShowGenerateClips] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("Hormozi 2")
  const [generatingClips, setGeneratingClips] = useState(false)
  const [loading, setLoading] = useState(false)
  const [assets, setAssets] = useState<any[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)

  const FormatIcon = formatIcons[idea.format] || Video
  const workflowStage = getWorkflowStage(idea.status)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("content_ideas")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === "selected" && !idea.selected_at
            ? { selected_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", idea.id)

      if (error) throw error

      setIdea({ ...idea, status: newStatus as any })
      toast.success("Status updated")
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to update status")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const deleteIdea = async () => {
    if (!confirm("Are you sure you want to delete this idea?")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("content_ideas").delete().eq("id", idea.id)

      if (error) throw error

      toast.success("Idea deleted")
      router.push("/ideas")
    } catch (error: any) {
      toast.error("Failed to delete idea")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getNextStatus = () => {
    const statusFlow = [
      "idea",
      "selected",
      "guest_outreach",
      "scheduled",
      "recording",
      "processing",
      "ready_to_publish",
      "published",
    ]
    const currentIndex = statusFlow.indexOf(idea.status)
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null
  }

  const nextStatus = getNextStatus()

  const generateClips = async () => {
    if (!idea.recording_url) {
      toast.error("No recording URL found. Please add a recording first.")
      return
    }

    setGeneratingClips(true)
    try {
      const response = await fetch("/api/submagic/magic-clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentIdeaId: idea.id,
          templateName: selectedTemplate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate clips")
      }

      toast.success(data.message || "Clips generation started! You'll be notified when ready.")
      setShowGenerateClips(false)
      
      // Update idea state
      setIdea({
        ...idea,
        submagic_project_id: data.projectId,
        submagic_template: selectedTemplate,
        status: "processing" as any,
      })
      
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to generate clips")
      console.error(error)
    } finally {
      setGeneratingClips(false)
    }
  }

  const checkClipStatus = async () => {
    if (!idea.submagic_project_id) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/submagic/magic-clips?projectId=${idea.submagic_project_id}`
      )
      const data = await response.json()

      if (data.status === "completed" && data.clips) {
        toast.success(`${data.clips.length} clips are ready!`)
        loadAssets() // Refresh assets
      } else if (data.status === "processing") {
        toast.info("Clips are still being generated...")
      } else if (data.status === "failed") {
        toast.error("Clip generation failed. Please try again.")
      }
    } catch (error: any) {
      toast.error("Failed to check clip status")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssets = async () => {
    setLoadingAssets(true)
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("content_idea_id", idea.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAssets(data || [])
    } catch (error: any) {
      console.error("Failed to load assets:", error)
    } finally {
      setLoadingAssets(false)
    }
  }

  // Load assets on mount
  useEffect(() => {
    loadAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea.id])

  // Auto-transition check when idea state changes
  useEffect(() => {
    const autoTransition = shouldAutoTransition(idea)
    if (autoTransition.shouldTransition && autoTransition.nextStatus) {
      // Only auto-transition if user hasn't manually set status recently
      // This prevents infinite loops
      const shouldAuto = confirm(
        `Auto-transition to "${getStatusLabel(autoTransition.nextStatus)}"?\n\nReason: ${autoTransition.reason}`
      )
      if (shouldAuto) {
        updateStatus(autoTransition.nextStatus)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea.recording_url, idea.scheduled_date, idea.guest_id])

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{idea.title}</h1>
              <Badge className={getStatusColor(idea.status)}>
                {getStatusLabel(idea.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">Content idea details</p>
            {/* Workflow Progress */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Workflow: {workflowStage.stage}</span>
                <span>{workflowStage.progress}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-500"
                  style={{ width: `${workflowStage.progress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditForm(true)}
              disabled={loading}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={loading}>
                  Change Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {CONTENT_STATUSES.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => updateStatus(status.value)}
                    disabled={idea.status === status.value}
                  >
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {nextStatus && (
              <Button
                size="sm"
                className="bg-brand hover:bg-brand/90"
                onClick={() => updateStatus(nextStatus)}
                disabled={loading}
              >
                Move to {CONTENT_STATUSES.find((s) => s.value === nextStatus)?.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteIdea}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {idea.hook && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-lg font-semibold text-foreground mb-2">Hook</h2>
                <p className="text-foreground">{idea.hook}</p>
              </Card>
            )}

            {idea.description && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
                <p className="text-muted-foreground">{idea.description}</p>
              </Card>
            )}

            {idea.why_this_will_work && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-lg font-semibold text-foreground mb-2">Why This Will Work</h2>
                <p className="text-muted-foreground">{idea.why_this_will_work}</p>
              </Card>
            )}

            {idea.script && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-lg font-semibold text-foreground mb-2">Script</h2>
                <div className="space-y-4">
                  {typeof idea.script === "object" && "mainPoints" in idea.script && (
                    <>
                      {idea.script.hook && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Hook</p>
                          <p className="text-sm text-muted-foreground">{idea.script.hook}</p>
                        </div>
                      )}
                      {idea.script.intro && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Introduction</p>
                          <p className="text-sm text-muted-foreground">{idea.script.intro}</p>
                        </div>
                      )}
                      {Array.isArray(idea.script.mainPoints) && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Main Points</p>
                          <div className="space-y-3">
                            {idea.script.mainPoints.map((point: any, idx: number) => (
                              <div key={idx} className="pl-4 border-l-2 border-border">
                                <p className="text-sm font-medium text-foreground">{point.point}</p>
                                {point.talkingPoints && (
                                  <ul className="mt-1 space-y-1">
                                    {point.talkingPoints.map((tp: string, tIdx: number) => (
                                      <li key={tIdx} className="text-xs text-muted-foreground">
                                        • {tp}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            )}

            {idea.transcript && (
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Transcript</h2>
                  <div className="flex items-center gap-2">
                    <BlogGenerator
                      ideaId={idea.id}
                      transcript={idea.transcript}
                      title={idea.title}
                      type="blog"
                    />
                    <BlogGenerator
                      ideaId={idea.id}
                      transcript={idea.transcript}
                      title={idea.title}
                      type="newsletter"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.transcript}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>{idea.transcript.length} characters</span>
                    <span>{idea.transcript.split(/\s+/).length} words</span>
                    <span>~{Math.ceil(idea.transcript.split(/\s+/).length / 200)} min read</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-card border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Format</p>
                  <div className="flex items-center gap-2">
                    <FormatIcon className="w-4 h-4 text-muted-foreground" />
                    <p className="text-foreground capitalize">{idea.format.replace("_", " ")}</p>
                  </div>
                </div>
                <Separator />
                {idea.estimated_length && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Length</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <p className="text-foreground">{formatDuration(idea.estimated_length)}</p>
                    </div>
                  </div>
                )}
                {idea.confidence_score && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Confidence Score</p>
                      <p className="text-foreground">{idea.confidence_score}%</p>
                    </div>
                  </>
                )}
                {idea.scheduled_date && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Scheduled</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="text-foreground">
                          {new Date(idea.scheduled_date).toLocaleDateString()}
                          {idea.scheduled_time && ` at ${idea.scheduled_time}`}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                {idea.recording_url && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Recording</p>
                      <a
                        href={idea.recording_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand hover:underline"
                      >
                        View Recording
                      </a>
                    </div>
                  </>
                )}
                {idea.submagic_project_id && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Submagic Project</p>
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-brand" />
                        <p className="text-sm text-foreground">
                          {idea.submagic_template || "Processing..."}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={checkClipStatus}
                        disabled={loading}
                      >
                        Check Status
                      </Button>
                    </div>
                  </>
                )}
                {idea.recording_url && !idea.submagic_project_id && idea.status === "recording" && (
                  <>
                    <Separator />
                    <Dialog open={showGenerateClips} onOpenChange={setShowGenerateClips}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full bg-brand hover:bg-brand/90"
                          disabled={loading}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Magic Clips
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Generate Magic Clips</DialogTitle>
                          <DialogDescription>
                            Create multiple viral clips from your recording using Submagic AI.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="template">Caption Template</Label>
                            <Select
                              value={selectedTemplate}
                              onValueChange={setSelectedTemplate}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SUBMAGIC_TEMPLATES.map((template) => (
                                  <SelectItem key={template.value} value={template.value}>
                                    <div>
                                      <div className="font-medium">{template.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {template.description}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Submagic will generate 20+ clips automatically. You'll be notified when ready.
                            </p>
                          </div>
                          <Button
                            onClick={generateClips}
                            disabled={generatingClips}
                            className="w-full bg-brand hover:bg-brand/90"
                          >
                            {generatingClips ? (
                              <>
                                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Scissors className="w-4 h-4 mr-2" />
                                Start Generation
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </Card>

            {idea.guest && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">Guest</h2>
                <p className="text-foreground">{idea.guest.name}</p>
                {idea.guest.company && (
                  <p className="text-sm text-muted-foreground">{idea.guest.company}</p>
                )}
                {idea.guest.title && (
                  <p className="text-sm text-muted-foreground">{idea.guest.title}</p>
                )}
              </Card>
            )}

            {idea.seo_keywords && idea.seo_keywords.length > 0 && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">SEO Keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {idea.seo_keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Thumbnail Generation */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-brand" />
                Thumbnail
              </h2>
              {idea.thumbnail_concept ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Main Text</p>
                    <p className="text-foreground font-medium">{idea.thumbnail_concept.mainText}</p>
                  </div>
                  {idea.thumbnail_concept.subText && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Sub Text</p>
                      <p className="text-sm text-foreground">{idea.thumbnail_concept.subText}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Visual Description</p>
                    <p className="text-xs text-foreground">{idea.thumbnail_concept.visualDescription}</p>
                  </div>
                  <Button
                    className="w-full bg-brand hover:bg-brand/90"
                    onClick={() => router.push(`/thumbnails?ideaId=${idea.id}&prompt=${encodeURIComponent(idea.thumbnail_concept?.visualDescription || idea.title)}`)}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Generate Thumbnail
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Create an eye-catching thumbnail for this content idea.
                  </p>
                  <Button
                    className="w-full bg-brand hover:bg-brand/90"
                    onClick={() => router.push(`/thumbnails?ideaId=${idea.id}&prompt=${encodeURIComponent(idea.title)}`)}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Create Thumbnail
                  </Button>
                </div>
              )}
            </Card>

            {/* Generated Assets */}
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Generated Assets</h2>
                <a
                  href={`/assets?idea=${idea.id}`}
                  className="text-sm text-brand hover:underline flex items-center gap-1"
                >
                  View All <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {loadingAssets ? (
                <div className="text-sm text-muted-foreground">Loading assets...</div>
              ) : assets.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No assets generated yet. Generate clips to see them here.
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.slice(0, 5).map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        {asset.thumbnail_url && (
                          <img
                            src={asset.thumbnail_url}
                            alt={asset.title || "Asset"}
                            className="w-12 h-8 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {asset.title || "Untitled"}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Badge className={statusColors[asset.status] || statusColors.generating}>
                              {asset.status}
                            </Badge>
                            {asset.duration && (
                              <span>
                                <Clock className="w-3 h-3 inline mr-1" />
                                {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                            {asset.virality_score !== null && (
                              <span>
                                <TrendingUp className="w-3 h-3 inline mr-1" />
                                {asset.virality_score}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {asset.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(asset.file_url, "_blank")}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <a
                          href={`/assets?idea=${idea.id}`}
                          className="text-xs text-brand hover:underline"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                  {assets.length > 5 && (
                    <div className="text-center pt-2">
                      <a
                        href={`/assets?idea=${idea.id}`}
                        className="text-sm text-brand hover:underline"
                      >
                        View all {assets.length} assets →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <IdeaForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        idea={idea}
      />
    </>
  )
}



