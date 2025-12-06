import { createClient } from "@/lib/supabase/server"
import { IdeasPageClient } from "./ideas-client"

export default async function IdeasPage() {
  const supabase = await createClient()
  
  const { data: ideas } = await supabase
    .from("content_ideas")
    .select("*, guest:guests(*)")
    .order("created_at", { ascending: false })

  return <IdeasPageClient initialIdeas={ideas || []} />
}


