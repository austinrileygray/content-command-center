import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { EmptyState } from "@/components/shared/empty-state"
import { format } from "date-fns"

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  processing: { label: "Processing", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  published: { label: "Published", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400", icon: XCircle },
}

export default async function PublishPage() {
  const supabase = await createClient()

  const { data: queue } = await supabase
    .from("publishing_queue")
    .select("*, content_idea:content_ideas(title, id), asset:assets(title, type)")
    .order("created_at", { ascending: false })

  const grouped = {
    pending: queue?.filter((item) => item.status === "pending") || [],
    processing: queue?.filter((item) => item.status === "processing") || [],
    published: queue?.filter((item) => item.status === "published") || [],
    failed: queue?.filter((item) => item.status === "failed") || [],
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publishing Queue"
        description="Manage content ready to publish across platforms"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-foreground">{grouped.pending.length}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-foreground">{grouped.processing.length}</div>
          <div className="text-sm text-muted-foreground">Processing</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-foreground">{grouped.published.length}</div>
          <div className="text-sm text-muted-foreground">Published</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-foreground">{grouped.failed.length}</div>
          <div className="text-sm text-muted-foreground">Failed</div>
        </Card>
      </div>

      {!queue || queue.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No items in queue"
          description="Content ready to publish will appear here."
        />
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((item) => {
                const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending
                const StatusIcon = status.icon

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.content_idea ? (
                        <a
                          href={`/ideas/${item.content_idea.id}`}
                          className="font-medium text-brand hover:underline"
                        >
                          {item.content_idea.title}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.asset ? (
                        <span className="text-sm">{item.asset.title || item.asset.type}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{item.platform}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.scheduled_for ? (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(item.scheduled_for), "MMM d, h:mm a")}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.published_at ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.published_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={item.published_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
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
