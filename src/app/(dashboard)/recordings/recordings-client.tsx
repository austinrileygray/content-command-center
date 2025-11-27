"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Video, ExternalLink, Clock, Calendar, CheckCircle, XCircle, Play, Search } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Recording {
  id: string
  content_idea_id: string
  platform: string
  external_id: string | null
  external_url: string | null
  status: string
  scheduled_start: string | null
  actual_start: string | null
  actual_end: string | null
  duration: number | null
  recording_urls: any
  transcript_url: string | null
  created_at: string
  updated_at: string
  content_idea?: {
    title: string
    id: string
    format: string
  } | null
}

interface RecordingsClientProps {
  initialRecordings: Recording[]
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400",
  recording: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
  cancelled: "bg-gray-500/20 text-gray-400",
}

const platformIcons: Record<string, any> = {
  loom: Video,
  squadcast: Video,
  restream: Video,
}

export function RecordingsClient({ initialRecordings }: RecordingsClientProps) {
  const supabase = createClient()
  const [recordings, setRecordings] = useState(initialRecordings)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")

  const filteredRecordings = useMemo(() => {
    let filtered = [...recordings]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (recording) =>
          recording.content_idea?.title?.toLowerCase().includes(query) ||
          recording.platform.toLowerCase().includes(query) ||
          recording.external_id?.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((recording) => recording.status === statusFilter)
    }

    if (platformFilter !== "all") {
      filtered = filtered.filter((recording) => recording.platform === platformFilter)
    }

    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [recordings, searchQuery, statusFilter, platformFilter])

  const stats = useMemo(() => {
    const total = recordings.length
    const completed = recordings.filter(r => r.status === "completed").length
    const scheduled = recordings.filter(r => r.status === "scheduled").length
    const recording = recordings.filter(r => r.status === "recording").length
    const failed = recordings.filter(r => r.status === "failed").length
    const totalDuration = recordings
      .filter(r => r.duration)
      .reduce((sum, r) => sum + (r.duration || 0), 0)

    return { total, completed, scheduled, recording, failed, totalDuration }
  }, [recordings])

  const platforms = Array.from(new Set(recordings.map(r => r.platform).filter(Boolean)))

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-blue-400">{stats.scheduled}</div>
          <div className="text-sm text-muted-foreground">Scheduled</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-yellow-400">{stats.recording}</div>
          <div className="text-sm text-muted-foreground">Recording</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-green-400">{stats.completed}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-red-400">{stats.failed}</div>
          <div className="text-sm text-muted-foreground">Failed</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-semibold text-brand">{formatDuration(stats.totalDuration)}</div>
          <div className="text-sm text-muted-foreground">Total Duration</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search recordings..."
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
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="recording">Recording</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
        </div>
      </Card>

      {/* Recordings Table */}
      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content Idea</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecordings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No recordings found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredRecordings.map((recording) => {
                const statusColor = statusColors[recording.status] || statusColors.scheduled
                const PlatformIcon = platformIcons[recording.platform] || Video

                return (
                  <TableRow key={recording.id}>
                    <TableCell>
                      {recording.content_idea ? (
                        <a
                          href={`/ideas/${recording.content_idea.id}`}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          {recording.content_idea.title}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PlatformIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{recording.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor}>
                        {recording.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {recording.scheduled_start
                        ? format(new Date(recording.scheduled_start), "MMM d, yyyy HH:mm")
                        : recording.actual_start
                        ? format(new Date(recording.actual_start), "MMM d, yyyy HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDuration(recording.duration)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {recording.external_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="View Recording"
                          >
                            <a href={recording.external_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {recording.recording_urls && typeof recording.recording_urls === 'object' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="Play Recording"
                          >
                            <a href={recording.recording_urls.video || recording.recording_urls.audio} target="_blank" rel="noopener noreferrer">
                              <Play className="w-4 h-4" />
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
    </div>
  )
}
