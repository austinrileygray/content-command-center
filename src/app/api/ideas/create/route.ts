import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/ideas/create
 * Create a new content idea with Zapier webhook trigger
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Get user profile
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single()

    if (!profiles) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    // Create content idea
    const { data: idea, error } = await supabase
      .from("content_ideas")
      .insert({
        user_id: profiles.id,
        ...body,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating idea:", error)
      return NextResponse.json(
        { error: "Failed to create idea", details: error.message },
        { status: 500 }
      )
    }

    // Trigger Zapier webhook for idea created
    const { triggerZapierWebhookAsync } = await import("@/lib/zapier")
    triggerZapierWebhookAsync('idea.created', {
      ideaId: idea.id,
      title: idea.title,
      format: idea.format,
      status: idea.status,
      created_at: idea.created_at,
    })

    return NextResponse.json({
      success: true,
      idea,
      message: "Idea created successfully",
    })
  } catch (error: any) {
    console.error("Create idea error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create idea" },
      { status: 500 }
    )
  }
}









