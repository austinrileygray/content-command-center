"use client"

import { ContentIdea } from "@/types/database"
import { IdeaCard } from "./idea-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { getStatusLabel } from "@/lib/utils"

interface PipelineBoardProps {
  ideas: ContentIdea[]
}

const columns = [
  { status: "idea", label: "💡 Ideas" },
  { status: "selected", label: "✅ Selected" },
  { status: "scheduled", label: "📅 Scheduled" },
  { status: "recording", label: "🎥 Recording" },
  { status: "processing", label: "⚙️ Processing" },
  { status: "ready_to_publish", label: "🚀 Ready" },
  { status: "published", label: "✨ Published" },
]

export function PipelineBoard({ ideas }: PipelineBoardProps) {
  const getIdeasByStatus = (status: string) => 
    ideas.filter(idea => idea.status === status)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnIdeas = getIdeasByStatus(column.status)
        
        return (
          <div key={column.status} className="flex-shrink-0 w-80">
            <Card className="bg-card border-border">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">
                  {column.label} ({columnIdeas.length})
                </h3>
              </div>
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-3">
                  {columnIdeas.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No items
                    </div>
                  ) : (
                    columnIdeas.map((idea) => (
                      <IdeaCard key={idea.id} idea={idea} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        )
      })}
    </div>
  )
}



