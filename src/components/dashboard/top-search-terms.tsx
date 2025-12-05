"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp } from "lucide-react"
import { YouTubeVideo } from "@/types/database"

interface TopSearchTermsProps {
  videos: YouTubeVideo[]
}

export function TopSearchTerms({ videos }: TopSearchTermsProps) {
  // Extract and count tags/keywords from top performing videos
  const keywordCounts = new Map<string, { count: number; totalScore: number; videos: number }>()

  videos
    .filter(v => v.performance_score !== null && v.performance_score > 0)
    .slice(0, 50) // Top 50 videos
    .forEach(video => {
      // Extract from tags
      if (video.tags && Array.isArray(video.tags)) {
        video.tags.forEach(tag => {
          const normalized = tag.toLowerCase().trim()
          if (normalized.length > 2) {
            const existing = keywordCounts.get(normalized) || { count: 0, totalScore: 0, videos: 0 }
            keywordCounts.set(normalized, {
              count: existing.count + 1,
              totalScore: existing.totalScore + (video.performance_score || 0),
              videos: existing.videos + 1,
            })
          }
        })
      }

      // Extract from topics
      if (video.topics && Array.isArray(video.topics)) {
        video.topics.forEach(topic => {
          const normalized = topic.toLowerCase().trim()
          if (normalized.length > 2) {
            const existing = keywordCounts.get(normalized) || { count: 0, totalScore: 0, videos: 0 }
            keywordCounts.set(normalized, {
              count: existing.count + 1,
              totalScore: existing.totalScore + (video.performance_score || 0),
              videos: existing.videos + 1,
            })
          }
        })
      }

      // Extract from title (simple keyword extraction)
      if (video.title) {
        const words = video.title
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 4) // Only meaningful words
        
        words.forEach(word => {
          const existing = keywordCounts.get(word) || { count: 0, totalScore: 0, videos: 0 }
          keywordCounts.set(word, {
            count: existing.count + 1,
            totalScore: existing.totalScore + (video.performance_score || 0),
            videos: existing.videos + 1,
          })
        })
      }
    })

  // Sort by average performance score and count
  const topKeywords = Array.from(keywordCounts.entries())
    .map(([keyword, data]) => ({
      keyword,
      count: data.count,
      avgScore: data.totalScore / data.videos,
      videos: data.videos,
    }))
    .sort((a, b) => {
      // Sort by average score first, then by count
      if (Math.abs(a.avgScore - b.avgScore) > 5) {
        return b.avgScore - a.avgScore
      }
      return b.count - a.count
    })
    .slice(0, 15)

  if (topKeywords.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold text-foreground">Top Search Terms</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          No keyword data available. Keywords are extracted from video tags, topics, and titles.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold text-foreground">Top Search Terms</h2>
        </div>
        <Badge variant="outline" className="text-xs">
          From top 50 videos
        </Badge>
      </div>

      <div className="space-y-2">
        {topKeywords.map((item, index) => (
          <div
            key={item.keyword}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-semibold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground capitalize">
                  {item.keyword}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.videos} video{item.videos !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs">
                {Math.round(item.avgScore)}% avg
              </Badge>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}



