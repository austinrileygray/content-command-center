"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Lightbulb, Video, Package, Send, CheckCircle, XCircle, Clock } from "lucide-react"

interface ActivityItem {
  id: string
  type: "idea_created" | "idea_updated" | "recording_completed" | "asset_generated" | "asset_approved" | "published" | "status_changed"
  title: string
  description: string
  timestamp: string
  status?: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

const activityIcons = {
  idea_created: Lightbulb,
  idea_updated: Lightbulb,
  recording_completed: Video,
  asset_generated: Package,
  asset_approved: CheckCircle,
  published: Send,
  status_changed: Clock,
}

const activityColors = {
  idea_created: "bg-blue-500/20 text-blue-400",
  idea_updated: "bg-yellow-500/20 text-yellow-400",
  recording_completed: "bg-green-500/20 text-green-400",
  asset_generated: "bg-purple-500/20 text-purple-400",
  asset_approved: "bg-teal-500/20 text-teal-400",
  published: "bg-brand/20 text-brand",
  status_changed: "bg-gray-500/20 text-gray-400",
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <p className="text-sm text-muted-foreground text-center">No recent activity</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type] || Clock
          const color = activityColors[activity.type] || activityColors.status_changed

          return (
            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                  {activity.status && (
                    <Badge variant="outline" className="text-xs">
                      {activity.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}


