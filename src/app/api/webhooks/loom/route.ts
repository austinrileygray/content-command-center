import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Loom webhook payload structure
    // Adjust based on actual Loom webhook format
    const { videoId, videoUrl, title, duration, transcript } = body

    if (!videoId || !videoUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Find content idea by recording_url or create new recording entry
    const { data: idea } = await supabase
      .from("content_ideas")
      .select("*")
      .eq("recording_platform", "loom")
      .eq("status", "recording")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (idea) {
      // Update content idea with recording info
      await supabase
        .from("content_ideas")
        .update({
          recording_url: videoUrl,
          transcript: transcript || null,
          status: "processing",
          recorded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", idea.id)

      // Create recording entry
      await supabase.from("recordings").insert({
        content_idea_id: idea.id,
        platform: "loom",
        external_id: videoId,
        external_url: videoUrl,
        status: "completed",
        actual_end: new Date().toISOString(),
        duration: duration ? Math.floor(duration / 60) : null, // Convert to minutes
        recording_urls: { loom: videoUrl },
        transcript_url: transcript ? videoUrl : null,
        webhook_payload: body,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Loom webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
