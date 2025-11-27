"use client"

import { useState, useMemo } from "react"
import { IdeaCard } from "@/components/ideas/idea-card"
import { IdeaForm } from "@/components/ideas/idea-form"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { useAppStore } from "@/stores/app-store"
import { ContentIdea } from "@/types/database"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface IdeasPageClientProps {
  initialIdeas: ContentIdea[]
}

export function IdeasPageClient({ initialIdeas }: IdeasPageClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | undefined>()
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

      {/* Ideas Grid */}
      <div className="space-y-8">
        {/* New Ideas */}
        {grouped.idea.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              💡 New Ideas ({grouped.idea.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.idea.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </section>
        )}

        {/* Selected */}
        {grouped.selected.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              ✅ Selected ({grouped.selected.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.selected.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </section>
        )}

        {/* In Progress */}
        {grouped.inProgress.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              🔄 In Progress ({grouped.inProgress.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.inProgress.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </section>
        )}

        {/* Ready to Publish */}
        {grouped.ready.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              🚀 Ready to Publish ({grouped.ready.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.ready.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </section>
        )}

        {/* Published */}
        {grouped.published.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              ✨ Published ({grouped.published.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.published.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
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
