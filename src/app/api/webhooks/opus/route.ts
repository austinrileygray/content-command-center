import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Opus Clip webhook payload structure
    // Adjust based on actual Opus Clip webhook format
    const { projectId, clips, status } = body

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing project ID" },
        { status: 400 }
      )
    }

    // Find content idea by opus_project_id
    const { data: idea } = await supabase
      .from("content_ideas")
      .select("*")
      .eq("opus_project_id", projectId)
      .single()

    if (!idea) {
      return NextResponse.json(
        { error: "Content idea not found" },
        { status: 404 }
      )
    }

    if (status === "completed" && clips && Array.isArray(clips)) {
      // Create asset entries for each clip
      const assetPromises = clips.map((clip: any) =>
        supabase.from("assets").insert({
          content_idea_id: idea.id,
          type: "clip",
          status: "ready",
          title: clip.title || `Clip ${clip.index || ""}`,
          file_url: clip.url || clip.downloadUrl,
          metadata: clip,
          platform: "opus",
        })
      )

      await Promise.all(assetPromises)

      // Update content idea status if all processing is done
      await supabase
        .from("content_ideas")
        .update({
          status: "ready_to_publish",
          updated_at: new Date().toISOString(),
        })
        .eq("id", idea.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Opus webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
