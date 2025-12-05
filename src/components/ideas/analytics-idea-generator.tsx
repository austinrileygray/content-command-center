"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BarChart3,
  Loader2,
  Sparkles,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageSquare,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ContentIdea } from "@/types/database";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
    duration: string;
  };
  performanceScore: number;
  engagementRate: number;
}

interface GeneratedIdea extends Partial<ContentIdea> {
  why_this_will_work?: string;
  source_inspiration?: string;
  source_video_id?: string;
}

interface AnalyticsIdeaGeneratorProps {
  onIdeaGenerated?: (idea: ContentIdea) => void;
}

export function AnalyticsIdeaGenerator({
  onIdeaGenerated,
}: AnalyticsIdeaGeneratorProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(
    new Set()
  );
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [youtubeConnected, setYoutubeConnected] = useState<boolean | null>(
    null
  );
  const [totalVideos, setTotalVideos] = useState(0);

  // Check YouTube connection status when dialog opens
  useEffect(() => {
    if (open) {
      checkYouTubeConnection();
    }
  }, [open]);

  const checkYouTubeConnection = async () => {
    try {
      const response = await fetch("/api/auth/youtube/status");
      const data = await response.json();
      setYoutubeConnected(data.connected);

      if (data.connected) {
        fetchTopVideos();
      }
    } catch (err) {
      setYoutubeConnected(false);
    }
  };

  const fetchTopVideos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/youtube/top-videos?limit=20");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch videos");
      }

      setVideos(data.videos || []);
      setTotalVideos(data.total || 0);

      // Auto-select top 5 videos
      const topIds = (data.videos || [])
        .slice(0, 5)
        .map((v: YouTubeVideo) => v.id);
      setSelectedVideoIds(new Set(topIds));
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch YouTube videos");
    } finally {
      setLoading(false);
    }
  };

  const toggleVideo = (videoId: string) => {
    const newSet = new Set(selectedVideoIds);
    if (newSet.has(videoId)) {
      newSet.delete(videoId);
    } else {
      newSet.add(videoId);
    }
    setSelectedVideoIds(newSet);
  };

  const selectAll = () => {
    setSelectedVideoIds(new Set(videos.map((v) => v.id)));
  };

  const selectNone = () => {
    setSelectedVideoIds(new Set());
  };

  const generateIdeas = async () => {
    if (selectedVideoIds.size === 0) {
      toast.error("Please select at least one video");
      return;
    }

    setGenerating(true);
    setGeneratedIdeas([]);

    try {
      const selectedVideos = videos
        .filter((v) => selectedVideoIds.has(v.id))
        .map((v) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          views: v.stats.views,
          likes: v.stats.likes,
          comments: v.stats.comments,
          engagementRate: v.engagementRate,
          performanceScore: v.performanceScore,
        }));

      const response = await fetch("/api/ai/generate-ideas-from-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videos: selectedVideos,
          count: 3,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate ideas");
      }

      toast.success(
        `Generated ${data.ideas.length} ideas from ${data.analyzed_videos} videos!`
      );
      setGeneratedIdeas(data.ideas || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate ideas");
    } finally {
      setGenerating(false);
    }
  };

  const saveIdea = async (idea: GeneratedIdea) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single();

      if (!profile) {
        toast.error("User profile not found");
        return;
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
          source_inspiration: idea.source_inspiration || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Idea saved!");
      router.refresh();

      if (onIdeaGenerated && data) {
        onIdeaGenerated(data);
      }
    } catch (error: any) {
      toast.error("Failed to save idea");
      console.error(error);
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="w-4 h-4" />
          From Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand" />
            Generate Ideas from Top Performing Videos
          </DialogTitle>
          <DialogDescription>
            Analyze your best YouTube content and generate new ideas based on
            what's working.
          </DialogDescription>
        </DialogHeader>

        {youtubeConnected === false ? (
          <div className="text-center py-8">
            <Youtube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">
              YouTube Not Connected
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your YouTube channel to analyze your top performing
              videos.
            </p>
            <Button
              onClick={() => {
                setOpen(false);
                router.push("/settings");
              }}
            >
              Go to Settings
            </Button>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-brand mb-4" />
            <p className="text-sm text-muted-foreground">
              Fetching your YouTube videos...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Selection */}
            {videos.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Your Top Videos ({totalVideos} total)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedVideoIds.size} selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={selectNone}>
                      Select None
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto border border-border rounded-lg p-2">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedVideoIds.has(video.id)
                          ? "bg-brand/10 border border-brand/30"
                          : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                      }`}
                      onClick={() => toggleVideo(video.id)}
                    >
                      <Checkbox
                        checked={selectedVideoIds.has(video.id)}
                        onChange={() => toggleVideo(video.id)}
                        className="mt-1"
                      />
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-24 h-14 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm truncate">
                          {video.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatViews(video.stats.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {formatViews(video.stats.likes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {video.stats.comments}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            video.performanceScore >= 80
                              ? "default"
                              : "secondary"
                          }
                        >
                          {video.performanceScore}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {video.engagementRate}% eng
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={generateIdeas}
                  disabled={generating || selectedVideoIds.size === 0}
                  className="w-full bg-brand hover:bg-brand/90"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing & Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Ideas from {selectedVideoIds.size} Video
                      {selectedVideoIds.size !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </>
            )}

            {videos.length === 0 && !loading && youtubeConnected && (
              <div className="text-center py-8">
                <Youtube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">
                  No Videos Found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload some videos to your YouTube channel to get started.
                </p>
              </div>
            )}

            {/* Generated Ideas */}
            {generatedIdeas.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand" />
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
                            <p className="text-sm text-muted-foreground mb-2">
                              {idea.hook}
                            </p>
                          )}
                          {idea.description && (
                            <p className="text-xs text-muted-foreground">
                              {idea.description}
                            </p>
                          )}
                        </div>
                        {idea.confidence_score && (
                          <Badge variant="outline" className="ml-2">
                            {idea.confidence_score}% confidence
                          </Badge>
                        )}
                      </div>

                      {idea.why_this_will_work && (
                        <div className="p-2 bg-green-500/10 rounded text-xs text-green-400">
                          <strong>Why this will work:</strong>{" "}
                          {idea.why_this_will_work}
                        </div>
                      )}

                      {idea.source_inspiration && (
                        <p className="text-xs text-muted-foreground">
                          <span className="text-brand">Inspired by:</span>{" "}
                          {idea.source_inspiration}
                        </p>
                      )}

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
                            router.push(
                              `/ideas?new=true&title=${encodeURIComponent(
                                idea.title || ""
                              )}&hook=${encodeURIComponent(idea.hook || "")}`
                            );
                            setOpen(false);
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
                <strong>How it works:</strong> We analyze your top performing
                videos by views, engagement rate, and overall performance.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
