import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { IdeaDetailClient } from "./idea-detail-client"

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: idea } = await supabase
    .from("content_ideas")
    .select("*, guest:guests(*)")
    .eq("id", id)
    .single()

  if (!idea) {
    notFound()
  }

  return <IdeaDetailClient idea={idea} />
}



