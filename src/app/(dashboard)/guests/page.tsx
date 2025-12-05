import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { GuestsClient } from "./guests-client"

export default async function GuestsPage() {
  const supabase = await createClient()

  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guests"
        description="Manage your guest interview pipeline"
      />

      <GuestsClient initialGuests={guests || []} showEmptyState={!guests || guests.length === 0} />
    </div>
  )
}
