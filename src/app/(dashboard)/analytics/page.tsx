import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { AnalyticsClient } from "./analytics-client"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Get all content ideas
  const { data: ideas } = await supabase
    .from("content_ideas")
    .select("*")
    .order("created_at", { ascending: false })

  // Get all assets
  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Performance metrics and insights across all platforms"
      />

      <AnalyticsClient ideas={ideas || []} assets={assets || []} />
    </div>
  )
}
