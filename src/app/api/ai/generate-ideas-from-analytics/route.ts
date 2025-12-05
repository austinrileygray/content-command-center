import { NextRequest, NextResponse } from "next/server"

interface VideoData {
  id: string
  title: string
  description: string
  views: number
  likes: number
  comments: number
  engagementRate: number
  performanceScore: number
}

/**
 * POST /api/ai/generate-ideas-from-analytics
 * Generate content ideas based on top-performing YouTube videos
 */
export async function POST(request: NextRequest) {
  try {
    const { videos, count = 3 } = await request.json() as {
      videos: VideoData[]
      count?: number
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { error: "No video data provided" },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      )
    }

    // Build context about top performing videos
    const videoContext = videos.map((v, i) =>
      `${i + 1}. "${v.title}"
   - Views: ${v.views.toLocaleString()}
   - Engagement Rate: ${v.engagementRate}%
   - Performance Score: ${v.performanceScore}/100
   - Description: ${v.description.substring(0, 150)}...`
    ).join("\n\n")

    // Extract common themes for the prompt
    const titles = videos.map(v => v.title).join(", ")

    const prompt = `You are a YouTube content strategist. Analyze these top-performing videos from a channel and generate ${count} new content ideas that build on what's working.

## Top Performing Videos (sorted by performance):

${videoContext}

## Your Task:

Based on the patterns in these successful videos, generate ${count} NEW content ideas that:
1. Build on proven topics that resonate with this audience
2. Explore related angles or go deeper on successful topics
3. Address potential follow-up questions viewers might have
4. Could realistically outperform the existing content

For each idea, consider:
- What made the original videos successful (topic, format, hook)
- Gaps or follow-up content opportunities
- Seasonal or trending relevance
- Cross-pollination between successful topics

## Response Format:

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Compelling title (50-60 chars)",
    "hook": "One attention-grabbing sentence",
    "description": "2-3 sentences explaining the video concept",
    "format": "solo_youtube",
    "estimated_length": 15,
    "confidence_score": 85,
    "why_this_will_work": "Brief explanation of why this should perform well based on the analytics",
    "inspired_by": "Title of the source video this builds on"
  }
]

Generate ideas that could realistically get similar or better performance than the source videos.`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Anthropic API error:", error)
      return NextResponse.json(
        { error: "Failed to generate ideas from AI" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse the JSON response
    let ideas
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0])
      } else {
        ideas = JSON.parse(content)
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      console.error("Raw content:", content)
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      )
    }

    // Validate and format ideas, linking to source videos
    const formattedIdeas = ideas.slice(0, count).map((idea: any) => {
      // Find the source video ID based on the "inspired_by" title
      const sourceVideo = videos.find(v =>
        v.title.toLowerCase().includes(idea.inspired_by?.toLowerCase()?.substring(0, 20) || "") ||
        idea.inspired_by?.toLowerCase()?.includes(v.title.toLowerCase().substring(0, 20))
      )

      return {
        title: idea.title || "New content idea",
        hook: idea.hook || "",
        description: idea.description || "",
        format: idea.format || "solo_youtube",
        estimated_length: idea.estimated_length || 15,
        confidence_score: Math.min(100, Math.max(0, idea.confidence_score || 75)),
        why_this_will_work: idea.why_this_will_work || "",
        source_inspiration: idea.inspired_by || null,
        source_video_id: sourceVideo?.id || null,
      }
    })

    return NextResponse.json({
      ideas: formattedIdeas,
      analyzed_videos: videos.length,
    })
  } catch (error: any) {
    console.error("Analytics idea generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate ideas" },
      { status: 500 }
    )
  }
}
