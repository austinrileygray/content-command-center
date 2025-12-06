"use client"

import { Badge } from "@/components/ui/badge"
import { getStatusColor, getStatusLabel } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge className={`${getStatusColor(status)} ${className || ""}`}>
      {getStatusLabel(status)}
    </Badge>
  )
}


