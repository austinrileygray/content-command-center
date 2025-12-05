"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  Scissors,
  Loader2,
  Clock,
  TrendingUp,
  Copy,
  ExternalLink,
  Sparkles,
  Video,
  Target,
  Users,
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  ThumbsUp,
} from "lucide-react"
import { toast } from "sonner"
import { ViralClipAnalysis, ViralClip } from "@/types/database"

interface ChannelVideo {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  stats: {
    views: number
    likes: number
    comments: number
    duration: string
  }
  performanceScore: number
}

interface ViralClipsClientProps {
  initialAnalyses: ViralClipAnalysis[]
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : score >= 6
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30"

  return (
    <Badge className={`${color} font-bold`}>
      {score}/10
    </Badge>
  )
}

function ClipCard({ clip, videoId, index }: { clip: ViralClip; videoId: string; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const youtubeTimestampUrl = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(clip.startTime)}s`

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  return (
    <Card className="p-4 bg-card border-border hover:border-muted-foreground transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-muted-foreground">
              Clip #{index + 1}
            </Badge>
            <ScoreBadge score={clip.score} />
            <Badge variant="outline" className="text-brand">
              {clip.emotionalPeak}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
            </span>
            <span className="flex items-center gap-1">
              <Play className="w-4 h-4" />
              {clip.duration}s duration
            </span>
          </div>

          <p className="text-foreground font-medium mb-2">{clip.reason}</p>

          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={youtubeTimestampUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Watch on YouTube
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  More
                </>
              )}
            </Button>
          </div>

          {expanded && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div>
                <Label className="text-xs text-muted-foreground">Suggested Hook</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-foreground flex-1 bg-secondary/50 p-2 rounded">
                    "{clip.hook}"
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(clip.hook, "Hook")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Caption & Hashtags</Label>
                <div className="flex items-start gap-2 mt-1">
                  <p className="text-sm text-foreground flex-1 bg-secondary/50 p-2 rounded">
                    {clip.suggestedCaption}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(clip.suggestedCaption, "Caption")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Best thumbnail frame: {formatTime(clip.thumbnailTimestamp)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
  return views.toString()
}

export function ViralClipsClient({ initialAnalyses }: ViralClipsClientProps) {
  const router = useRouter()

  // Videos state
  const [channelVideos, setChannelVideos] = useState<ChannelVideo[]>([])
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [videosError, setVideosError] = useState<string | null>(null)

  // Analysis state
  const [analyses, setAnalyses] = useState(initialAnalyses)
  const [analyzing, setAnalyzing] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [selectedVideoId, setSelectedVideoId] = useState("")
  const [maxClips, setMaxClips] = useState("5")
  const [currentAnalysis, setCurrentAnalysis] = useState<ViralClipAnalysis | null>(null)

  // Fetch channel videos on mount
  useEffect(() => {
    fetchChannelVideos()
  }, [])

  const fetchChannelVideos = async () => {
    setLoadingVideos(true)
    setVideosError(null)

    try {
      const response = await fetch("/api/youtube/top-videos?limit=50")
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setVideosError("YouTube not connected. Connect your channel in Settings.")
        } else {
          setVideosError(data.error || "Failed to load videos")
        }
        return
      }

      setChannelVideos(data.videos || [])
    } catch (error: any) {
      setVideosError("Failed to load videos")
    } finally {
      setLoadingVideos(false)
    }
  }

  // Extract video ID from URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  // Analyze video
  const analyzeVideo = async () => {
    const videoId = selectedVideoId || extractVideoId(videoUrl)

    if (!videoId) {
      toast.error("Please enter a valid YouTube URL or select a video")
      return
    }

    setAnalyzing(true)
    setCurrentAnalysis(null)

    try {
      const selectedVideo = channelVideos.find(v => v.id === videoId)

      const response = await fetch("/api/viral-clips/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          videoUrl: videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
          videoTitle: selectedVideo?.title,
          maxClips: parseInt(maxClips),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze video")
      }

      const newAnalysis: ViralClipAnalysis = {
        id: data.analysisId,
        user_id: "default",
        video_id: data.videoId,
        video_url: data.videoUrl,
        video_title: data.videoTitle || selectedVideo?.title || null,
        clips: data.clips || [],
        video_summary: data.videoSummary || null,
        overall_viral_potential: data.overallViralPotential || null,
        target_audience: data.targetAudience || null,
        content_category: data.contentCategory || null,
        status: "completed",
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setCurrentAnalysis(newAnalysis)
      setAnalyses([newAnalysis, ...analyses])
      toast.success(`Found ${data.clips?.length || 0} viral clips!`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze video")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="analyze" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analyze">Analyze Video</TabsTrigger>
          <TabsTrigger value="history">Previous Analyses</TabsTrigger>
        </TabsList>

        {/* Analyze Tab */}
        <TabsContent value="analyze" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Configuration */}
            <div className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-brand" />
                  Find Viral Clips
                </h3>

                <div className="space-y-4">
                  {/* Your Channel Videos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Your Videos</Label>
                      {!loadingVideos && channelVideos.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchChannelVideos}
                          className="h-6 px-2"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    {loadingVideos ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : videosError ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        {videosError}
                      </div>
                    ) : channelVideos.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                        {channelVideos.map((video) => (
                          <div
                            key={video.id}
                            onClick={() => {
                              setSelectedVideoId(video.id)
                              setVideoUrl("")
                            }}
                            className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedVideoId === video.id
                                ? "bg-brand/10 border border-brand"
                                : "bg-secondary/50 hover:bg-secondary border border-transparent"
                            }`}
                          >
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-24 h-14 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-2">
                                {video.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {formatViews(video.stats.views)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  {formatViews(video.stats.likes)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No videos found. Connect your YouTube channel in Settings.
                      </div>
                    )}
                  </div>

                  {channelVideos.length > 0 && (
                    <div className="text-center text-sm text-muted-foreground">or enter a URL</div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="video-url">YouTube URL</Label>
                    <Input
                      id="video-url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value)
                        if (e.target.value) setSelectedVideoId("")
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Number of clips to find</Label>
                    <Select value={maxClips} onValueChange={setMaxClips}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 clips</SelectItem>
                        <SelectItem value="5">5 clips</SelectItem>
                        <SelectItem value="7">7 clips</SelectItem>
                        <SelectItem value="10">10 clips</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Button
                onClick={analyzeVideo}
                disabled={analyzing || (!videoUrl && !selectedVideoId)}
                className="w-full bg-brand hover:bg-brand/90 h-12 text-lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Video...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Find Viral Clips
                  </>
                )}
              </Button>

              {analyzing && (
                <p className="text-sm text-muted-foreground text-center">
                  Gemini is watching and analyzing the video. This may take a minute...
                </p>
              )}
            </div>

            {/* Right: Results */}
            <div className="lg:col-span-2">
              {currentAnalysis ? (
                <div className="space-y-6">
                  {/* Video Summary */}
                  <Card className="p-6 bg-card border-border">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {currentAnalysis.video_title || "Video Analysis"}
                        </h3>
                        {currentAnalysis.video_summary && (
                          <p className="text-sm text-muted-foreground">{currentAnalysis.video_summary}</p>
                        )}
                      </div>
                      {currentAnalysis.overall_viral_potential && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-brand">
                            {currentAnalysis.overall_viral_potential}/10
                          </div>
                          <div className="text-xs text-muted-foreground">Viral Potential</div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      {currentAnalysis.content_category && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Video className="w-4 h-4" />
                          <span>{currentAnalysis.content_category}</span>
                        </div>
                      )}
                      {currentAnalysis.target_audience && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{currentAnalysis.target_audience}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Zap className="w-4 h-4" />
                        <span>{currentAnalysis.clips?.length || 0} clips found</span>
                      </div>
                    </div>
                  </Card>

                  {/* Clips List */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-brand" />
                      Viral Clip Recommendations
                    </h4>

                    {currentAnalysis.clips && currentAnalysis.clips.length > 0 ? (
                      currentAnalysis.clips.map((clip, index) => (
                        <ClipCard
                          key={index}
                          clip={clip}
                          videoId={currentAnalysis.video_id}
                          index={index}
                        />
                      ))
                    ) : (
                      <Card className="p-8 bg-card border-border text-center">
                        <p className="text-muted-foreground">No viral clips found in this video.</p>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <Card className="p-12 bg-card border-border h-full min-h-[400px]">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <div className="p-4 rounded-full bg-secondary mb-4">
                      <Scissors className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Find Viral Clips</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Enter a YouTube URL and Gemini AI will analyze the video to find the most viral-worthy
                      moments for YouTube Shorts, TikTok, and Instagram Reels.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Previous Analyses</h3>

          {analyses.length === 0 ? (
            <Card className="p-12 bg-card border-border">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-secondary mb-4">
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No analyses yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Your video analyses will appear here.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Card
                  key={analysis.id}
                  className="p-4 bg-card border-border hover:border-muted-foreground cursor-pointer transition-colors"
                  onClick={() => setCurrentAnalysis(analysis)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">
                        {analysis.video_title || `Video: ${analysis.video_id}`}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {analysis.clips?.length || 0} clips found
                        {analysis.content_category && ` • ${analysis.content_category}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {analysis.overall_viral_potential && (
                        <ScoreBadge score={analysis.overall_viral_potential} />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
