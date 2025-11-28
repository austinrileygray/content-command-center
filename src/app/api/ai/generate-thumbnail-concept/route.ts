import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role for generation to bypass RLS
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
 * POST /api/ai/generate-thumbnail-concept
 * Generates thumbnail concept based on content idea and learned patterns
 */
export async function POST(request: NextRequest) {
  try {
    const { contentIdeaId, category = "youtube" } = await request.json()

    if (!contentIdeaId) {
      return NextResponse.json(
        { error: "Content idea ID is required" },
        { status: 400 }
      )
    }

    if (!["youtube", "short_form"].includes(category)) {
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

    // Get content idea
    const { data: contentIdea, error: ideaError } = await supabase
      .from("content_ideas")
      .select("title, description, hook")
      .eq("id", contentIdeaId)
      .single()

    if (ideaError || !contentIdea) {
      return NextResponse.json(
        { error: "Content idea not found" },
        { status: 404 }
      )
    }

    // Get training insights
    const { data: insights } = await supabase
      .from("thumbnail_training_insights")
      .select("learned_patterns, preferences, requirements")
      .eq("user_id", userId)
      .eq("category", category)
      .single()

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      )
    }

    // Build context from training insights
    let trainingContext = ""
    if (insights) {
      trainingContext = `
TRAINING DATA (Learn from these patterns):

Learned Patterns:
${(insights.learned_patterns || []).map((p: string) => `- ${p}`).join("\n")}

User Preferences:
Likes: ${(insights.preferences?.likes || []).join(", ") || "None specified"}
Dislikes: ${(insights.preferences?.dislikes || []).join(", ") || "None specified"}

Requirements:
${Object.entries(insights.requirements || {}).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "None specified"}
`
    } else {
      trainingContext = "\nNote: No training data available yet. Use general best practices for thumbnail design."
    }

    // Generate thumbnail concept with Claude
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
            content: `Generate a detailed thumbnail concept for a ${category} video based on the content idea below.

${trainingContext}

CONTENT IDEA:
Title: ${contentIdea.title}
Hook: ${contentIdea.hook || "N/A"}
Description: ${contentIdea.description || "N/A"}

Create a thumbnail concept that:
1. Follows the learned patterns and preferences from training data
2. Is optimized for ${category === "short_form" ? "vertical/short-form" : "horizontal/YouTube"} format
3. Is eye-catching and click-worthy
4. Accurately represents the content

Provide a detailed thumbnail concept in this JSON format:
{
  "mainText": "Primary text overlay (3-5 words max)",
  "subText": "Secondary text (optional, 2-3 words)",
  "visualDescription": "Detailed description of the visual elements, composition, and scene",
  "emotionToConvey": "The emotion or feeling the thumbnail should evoke",
  "colorScheme": ["primary color", "secondary color", "accent color"],
  "composition": "Description of layout and element placement",
  "keyElements": ["element 1", "element 2", "element 3"],
  "styleNotes": "Any specific style requirements based on training"
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
        { error: "Failed to generate thumbnail concept" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse the JSON response
    let concept
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        concept = JSON.parse(jsonMatch[0])
      } else {
        concept = JSON.parse(content)
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json(
        { error: "Failed to parse thumbnail concept" },
        { status: 500 }
      )
    }

    // Update content idea with thumbnail concept
    await supabase
      .from("content_ideas")
      .update({
        thumbnail_concept: concept,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentIdeaId)

    return NextResponse.json({
      concept,
      success: true,
    })
  } catch (error: any) {
    console.error("Thumbnail generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate thumbnail concept" },
      { status: 500 }
    )
  }
}
