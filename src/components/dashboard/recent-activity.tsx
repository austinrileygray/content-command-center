"use client"

import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { ContentIdea } from "@/types/database"
import { getStatusColor, getStatusLabel } from "@/lib/utils"

interface RecentActivityProps {
  ideas: ContentIdea[]
}

export function RecentActivity({ ideas }: RecentActivityProps) {
  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {ideas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          ideas.map((idea) => (
            <div key={idea.id} className="flex items-start gap-3">
              <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(idea.status)}`}>
                {getStatusLabel(idea.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{idea.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(idea.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}



