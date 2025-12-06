import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { QueueClient } from "./queue-client"

export default async function QueuePage() {
  const supabase = await createClient()

  // Get all video editing jobs with related data
  const { data: editingJobs } = await supabase
    .from("video_editing_jobs")
    .select(`
      *,
      recording:recordings(*, content_idea:content_ideas(id, title, format, recording_url)),
      master_prompt:recording_editing_prompts(id, name, category, version_number),
      video_specific_prompt:video_specific_prompts(id, name, prompt_text, edit_notes, version_number),
      content_idea:content_ideas(id, title, format, recording_url)
    `)
    .order("created_at", { ascending: false })

  // Get all clips/assets for review (short-form content)
  const { data: clips } = await supabase
    .from("assets")
    .select(`
      *,
      content_idea:content_ideas(id, title, format)
    `)
    .eq("type", "clip")
    .in("status", ["ready", "approved"])
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Queue & Review"
        description="Review edited episodes, short-form clips, request changes, and approve content for publishing"
      />
      <QueueClient 
        editingJobs={editingJobs || []}
        clips={clips || []}
      />
    </div>
  )
}








