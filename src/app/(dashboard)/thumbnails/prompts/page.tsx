import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { PromptsClient } from "./prompts-client"

export default async function ThumbnailPromptsPage() {
  const supabase = await createClient()

  // Check if prompts are initialized and get full template data
  const { data: youtubeTemplate } = await supabase
    .from("thumbnail_prompt_templates")
    .select("id, version_number, updated_at, sections")
    .eq("category", "youtube")
    .eq("is_active", true)
    .single()

  const { data: shortFormTemplate } = await supabase
    .from("thumbnail_prompt_templates")
    .select("id, version_number, updated_at, sections")
    .eq("category", "short_form")
    .eq("is_active", true)
    .single()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thumbnail Prompt System"
        description="Manage AI prompts for thumbnail generation. Modular sections update based on your analytics and feedback."
      />
      <PromptsClient
        youtubeInitialized={!!youtubeTemplate}
        shortFormInitialized={!!shortFormTemplate}
        youtubeVersion={youtubeTemplate?.version_number || 0}
        shortFormVersion={shortFormTemplate?.version_number || 0}
        youtubeSections={youtubeTemplate?.sections || null}
        shortFormSections={shortFormTemplate?.sections || null}
      />
    </div>
  )
}
