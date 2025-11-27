"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContentIdea } from "@/types/database"
import { getStatusColor, getStatusLabel } from "@/lib/utils"
import { ArrowRight, GripVertical } from "lucide-react"
import { IdeaCard } from "./idea-card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PipelineBoardEnhancedProps {
  ideas: ContentIdea[]
}

const statusOrder = [
  "idea",
  "selected",
  "scheduled",
  "recording",
  "processing",
  "ready_to_publish",
  "published",
]

export function PipelineBoardEnhanced({ ideas }: PipelineBoardEnhancedProps) {
  const router = useRouter()
  const supabase = createClient()
  const [draggedIdea, setDraggedIdea] = useState<ContentIdea | null>(null)

  const grouped = {
    idea: ideas.filter((i) => i.status === "idea"),
    selected: ideas.filter((i) => i.status === "selected"),
    inProgress: ideas.filter((i) =>
      ["scheduled", "recording", "processing"].includes(i.status)
    ),
    ready: ideas.filter((i) => i.status === "ready_to_publish"),
    published: ideas.filter((i) => i.status === "published"),
  }

  const handleDragStart = (idea: ContentIdea) => {
    setDraggedIdea(idea)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    if (!draggedIdea) return

    if (draggedIdea.status === targetStatus) {
      setDraggedIdea(null)
      return
    }

    try {
      const { error } = await supabase
        .from("content_ideas")
        .update({
          status: targetStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draggedIdea.id)

      if (error) throw error

      toast.success(`Moved "${draggedIdea.title}" to ${getStatusLabel(targetStatus)}`)
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to update idea status")
      console.error(error)
    } finally {
      setDraggedIdea(null)
    }
  }

  const columns = [
    {
      id: "idea",
      title: "💡 New Ideas",
      ideas: grouped.idea,
      color: "border-blue-500/20",
    },
    {
      id: "selected",
      title: "✅ Selected",
      ideas: grouped.selected,
      color: "border-yellow-500/20",
    },
    {
      id: "inProgress",
      title: "🔄 In Progress",
      ideas: grouped.inProgress,
      color: "border-orange-500/20",
    },
    {
      id: "ready",
      title: "🚀 Ready to Publish",
      ideas: grouped.ready,
      color: "border-teal-500/20",
    },
    {
      id: "published",
      title: "✨ Published",
      ideas: grouped.published,
      color: "border-green-500/20",
    },
  ]

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <Card
          key={column.id}
          className={`min-w-[280px] p-4 bg-card border-border ${column.color} flex-shrink-0`}
          onDragOver={handleDragOver}
          onDrop={(e) => {
            if (column.id === "inProgress") {
              // For inProgress, use the first status in that group
              handleDrop(e, "scheduled")
            } else {
              handleDrop(e, column.id === "ready" ? "ready_to_publish" : column.id)
            }
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{column.title}</h3>
            <Badge variant="outline" className="text-xs">
              {column.ideas.length}
            </Badge>
          </div>
          <div className="space-y-2 min-h-[200px]">
            {column.ideas.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                Drop ideas here
              </div>
            ) : (
              column.ideas.map((idea) => (
                <div
                  key={idea.id}
                  draggable
                  onDragStart={() => handleDragStart(idea)}
                  className="cursor-move group"
                >
                  <div className="relative">
                    <GripVertical className="absolute top-2 left-2 z-10 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 p-1 rounded" />
                    <IdeaCard idea={idea} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
