"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Eye, ThumbsUp, MessageSquare, ExternalLink } from "lucide-react"
import { YouTubeVideo } from "@/types/database"
import Link from "next/link"
// Using img tag for external YouTube thumbnails

interface TopPerformingVideosProps {
  videos: YouTubeVideo[]
}

export function TopPerformingVideos({ videos }: TopPerformingVideosProps) {
  // Sort by performance score and take top 10
  const topVideos = videos
    .filter(v => v.performance_score !== null)
    .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
    .slice(0, 10)

  if (topVideos.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold text-foreground">Top Performing Videos</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          No video data available. Connect YouTube and fetch your videos to see top performers.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold text-foreground">Top Performing Videos</h2>
        </div>
        <Badge variant="outline" className="text-xs">
          {videos.length} total
        </Badge>
      </div>

      <div className="space-y-3">
        {topVideos.map((video, index) => (
          <Link
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="relative w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
              {video.thumbnail_url ? (
                <>
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    #{index + 1}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No thumbnail
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-brand transition-colors">
                  {video.title}
                </h3>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {Math.round(video.performance_score || 0)}%
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {video.views.toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {video.likes.toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {video.comments.toLocaleString()}
                </div>
                {video.click_through_rate && (
                  <div className="text-brand font-medium">
                    CTR: {video.click_through_rate.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
          </Link>
        ))}
      </div>
    </Card>
  )
}






