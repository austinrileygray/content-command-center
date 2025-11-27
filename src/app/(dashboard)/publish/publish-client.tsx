"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Send, CheckCircle, XCircle, Clock, ExternalLink, Trash2, Calendar } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PublishingQueueItem {
  id: string
  content_idea_id: string
  asset_id: string | null
  platform: string
  status: string
  scheduled_for: string | null
  published_at: string | null
  published_url: string | null
  error_message: string | null
  created_at: string
  content_idea?: { title: string; id: string } | null
  asset?: { title: string; type: string } | null
}

interface PublishClientProps {
  initialQueue: PublishingQueueItem[]
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  processing: { label: "Processing", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  published: { label: "Published", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400", icon: XCircle },
}

export function PublishClient({ initialQueue }: PublishClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [queue, setQueue] = useState(initialQueue)
  const [removing, setRemoving] = useState<string | null>(null)

  const removeFromQueue = async (queueId: string) => {
    if (!confirm("Remove this item from the publishing queue?")) return

    setRemoving(queueId)
    try {
      const { error } = await supabase
        .from("publishing_queue")
        .delete()
        .eq("id", queueId)

      if (error) throw error

      setQueue(queue.filter(item => item.id !== queueId))
      toast.success("Removed from queue")
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to remove from queue")
      console.error(error)
    } finally {
      setRemoving(null)
    }
  }

  const grouped = {
    pending: queue.filter((item) => item.status === "pending"),
    processing: queue.filter((item) => item.status === "processing"),
    published: queue.filter((item) => item.status === "published"),
    failed: queue.filter((item) => item.status === "failed"),
  }

  return (
    <div className="space-y-6">
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
          <div className="text-2xl font-semibold text-green-400">{grouped.published.length}</div>
          <div className="text-sm text-muted-foreground">Published</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-red-400">{grouped.failed.length}</div>
          <div className="text-sm text-muted-foreground">Failed</div>
        </Card>
      </div>

      {/* Queue Table */}
      {queue.length === 0 ? (
        <Card className="p-12 bg-card border-border text-center">
          <Send className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No items in queue</h3>
          <p className="text-sm text-muted-foreground">
            Approved assets will appear here when added to the publishing queue.
          </p>
        </Card>
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
                const status = statusConfig[item.status] || statusConfig.pending
                const StatusIcon = status.icon

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.content_idea ? (
                        <a
                          href={`/ideas/${item.content_idea.id}`}
                          className="text-sm text-brand hover:underline"
                        >
                          {item.content_idea.title}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.asset ? (
                        <div>
                          <span className="text-sm font-medium text-foreground">{item.asset.title}</span>
                          <span className="text-xs text-muted-foreground ml-2 capitalize">
                            ({item.asset.type})
                          </span>
                        </div>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {item.scheduled_for
                        ? format(new Date(item.scheduled_for), "MMM d, yyyy HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.published_at
                        ? formatDistanceToNow(new Date(item.published_at), { addSuffix: true })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.published_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="View Published"
                          >
                            <a href={item.published_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {item.status !== "published" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromQueue(item.id)}
                            disabled={removing === item.id}
                            title="Remove from queue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
