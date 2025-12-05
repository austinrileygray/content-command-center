"use client"

import Link from "next/link"
import { ContentIdea } from "@/types/database"
import { formatDuration } from "@/lib/utils"
import { Clock, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface YouTubeVideoCardProps {
  idea: ContentIdea
  thumbnailUrl?: string
  onEdit?: (idea: ContentIdea) => void
  onDelete?: (ideaId: string) => void
}

/**
 * Get thumbnail URL for an idea
 * Uses provided thumbnailUrl, or generates placeholder
 */
function getThumbnailUrl(idea: ContentIdea, providedUrl?: string): string {
  // Use provided thumbnail URL if available
  if (providedUrl) {
    return providedUrl
  }

  // Fallback: Generate placeholder based on title
  const title = encodeURIComponent(idea.title.substring(0, 50))
  return `https://via.placeholder.com/320x180/1a1a1a/ffffff?text=${title}`
}

export function YouTubeVideoCard({ idea, thumbnailUrl: providedThumbnail, onEdit, onDelete }: YouTubeVideoCardProps) {
  const router = useRouter()
  const thumbnailUrl = getThumbnailUrl(idea, providedThumbnail)
  const description = idea.description || idea.hook || ""

  return (
    <div className="group">
      <Link href={`/ideas/${idea.id}`} className="block">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted mb-3">
          <img
            src={thumbnailUrl}
            alt={idea.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {idea.estimated_length && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(idea.estimated_length)}
            </div>
          )}
          {idea.status === "published" && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Published
            </div>
          )}

          {/* Actions Menu - Overlay on Hover */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 bg-black/70 hover:bg-black/90 rounded backdrop-blur-sm"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="w-4 h-4 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault()
                  onEdit?.(idea)
                }}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault()
                  router.push(`/ideas/${idea.id}`)
                }}>
                  View Details
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      onDelete(idea.id)
                    }}
                    className="text-red-500"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Video Info - Below Thumbnail */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {idea.confidence_score && (
              <span>{idea.confidence_score}% match</span>
            )}
            {idea.created_at && (
              <span>• {new Date(idea.created_at).toLocaleDateString()}</span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}



