import { createClient } from "@/lib/supabase/server"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { PipelineOverview } from "@/components/dashboard/pipeline-overview"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Fetch content ideas for stats
  const { data: ideas } = await supabase
    .from("content_ideas")
    .select("*")
    .order("created_at", { ascending: false })

  const stats = {
    totalIdeas: ideas?.length || 0,
    inProgress: ideas?.filter(i => ["selected", "scheduled", "recording", "processing"].includes(i.status)).length || 0,
    readyToPublish: ideas?.filter(i => i.status === "ready_to_publish").length || 0,
    published: ideas?.filter(i => i.status === "published").length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your content.
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PipelineOverview ideas={ideas || []} />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity ideas={ideas?.slice(0, 5) || []} />
        </div>
      </div>
    </div>
  )
}
