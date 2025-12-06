"use client"

import Link from "next/link"
import { Sparkles, Plus, Video } from "lucide-react"
import { Card } from "@/components/ui/card"

const actions = [
  {
    name: "Generate Ideas",
    description: "AI-powered suggestions",
    icon: Sparkles,
    href: "/ideas?generate=true",
    primary: true,
  },
  {
    name: "New Idea",
    description: "Create manually",
    icon: Plus,
    href: "/ideas?new=true",
  },
  {
    name: "Start Recording",
    description: "Open recording platform",
    icon: Video,
    href: "/record",
  },
]

export function QuickActions() {
  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.name}
              href={action.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                action.primary
                  ? "bg-brand text-white hover:bg-brand/90"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <div className={`p-2 rounded-lg ${action.primary ? "bg-white/20" : "bg-background"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{action.name}</p>
                <p className={`text-xs ${action.primary ? "text-white/70" : "text-muted-foreground"}`}>
                  {action.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}


