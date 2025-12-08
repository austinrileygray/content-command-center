import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { ThumbnailsClient } from "./thumbnails-client"

export default async function ThumbnailsPage({
  searchParams,
}: {
  searchParams: Promise<{ ideaId?: string; prompt?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch ingredients
  const { data: ingredients } = await supabase
    .from("thumbnail_ingredients")
    .select("*")
    .order("created_at", { ascending: false })

  // Fetch recent generations
  const { data: generations } = await supabase
    .from("generated_thumbnails")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thumbnail Generator"
        description="Create eye-catching YouTube thumbnails with AI"
      />

      <ThumbnailsClient
        initialIngredients={ingredients || []}
        initialGenerations={generations || []}
        initialPrompt={params.prompt}
        contentIdeaId={params.ideaId}
      />
    </div>
  )
}



