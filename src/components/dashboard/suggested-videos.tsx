"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Lightbulb, Loader2, Plus } from "lucide-react"
import { ContentIdea, ContentPattern } from "@/types/database"
import { AIIdeaGenerator } from "@/components/ideas/ai-idea-generator"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface SuggestedVideosProps {
  patterns: ContentPattern[]
  topVideos: Array<{ title: string; description: string | null; performance_score: number | null }>
  hasPatterns: boolean
}

export function SuggestedVideos({ patterns, topVideos, hasPatterns }: SuggestedVideosProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [suggestedIdeas, setSuggestedIdeas] = useState<Partial<ContentIdea>[]>([])

  const generateSuggestions = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-ideas-from-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 3 }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate suggestions")
      }

      setSuggestedIdeas(data.ideas || [])
    } catch (error: any) {
      console.error("Failed to generate suggestions:", error)
    } finally {
      setGenerating(false)
    }
  }

  if (!hasPatterns) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold text-foreground">Suggested Videos</h2>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Analyze your top performing videos first to get AI-powered suggestions.
          </p>
          <Link href="/ideas">
            <Button variant="outline" className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Go to Ideas → Analyze Patterns
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold text-foreground">Suggested Videos</h2>
        </div>
        <AIIdeaGenerator />
      </div>

      {suggestedIdeas.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Based on {patterns.length} patterns from your top performing videos, we can generate personalized suggestions.
          </p>
          <Button
            onClick={generateSuggestions}
            disabled={generating}
            className="w-full bg-brand hover:bg-brand/90"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Suggestions
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestedIdeas.map((idea, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-foreground flex-1">
                  {idea.title || "Untitled Idea"}
                </h3>
                {idea.confidence_score && (
                  <Badge variant="outline" className="text-xs">
                    {idea.confidence_score}% match
                  </Badge>
                )}
              </div>
              {idea.hook && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{idea.hook}</p>
              )}
              {idea.why_this_will_work && (
                <p className="text-xs text-muted-foreground italic mb-3">
                  💡 {idea.why_this_will_work}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    router.push(
                      `/ideas?new=true&title=${encodeURIComponent(idea.title || "")}&hook=${encodeURIComponent(idea.hook || "")}`
                    )
                  }}
                  className="flex-1"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create Idea
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuggestedIdeas([])}
            className="w-full text-xs"
          >
            Clear Suggestions
          </Button>
        </div>
      )}
    </Card>
  )
}





