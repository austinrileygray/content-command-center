"use client"

import { Lightbulb, Play, CheckCircle, Send } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatsCardsProps {
  stats: {
    totalIdeas: number
    inProgress: number
    readyToPublish: number
    published: number
  }
}

const statConfig = [
  { key: "totalIdeas", label: "Total Ideas", icon: Lightbulb, color: "text-brand" },
  { key: "inProgress", label: "In Progress", icon: Play, color: "text-blue-400" },
  { key: "readyToPublish", label: "Ready to Publish", icon: CheckCircle, color: "text-teal-400" },
  { key: "published", label: "Published", icon: Send, color: "text-green-400" },
]

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((stat) => {
        const Icon = stat.icon
        const value = stats[stat.key as keyof typeof stats]
        
        return (
          <Card key={stat.key} className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
