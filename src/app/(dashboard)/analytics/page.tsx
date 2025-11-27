import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Eye, ThumbsUp, Share2, Clock } from "lucide-react"
import { formatNumber } from "@/lib/utils"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Get published content ideas
  const { data: published } = await supabase
    .from("content_ideas")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })

  // Get analytics snapshots (mock data structure)
  const { data: snapshots } = await supabase
    .from("analytics_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(30)

  // Calculate aggregate metrics (mock for now)
  const metrics = {
    totalViews: 125000,
    totalLikes: 8500,
    totalShares: 3200,
    avgWatchTime: 245, // seconds
    topPerformer: published?.[0]?.title || "No content yet",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Performance metrics and insights across all platforms"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-foreground">{formatNumber(metrics.totalViews)}</div>
          <div className="text-sm text-muted-foreground">Total Views</div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
              <ThumbsUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-foreground">{formatNumber(metrics.totalLikes)}</div>
          <div className="text-sm text-muted-foreground">Total Likes</div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-foreground">{formatNumber(metrics.totalShares)}</div>
          <div className="text-sm text-muted-foreground">Total Shares</div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-foreground">{Math.floor(metrics.avgWatchTime / 60)}m</div>
          <div className="text-sm text-muted-foreground">Avg Watch Time</div>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="platforms">By Platform</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Performance Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Published Content</span>
                  <span className="text-sm font-medium text-foreground">{published?.length || 0}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full">
                  <div
                    className="h-full bg-brand rounded-full"
                    style={{ width: `${Math.min((published?.length || 0) * 10, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Top Performer</span>
                  <span className="text-sm font-medium text-foreground truncate ml-2">{metrics.topPerformer}</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Content Performance</h3>
            {published && published.length > 0 ? (
              <div className="space-y-3">
                {published.slice(0, 5).map((idea) => (
                  <div key={idea.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{idea.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Published {idea.published_at ? new Date(idea.published_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">—</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No published content yet</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Platform Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm font-medium text-foreground">YouTube</span>
                <span className="text-sm text-muted-foreground">—</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm font-medium text-foreground">LinkedIn</span>
                <span className="text-sm text-muted-foreground">—</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm font-medium text-foreground">Twitter/X</span>
                <span className="text-sm text-muted-foreground">—</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
