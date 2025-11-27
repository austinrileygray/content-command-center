import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getStatusColor, getStatusLabel, formatDuration } from "@/lib/utils"

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{idea.title}</h1>
            <Badge className={getStatusColor(idea.status)}>
              {getStatusLabel(idea.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">Content idea details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {idea.hook && (
            <Card className="p-6 bg-card border-border">
              <h2 className="text-lg font-semibold text-foreground mb-2">Hook</h2>
              <p className="text-foreground">{idea.hook}</p>
            </Card>
          )}

          {idea.description && (
            <Card className="p-6 bg-card border-border">
              <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
              <p className="text-muted-foreground">{idea.description}</p>
            </Card>
          )}

          {idea.why_this_will_work && (
            <Card className="p-6 bg-card border-border">
              <h2 className="text-lg font-semibold text-foreground mb-2">Why This Will Work</h2>
              <p className="text-muted-foreground">{idea.why_this_will_work}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Format</p>
                <p className="text-foreground capitalize">{idea.format.replace("_", " ")}</p>
              </div>
              {idea.estimated_length && (
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Length</p>
                  <p className="text-foreground">{formatDuration(idea.estimated_length)}</p>
                </div>
              )}
              {idea.confidence_score && (
                <div>
                  <p className="text-sm text-muted-foreground">Confidence Score</p>
                  <p className="text-foreground">{idea.confidence_score}%</p>
                </div>
              )}
            </div>
          </Card>

          {idea.guest && (
            <Card className="p-6 bg-card border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Guest</h2>
              <p className="text-foreground">{idea.guest.name}</p>
              {idea.guest.company && (
                <p className="text-sm text-muted-foreground">{idea.guest.company}</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
