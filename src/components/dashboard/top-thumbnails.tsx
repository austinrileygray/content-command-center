"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Image as ImageIcon, TrendingUp, Eye, ThumbsUp } from "lucide-react"
import { ThumbnailTraining, YouTubeVideo } from "@/types/database"
import Link from "next/link"
// Using img tag for external thumbnail URLs

interface TopThumbnailsProps {
  thumbnails: ThumbnailTraining[]
  videos?: YouTubeVideo[] // Optional: to get performance data
}

export function TopThumbnails({ thumbnails, videos = [] }: TopThumbnailsProps) {
  // Create a map of video IDs to performance scores for quick lookup
  const videoPerformanceMap = new Map<string, number>()
  videos.forEach(v => {
    if (v.video_id && v.performance_score) {
      videoPerformanceMap.set(v.video_id, v.performance_score)
    }
  })

  // Combine thumbnails with their performance data
  const thumbnailsWithPerformance = thumbnails
    .filter(t => t.approved && t.image_url)
    .map(thumbnail => {
      let performanceScore = 0
      let views = 0
      let engagement = 0

      // Get performance from thumbnail's performance_metrics
      if (thumbnail.performance_metrics) {
        views = thumbnail.performance_metrics.views || 0
        engagement = thumbnail.performance_metrics.engagement_rate || 0
        // Calculate a simple performance score from metrics
        if (views > 0) {
          const ctr = thumbnail.performance_metrics.ctr || 0
          performanceScore = (views / 1000) * 0.4 + (engagement * 10) * 0.3 + (ctr * 10) * 0.3
        }
      }

      // If we have video data, use that
      if (thumbnail.source_video_id) {
        const videoScore = videoPerformanceMap.get(thumbnail.source_video_id)
        if (videoScore) {
          performanceScore = videoScore
        }
      }

      return {
        ...thumbnail,
        calculatedScore: performanceScore,
        views,
        engagement,
      }
    })
    .sort((a, b) => b.calculatedScore - a.calculatedScore)
    .slice(0, 12)

  if (thumbnailsWithPerformance.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold text-foreground">Top Performing Thumbnails</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          No thumbnail data available. Upload thumbnails or fetch from YouTube to see top performers.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold text-foreground">Top Performing Thumbnails</h2>
        </div>
        <Badge variant="outline" className="text-xs">
          {thumbnailsWithPerformance.length} shown
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {thumbnailsWithPerformance.map((thumbnail, index) => (
          <Link
            key={thumbnail.id}
            href={thumbnail.source_video_url || '#'}
            target={thumbnail.source_video_url ? "_blank" : undefined}
            rel={thumbnail.source_video_url ? "noopener noreferrer" : undefined}
            className="group relative aspect-video rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-brand transition-all"
          >
            <img
              src={thumbnail.image_url}
              alt={thumbnail.source_video_title || `Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <div className="text-xs font-medium text-white line-clamp-1">
                  {thumbnail.source_video_title || `Thumbnail ${index + 1}`}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-white/80">
                  {thumbnail.views > 0 && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {(thumbnail.views / 1000).toFixed(1)}k
                    </div>
                  )}
                  {thumbnail.engagement > 0 && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {thumbnail.engagement.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
              #{index + 1}
            </div>
            <Badge
              variant="outline"
              className="absolute top-1 right-1 bg-black/70 text-white border-white/20 text-xs"
            >
              {Math.round(thumbnail.calculatedScore)}%
            </Badge>
          </Link>
        ))}
      </div>
    </Card>
  )
}



