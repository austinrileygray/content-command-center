import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { AssetsClient } from "./assets-client"

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string }>
}) {
  const { idea: ideaId } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("assets")
    .select("*")

  // Filter by content idea if provided
  if (ideaId) {
    query = query.eq("content_idea_id", ideaId)
  }

  const { data: assets } = await query.order("created_at", { ascending: false })

  // Get idea title if filtering
  let ideaTitle: string | null = null
  if (ideaId) {
    const { data: idea } = await supabase
      .from("content_ideas")
      .select("title")
      .eq("id", ideaId)
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

      <AssetsClient initialAssets={assets || []} showEmptyState={!assets || assets.length === 0} />
    </div>
  )
}



