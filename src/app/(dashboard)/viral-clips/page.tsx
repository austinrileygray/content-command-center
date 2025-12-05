import { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { ViralClipsClient } from "./viral-clips-client"
import { ViralClipAnalysis } from "@/types/database"

export const metadata: Metadata = {
  title: "Viral Clips | Content Command Center",
  description: "Find viral clips from your YouTube videos using AI",
}

// This page fetches videos client-side to use the authenticated YouTube connection
export default async function ViralClipsPage() {
  // Only fetch previous analyses server-side
  let analyses: ViralClipAnalysis[] = []

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from("viral_clip_analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (!error && data) {
      analyses = data
    }
  } catch (error) {
    console.error("Failed to fetch analyses:", error)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Viral Clips Finder</h1>
        <p className="text-muted-foreground">
          Let Gemini AI analyze your YouTube videos and find the most viral-worthy clips for Shorts, TikTok, and Reels
        </p>
      </div>

      <ViralClipsClient initialAnalyses={analyses} />
    </div>
  )
}
