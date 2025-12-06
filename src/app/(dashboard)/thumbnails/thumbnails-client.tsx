"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Image as ImageIcon, Sparkles, Download, Trash2, ExternalLink, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ThumbnailTraining } from "@/types/database"

interface ThumbnailsClientProps {
  initialThumbnails: ThumbnailTraining[]
}

export function ThumbnailsClient({ initialThumbnails }: ThumbnailsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [thumbnails, setThumbnails] = useState(initialThumbnails)
  const [uploading, setUploading] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<"youtube" | "short_form">("youtube")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const youtubeThumbnails = useMemo(() => 
    thumbnails.filter(t => t.category === "youtube"),
    [thumbnails]
  )

  const shortFormThumbnails = useMemo(() => 
    thumbnails.filter(t => t.category === "short_form"),
    [thumbnails]
  )

  const handleFileUpload = async (file: File, category: "youtube" | "short_form", notes?: string) => {
    setUploading(true)
    try {
      // Upload via API route
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", category)
      if (notes) formData.append("notes", notes)

      const response = await fetch("/api/thumbnails/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error if available
        if (data.details) {
          toast.error(data.error || "Failed to upload thumbnail", {
            description: data.details,
            duration: 5000,
          })
        } else {
          toast.error(data.error || "Failed to upload thumbnail")
        }
        throw new Error(data.error || "Failed to upload thumbnail")
      }

      setThumbnails([data.thumbnail, ...thumbnails])
      toast.success(data.message || "Thumbnail uploaded and notes saved successfully!")
      
      // If notes were provided, show info about AI training
      if (notes && notes.trim().length > 0) {
        toast.info("AI is analyzing your notes to improve future thumbnail generation", {
          duration: 4000,
        })
      }
      
      setUploadDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to upload thumbnail")
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const collectFromYouTube = async (category: "youtube" | "short_form") => {
    setCollecting(true)
    try {
      const response = await fetch("/api/youtube/collect-thumbnails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, limit: 20 }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to collect thumbnails")
      }

      if (data.thumbnails && data.thumbnails.length > 0) {
        setThumbnails([...data.thumbnails, ...thumbnails])
        toast.success(`Collected ${data.thumbnails.length} thumbnails from high-performing videos!`)
      } else {
        toast.info("No new thumbnails found")
      }
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to collect thumbnails")
      console.error(error)
    } finally {
      setCollecting(false)
    }
  }

  const deleteThumbnail = async (id: string) => {
    if (!confirm("Delete this thumbnail?")) return

    try {
      const { error } = await supabase
        .from("thumbnail_training")
        .delete()
        .eq("id", id)

      if (error) throw error

      setThumbnails(thumbnails.filter(t => t.id !== id))
      toast.success("Thumbnail deleted")
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to delete thumbnail")
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as "youtube" | "short_form")}>
          <TabsList>
            <TabsTrigger value="youtube">YouTube ({youtubeThumbnails.length})</TabsTrigger>
            <TabsTrigger value="short_form">Short Form ({shortFormThumbnails.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => collectFromYouTube(selectedCategory)}
            disabled={collecting}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${collecting ? "animate-spin" : ""}`} />
            {collecting ? "Collecting..." : "Auto-Collect from YouTube"}
          </Button>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Thumbnail
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Upload Thumbnail</DialogTitle>
                <DialogDescription>
                  Upload a thumbnail to train the AI model
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-1">
                <ThumbnailUploadForm
                  category={selectedCategory}
                  onUpload={handleFileUpload}
                  uploading={uploading}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Thumbnail Grid */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as "youtube" | "short_form")}>
        <TabsContent value="youtube" className="space-y-4">
          <ThumbnailGrid
            thumbnails={youtubeThumbnails}
            category="youtube"
            onDelete={deleteThumbnail}
          />
        </TabsContent>
        <TabsContent value="short_form" className="space-y-4">
          <ThumbnailGrid
            thumbnails={shortFormThumbnails}
            category="short_form"
            onDelete={deleteThumbnail}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ThumbnailUploadForm({
  category,
  onUpload,
  uploading,
}: {
  category: "youtube" | "short_form"
  onUpload: (file: File, category: "youtube" | "short_form", notes?: string) => void
  uploading: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      onUpload(file, category, notes || undefined)
      setFile(null)
      setNotes("")
      setPreview(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="space-y-2">
        <Label htmlFor="file">Thumbnail Image</Label>
        <Input
          id="file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          required
        />
        {preview && (
          <div className="mt-2 flex justify-center">
            <div className="relative w-full max-w-[300px] aspect-video rounded-lg border border-border overflow-hidden bg-muted">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about this thumbnail..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <div className="pt-2 border-t border-border">
        <Button type="submit" disabled={!file || uploading} className="w-full">
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </form>
  )
}

function ThumbnailGrid({
  thumbnails,
  category,
  onDelete,
}: {
  thumbnails: ThumbnailTraining[]
  category: "youtube" | "short_form"
  onDelete: (id: string) => void
}) {
  if (thumbnails.length === 0) {
    return (
      <Card className="p-12 text-center border-border">
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No thumbnails yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload thumbnails manually or auto-collect from high-performing videos
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {thumbnails.map((thumbnail) => (
        <Card key={thumbnail.id} className="overflow-hidden border-border group">
          <div className="relative aspect-video bg-muted">
            <img
              src={thumbnail.image_url}
              alt={thumbnail.source_video_title || "Thumbnail"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(thumbnail.id)}
                className="text-white hover:text-white hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {thumbnail.source_video_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-white hover:text-white"
                >
                  <a href={thumbnail.source_video_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
          <div className="p-2 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {thumbnail.source_type === "manual" ? "Manual" : "Auto"}
              </Badge>
              {thumbnail.performance_metrics?.views && (
                <span className="text-xs text-muted-foreground">
                  {thumbnail.performance_metrics.views.toLocaleString()} views
                </span>
              )}
            </div>
            {thumbnail.source_video_title && (
              <p className="text-xs text-muted-foreground truncate" title={thumbnail.source_video_title}>
                {thumbnail.source_video_title}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}


