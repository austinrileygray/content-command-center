"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2, CheckCircle, Video } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"

interface UploadRecordingProps {
  contentIdeaId?: string
  ideas?: Array<{ id: string; title: string }>
  onSuccess?: () => void
}

export function UploadRecording({ contentIdeaId: initialContentIdeaId, ideas = [], onSuccess }: UploadRecordingProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [platform, setPlatform] = useState("manual")
  const [autoProcess, setAutoProcess] = useState(true)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>(initialContentIdeaId || "")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validVideoTypes = [
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
        "video/mov"
      ]

      if (!validVideoTypes.includes(file.type)) {
        toast.error("Please select a valid video file (mp4, mov, avi, webm)")
        return
      }

      // Validate file size (2GB max)
      const maxSize = 2 * 1024 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error("File size must be less than 2GB")
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      if (selectedIdeaId && selectedIdeaId !== "__new_idea__" || (initialContentIdeaId && initialContentIdeaId !== "__new_idea__")) {
        formData.append("contentIdeaId", selectedIdeaId || initialContentIdeaId || "")
      }
      formData.append("platform", platform)
      formData.append("autoProcess", autoProcess.toString())

      const response = await fetch("/api/recordings/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      toast.success(data.message || "Recording uploaded successfully!")
      
      // Reset form
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Refresh page or call callback
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Failed to upload recording")
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Upload Recording
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload a video recording to start the automated workflow (Submagic → Thumbnails → YouTube)
          </p>
        </div>

        {/* File Input */}
        <div className="space-y-2">
          <Label htmlFor="recording-file">Video File</Label>
          <div className="flex items-center gap-4">
            <Input
              id="recording-file"
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/mov"
              onChange={handleFileSelect}
              className="flex-1"
              disabled={uploading}
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="w-4 h-4" />
                <span>{selectedFile.name}</span>
                <span className="text-xs">({formatFileSize(selectedFile.size)})</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Idea Selection */}
        {ideas && ideas.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="content-idea">Link to Content Idea (Optional)</Label>
            <Select 
              value={selectedIdeaId} 
              onValueChange={setSelectedIdeaId} 
              disabled={uploading || !!initialContentIdeaId}
            >
              <SelectTrigger id="content-idea">
                <SelectValue placeholder="Select an idea or create new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__new_idea__">Create New Idea</SelectItem>
                {ideas.map(idea => (
                  <SelectItem key={idea.id} value={idea.id}>
                    {idea.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Platform Selection */}
        <div className="space-y-2">
          <Label htmlFor="platform">Recording Platform</Label>
          <Select value={platform} onValueChange={setPlatform} disabled={uploading}>
            <SelectTrigger id="platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual Upload</SelectItem>
              <SelectItem value="loom">Loom</SelectItem>
              <SelectItem value="squadcast">SquadCast</SelectItem>
              <SelectItem value="restream">Restream</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto Process Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="autoProcess"
            checked={autoProcess}
            onCheckedChange={(checked) => setAutoProcess(checked === true)}
            disabled={uploading}
          />
          <Label
            htmlFor="autoProcess"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Automatically start workflow (Submagic → Thumbnails → YouTube)
          </Label>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full bg-brand hover:bg-brand/90"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Recording
            </>
          )}
        </Button>

        {autoProcess && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Automated Workflow:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Upload recording to storage</li>
              <li>Send to Submagic for clip generation</li>
              <li>Generate thumbnails</li>
              <li>Auto-publish to YouTube</li>
            </ol>
          </div>
        )}
      </div>
    </Card>
  )
}



