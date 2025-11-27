"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Eye, ThumbsUp, Share2, Clock, Video, Package, Lightbulb } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { ContentIdea } from "@/types/database"
import { Asset } from "@/types/database"

interface AnalyticsClientProps {
  ideas: ContentIdea[]
  assets: Asset[]
}

export function AnalyticsClient({ ideas, assets }: AnalyticsClientProps) {
  // Calculate metrics from real data
  const metrics = useMemo(() => {
    const publishedIdeas = ideas.filter(i => i.status === "published")
    const totalAssets = assets.length
    const clips = assets.filter(a => a.type === "clip").length
    const approvedAssets = assets.filter(a => a.status === "approved").length
    const publishedAssets = assets.filter(a => a.status === "published").length
    
    // Calculate total duration from assets
    const totalDuration = assets
      .filter(a => a.duration)
      .reduce((sum, a) => sum + (a.duration || 0), 0)
    
    // Calculate average virality
    const assetsWithVirality = assets.filter(a => a.virality_score !== null)
    const avgVirality = assetsWithVirality.length > 0
      ? assetsWithVirality.reduce((sum, a) => sum + (a.virality_score || 0), 0) / assetsWithVirality.length
      : 0

    // Status distribution
    const statusDistribution = {
      idea: ideas.filter(i => i.status === "idea").length,
      selected: ideas.filter(i => i.status === "selected").length,
      inProgress: ideas.filter(i => ["scheduled", "recording", "processing"].includes(i.status)).length,
      ready: ideas.filter(i => i.status === "ready_to_publish").length,
      published: ideas.filter(i => i.status === "published").length,
    }

    // Asset type distribution
    const assetTypeDistribution = {
      clip: assets.filter(a => a.type === "clip").length,
      thumbnail: assets.filter(a => a.type === "thumbnail").length,
      blog: assets.filter(a => a.type === "blog").length,
      newsletter: assets.filter(a => a.type === "newsletter").length,
      social_post: assets.filter(a => a.type === "social_post").length,
    }

    // Platform distribution (from assets)
    const platformDistribution: Record<string, number> = {}
    assets.forEach(asset => {
      if (asset.platform) {
        platformDistribution[asset.platform] = (platformDistribution[asset.platform] || 0) + 1
      }
    })

    return {
      totalIdeas: ideas.length,
      publishedIdeas: publishedIdeas.length,
      totalAssets,
      clips,
      approvedAssets,
      publishedAssets,
      totalDuration,
      avgVirality: Math.round(avgVirality),
      statusDistribution,
      assetTypeDistribution,
      platformDistribution,
    }
  }, [ideas, assets])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Lightbulb className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-foreground">{metrics.totalIdeas}</div>
          <div className="text-sm text-muted-foreground">Total Ideas</div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-foreground">{metrics.totalAssets}</div>
          <div className="text-sm text-muted-foreground">Total Assets</div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-foreground">{metrics.clips}</div>
          <div className="text-sm text-muted-foreground">Clips Generated</div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-brand/10 text-brand">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-foreground">{metrics.avgVirality}%</div>
          <div className="text-sm text-muted-foreground">Avg Virality Score</div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Distribution */}
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Idea Status Distribution</h3>
              <div className="space-y-3">
                {Object.entries(metrics.statusDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">{status.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand"
                          style={{ width: `${(count / metrics.totalIdeas) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Asset Type Distribution */}
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Asset Type Distribution</h3>
              <div className="space-y-3">
                {Object.entries(metrics.assetTypeDistribution).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">{type.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand"
                          style={{ width: `${metrics.totalAssets > 0 ? (count / metrics.totalAssets) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-card border-border">
              <div className="text-sm text-muted-foreground mb-1">Total Content Duration</div>
              <div className="text-2xl font-semibold text-foreground">{formatDuration(metrics.totalDuration)}</div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="text-sm text-muted-foreground mb-1">Approved Assets</div>
              <div className="text-2xl font-semibold text-green-400">{metrics.approvedAssets}</div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="text-sm text-muted-foreground mb-1">Published Assets</div>
              <div className="text-2xl font-semibold text-brand">{metrics.publishedAssets}</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ideas" className="space-y-4">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Content Pipeline</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">New Ideas</span>
                <Badge variant="outline">{metrics.statusDistribution.idea}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">Selected</span>
                <Badge variant="outline">{metrics.statusDistribution.selected}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">In Progress</span>
                <Badge variant="outline">{metrics.statusDistribution.inProgress}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">Ready to Publish</span>
                <Badge variant="outline" className="bg-teal-500/20 text-teal-400">
                  {metrics.statusDistribution.ready}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">Published</span>
                <Badge variant="outline" className="bg-green-500/20 text-green-400">
                  {metrics.statusDistribution.published}
                </Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Asset Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ready</span>
                  <span className="text-sm font-medium text-foreground">
                    {assets.filter(a => a.status === "ready").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Approved</span>
                  <span className="text-sm font-medium text-green-400">
                    {assets.filter(a => a.status === "approved").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <span className="text-sm font-medium text-brand">
                    {assets.filter(a => a.status === "published").length}
                  </span>
                </div>
              </div>
            </Card>

            {Object.keys(metrics.platformDistribution).length > 0 && (
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Platform Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(metrics.platformDistribution).map(([platform, count]) => (
                    <div key={platform} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground capitalize">{platform}</span>
                      <span className="text-sm font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
