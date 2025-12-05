import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenAI } from "@google/genai"

interface AnalyzeRequest {
  videoId: string
  videoUrl?: string
  videoTitle?: string
  minClipDuration?: number // in seconds
  maxClips?: number
}

interface ViralClip {
  startTime: number // seconds
  endTime: number // seconds
  duration: number
  score: number // 1-10 viral potential
  reason: string
  hook: string // suggested hook text
  suggestedCaption: string
  emotionalPeak: string
  thumbnailTimestamp: number
}

const MODEL_ID = "gemini-2.0-flash"

/**
 * POST /api/viral-clips/analyze
 * Analyze a YouTube video using Gemini to find the most viral clips
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json()
    const {
      videoId,
      videoUrl,
      videoTitle,
      minClipDuration = 15,
      maxClips = 5
    } = body

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Initialize Google GenAI
    const ai = new GoogleGenAI({ apiKey })

    // Build the YouTube URL for Gemini to analyze
    const youtubeUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`

    // Create the analysis prompt
    const analysisPrompt = `You are an expert viral content analyst specializing in YouTube Shorts and TikTok clips.

Analyze this YouTube video and identify the ${maxClips} most viral-worthy clip segments that would perform well as short-form content (YouTube Shorts, TikTok, Instagram Reels).

Video: ${youtubeUrl}
${videoTitle ? `Title: ${videoTitle}` : ''}

For each viral clip segment, identify:
1. **Timestamps**: Exact start and end times (in seconds)
2. **Viral Score**: Rate 1-10 based on viral potential
3. **Why It's Viral**: What makes this moment engaging (emotional peak, surprising moment, valuable insight, funny moment, controversial take, etc.)
4. **Hook**: A compelling opening line/text overlay for the first 1-3 seconds
5. **Caption**: Suggested social media caption with relevant hashtags
6. **Emotional Peak**: The key emotion this clip evokes
7. **Thumbnail Timestamp**: Best frame to use as thumbnail (in seconds)

Criteria for viral clips:
- Strong emotional reaction (humor, shock, inspiration, curiosity)
- Clear value proposition or takeaway
- Works as standalone content without context
- Has a natural hook in the first 3 seconds
- Minimum duration: ${minClipDuration} seconds
- Maximum duration: 60 seconds (ideal for Shorts/Reels)

Return your analysis as a JSON array with this exact structure:
{
  "clips": [
    {
      "startTime": <number in seconds>,
      "endTime": <number in seconds>,
      "duration": <number in seconds>,
      "score": <1-10>,
      "reason": "<why this segment is viral-worthy>",
      "hook": "<suggested hook text>",
      "suggestedCaption": "<caption with hashtags>",
      "emotionalPeak": "<primary emotion>",
      "thumbnailTimestamp": <best frame timestamp in seconds>
    }
  ],
  "videoSummary": "<brief summary of the video content>",
  "overallViralPotential": <1-10>,
  "targetAudience": "<who would engage most with this content>",
  "contentCategory": "<category like education, entertainment, tutorial, etc>"
}

Only return valid JSON, no additional text or markdown.`

    // Call Gemini with the video URL
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          text: analysisPrompt,
        },
      ],
    })

    // Extract the response text
    let analysisText = ""
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          analysisText += part.text
        }
      }
    }

    if (!analysisText) {
      return NextResponse.json(
        { error: "No analysis generated" },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let analysisResult
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanedText = analysisText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      analysisResult = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", analysisText)
      return NextResponse.json(
        { error: "Failed to parse analysis results", raw: analysisText },
        { status: 500 }
      )
    }

    // Store the analysis in the database
    const { data: analysisRecord, error: insertError } = await supabase
      .from("viral_clip_analyses")
      .insert({
        user_id: "default",
        video_id: videoId,
        video_url: youtubeUrl,
        video_title: videoTitle || null,
        clips: analysisResult.clips || [],
        video_summary: analysisResult.videoSummary || null,
        overall_viral_potential: analysisResult.overallViralPotential || null,
        target_audience: analysisResult.targetAudience || null,
        content_category: analysisResult.contentCategory || null,
        status: "completed",
      })
      .select()
      .single()

    if (insertError) {
      console.error("Failed to save analysis:", insertError)
      // Continue anyway - we can still return the results
    }

    return NextResponse.json({
      success: true,
      analysisId: analysisRecord?.id,
      videoId,
      videoUrl: youtubeUrl,
      ...analysisResult,
    })
  } catch (error: any) {
    console.error("Viral clip analysis error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to analyze video" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/viral-clips/analyze
 * Get previous analyses for a video
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from("viral_clip_analyses")
      .select("*")
      .order("created_at", { ascending: false })

    if (videoId) {
      query = query.eq("video_id", videoId)
    }

    const { data, error } = await query.limit(20)

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch analyses" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analyses: data || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch analyses" },
      { status: 500 }
    )
  }
}
