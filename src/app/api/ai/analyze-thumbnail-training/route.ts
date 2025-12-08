import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role for analysis to bypass RLS
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * POST /api/ai/analyze-thumbnail-training
 * Analyzes all thumbnail training notes to extract patterns and preferences
 */
export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json()

    if (!category || !["youtube", "short_form"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'youtube' or 'short_form'" },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS
    const supabase = getSupabaseAdmin()

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

    // Get all approved thumbnails with notes for this category
    const { data: thumbnails, error } = await supabase
      .from("thumbnail_training")
      .select("notes, performance_metrics, tags, source_video_title")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("approved", true)
      .not("notes", "is", null)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch training data" },
        { status: 500 }
      )
    }

    if (!thumbnails || thumbnails.length === 0) {
      return NextResponse.json({
        insights: {
          learned_patterns: [],
          preferences: {},
          requirements: {},
          message: "No training data available yet. Upload thumbnails with notes to start training.",
        },
      })
    }

    // Extract all notes
    const notes = thumbnails
      .map((t) => t.notes)
      .filter(Boolean)
      .join("\n\n")

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      )
    }

    // Analyze notes with Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `Analyze the following thumbnail training notes and extract patterns, preferences, and requirements for ${category} thumbnails.

Training Notes:
${notes}

Extract and organize the following information:

1. **Learned Patterns** - What visual elements, styles, or compositions work well?
2. **Preferences** - What does the user like? What do they dislike?
3. **Requirements** - Technical requirements (resolution, format, etc.) and constraints

Format your response as a JSON object with this structure:
{
  "learned_patterns": [
    "Pattern 1 description",
    "Pattern 2 description"
  ],
  "preferences": {
    "likes": ["element 1", "element 2"],
    "dislikes": ["element 1", "element 2"]
  },
  "requirements": {
    "resolution": "requirement",
    "format": "requirement",
    "other": "requirement"
  }
}

Return ONLY the JSON object, no other text.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Anthropic API error:", error)
      return NextResponse.json(
        { error: "Failed to analyze training data" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse the JSON response
    let insights
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0])
      } else {
        insights = JSON.parse(content)
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json(
        { error: "Failed to parse AI analysis" },
        { status: 500 }
      )
    }

    // Save insights to database
    const { data: existingInsight } = await supabase
      .from("thumbnail_training_insights")
      .select("id")
      .eq("user_id", userId)
      .eq("category", category)
      .single()

    if (existingInsight) {
      await supabase
        .from("thumbnail_training_insights")
        .update({
          learned_patterns: insights.learned_patterns || [],
          preferences: insights.preferences || {},
          requirements: insights.requirements || {},
          last_analyzed_at: new Date().toISOString(),
        })
        .eq("id", existingInsight.id)
    } else {
      await supabase
        .from("thumbnail_training_insights")
        .insert({
          user_id: userId,
          category,
          learned_patterns: insights.learned_patterns || [],
          preferences: insights.preferences || {},
          requirements: insights.requirements || {},
        })
    }

    return NextResponse.json({
      insights,
      analyzed_count: thumbnails.length,
    })
  } catch (error: any) {
    console.error("Training analysis error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to analyze training data" },
      { status: 500 }
    )
  }
}



