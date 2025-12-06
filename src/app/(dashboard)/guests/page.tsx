import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Users } from "lucide-react"
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

      {!guests || guests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No guests yet"
          description="Add guests to schedule interviews and create guest content."
        />
      ) : (
        <GuestsClient initialGuests={guests} />
      )}
    </div>
  )
}


