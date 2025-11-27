import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { PublishClient } from "./publish-client"

export default async function PublishPage() {
  const supabase = await createClient()

  const { data: queue } = await supabase
    .from("publishing_queue")
    .select("*, content_idea:content_ideas(title, id), asset:assets(title, type)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publishing Queue"
        description="Manage content ready to publish across platforms"
      />

      <PublishClient initialQueue={queue || []} />
    </div>
  )
}
