"use client"

import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-12 bg-card border-border">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-secondary mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="bg-brand hover:bg-brand/90">
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  )
}



