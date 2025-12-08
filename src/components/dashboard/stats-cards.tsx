"use client"

import { Lightbulb, Play, CheckCircle, Send, Package, Scissors } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

interface StatsCardsProps {
  stats: {
    totalIdeas: number
    inProgress: number
    readyToPublish: number
    published: number
    totalAssets?: number
    readyAssets?: number
    approvedAssets?: number
    clipsGenerated?: number
  }
}

const statConfig = [
  { key: "totalIdeas", label: "Total Ideas", icon: Lightbulb, color: "text-brand", href: "/ideas" },
  { key: "inProgress", label: "In Progress", icon: Play, color: "text-blue-400", href: "/ideas" },
  { key: "readyToPublish", label: "Ready to Publish", icon: CheckCircle, color: "text-teal-400", href: "/ideas" },
  { key: "published", label: "Published", icon: Send, color: "text-green-400", href: "/ideas" },
]

const assetStatConfig = [
  { key: "totalAssets", label: "Total Assets", icon: Package, color: "text-brand", href: "/assets" },
  { key: "readyAssets", label: "Ready Assets", icon: CheckCircle, color: "text-teal-400", href: "/assets" },
  { key: "approvedAssets", label: "Approved", icon: CheckCircle, color: "text-blue-400", href: "/assets" },
  { key: "clipsGenerated", label: "Clips Generated", icon: Scissors, color: "text-brand", href: "/assets" },
]

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statConfig.map((stat) => {
          const Icon = stat.icon
          const value = stats[stat.key as keyof typeof stats] || 0
          
          return (
            <Link key={stat.key} href={stat.href || "#"}>
              <Card className="p-4 bg-card border-border hover:border-brand/50 transition-colors cursor-pointer">
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
            </Link>
          )
        })}
      </div>
      
      {/* Asset Stats */}
      {stats.totalAssets !== undefined && stats.totalAssets > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {assetStatConfig.map((stat) => {
            const Icon = stat.icon
            const value = stats[stat.key as keyof typeof stats] || 0
            
            return (
              <Link key={stat.key} href={stat.href || "#"}>
                <Card className="p-4 bg-card border-border hover:border-brand/50 transition-colors cursor-pointer">
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
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}



