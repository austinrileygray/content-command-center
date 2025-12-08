import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/queue/request-edit
 * Request edits for a video editing job
 * 
 * This endpoint:
 * 1. Creates/updates a video-specific prompt based on edit notes
 * 2. Updates the editing job status to "needs_edits"
 * 3. Optionally updates master prompt if requested
 * 4. Triggers re-processing with the updated prompt
 */
export const maxDuration = 300
export async function POST(request: NextRequest) {
  try {
    const {
      editingJobId,
      recordingId,
      contentIdeaId,
      editNotes,
      updateMasterPrompt = false,
      videoSpecificPromptId,
      masterPromptId,
    } = await request.json()

    if (!editingJobId || !recordingId || !contentIdeaId || !editNotes) {
      return NextResponse.json(
        { error: "Missing required fields: editingJobId, recordingId, contentIdeaId, editNotes" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get user profile
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    const userId = profiles[0].id

    // Get the editing job
    const { data: editingJob, error: jobError } = await supabase
      .from("video_editing_jobs")
      .select("*")
      .eq("id", editingJobId)
      .single()

    if (jobError || !editingJob) {
      return NextResponse.json(
        { error: "Editing job not found" },
        { status: 404 }
      )
    }

    // Get master prompt if we have it
    let masterPrompt = null
    if (masterPromptId) {
      const { data: prompt } = await supabase
        .from("recording_editing_prompts")
        .select("*")
        .eq("id", masterPromptId)
        .single()

      if (prompt) {
        masterPrompt = prompt
      }
    }

    // Get or create video-specific prompt
    let videoSpecificPrompt = null

    if (videoSpecificPromptId) {
      // Update existing video-specific prompt
      const { data: existingPrompt } = await supabase
        .from("video_specific_prompts")
        .select("*")
        .eq("id", videoSpecificPromptId)
        .single()

      if (existingPrompt) {
        // Increment version and update with new notes
        const newVersionNumber = (existingPrompt.version_number || 1) + 1
        const updatedPromptText = `${existingPrompt.prompt_text}\n\n---\n\nAdditional Instructions (v${newVersionNumber}):\n${editNotes}`

        const { data: updatedPrompt, error: updateError } = await supabase
          .from("video_specific_prompts")
          .insert({
            recording_id: recordingId,
            content_idea_id: contentIdeaId,
            based_on_prompt_id: masterPromptId,
            category: existingPrompt.category,
            name: `${existingPrompt.name} (v${newVersionNumber})`,
            prompt_text: updatedPromptText,
            edit_notes: editNotes,
            version_number: newVersionNumber,
            is_master_update: updateMasterPrompt,
          })
          .select()
          .single()

        if (updateError) {
          console.error("Error updating video-specific prompt:", updateError)
          return NextResponse.json(
            { error: "Failed to update video-specific prompt" },
            { status: 500 }
          )
        }

        videoSpecificPrompt = updatedPrompt
      }
    } else {
      // Create new video-specific prompt from master
      if (!masterPrompt) {
        return NextResponse.json(
          { error: "Master prompt not found" },
          { status: 404 }
        )
      }

      const newPromptText = `${masterPrompt.prompt_text}\n\n---\n\nAdditional Instructions:\n${editNotes}`

      const { data: newPrompt, error: createError } = await supabase
        .from("video_specific_prompts")
        .insert({
          recording_id: recordingId,
          content_idea_id: contentIdeaId,
          based_on_prompt_id: masterPromptId,
          category: masterPrompt.category,
          name: `${masterPrompt.name} - ${editingJob.content_idea_id.substring(0, 8)}`,
          prompt_text: newPromptText,
          edit_notes: editNotes,
          version_number: 1,
          is_master_update: updateMasterPrompt,
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating video-specific prompt:", createError)
        return NextResponse.json(
          { error: "Failed to create video-specific prompt" },
          { status: 500 }
        )
      }

      videoSpecificPrompt = newPrompt
    }

    // Update master prompt if requested
    if (updateMasterPrompt && masterPrompt) {
      const updatedMasterPrompt = `${masterPrompt.prompt_text}\n\n---\n\nUpdate: ${editNotes}`
      
      // Deactivate old master prompt
      await supabase
        .from("recording_editing_prompts")
        .update({ is_active: false })
        .eq("id", masterPromptId)

      // Create new version of master prompt
      await supabase
        .from("recording_editing_prompts")
        .insert({
          user_id: userId,
          category: masterPrompt.category,
          name: `${masterPrompt.name} (v${(masterPrompt.version_number || 1) + 1})`,
          prompt_text: updatedMasterPrompt,
          is_active: true,
          version_number: (masterPrompt.version_number || 1) + 1,
        })
    }

    // Update editing job
    const editHistoryEntry = {
      timestamp: new Date().toISOString(),
      notes: editNotes,
      status: "needs_edits",
      video_specific_prompt_id: videoSpecificPrompt.id,
    }

    const updatedEditHistory = [
      ...(editingJob.edit_history || []),
      editHistoryEntry,
    ]

    const { error: updateJobError } = await supabase
      .from("video_editing_jobs")
      .update({
        status: "needs_edits",
        video_specific_prompt_id: videoSpecificPrompt.id,
        edit_history: updatedEditHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingJobId)

    if (updateJobError) {
      console.error("Error updating editing job:", updateJobError)
      return NextResponse.json(
        { error: "Failed to update editing job" },
        { status: 500 }
      )
    }

    // Trigger re-processing with the updated prompt
    // This will use the video-specific prompt for editing
    const processUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://contentmotor.co'}/api/workflow/process-recording`
    
    fetch(processUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentIdeaId,
        recordingId,
        videoSpecificPromptId: videoSpecificPrompt.id,
      }),
    }).catch(err => {
      console.error("Failed to trigger re-processing:", err)
      // Don't fail the request - the edit request is still saved
    })

    // Update editing job status to processing
    await supabase
      .from("video_editing_jobs")
      .update({
        status: "processing",
        processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingJobId)

    return NextResponse.json({
      success: true,
      message: "Edit request submitted. Video will be re-processed with updated prompt.",
      videoSpecificPromptId: videoSpecificPrompt.id,
      editingJobId,
    })
  } catch (error: any) {
    console.error("Edit request error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process edit request" },
      { status: 500 }
    )
  }
}









