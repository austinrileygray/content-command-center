"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { IdeaCard } from "@/components/ideas/idea-card"
import { IdeaForm } from "@/components/ideas/idea-form"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles, Check, X } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { useAppStore } from "@/stores/app-store"
import { ContentIdea } from "@/types/database"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { exportIdeasToCSV, exportIdeasToJSON } from "@/lib/export"
import { Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface IdeasPageClientProps {
  initialIdeas: ContentIdea[]
}

export function IdeasPageClient({ initialIdeas }: IdeasPageClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | undefined>()
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState<string | null>(null)
  const { searchQuery, selectedStatus, selectedFormat, setSelectedStatus, setSelectedFormat } = useAppStore()

  // Filter ideas based on search and filters
  const filteredIdeas = useMemo(() => {
    let filtered = initialIdeas

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (idea) =>
          idea.title.toLowerCase().includes(query) ||
          idea.hook?.toLowerCase().includes(query) ||
          idea.description?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter((idea) => idea.status === selectedStatus)
    }

    // Format filter
    if (selectedFormat) {
      filtered = filtered.filter((idea) => idea.format === selectedFormat)
    }

    return filtered
  }, [initialIdeas, searchQuery, selectedStatus, selectedFormat])

  // Group by status
  const grouped = {
    idea: filteredIdeas.filter((i) => i.status === "idea"),
    selected: filteredIdeas.filter((i) => i.status === "selected"),
    inProgress: filteredIdeas.filter((i) =>
      ["scheduled", "recording", "processing"].includes(i.status)
    ),
    ready: filteredIdeas.filter((i) => i.status === "ready_to_publish"),
    published: filteredIdeas.filter((i) => i.status === "published"),
  }

  const handleEdit = (idea: ContentIdea) => {
    setSelectedIdea(idea)
    setShowForm(true)
  }

  const handleNew = () => {
    setSelectedIdea(undefined)
    setShowForm(true)
  }

  const toggleSelectIdea = (ideaId: string) => {
    setSelectedIdeas(prev => {
      const next = new Set(prev)
      if (next.has(ideaId)) {
        next.delete(ideaId)
      } else {
        next.add(ideaId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIdeas.size === filteredIdeas.length) {
      setSelectedIdeas(new Set())
    } else {
      setSelectedIdeas(new Set(filteredIdeas.map(i => i.id)))
    }
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedIdeas.size === 0) return

    setUpdating("bulk")
    try {
      const ideaIds = Array.from(selectedIdeas)
      const { error } = await supabase
        .from("content_ideas")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .in("id", ideaIds)

      if (error) throw error

      setSelectedIdeas(new Set())
      toast.success(`${ideaIds.length} idea${ideaIds.length !== 1 ? "s" : ""} updated to ${newStatus}`)
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to update ideas")
      console.error(error)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Ideas"
        description="Manage your content pipeline"
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Ideas
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportIdeasToCSV(filteredIdeas)}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportIdeasToJSON(filteredIdeas)}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-2 bg-brand hover:bg-brand/90" onClick={handleNew}>
              <Plus className="w-4 h-4" />
              New Idea
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => {
              const { setSearchQuery } = useAppStore.getState()
              setSearchQuery(e.target.value)
            }}
            className="max-w-md"
          />
        </div>
        <Select value={selectedStatus || "all"} onValueChange={(v) => setSelectedStatus(v === "all" ? null : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="selected">Selected</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="recording">Recording</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="ready_to_publish">Ready</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedFormat || "all"} onValueChange={(v) => setSelectedFormat(v === "all" ? null : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Formats" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="solo_youtube">Solo YouTube</SelectItem>
            <SelectItem value="guest_interview">Guest Interview</SelectItem>
            <SelectItem value="live_stream">Live Stream</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedIdeas.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
          <div className="text-sm text-muted-foreground">
            {selectedIdeas.size} idea{selectedIdeas.size !== 1 ? "s" : ""} selected
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updating === "bulk"}
                >
                  Update Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => bulkUpdateStatus("selected")}>
                  Move to Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus("scheduled")}>
                  Move to Scheduled
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus("recording")}>
                  Move to Recording
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus("ready_to_publish")}>
                  Move to Ready
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus("published")}>
                  Mark as Published
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIdeas(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Ideas Grid */}
      <div className="space-y-8">
        {/* New Ideas */}
        {grouped.idea.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                💡 New Ideas ({grouped.idea.length})
              </h2>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIdeas.size === grouped.idea.length && grouped.idea.length > 0}
                  onCheckedChange={() => {
                    const ideaIds = grouped.idea.map(i => i.id)
                    if (selectedIdeas.size === grouped.idea.length) {
                      ideaIds.forEach(id => {
                        setSelectedIdeas(prev => {
                          const next = new Set(prev)
                          next.delete(id)
                          return next
                        })
                      })
                    } else {
                      ideaIds.forEach(id => {
                        setSelectedIdeas(prev => new Set(prev).add(id))
                      })
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.idea.map((idea) => (
                <div key={idea.id} className="relative">
                  <Checkbox
                    checked={selectedIdeas.has(idea.id)}
                    onCheckedChange={() => toggleSelectIdea(idea.id)}
                    className="absolute top-2 left-2 z-10 bg-card/80 backdrop-blur-sm"
                  />
                  <IdeaCard idea={idea} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Selected */}
        {grouped.selected.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                ✅ Selected ({grouped.selected.length})
              </h2>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={grouped.selected.every(i => selectedIdeas.has(i.id)) && grouped.selected.length > 0}
                  onCheckedChange={() => {
                    const ideaIds = grouped.selected.map(i => i.id)
                    const allSelected = ideaIds.every(id => selectedIdeas.has(id))
                    if (allSelected) {
                      ideaIds.forEach(id => {
                        setSelectedIdeas(prev => {
                          const next = new Set(prev)
                          next.delete(id)
                          return next
                        })
                      })
                    } else {
                      ideaIds.forEach(id => {
                        setSelectedIdeas(prev => new Set(prev).add(id))
                      })
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.selected.map((idea) => (
                <div key={idea.id} className="relative">
                  <Checkbox
                    checked={selectedIdeas.has(idea.id)}
                    onCheckedChange={() => toggleSelectIdea(idea.id)}
                    className="absolute top-2 left-2 z-10 bg-card/80 backdrop-blur-sm"
                  />
                  <IdeaCard idea={idea} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* In Progress */}
        {grouped.inProgress.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                🔄 In Progress ({grouped.inProgress.length})
              </h2>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={grouped.inProgress.every(i => selectedIdeas.has(i.id)) && grouped.inProgress.length > 0}
                  onCheckedChange={() => {
                    const ideaIds = grouped.inProgress.map(i => i.id)
                    const allSelected = ideaIds.every(id => selectedIdeas.has(id))
                    if (allSelected) {
                      ideaIds.forEach(id => {
                        setSelectedIdeas(prev => {
                          const next = new Set(prev)
                          next.delete(id)
                          return next
                        })
                      })
                    } else {
                      ideaIds.forEach(id => {
                        setSelectedIdeas(prev => new Set(prev).add(id))
                      })
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.inProgress.map((idea) => (
                <div key={idea.id} className="relative">
                  <Checkbox
                    checked={selectedIdeas.has(idea.id)}
                    onCheckedChange={() => toggleSelectIdea(idea.id)}
                    className="absolute top-2 left-2 z-10 bg-card/80 backdrop-blur-sm"
                  />
                  <IdeaCard idea={idea} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ready to Publish */}
        {grouped.ready.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                🚀 Ready to Publish ({grouped.ready.length})
              </h2>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={grouped.ready.every(i => selectedIdeas.has(i.id)) && grouped.ready.length > 0}
                  onCheckedChange={() => {
                    const ideaIds = grouped.ready.map(i => i.id)
                    const allSelected = ideaIds.every(id => selectedIdeas.has(id))
                    if (allSelected) {
                      ideaIds.forEach(id => {
                        setSelectedIdeas(prev => {
                          const next = new Set(prev)
                          next.delete(id)
                          return next
                        })
                      })
                    } else {
                      ideaIds.forEach(id => {
                        setSelectedIdeas(prev => new Set(prev).add(id))
                      })
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.ready.map((idea) => (
                <div key={idea.id} className="relative">
                  <Checkbox
                    checked={selectedIdeas.has(idea.id)}
                    onCheckedChange={() => toggleSelectIdea(idea.id)}
                    className="absolute top-2 left-2 z-10 bg-card/80 backdrop-blur-sm"
                  />
                  <IdeaCard idea={idea} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Published */}
        {grouped.published.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                ✨ Published ({grouped.published.length})
              </h2>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={grouped.published.every(i => selectedIdeas.has(i.id)) && grouped.published.length > 0}
                  onCheckedChange={() => {
                    const ideaIds = grouped.published.map(i => i.id)
                    const allSelected = ideaIds.every(id => selectedIdeas.has(id))
                    if (allSelected) {
                      ideaIds.forEach(id => {
                        setSelectedIdeas(prev => {
                          const next = new Set(prev)
                          next.delete(id)
                          return next
                        })
                      })
                    } else {
                      ideaIds.forEach(id => {
                        setSelectedIdeas(prev => new Set(prev).add(id))
                      })
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.published.map((idea) => (
                <div key={idea.id} className="relative">
                  <Checkbox
                    checked={selectedIdeas.has(idea.id)}
                    onCheckedChange={() => toggleSelectIdea(idea.id)}
                    className="absolute top-2 left-2 z-10 bg-card/80 backdrop-blur-sm"
                  />
                  <IdeaCard idea={idea} />
                </div>
              ))}
            </div>
          </section>
        )}

        {filteredIdeas.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No ideas found. Try adjusting your filters or create a new idea.
          </div>
        )}
      </div>

      <IdeaForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setSelectedIdea(undefined)
        }}
        idea={selectedIdea}
      />
    </div>
  )
}
