import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/queue/approve
 * Approve a video editing job and move to assets table
 */
export async function POST(request: NextRequest) {
  try {
    const { editingJobId, version } = await request.json()

    if (!editingJobId) {
      return NextResponse.json(
        { error: "Editing job ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get editing job with current version
    const { data: editingJob, error: jobError } = await supabase
      .from("video_editing_jobs")
      .select(`
        *,
        recording:recordings(*, content_idea:content_ideas(id, title))
      `)
      .eq("id", editingJobId)
      .single()

    if (jobError || !editingJob) {
      return NextResponse.json(
        { error: "Editing job not found" },
        { status: 404 }
      )
    }

    // Get the version to approve (or latest)
    const versionToApprove = version 
      ? editingJob.versions.find((v: any) => v.version === version)
      : editingJob.versions[editingJob.versions.length - 1]

    if (!versionToApprove || !versionToApprove.file_url) {
      return NextResponse.json(
        { error: "No video version found to approve" },
        { status: 400 }
      )
    }

    // Create asset entry for approved video
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .insert({
        content_idea_id: editingJob.content_idea_id,
        type: "edited_episode",
        status: "approved",
        title: editingJob.recording?.content_idea?.title || "Approved Episode",
        file_url: versionToApprove.file_url,
        thumbnail_url: versionToApprove.thumbnail_url || null,
        duration: null, // TODO: Extract duration if available
        metadata: {
          version: versionToApprove.version,
          editing_job_id: editingJobId,
          recording_id: editingJob.recording_id,
          approved_at: new Date().toISOString(),
        },
        platform: "manual",
      })
      .select()
      .single()

    if (assetError) {
      console.error("Error creating asset:", assetError)
      return NextResponse.json(
        { error: "Failed to create asset" },
        { status: 500 }
      )
    }

    // Update editing job
    await supabase
      .from("video_editing_jobs")
      .update({
        status: "approved",
        final_approved_asset_id: asset.id,
        selected_version: versionToApprove.version,
        approved_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingJobId)

    // Trigger Zapier webhook for asset approval
    const { triggerZapierWebhookAsync } = await import("@/lib/zapier")
    triggerZapierWebhookAsync('asset.approved', {
      assetId: asset.id,
      editingJobId,
      contentIdeaId: editingJob.content_idea_id,
      version: versionToApprove.version,
    })

    return NextResponse.json({
      success: true,
      message: "Video approved and added to assets",
      assetId: asset.id,
      editingJobId,
    })
  } catch (error: any) {
    console.error("Approve error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to approve video" },
      { status: 500 }
    )
  }
}









