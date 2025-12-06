import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // SquadCast webhook payload structure
    // Adjust based on actual SquadCast webhook format
    const { recordingId, recordingUrl, title, duration, transcript, participants } = body

    if (!recordingId || !recordingUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Find content idea by recording_url or scheduled recording
    const { data: idea } = await supabase
      .from("content_ideas")
      .select("*")
      .eq("recording_platform", "squadcast")
      .in("status", ["scheduled", "recording"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (idea) {
      // Update content idea with recording info
      await supabase
        .from("content_ideas")
        .update({
          recording_url: recordingUrl,
          transcript: transcript || null,
          status: "processing",
          recorded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", idea.id)

      // Create recording entry
      await supabase.from("recordings").insert({
        content_idea_id: idea.id,
        platform: "squadcast",
        external_id: recordingId,
        external_url: recordingUrl,
        status: "completed",
        actual_end: new Date().toISOString(),
        duration: duration ? Math.floor(duration / 60) : null,
        recording_urls: { squadcast: recordingUrl },
        transcript_url: transcript ? recordingUrl : null,
        webhook_payload: body,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("SquadCast webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


