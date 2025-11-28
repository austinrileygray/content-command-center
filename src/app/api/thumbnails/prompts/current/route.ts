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
 * GET /api/thumbnails/prompts/current?category=youtube
 * Get the current active prompt template
 */
export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category") || "youtube"

    if (!["youtube", "short_form"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'youtube' or 'short_form'" },
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

    // Get current active template
    const { data: template, error } = await supabase
      .from("thumbnail_prompt_templates")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("is_active", true)
      .single()

    if (error || !template) {
      return NextResponse.json(
        { error: "No active prompt template found. Please initialize first." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error: any) {
    console.error("Get prompt error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get prompt" },
      { status: 500 }
    )
  }
}
