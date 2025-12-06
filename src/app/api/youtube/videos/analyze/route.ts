import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeVideoPatterns } from "@/lib/pattern-analyzer"
import { getTopPerformingVideos } from "@/lib/youtube-videos"
import type { YouTubeVideo } from "@/types/database"

/**
 * POST /api/youtube/videos/analyze
 * Analyze top performing videos and extract patterns
 */
export const maxDuration = 60 // Vercel Pro plan max
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { limit = 10 } = await request.json()
    const supabase = await createClient()

    // Get API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      )
    }

    // Get user profile
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const userId = profiles[0].id

    // Get top performing videos
    const { data: videos, error: videosError } = await supabase
      .from("youtube_videos")
      .select("*")
      .eq("user_id", userId)
      .not("performance_score", "is", null)
      .order("performance_score", { ascending: false })
      .limit(limit)

    if (videosError || !videos || videos.length === 0) {
      return NextResponse.json(
        { error: "No videos with performance scores found. Please fetch analytics first." },
        { status: 404 }
      )
    }

    // Convert to format expected by pattern analyzer
    const topVideos = videos.map((video: YouTubeVideo) => ({
      videoId: video.video_id,
      title: video.title,
      description: video.description || '',
      views: video.views,
      likes: video.likes,
      comments: video.comments,
      engagementRate: video.engagement_rate || 0,
      performanceScore: video.performance_score || 0,
      publishedAt: video.published_at || '',
      tags: video.tags || [],
    }))

    // Analyze patterns using Claude
    const patterns = await analyzeVideoPatterns(apiKey, topVideos, limit)

    // Save patterns to database (clear old patterns first)
    await supabase
      .from("content_patterns")
      .delete()
      .eq("user_id", userId)

    // Insert new patterns
    const patternsToInsert = patterns.map(pattern => ({
      user_id: userId,
      pattern_type: pattern.patternType,
      pattern_name: pattern.patternName,
      pattern_data: pattern.patternData,
      performance_impact: pattern.performanceImpact,
      video_count: pattern.videoCount,
      average_performance_score: pattern.averagePerformanceScore,
    }))

    const { error: insertError } = await supabase
      .from("content_patterns")
      .insert(patternsToInsert)

    if (insertError) {
      console.error("Error inserting patterns:", insertError)
      return NextResponse.json(
        { error: "Failed to save patterns" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      patterns: patterns.length,
      patternsData: patterns,
      message: `Successfully analyzed ${videos.length} videos and extracted ${patterns.length} patterns`,
    })
  } catch (error: any) {
    console.error("Video analysis error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to analyze videos" },
      { status: 500 }
    )
  }
}


