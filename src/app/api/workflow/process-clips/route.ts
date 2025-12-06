import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSubmagicClient } from "@/lib/submagic"

/**
 * POST /api/workflow/process-clips
 * Step 2 of workflow: Generate clips from edited video
 * Called after editing is complete or if editing is skipped
 */
export const maxDuration = 300 // 5 minutes
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { contentIdeaId, recordingId } = await request.json()

    if (!contentIdeaId) {
      return NextResponse.json(
        { error: "Content idea ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get content idea (should now have edited video URL if editing was done)
    const { data: contentIdea, error: ideaError } = await supabase
      .from("content_ideas")
      .select("*")
      .eq("id", contentIdeaId)
      .single()

    if (ideaError || !contentIdea) {
      return NextResponse.json(
        { error: "Content idea not found" },
        { status: 404 }
      )
    }

    if (!contentIdea.recording_url) {
      return NextResponse.json(
        { error: "No recording URL found for this content idea" },
        { status: 400 }
      )
    }

    // Send to Submagic for Magic Clips generation
    const submagic = getSubmagicClient()
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://contentmotor.co'}/api/webhooks/submagic`

    try {
      const submagicResponse = await submagic.createMagicClips({
        title: contentIdea.title,
        language: "en",
        videoUrl: contentIdea.recording_url, // This will be the edited video if editing happened
        templateName: "Hormozi 2", // Default template
        webhookUrl,
      })

      // Update content idea with Submagic project ID
      await supabase
        .from("content_ideas")
        .update({
          submagic_project_id: submagicResponse.id,
          submagic_template: "Hormozi 2",
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentIdeaId)

      return NextResponse.json({
        success: true,
        message: "Video sent to Submagic for clip generation.",
        submagicProjectId: submagicResponse.id,
      })
    } catch (submagicError: any) {
      console.error("Submagic error:", submagicError)
      return NextResponse.json(
        { 
          error: "Failed to send to Submagic",
          details: submagicError.message 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Process clips error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process clips" },
      { status: 500 }
    )
  }
}








