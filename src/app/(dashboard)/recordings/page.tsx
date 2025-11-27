import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Video } from "lucide-react"
import { RecordingsClient } from "./recordings-client"

export default async function RecordingsPage() {
  const supabase = await createClient()

  const { data: recordings } = await supabase
    .from("recordings")
    .select("*, content_idea:content_ideas(title, id, format)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recordings"
        description="Manage and track all your content recordings"
      />

      {!recordings || recordings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No recordings yet"
          description="Recordings will appear here once you start recording content via Loom, SquadCast, or Restream."
        />
      ) : (
        <RecordingsClient initialRecordings={recordings} />
      )}
    </div>
  )
}
