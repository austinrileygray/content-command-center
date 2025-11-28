import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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
 * POST /api/thumbnails/prompts/initialize
 * Initialize the base prompt template from user's mega prompt
 * Breaks it into modular sections
 */
export async function POST(request: NextRequest) {
  try {
    const { category, megaPrompt } = await request.json()

    if (!category || !["youtube", "short_form"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'youtube' or 'short_form'" },
        { status: 400 }
      )
    }

    if (!megaPrompt || typeof megaPrompt !== "string" || megaPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Mega prompt is required" },
        { status: 400 }
      )
    }

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

    // Use Claude to break the mega prompt into modular sections
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      )
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8000,
        messages: [
          {
            role: "user",
            content: `You are analyzing a comprehensive thumbnail generation prompt for ${category} content. Your task is to break this mega prompt into logical, independent modular sections.

MEGA PROMPT:
${megaPrompt.substring(0, 200000)}${megaPrompt.length > 200000 ? '\n\n[... prompt truncated for length ...]' : ''}

INSTRUCTIONS:
Break this prompt into logical, independent sections that can be updated separately. Focus on extracting the thumbnail-specific content. Common sections include:
- color_palette: Color schemes, brand colors, contrast requirements, specific hex codes
- text_style: Font choices, text placement, word limits, capitalization rules
- layout: Composition rules, element placement, rule of thirds, positioning guidelines
- visual_elements: Subject positioning, background style, props, equipment visuals
- emotion_tone: Emotional impact, mood, energy level, facial expressions
- technical_specs: Resolution, aspect ratio, file format requirements
- best_practices: General guidelines, what to avoid, proven patterns
- thumbnail_formulas: Specific formulas and structures (e.g., Style A, Style B, Style C)
- element_library: Visual elements to include (equipment, software, etc.)
- language_guidelines: Industry-specific terminology and preferred wording

CRITICAL: Return ONLY a valid JSON object with this exact structure:
{
  "sections": {
    "section_name": {
      "content": "Detailed content for this section extracted from the prompt...",
      "last_updated": "${new Date().toISOString()}",
      "updated_by": "initial"
    }
  }
}

Do NOT include any markdown formatting, code blocks, or explanatory text. Return ONLY the raw JSON object.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: { message: errorText } }
      }
      console.error("Anthropic API error:", errorData)
      return NextResponse.json(
        { 
          error: "Failed to analyze prompt",
          details: errorData.error?.message || errorText || "Unknown error"
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse the JSON response
    let parsedSections
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedSections = JSON.parse(jsonMatch[0])
      } else {
        parsedSections = JSON.parse(content)
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      console.error("Raw response content:", content.substring(0, 500))
      return NextResponse.json(
        { 
          error: "Failed to parse prompt sections",
          details: parseError instanceof Error ? parseError.message : "Invalid JSON response",
          rawContent: content.substring(0, 1000) // Include first 1000 chars for debugging
        },
        { status: 500 }
      )
    }

    // Check if template already exists
    const { data: existing } = await supabase
      .from("thumbnail_prompt_templates")
      .select("id, version_number")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("is_active", true)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Prompt template already exists. Use update endpoint instead." },
        { status: 400 }
      )
    }

    // Create initial template
    const { data: template, error: templateError } = await supabase
      .from("thumbnail_prompt_templates")
      .insert({
        user_id: userId,
        category,
        sections: parsedSections.sections,
        version_number: 1,
        is_active: true,
      })
      .select()
      .single()

    if (templateError) {
      console.error("Template creation error:", templateError)
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      )
    }

    // Save to version history
    await supabase.from("thumbnail_prompt_versions").insert({
      user_id: userId,
      category,
      sections: parsedSections.sections,
      version_number: 1,
      change_summary: "Initial prompt template created",
      change_type: "initial",
      changed_sections: Object.keys(parsedSections.sections),
      created_by: "user",
    })

    return NextResponse.json({
      success: true,
      template,
      sections: parsedSections.sections,
      message: "Prompt template initialized successfully",
    })
  } catch (error: any) {
    console.error("Prompt initialization error:", error)
    return NextResponse.json(
      { 
        error: error.message || "Failed to initialize prompt",
        details: error.stack || "Unknown error occurred"
      },
      { status: 500 }
    )
  }
}
