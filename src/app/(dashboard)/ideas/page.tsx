import { createClient } from "@/lib/supabase/server"
import { IdeaCard } from "@/components/ideas/idea-card"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles } from "lucide-react"
import Link from "next/link"

export default async function IdeasPage() {
  const supabase = await createClient()
  
  const { data: ideas } = await supabase
    .from("content_ideas")
    .select("*, guest:guests(*)")
    .order("created_at", { ascending: false })

  // Group by status
  const grouped = {
    idea: ideas?.filter(i => i.status === "idea") || [],
    selected: ideas?.filter(i => i.status === "selected") || [],
    inProgress: ideas?.filter(i => ["scheduled", "recording", "processing"].includes(i.status)) || [],
    ready: ideas?.filter(i => i.status === "ready_to_publish") || [],
    published: ideas?.filter(i => i.status === "published") || [],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Ideas</h1>
          <p className="text-muted-foreground">Manage your content pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Ideas
          </Button>
          <Button className="gap-2 bg-brand hover:bg-brand/90">
            <Plus className="w-4 h-4" />
            New Idea
          </Button>
        </div>
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
      </div>
    </div>
  )
}
