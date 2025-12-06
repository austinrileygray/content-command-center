import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Package } from "lucide-react"
import { AssetsClient } from "./assets-client"

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: { idea?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from("assets")
    .select("*")

  // Filter by content idea if provided
  if (searchParams?.idea) {
    query = query.eq("content_idea_id", searchParams.idea)
  }

  const { data: assets } = await query.order("created_at", { ascending: false })

  // Get idea title if filtering
  let ideaTitle: string | null = null
  if (searchParams?.idea) {
    const { data: idea } = await supabase
      .from("content_ideas")
      .select("title")
      .eq("id", searchParams.idea)
      .single()
    ideaTitle = idea?.title || null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ideaTitle ? `Assets: ${ideaTitle}` : "Assets"}
        description={
          ideaTitle
            ? `Generated assets for this content idea`
            : "Generated clips, thumbnails, and other content assets"
        }
      />

      {!assets || assets.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No assets yet"
          description="Assets will appear here once content is processed and clips are generated."
        />
      ) : (
        <AssetsClient initialAssets={assets} />
      )}
    </div>
  )
}


