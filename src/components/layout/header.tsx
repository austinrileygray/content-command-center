"use client"

import { Bell, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserMenu } from "./user-menu"
import { ThemeToggle } from "./theme-toggle"
import Link from "next/link"
import { useAppStore } from "@/stores/app-store"
import { debounce } from "@/lib/performance"
import { useCallback, useState, useEffect } from "react"

export function Header() {
  const { searchQuery, setSearchQuery } = useAppStore()
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  // Debounced search update
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value)
    }, 300),
    [setSearchQuery]
  )

  useEffect(() => {
    debouncedSetSearch(localSearchQuery)
  }, [localSearchQuery, debouncedSetSearch])

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas, assets... (⌘K)"
            className="pl-10 bg-secondary border-border"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setLocalSearchQuery("")
                setSearchQuery("")
              }
            }}
            onFocus={(e) => {
              // Open command palette on focus with Cmd+K hint
              if (e.target.value === "") {
                e.target.blur()
              }
            }}
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

        <ThemeToggle />

        <UserMenu />
      </div>
    </header>
  )
}
