import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { IdeaDetailClient } from "./idea-detail-client"

export default async function IdeaDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  
  const { data: idea } = await supabase
    .from("content_ideas")
    .select("*, guest:guests(*)")
    .eq("id", params.id)
    .single()

  if (!idea) {
    notFound()
  }

  return <IdeaDetailClient idea={idea} />
}


