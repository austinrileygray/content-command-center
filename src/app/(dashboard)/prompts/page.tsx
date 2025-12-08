import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { RecordingPromptsClient } from "./prompts-client"

export default async function RecordingPromptsPage() {
  const supabase = await createClient()

  // Get active prompts for podcast and solo YouTube
  const { data: podcastPrompt } = await supabase
    .from("recording_editing_prompts")
    .select("*")
    .eq("category", "podcast")
    .eq("is_active", true)
    .single()

  const { data: soloYouTubePrompt } = await supabase
    .from("recording_editing_prompts")
    .select("*")
    .eq("category", "solo_youtube")
    .eq("is_active", true)
    .single()

  // Get all prompts for each category (for version history)
  const { data: allPodcastPrompts } = await supabase
    .from("recording_editing_prompts")
    .select("*")
    .eq("category", "podcast")
    .order("created_at", { ascending: false })

  const { data: allSoloYouTubePrompts } = await supabase
    .from("recording_editing_prompts")
    .select("*")
    .eq("category", "solo_youtube")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recording Editing Prompts"
        description="Manage editing prompts for podcast episodes and solo YouTube videos. These prompts guide the automated editing workflow."
      />
      <RecordingPromptsClient
        podcastPrompt={podcastPrompt || null}
        soloYouTubePrompt={soloYouTubePrompt || null}
        allPodcastPrompts={allPodcastPrompts || []}
        allSoloYouTubePrompts={allSoloYouTubePrompts || []}
      />
    </div>
  )
}









