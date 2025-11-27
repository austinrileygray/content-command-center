"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getStatusColor, getStatusLabel, formatDuration } from "@/lib/utils"
import { ContentIdea } from "@/types/database"
import { IdeaForm } from "@/components/ideas/idea-form"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Edit, Trash2, ArrowRight, Calendar, Clock, Video, Users, Radio } from "lucide-react"
import { CONTENT_STATUSES } from "@/lib/constants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface IdeaDetailClientProps {
  idea: ContentIdea
}

const formatIcons = {
  solo_youtube: Video,
  guest_interview: Users,
  live_stream: Radio,
}

export function IdeaDetailClient({ idea: initialIdea }: IdeaDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [idea, setIdea] = useState(initialIdea)
  const [showEditForm, setShowEditForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const FormatIcon = formatIcons[idea.format] || Video

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
                <h2 className="text-lg font-semibold text-foreground mb-2">Transcript</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.transcript}</p>
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
