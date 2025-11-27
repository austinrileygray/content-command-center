import { createClient } from "@/lib/supabase/server"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { PipelineOverview } from "@/components/dashboard/pipeline-overview"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Fetch content ideas for stats
  const { data: ideas } = await supabase
    .from("content_ideas")
    .select("*")
    .order("created_at", { ascending: false })

  // Fetch assets for stats
  const { data: assets } = await supabase
    .from("assets")
    .select("*")

  // Fetch recordings for activity
  const { data: recordings } = await supabase
    .from("recordings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  // Generate activity feed from recent changes
  const activities = [
    ...(ideas?.slice(0, 5).map(idea => ({
      id: idea.id,
      type: "idea_created" as const,
      title: idea.title,
      description: `New idea created: ${idea.title}`,
      timestamp: idea.created_at,
      status: idea.status,
    })) || []),
    ...(assets?.slice(0, 5).map(asset => ({
      id: asset.id,
      type: asset.status === "approved" ? "asset_approved" as const : "asset_generated" as const,
      title: asset.title || "Untitled Asset",
      description: `${asset.type} ${asset.status === "approved" ? "approved" : "generated"}`,
      timestamp: asset.created_at,
      status: asset.status,
    })) || []),
    ...(recordings?.slice(0, 3).map(recording => ({
      id: recording.id,
      type: "recording_completed" as const,
      title: `Recording on ${recording.platform}`,
      description: `Recording ${recording.status} on ${recording.platform}`,
      timestamp: recording.created_at,
      status: recording.status,
    })) || []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)

  const stats = {
    totalIdeas: ideas?.length || 0,
    inProgress: ideas?.filter(i => ["selected", "scheduled", "recording", "processing"].includes(i.status)).length || 0,
    readyToPublish: ideas?.filter(i => i.status === "ready_to_publish").length || 0,
    published: ideas?.filter(i => i.status === "published").length || 0,
    totalAssets: assets?.length || 0,
    readyAssets: assets?.filter(a => a.status === "ready").length || 0,
    approvedAssets: assets?.filter(a => a.status === "approved").length || 0,
    clipsGenerated: assets?.filter(a => a.type === "clip").length || 0,
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
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  )
}
