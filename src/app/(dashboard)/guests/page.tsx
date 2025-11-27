import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Mail, Linkedin, Twitter, Building, Briefcase } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { EmptyState } from "@/components/shared/empty-state"
import { Users } from "lucide-react"

const statusColors = {
  prospect: "bg-yellow-500/20 text-yellow-400",
  contacted: "bg-blue-500/20 text-blue-400",
  confirmed: "bg-green-500/20 text-green-400",
  declined: "bg-red-500/20 text-red-400",
}

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
        actions={
          <Button className="gap-2 bg-brand hover:bg-brand/90">
            <Plus className="w-4 h-4" />
            Add Guest
          </Button>
        }
      />

      {!guests || guests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No guests yet"
          description="Add guests to schedule interviews and create guest content."
          action={{
            label: "Add Guest",
            onClick: () => {},
          }}
        />
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title & Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Relevance</TableHead>
                <TableHead>Last Contacted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((guest) => {
                const statusColor =
                  statusColors[guest.status as keyof typeof statusColors] || statusColors.prospect

                return (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {guest.title && (
                          <div className="flex items-center gap-1 text-sm">
                            <Briefcase className="w-3 h-3 text-muted-foreground" />
                            <span>{guest.title}</span>
                          </div>
                        )}
                        {guest.company && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building className="w-3 h-3" />
                            <span>{guest.company}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {guest.email && (
                          <a
                            href={`mailto:${guest.email}`}
                            className="text-sm text-brand hover:underline"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {guest.linkedin_url && (
                          <a
                            href={guest.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand hover:underline"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {guest.twitter_handle && (
                          <a
                            href={`https://twitter.com/${guest.twitter_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand hover:underline"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor}>{guest.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {guest.relevance_score ? (
                        <span className="text-sm">{guest.relevance_score}%</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {guest.last_contacted_at ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(guest.last_contacted_at), {
                            addSuffix: true,
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
