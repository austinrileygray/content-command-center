import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { ThumbnailsClient } from "./thumbnails-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function ThumbnailsPage() {
  const supabase = await createClient()

  // Get all approved thumbnails
  const { data: thumbnails } = await supabase
    .from("thumbnail_training")
    .select("*")
    .eq("approved", true)
    .order("created_at", { ascending: false })

  // Check if prompts are initialized
  const { data: youtubeTemplate } = await supabase
    .from("thumbnail_prompt_templates")
    .select("id, version_number")
    .eq("category", "youtube")
    .eq("is_active", true)
    .single()

  const { data: shortFormTemplate } = await supabase
    .from("thumbnail_prompt_templates")
    .select("id, version_number")
    .eq("category", "short_form")
    .eq("is_active", true)
    .single()

  const promptsInitialized = !!youtubeTemplate || !!shortFormTemplate

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thumbnail Training"
        description="Upload and manage thumbnails to train AI models. Automatically collect from high-performing videos."
      />
      
      {!promptsInitialized && (
        <Card className="border-brand/20 bg-brand/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Initialize Your Thumbnail Prompt
            </CardTitle>
            <CardDescription>
              Before uploading thumbnails, set up your AI prompt system. This will guide how thumbnails are generated and improved over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/thumbnails/prompts">
              <Button className="w-full sm:w-auto">
                Go to Prompt Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <ThumbnailsClient initialThumbnails={thumbnails || []} />
    </div>
  )
}
