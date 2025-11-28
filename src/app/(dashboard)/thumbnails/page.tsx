import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { ThumbnailsClient } from "./thumbnails-client"

export default async function ThumbnailsPage() {
  const supabase = await createClient()

  // Get all approved thumbnails
  const { data: thumbnails } = await supabase
    .from("thumbnail_training")
    .select("*")
    .eq("approved", true)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thumbnail Training"
        description="Upload and manage thumbnails to train AI models. Automatically collect from high-performing videos."
      />
      <ThumbnailsClient initialThumbnails={thumbnails || []} />
    </div>
  )
}
