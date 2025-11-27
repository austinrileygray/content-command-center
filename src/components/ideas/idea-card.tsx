"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContentIdea } from "@/types/database"
import { getStatusColor, getStatusLabel, formatDuration } from "@/lib/utils"
import { Clock, Users, Video, Radio, Scissors } from "lucide-react"

interface IdeaCardProps {
  idea: ContentIdea
}

const formatIcons = {
  solo_youtube: Video,
  guest_interview: Users,
  live_stream: Radio,
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const FormatIcon = formatIcons[idea.format] || Video

  return (
    <Link href={`/ideas/${idea.id}`}>
      <Card className="p-4 bg-card border-border hover:border-brand/50 transition-colors cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge className={getStatusColor(idea.status)}>
            {getStatusLabel(idea.status)}
          </Badge>
          <div className="flex items-center gap-2">
            {idea.submagic_project_id && (
              <span title="Clips generating">
                <Scissors className="w-3 h-3 text-brand" />
              </span>
            )}
            {idea.confidence_score && (
              <span className="text-xs text-muted-foreground">
                {idea.confidence_score}% match
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {idea.title}
        </h3>

        {/* Hook */}
        {idea.hook && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {idea.hook}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FormatIcon className="w-3 h-3" />
            <span className="capitalize">{idea.format.replace("_", " ")}</span>
          </div>
          {idea.estimated_length && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(idea.estimated_length)}</span>
            </div>
          )}
        </div>

        {/* Guest indicator */}
        {idea.guest && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Guest: <span className="text-foreground">{idea.guest.name}</span>
            </p>
          </div>
        )}
      </Card>
    </Link>
  )
}
