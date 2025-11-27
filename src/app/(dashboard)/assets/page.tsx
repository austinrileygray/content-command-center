import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, FileVideo, Image, FileText, Share2, Mail } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { EmptyState } from "@/components/shared/empty-state"
import { Package } from "lucide-react"

const assetTypeIcons = {
  clip: FileVideo,
  thumbnail: Image,
  blog: FileText,
  social_post: Share2,
  newsletter: Mail,
}

const assetTypeLabels = {
  clip: "Video Clip",
  thumbnail: "Thumbnail",
  blog: "Blog Post",
  social_post: "Social Post",
  newsletter: "Newsletter",
}

const statusColors = {
  generating: "bg-yellow-500/20 text-yellow-400",
  ready: "bg-teal-500/20 text-teal-400",
  published: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
}

export default async function AssetsPage() {
  const supabase = await createClient()

  const { data: assets } = await supabase
    .from("assets")
    .select("*, content_idea:content_ideas(title, id)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        description="Generated clips, thumbnails, and other content assets"
      />

      {!assets || assets.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No assets yet"
          description="Assets will appear here once content is processed and clips are generated."
        />
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Content Idea</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const Icon = assetTypeIcons[asset.type as keyof typeof assetTypeIcons] || FileVideo
                const statusColor = statusColors[asset.status as keyof typeof statusColors] || statusColors.generating

                return (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {assetTypeLabels[asset.type as keyof typeof assetTypeLabels] || asset.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {asset.title || "Untitled"}
                    </TableCell>
                    <TableCell>
                      {asset.content_idea ? (
                        <a
                          href={`/ideas/${asset.content_idea.id}`}
                          className="text-sm text-brand hover:underline"
                        >
                          {asset.content_idea.title}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.platform ? (
                        <span className="text-sm capitalize">{asset.platform}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {asset.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {asset.published_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={asset.published_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
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
