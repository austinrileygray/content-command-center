import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RECORDING_PLATFORMS } from "@/lib/constants"
import { Video, Users, Radio, ExternalLink } from "lucide-react"
import Link from "next/link"

const platformIcons = {
  loom: Video,
  squadcast: Users,
  restream: Radio,
}

export default async function RecordPage() {
  const supabase = await createClient()
  
  // Get scheduled recordings
  const { data: scheduled } = await supabase
    .from("content_ideas")
    .select("*")
    .eq("status", "scheduled")
    .order("scheduled_date", { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Record</h1>
        <p className="text-muted-foreground">Choose your recording platform</p>
      </div>

      {/* Recording Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(RECORDING_PLATFORMS).map(([key, platform]) => {
          const Icon = platformIcons[key as keyof typeof platformIcons]
          return (
            <Card key={key} className="p-6 bg-card border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-brand/10 text-brand">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                </div>
              </div>
              <a href={platform.url} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2 bg-brand hover:bg-brand/90">
                  <ExternalLink className="w-4 h-4" />
                  Open {platform.name}
                </Button>
              </a>
            </Card>
          )
        })}
      </div>

      {/* Scheduled Recordings */}
      {scheduled && scheduled.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Scheduled Recordings
          </h2>
          <div className="space-y-3">
            {scheduled.map((idea) => (
              <Card key={idea.id} className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{idea.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {idea.scheduled_date} {idea.scheduled_time && `at ${idea.scheduled_time}`}
                    </p>
                  </div>
                  <Link href={`/ideas/${idea.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



