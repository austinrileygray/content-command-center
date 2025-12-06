"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sparkles, Loader2, Lightbulb, TrendingUp, Video, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ContentIdea, YouTubeVideo } from "@/types/database"

interface AIIdeaGeneratorProps {
  onIdeaGenerated?: (idea: ContentIdea) => void
}

export function AIIdeaGenerator({ onIdeaGenerated }: AIIdeaGeneratorProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("topic")
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [generatedIdeas, setGeneratedIdeas] = useState<Partial<ContentIdea>[]>([])
  
  // Top Videos Tab State
  const [fetchingVideos, setFetchingVideos] = useState(false)
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false)
  const [analyzingPatterns, setAnalyzingPatterns] = useState(false)
  const [topVideos, setTopVideos] = useState<YouTubeVideo[]>([])
  const [patternsReady, setPatternsReady] = useState(false)
  const [videoPrompt, setVideoPrompt] = useState("")

  // Check if patterns are ready on mount
  useEffect(() => {
    if (open && activeTab === "videos") {
      checkPatternsReady()
      loadTopVideos()
    }
  }, [open, activeTab])

  const checkPatternsReady = async () => {
    const { data: patterns } = await supabase
      .from("content_patterns")
      .select("id")
      .limit(1)
    setPatternsReady(!!patterns && patterns.length > 0)
  }

  const loadTopVideos = async () => {
    const { data: videos } = await supabase
      .from("youtube_videos")
      .select("*")
      .not("performance_score", "is", null)
      .order("performance_score", { ascending: false })
      .limit(10)
    setTopVideos(videos || [])
  }

  const fetchVideos = async () => {
    setFetchingVideos(true)
    try {
      const response = await fetch("/api/youtube/videos/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxResults: 50 }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to fetch videos")

      toast.success(`Fetched ${data.videosFetched} videos!`)
      await loadTopVideos()
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch videos")
    } finally {
      setFetchingVideos(false)
    }
  }

  const fetchAnalytics = async () => {
    setFetchingAnalytics(true)
    try {
      const response = await fetch("/api/youtube/analytics/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to fetch analytics")

      toast.success(`Updated analytics for ${data.videosUpdated} videos!`)
      await loadTopVideos()
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch analytics")
    } finally {
      setFetchingAnalytics(false)
    }
  }

  const analyzePatterns = async () => {
    setAnalyzingPatterns(true)
    try {
      const response = await fetch("/api/youtube/videos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 10 }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to analyze patterns")

      toast.success(`Analyzed ${data.patterns} patterns from your top videos!`)
      setPatternsReady(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze patterns")
    } finally {
      setAnalyzingPatterns(false)
    }
  }

  const generateIdeas = async () => {
    if (activeTab === "topic") {
      if (!prompt.trim()) {
        toast.error("Please enter a prompt or topic")
        return
      }

      setGenerating(true)
      try {
        const response = await fetch("/api/ai/generate-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to generate ideas")

        if (data.fallback) {
          toast.info("Using template ideas. AI API may not be configured.")
        } else {
          toast.success("AI-powered ideas generated!")
        }

        setGeneratedIdeas(data.ideas || [])
      } catch (error: any) {
        toast.error(error.message || "Failed to generate ideas")
        const ideas = generateBasicIdeas(prompt)
        setGeneratedIdeas(ideas)
      } finally {
        setGenerating(false)
      }
    } else {
      // Generate from videos
      if (!patternsReady) {
        toast.error("Please analyze your videos first to extract patterns")
        return
      }

      setGenerating(true)
      try {
        const response = await fetch("/api/ai/generate-ideas-from-videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userPrompt: videoPrompt.trim() || undefined,
            count: 3,
          }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to generate ideas")

        toast.success(`Generated ${data.ideas.length} ideas based on your top videos!`)
        setGeneratedIdeas(data.ideas || [])
      } catch (error: any) {
        toast.error(error.message || "Failed to generate ideas")
      } finally {
        setGenerating(false)
      }
    }
  }

  const saveIdea = async (idea: Partial<ContentIdea>) => {
    try {
      // Get current user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single()

      if (!profile) {
        toast.error("User profile not found")
        return
      }

      const { data, error } = await supabase
        .from("content_ideas")
        .insert({
          user_id: profile.id,
          title: idea.title || "Untitled Idea",
          hook: idea.hook || null,
          description: idea.description || null,
          format: idea.format || "solo_youtube",
          status: "idea",
          confidence_score: idea.confidence_score || null,
          estimated_length: idea.estimated_length || null,
          why_this_will_work: idea.why_this_will_work || null,
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Idea saved!")
      setOpen(false)
      router.refresh()
      
      if (onIdeaGenerated && data) {
        onIdeaGenerated(data)
      }
    } catch (error: any) {
      toast.error("Failed to save idea")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Ideas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Idea Generator</DialogTitle>
          <DialogDescription>
            Generate content ideas using AI. Use your top performing videos or enter a topic.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topic">
              <Lightbulb className="w-4 h-4 mr-2" />
              From Topic
            </TabsTrigger>
            <TabsTrigger value="videos">
              <TrendingUp className="w-4 h-4 mr-2" />
              From My Top Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Topic or Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="e.g., 'How to build a SaaS business', 'Productivity tips for entrepreneurs', 'Latest trends in AI'..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Describe the type of content you want to create. Be specific for better results.
              </p>
            </div>

            <Button
              onClick={generateIdeas}
              disabled={generating || !prompt.trim()}
              className="w-full bg-brand hover:bg-brand/90"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Ideas
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="videos" className="space-y-4 mt-4">
            {!patternsReady && (
              <Card className="p-4 bg-muted/50 border-border">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-brand" />
                    <h3 className="font-semibold">Setup Required</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    First, fetch your videos and analyze patterns from your top performers.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchVideos}
                      disabled={fetchingVideos}
                    >
                      {fetchingVideos ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Fetch My Videos
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchAnalytics}
                      disabled={fetchingAnalytics || topVideos.length === 0}
                    >
                      {fetchingAnalytics ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Get Performance Data
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={analyzePatterns}
                      disabled={analyzingPatterns || topVideos.length === 0}
                    >
                      {analyzingPatterns ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analyze Patterns
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {patternsReady && (
              <>
                {topVideos.length > 0 && (
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Your Top Performing Videos</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {topVideos.slice(0, 5).map((video) => (
                        <div key={video.id} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">{Math.round(video.performance_score || 0)}%</Badge>
                          <span className="truncate flex-1">{video.title}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label htmlFor="video-prompt">Optional: Focus on specific topic</Label>
                  <Textarea
                    id="video-prompt"
                    placeholder="e.g., 'AI automation', 'business growth', 'productivity'..."
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to generate ideas based purely on your top video patterns.
                  </p>
                </div>

                <Button
                  onClick={generateIdeas}
                  disabled={generating}
                  className="w-full bg-brand hover:bg-brand/90"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Ideas...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Generate Ideas from Top Videos
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>

        {generatedIdeas.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Generated Ideas ({generatedIdeas.length})
            </h3>
            {generatedIdeas.map((idea, index) => (
              <Card key={index} className="p-4 bg-card border-border">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        {idea.title || "Untitled Idea"}
                      </h4>
                      {idea.hook && (
                        <p className="text-sm text-muted-foreground mb-2">{idea.hook}</p>
                      )}
                      {idea.description && (
                        <p className="text-xs text-muted-foreground">{idea.description}</p>
                      )}
                      {idea.why_this_will_work && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          💡 {idea.why_this_will_work}
                        </p>
                      )}
                    </div>
                    {idea.confidence_score && (
                      <Badge variant="outline" className="ml-2">
                        {idea.confidence_score}% match
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveIdea(idea)}
                    >
                      Save Idea
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        router.push(`/ideas?new=true&title=${encodeURIComponent(idea.title || "")}&hook=${encodeURIComponent(idea.hook || "")}`)
                        setOpen(false)
                      }}
                    >
                      Edit & Save
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>AI-Powered:</strong> Ideas are generated using Claude AI. {activeTab === "videos" ? "Based on patterns from your top performing videos." : "Enter a topic or describe what you want to create."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Generate basic ideas from prompt (template-based)
 * This is a fallback when AI API is not configured
 */
function generateBasicIdeas(prompt: string): Partial<ContentIdea>[] {
  const keywords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const baseIdeas = [
    {
      title: `How to ${prompt}`,
      hook: `Learn the essential steps to ${prompt} in this comprehensive guide.`,
      description: `A detailed breakdown of ${prompt}, covering all the key aspects you need to know.`,
      format: "solo_youtube" as const,
      confidence_score: 75,
      estimated_length: 15,
    },
    {
      title: `The Ultimate Guide to ${prompt}`,
      hook: `Everything you need to know about ${prompt} in one place.`,
      description: `Complete guide covering ${prompt} from basics to advanced strategies.`,
      format: "solo_youtube" as const,
      confidence_score: 80,
      estimated_length: 20,
    },
    {
      title: `${prompt}: Common Mistakes to Avoid`,
      hook: `Avoid these critical mistakes when ${prompt}.`,
      description: `Learn from others' mistakes and avoid common pitfalls in ${prompt}.`,
      format: "solo_youtube" as const,
      confidence_score: 70,
      estimated_length: 12,
    },
  ]

  return baseIdeas
}


