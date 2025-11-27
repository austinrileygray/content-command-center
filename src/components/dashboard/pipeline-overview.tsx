"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ContentIdea } from "@/types/database"
import { getStatusLabel } from "@/lib/utils"

interface PipelineOverviewProps {
  ideas: ContentIdea[]
}

const stages = [
  { status: "idea", label: "Ideas", color: "bg-zinc-500" },
  { status: "selected", label: "Selected", color: "bg-blue-500" },
  { status: "scheduled", label: "Scheduled", color: "bg-purple-500" },
  { status: "recording", label: "Recording", color: "bg-red-500" },
  { status: "processing", label: "Processing", color: "bg-orange-500" },
  { status: "ready_to_publish", label: "Ready", color: "bg-teal-500" },
  { status: "published", label: "Published", color: "bg-green-500" },
]

export function PipelineOverview({ ideas }: PipelineOverviewProps) {
  const getCounts = (status: string) => ideas.filter(i => i.status === status).length

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pipeline</h2>
          <p className="text-sm text-muted-foreground">Content production stages</p>
        </div>
        <Link 
          href="/ideas" 
          className="flex items-center gap-1 text-sm text-brand hover:text-brand/80"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {stages.map((stage) => {
          const count = getCounts(stage.status)
          const maxCount = Math.max(...stages.map(s => getCounts(s.status)), 1)
          const percentage = (count / maxCount) * 100

          return (
            <div key={stage.status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">{stage.label}</span>
                <span className="text-sm font-medium text-foreground">{count}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
