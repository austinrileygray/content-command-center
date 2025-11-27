"use client"

import { Bell, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function Header() {
  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas, assets..."
            className="pl-10 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link href="/ideas?new=true">
          <Button size="sm" className="gap-2 bg-brand hover:bg-brand/90">
            <Plus className="w-4 h-4" />
            New Idea
          </Button>
        </Link>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full" />
        </Button>

        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-medium">
          O
        </div>
      </div>
    </header>
  )
}
