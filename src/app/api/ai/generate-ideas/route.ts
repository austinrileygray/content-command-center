import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/ai/generate-ideas
 * Generate content ideas using Anthropic Claude API
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "Prompt must be at least 3 characters" },
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

    // Call Anthropic Claude API
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
            content: `Generate 3 creative content ideas for a YouTube channel based on this topic: "${prompt}"

For each idea, provide:
1. A compelling title (50-60 characters)
2. A hook (one sentence that grabs attention)
3. A brief description (2-3 sentences)
4. Estimated video length in minutes (10-30)
5. Confidence score (0-100) based on potential virality

Format the response as a JSON array with this structure:
[
  {
    "title": "Title here",
    "hook": "Hook here",
    "description": "Description here",
    "estimated_length": 15,
    "confidence_score": 85,
    "format": "solo_youtube"
  },
  ...
]

Return ONLY the JSON array, no other text.`,
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
      // Fallback to template-based generation
      return NextResponse.json({
        ideas: generateTemplateIdeas(prompt),
        fallback: true,
      })
    }

    // Validate and format ideas
    const formattedIdeas = ideas
      .slice(0, 3)
      .map((idea: any) => ({
        title: idea.title || `Content idea about ${prompt}`,
        hook: idea.hook || `Learn about ${prompt}`,
        description: idea.description || `A comprehensive guide to ${prompt}`,
        format: idea.format || "solo_youtube",
        estimated_length: idea.estimated_length || 15,
        confidence_score: Math.min(100, Math.max(0, idea.confidence_score || 75)),
      }))

    return NextResponse.json({
      ideas: formattedIdeas,
      fallback: false,
    })
  } catch (error: any) {
    console.error("AI idea generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate ideas", fallback: true },
      { status: 500 }
    )
  }
}

/**
 * Fallback template-based idea generation
 */
function generateTemplateIdeas(prompt: string) {
  return [
    {
      title: `How to ${prompt}`,
      hook: `Learn the essential steps to ${prompt} in this comprehensive guide.`,
      description: `A detailed breakdown of ${prompt}, covering all the key aspects you need to know.`,
      format: "solo_youtube",
      confidence_score: 75,
      estimated_length: 15,
    },
    {
      title: `The Ultimate Guide to ${prompt}`,
      hook: `Everything you need to know about ${prompt} in one place.`,
      description: `Complete guide covering ${prompt} from basics to advanced strategies.`,
      format: "solo_youtube",
      confidence_score: 80,
      estimated_length: 20,
    },
    {
      title: `${prompt}: Common Mistakes to Avoid`,
      hook: `Avoid these critical mistakes when ${prompt}.`,
      description: `Learn from others' mistakes and avoid common pitfalls in ${prompt}.`,
      format: "solo_youtube",
      confidence_score: 70,
      estimated_length: 12,
    },
  ]
}


