import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ContentPattern, YouTubeVideo } from "@/types/database"

/**
 * POST /api/ai/generate-ideas-from-videos
 * Generate content ideas based on analyzed patterns from top performing videos
 */
export const maxDuration = 60 // Vercel Pro plan max
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { userPrompt, count = 3 } = await request.json()
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

    // Get stored patterns
    const { data: patterns, error: patternsError } = await supabase
      .from("content_patterns")
      .select("*")
      .eq("user_id", userId)
      .order("average_performance_score", { ascending: false })

    if (patternsError || !patterns || patterns.length === 0) {
      return NextResponse.json(
        { error: "No patterns found. Please analyze your videos first." },
        { status: 404 }
      )
    }

    // Get top videos for context
    const { data: topVideos } = await supabase
      .from("youtube_videos")
      .select("title, description, performance_score")
      .eq("user_id", userId)
      .not("performance_score", "is", null)
      .order("performance_score", { ascending: false })
      .limit(5)

    // Prepare pattern data for Claude
    const patternSummary = patterns.map((p: ContentPattern) => ({
      type: p.pattern_type,
      name: p.pattern_name,
      data: p.pattern_data,
      impact: p.performance_impact,
      avgScore: p.average_performance_score,
    }))

    const topVideoExamples = (topVideos || []).map((v: any) => ({
      title: v.title || '',
      description: v.description || '',
      score: v.performance_score || 0,
    }))

    const prompt = `You are a content strategist analyzing successful YouTube videos to generate new content ideas.

PROVEN PATTERNS FROM TOP PERFORMING VIDEOS:
${JSON.stringify(patternSummary, null, 2)}

TOP VIDEO EXAMPLES:
${JSON.stringify(topVideoExamples, null, 2)}

${userPrompt ? `USER'S TOPIC FOCUS: ${userPrompt}\n\n` : ''}TASK: Generate ${count} new content ideas that:
1. Match the proven patterns identified above
2. Use successful title structures and hook patterns
3. Target similar topics that performed well
4. Are fresh and original (not duplicates of existing videos)
5. Have high potential for virality based on the patterns

For each idea, provide:
- title: Compelling title (50-60 characters) using proven patterns
- hook: One sentence hook that grabs attention
- description: Brief description (2-3 sentences)
- estimated_length: Video length in minutes (10-30)
- confidence_score: 0-100 based on how well it matches proven patterns
- format: "solo_youtube" or "guest_interview"
- why_this_will_work: Explanation of which patterns this idea uses and why it should perform well

Return ONLY a valid JSON array. Example format:
[
  {
    "title": "How I Built a $50k/Month Business with AI Automation",
    "hook": "I spent 6 months testing every AI tool. Here's what actually works.",
    "description": "Deep dive into the exact AI tools and workflows I use to automate my business. Real numbers, real results.",
    "estimated_length": 18,
    "confidence_score": 92,
    "format": "solo_youtube",
    "why_this_will_work": "Uses 'How I [Achievement]' title pattern (avg score: 87.5). Matches top-performing topic: AI automation. Personal achievement with specific numbers performs 2x better."
  }
]

Return ONLY the JSON array, no other text.`

    // Call Claude API
    const modelsToTry = [
      "claude-opus-4-5-20251101",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620",
    ]

    let lastError: any = null
    let response: Response | null = null
    let data: any = null

    for (const model of modelsToTry) {
      try {
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 4000,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        })

        if (response.ok) {
          data = await response.json()
          break
        } else {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: { message: errorText } }
          }
          lastError = errorData
        }
      } catch (error: any) {
        lastError = error
      }
    }

    if (!data || !response || !response.ok) {
      throw new Error(lastError?.error?.message || "Failed to generate ideas")
    }

    const content = data.content[0].text

    // Parse JSON from response
    let ideas
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0])
      } else {
        ideas = JSON.parse(content)
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      )
    }

    // Validate and format ideas
    const formattedIdeas = ideas
      .slice(0, count)
      .map((idea: any) => ({
        title: idea.title || "Untitled Idea",
        hook: idea.hook || "",
        description: idea.description || "",
        format: idea.format || "solo_youtube",
        estimated_length: idea.estimated_length || 15,
        confidence_score: Math.min(100, Math.max(0, idea.confidence_score || 75)),
        why_this_will_work: idea.why_this_will_work || "",
      }))

    return NextResponse.json({
      ideas: formattedIdeas,
      patternsUsed: patternSummary.length,
      fallback: false,
    })
  } catch (error: any) {
    console.error("AI idea generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate ideas" },
      { status: 500 }
    )
  }
}



