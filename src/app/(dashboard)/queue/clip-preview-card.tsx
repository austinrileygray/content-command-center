"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Video, Download, TrendingUp, CheckCircle } from "lucide-react"
import { VideoPlayer } from "@/components/shared/video-player"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

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

interface ClipPreviewCardProps {
  clip: Clip
}

export function ClipPreviewCard({ clip }: ClipPreviewCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="overflow-hidden">
      {/* Thumbnail/Preview */}
      {clip.file_url ? (
        <div className="aspect-video bg-muted">
          <VideoPlayer 
            src={clip.file_url}
            thumbnail={clip.thumbnail_url}
            autoPlay={false}
            controls
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <Video className="w-12 h-12 text-muted-foreground" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h4 className="font-semibold line-clamp-2">
            {clip.title || "Untitled Clip"}
          </h4>
          {clip.content_idea && (
            <Link 
              href={`/ideas/${clip.content_idea.id}`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              From: {clip.content_idea.title}
            </Link>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            {clip.duration && (
              <span>{formatDuration(clip.duration)}</span>
            )}
            <span>{formatDistanceToNow(new Date(clip.created_at), { addSuffix: true })}</span>
          </div>
          {clip.virality_score && (
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              {clip.virality_score}
            </Badge>
          )}
        </div>

        {/* Status & Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Badge 
            variant={clip.status === "approved" ? "default" : "secondary"}
            className="gap-1"
          >
            {clip.status === "approved" && <CheckCircle className="w-3 h-3" />}
            {clip.status.charAt(0).toUpperCase() + clip.status.slice(1)}
          </Badge>
          {clip.file_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={clip.file_url} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}








