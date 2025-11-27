"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Download, ExternalLink, FileVideo, Image, FileText, Share2, Mail, Clock, TrendingUp, Play, Check, X, Search, Filter, CheckSquare, Square, Send, CalendarIcon, Copy } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Asset } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface AssetsClientProps {
  initialAssets: Asset[]
}

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

const statusColors: Record<string, string> = {
  generating: "bg-yellow-500/20 text-yellow-400",
  ready: "bg-teal-500/20 text-teal-400",
  approved: "bg-blue-500/20 text-blue-400",
  published: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
}

export function AssetsClient({ initialAssets }: AssetsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [assets, setAssets] = useState(initialAssets)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined)
  const [schedulePlatform, setSchedulePlatform] = useState<string>("youtube")

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let filtered = [...assets]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (asset) =>
          asset.title?.toLowerCase().includes(query) ||
          asset.type.toLowerCase().includes(query) ||
          asset.platform?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((asset) => asset.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((asset) => asset.type === typeFilter)
    }

    // Platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter((asset) => asset.platform === platformFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "virality":
          return (b.virality_score || 0) - (a.virality_score || 0)
        case "duration":
          return (b.duration || 0) - (a.duration || 0)
        case "title":
          return (a.title || "").localeCompare(b.title || "")
        default:
          return 0
      }
    })

    return filtered
  }, [assets, searchQuery, statusFilter, typeFilter, platformFilter, sortBy])

  // Stats
  const stats = useMemo(() => {
    const total = assets.length
    const ready = assets.filter(a => a.status === "ready").length
    const approved = assets.filter(a => a.status === "approved").length
    const published = assets.filter(a => a.status === "published").length
    const clips = assets.filter(a => a.type === "clip").length
    const avgVirality = assets
      .filter(a => a.virality_score !== null)
      .reduce((sum, a) => sum + (a.virality_score || 0), 0) / 
      (assets.filter(a => a.virality_score !== null).length || 1)

    return { total, ready, approved, published, clips, avgVirality: Math.round(avgVirality) }
  }, [assets])

  const updateAssetStatus = async (assetId: string, newStatus: string) => {
    setUpdating(assetId)
    try {
      const { error } = await supabase
        .from("assets")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assetId)

      if (error) throw error

      setAssets(assets.map(a => a.id === assetId ? { ...a, status: newStatus as any } : a))
      setSelectedAssets(prev => {
        const next = new Set(prev)
        next.delete(assetId)
        return next
      })
      toast.success(`Asset ${newStatus === "approved" ? "approved" : "rejected"}`)
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to update asset status")
      console.error(error)
    } finally {
      setUpdating(null)
    }
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedAssets.size === 0) return

    setUpdating("bulk")
    try {
      const assetIds = Array.from(selectedAssets)
      const { error } = await supabase
        .from("assets")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .in("id", assetIds)

      if (error) throw error

      setAssets(assets.map(a => 
        selectedAssets.has(a.id) ? { ...a, status: newStatus as any } : a
      ))
      setSelectedAssets(new Set())
      toast.success(`${assetIds.length} assets ${newStatus === "approved" ? "approved" : "rejected"}`)
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to update assets")
      console.error(error)
    } finally {
      setUpdating(null)
    }
  }

  const addToPublishQueue = async (assetIds: string[], platform: string = "youtube", scheduledFor?: Date) => {
    if (assetIds.length === 0) return

    setUpdating("bulk")
    try {
      // Get the assets to queue
      const assetsToQueue = assets.filter(a => assetIds.includes(a.id))
      
      // Create publishing queue entries
      const queueEntries = assetsToQueue.map(asset => ({
        content_idea_id: asset.content_idea_id,
        asset_id: asset.id,
        platform,
        status: "pending",
        scheduled_for: scheduledFor ? scheduledFor.toISOString() : null,
        created_at: new Date().toISOString(),
      }))

      const { error } = await supabase
        .from("publishing_queue")
        .insert(queueEntries)

      if (error) throw error

      // Update asset status to published (or keep as approved)
      setSelectedAssets(new Set())
      toast.success(
        `${assetIds.length} asset${assetIds.length !== 1 ? "s" : ""} added to publishing queue${
          scheduledFor ? ` (scheduled for ${scheduledFor.toLocaleDateString()})` : ""
        }`
      )
      router.push("/publish")
    } catch (error: any) {
      toast.error("Failed to add to publishing queue")
      console.error(error)
    } finally {
      setUpdating(null)
    }
  }

  const toggleSelectAsset = (assetId: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev)
      if (next.has(assetId)) {
        next.delete(assetId)
      } else {
        next.add(assetId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set())
    } else {
      setSelectedAssets(new Set(filteredAssets.map(a => a.id)))
    }
  }

  const platforms = Array.from(new Set(assets.map(a => a.platform).filter((p): p is string => Boolean(p))))

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Assets</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-teal-400">{stats.ready}</div>
          <div className="text-sm text-muted-foreground">Ready</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-blue-400">{stats.approved}</div>
          <div className="text-sm text-muted-foreground">Approved</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-green-400">{stats.published}</div>
          <div className="text-sm text-muted-foreground">Published</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-brand">{stats.clips}</div>
          <div className="text-sm text-muted-foreground">Clips</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-brand">{stats.avgVirality}%</div>
          <div className="text-sm text-muted-foreground">Avg Virality</div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="generating">Generating</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="clip">Clips</SelectItem>
              <SelectItem value="thumbnail">Thumbnails</SelectItem>
              <SelectItem value="blog">Blog Posts</SelectItem>
              <SelectItem value="newsletter">Newsletters</SelectItem>
              <SelectItem value="social_post">Social Posts</SelectItem>
            </SelectContent>
          </Select>
          {platforms.length > 0 && (
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform}>
                    {platform?.charAt(0).toUpperCase() + platform?.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="virality">Highest Virality</SelectItem>
              <SelectItem value="duration">Longest Duration</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedAssets.size > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedAssets.size} asset{selectedAssets.size !== 1 ? "s" : ""} selected
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkUpdateStatus("approved")}
                disabled={updating === "bulk"}
              >
                <Check className="w-4 h-4 mr-2" />
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkUpdateStatus("failed")}
                disabled={updating === "bulk"}
              >
                <X className="w-4 h-4 mr-2" />
                Reject Selected
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-brand hover:bg-brand/90"
                    disabled={updating === "bulk"}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publish Selected
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => addToPublishQueue(Array.from(selectedAssets), "youtube")}>
                    <Send className="w-4 h-4 mr-2" />
                    Add to YouTube Queue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addToPublishQueue(Array.from(selectedAssets), "tiktok")}>
                    <Send className="w-4 h-4 mr-2" />
                    Add to TikTok Queue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addToPublishQueue(Array.from(selectedAssets), "instagram")}>
                    <Send className="w-4 h-4 mr-2" />
                    Add to Instagram Queue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addToPublishQueue(Array.from(selectedAssets), "linkedin")}>
                    <Send className="w-4 h-4 mr-2" />
                    Add to LinkedIn Queue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowScheduleDialog(true)}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule Publishing
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedAssets(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Assets Table */}
      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Content Idea</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No assets found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredAssets.map((asset) => {
                const Icon = assetTypeIcons[asset.type as keyof typeof assetTypeIcons] || FileVideo
                const statusColor = statusColors[asset.status as keyof typeof statusColors] || statusColors.generating
                const isSelected = selectedAssets.has(asset.id)

                return (
                  <TableRow key={asset.id} className={isSelected ? "bg-secondary/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectAsset(asset.id)}
                      />
                    </TableCell>
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
                  <a
                    href={`/ideas/${asset.content_idea_id}`}
                    className="text-sm text-brand hover:underline"
                  >
                    View Idea
                  </a>
                  <br />
                  <a
                    href={`/assets?idea=${asset.content_idea_id}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Filter by idea
                  </a>
                </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColor}>
                          {asset.status}
                        </Badge>
                        {asset.status === "ready" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={updating === asset.id}
                                className="h-6 px-2"
                              >
                                {updating === asset.id ? "..." : "⋮"}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => updateAssetStatus(asset.id, "approved")}
                                className="text-green-400"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateAssetStatus(asset.id, "failed")}
                                className="text-red-400"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {asset.status === "approved" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={updating === asset.id}
                                className="h-6 px-2"
                              >
                                {updating === asset.id ? "..." : "⋮"}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => addToPublishQueue([asset.id], "youtube")}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Publish to YouTube
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => addToPublishQueue([asset.id], "tiktok")}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Publish to TikTok
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => addToPublishQueue([asset.id], "instagram")}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Publish to Instagram
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => addToPublishQueue([asset.id], "linkedin")}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Publish to LinkedIn
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {asset.duration && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}</span>
                          </div>
                        )}
                        {asset.virality_score !== null && asset.virality_score !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3" />
                            <span>Virality: {asset.virality_score}%</span>
                          </div>
                        )}
                        {asset.thumbnail_url && (
                          <div className="mt-1">
                            <img
                              src={asset.thumbnail_url}
                              alt={asset.title || "Thumbnail"}
                              className="w-16 h-9 object-cover rounded border border-border cursor-pointer hover:opacity-80"
                              onClick={() => setPreviewAsset(asset)}
                            />
                          </div>
                        )}
                      </div>
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
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewAsset(asset)}
                              title="Preview"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              title="Download"
                            >
                              <a href={asset.file_url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          </>
                        )}
                        {asset.published_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="View Published"
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
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Schedule Publishing Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Publishing</DialogTitle>
            <DialogDescription>
              Select a date and platform to schedule publishing for {selectedAssets.size} selected asset{selectedAssets.size !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={schedulePlatform} onValueChange={setSchedulePlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Schedule Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduleDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate ? format(scheduleDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (scheduleDate) {
                    addToPublishQueue(Array.from(selectedAssets), schedulePlatform, scheduleDate)
                    setShowScheduleDialog(false)
                    setScheduleDate(undefined)
                  }
                }}
                disabled={!scheduleDate || updating === "bulk"}
              >
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.title || "Asset Preview"}</DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-4">
              {previewAsset.file_url && previewAsset.type === "clip" && (
                <video
                  src={previewAsset.file_url}
                  controls
                  className="w-full rounded-lg"
                  poster={previewAsset.thumbnail_url || undefined}
                />
              )}
              {previewAsset.thumbnail_url && previewAsset.type !== "clip" && previewAsset.type !== "blog" && previewAsset.type !== "newsletter" && (
                <img
                  src={previewAsset.thumbnail_url}
                  alt={previewAsset.title || "Preview"}
                  className="w-full rounded-lg"
                />
              )}
              {(previewAsset.type === "blog" || previewAsset.type === "newsletter") && previewAsset.metadata?.content && (
                <Card className="p-6 bg-card border-border">
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">
                      {previewAsset.metadata.content}
                    </pre>
                  </div>
                  {previewAsset.metadata.wordCount && (
                    <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                      Word count: {previewAsset.metadata.wordCount} words
                    </div>
                  )}
                </Card>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge className={statusColors[previewAsset.status]}>
                    {previewAsset.status}
                  </Badge>
                </div>
                {previewAsset.duration && (
                  <div>
                    <span className="text-muted-foreground">Duration:</span>{" "}
                    {Math.floor(previewAsset.duration / 60)}:{(previewAsset.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}
                {previewAsset.virality_score !== null && (
                  <div>
                    <span className="text-muted-foreground">Virality Score:</span>{" "}
                    {previewAsset.virality_score}%
                  </div>
                )}
                {previewAsset.platform && (
                  <div>
                    <span className="text-muted-foreground">Platform:</span>{" "}
                    {previewAsset.platform}
                  </div>
                )}
              </div>
              {previewAsset.file_url && (
                <div className="flex gap-2">
                  <Button asChild>
                    <a href={previewAsset.file_url} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={previewAsset.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              )}
              {(previewAsset.type === "blog" || previewAsset.type === "newsletter") && previewAsset.metadata?.content && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(previewAsset.metadata?.content || "")
                      toast.success("Content copied to clipboard!")
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Content
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([previewAsset.metadata?.content || ""], { type: "text/markdown" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `${previewAsset.title?.replace(/\s+/g, "-") || "content"}.md`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                      toast.success("Downloaded!")
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download as Markdown
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
