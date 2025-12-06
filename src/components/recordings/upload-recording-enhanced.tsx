"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2, Video, Headphones, Edit, ExternalLink, FileText } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface EditingPrompt {
  id: string
  name: string
  category: "podcast" | "solo_youtube"
  version_number: number
}

interface UploadRecordingEnhancedProps {
  podcastPrompts: EditingPrompt[]
  soloYouTubePrompts: EditingPrompt[]
  ideas?: Array<{ id: string; title: string }>
  onSuccess?: () => void
}

export function UploadRecordingEnhanced({ 
  podcastPrompts = [],
  soloYouTubePrompts = [],
  ideas = [],
  onSuccess 
}: UploadRecordingEnhancedProps) {
  const router = useRouter()
  const supabase = createClient()
  const podcastFileInputRef = useRef<HTMLInputElement>(null)
  const soloYouTubeFileInputRef = useRef<HTMLInputElement>(null)
  
  // Podcast state
  const [podcastFile, setPodcastFile] = useState<File | null>(null)
  const [podcastPromptId, setPodcastPromptId] = useState<string>("")
  const [podcastIdeaId, setPodcastIdeaId] = useState<string>("")
  const [podcastAutoProcess, setPodcastAutoProcess] = useState(true)
  const [podcastUploading, setPodcastUploading] = useState(false)

  // Solo YouTube state
  const [soloYouTubeFile, setSoloYouTubeFile] = useState<File | null>(null)
  const [soloYouTubePromptId, setSoloYouTubePromptId] = useState<string>("")
  const [soloYouTubeIdeaId, setSoloYouTubeIdeaId] = useState<string>("")
  const [soloYouTubeAutoProcess, setSoloYouTubeAutoProcess] = useState(true)
  const [soloYouTubeUploading, setSoloYouTubeUploading] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const validateFile = (file: File): boolean => {
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
      return false
    }

    const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
    if (file.size > maxSize) {
      toast.error("File size must be less than 2GB")
      return false
    }

    return true
  }

  const handlePodcastFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setPodcastFile(file)
    }
  }

  const handleSoloYouTubeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setSoloYouTubeFile(file)
    }
  }

  const handlePodcastUpload = async () => {
    if (!podcastFile) {
      toast.error("Please select a podcast file first")
      return
    }

    if (!podcastPromptId) {
      toast.error("Please select a podcast editing prompt")
      return
    }

    setPodcastUploading(true)
    try {
      const fileSizeMB = podcastFile.size / 1024 / 1024
      const vercelLimitMB = 50
      
      // For files > 50MB, use direct Supabase upload
      let recordingUrl: string
      let filePath: string

      if (fileSizeMB > vercelLimitMB) {
        // Large file: Use direct Supabase Storage upload from client
        toast.info(`Uploading ${fileSizeMB.toFixed(2)} MB file directly to storage...`)
        
        // Step 1: Generate file path
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(7)
        const fileExt = podcastFile.name.split(".").pop()
        
        // Get user ID
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .limit(1)
          .single()

        if (profileError || !profile) {
          throw new Error("User profile not found")
        }

        filePath = `${profile.id}/recordings/${timestamp}-${randomId}.${fileExt}`
        
        // Step 2: Upload directly to Supabase Storage from client
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("recordings")
          .upload(filePath, podcastFile, {
            contentType: podcastFile.type,
            upsert: false,
            cacheControl: "3600",
          })

        if (uploadError) {
          console.error("Storage upload error:", uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Step 3: Get public URL
        const { data: urlData } = supabase.storage
          .from("recordings")
          .getPublicUrl(filePath)

        recordingUrl = urlData.publicUrl

        toast.success("File uploaded! Creating recording entry...")
      } else {
        // Small file: Use standard API upload
        const formData = new FormData()
        formData.append("file", podcastFile)
        formData.append("contentType", "podcast")
        formData.append("editingPromptId", podcastPromptId)
        if (podcastIdeaId && podcastIdeaId !== "__new_idea__") {
          formData.append("contentIdeaId", podcastIdeaId)
        }
        formData.append("platform", "manual")
        formData.append("autoProcess", podcastAutoProcess.toString())

        const response = await fetch("/api/recordings/upload", {
          method: "POST",
          body: formData,
        })

        const contentType = response.headers.get("content-type") || ""
        let data: any
        
        if (contentType.includes("application/json")) {
          data = await response.json()
        } else {
          const text = await response.text()
          console.error("Non-JSON response received:", text.substring(0, 500))
          throw new Error(`Server returned non-JSON response (${response.status}). Please check server logs.`)
        }

        if (!response.ok) {
          throw new Error(data.error || data.message || "Upload failed")
        }

        toast.success(data.message || "Podcast uploaded successfully!")
        
        // Reset form and return early for standard upload
        setPodcastFile(null)
        if (podcastFileInputRef.current) {
          podcastFileInputRef.current.value = ""
        }
        setPodcastPromptId("")
        setPodcastIdeaId("")

        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
        return
      }

      // Step 3: Create recording entry via API (for large files)
      const createResponse = await fetch("/api/recordings/create-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingUrl,
          filePath,
          fileName: podcastFile.name,
          contentType: "podcast",
          editingPromptId: podcastPromptId,
          contentIdeaId: podcastIdeaId && podcastIdeaId !== "__new_idea__" ? podcastIdeaId : null,
          platform: "manual",
          autoProcess: podcastAutoProcess,
        }),
      })

      const createData = await createResponse.json()
      if (!createResponse.ok) {
        throw new Error(createData.error || "Failed to create recording entry")
      }

      toast.success(createData.message || "Podcast uploaded successfully!")
      
      // Reset form
      setPodcastFile(null)
      if (podcastFileInputRef.current) {
        podcastFileInputRef.current.value = ""
      }
      setPodcastPromptId("")
      setPodcastIdeaId("")

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Failed to upload podcast")
    } finally {
      setPodcastUploading(false)
    }
  }

  const handleSoloYouTubeUpload = async () => {
    if (!soloYouTubeFile) {
      toast.error("Please select a video file first")
      return
    }

    if (!soloYouTubePromptId) {
      toast.error("Please select a solo YouTube editing prompt")
      return
    }

    setSoloYouTubeUploading(true)
    try {
      const fileSizeMB = soloYouTubeFile.size / 1024 / 1024
      const vercelLimitMB = 50
      
      // For files > 50MB, use direct Supabase upload
      let recordingUrl: string
      let filePath: string

      if (fileSizeMB > vercelLimitMB) {
        // Large file: Use direct Supabase Storage upload from client
        toast.info(`Uploading ${fileSizeMB.toFixed(2)} MB file directly to storage...`)
        
        // Step 1: Generate file path
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(7)
        const fileExt = soloYouTubeFile.name.split(".").pop()
        
        // Get user ID
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .limit(1)
          .single()

        if (profileError || !profile) {
          throw new Error("User profile not found")
        }

        filePath = `${profile.id}/recordings/${timestamp}-${randomId}.${fileExt}`
        
        // Step 2: Upload directly to Supabase Storage from client
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("recordings")
          .upload(filePath, soloYouTubeFile, {
            contentType: soloYouTubeFile.type,
            upsert: false,
            cacheControl: "3600",
          })

        if (uploadError) {
          console.error("Storage upload error:", uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Step 3: Get public URL
        const { data: urlData } = supabase.storage
          .from("recordings")
          .getPublicUrl(filePath)

        recordingUrl = urlData.publicUrl

        toast.success("File uploaded! Creating recording entry...")
      } else {
        // Small file: Use standard API upload
        const formData = new FormData()
        formData.append("file", soloYouTubeFile)
        formData.append("contentType", "solo_youtube")
        formData.append("editingPromptId", soloYouTubePromptId)
        if (soloYouTubeIdeaId && soloYouTubeIdeaId !== "__new_idea__") {
          formData.append("contentIdeaId", soloYouTubeIdeaId)
        }
        formData.append("platform", "manual")
        formData.append("autoProcess", soloYouTubeAutoProcess.toString())

        const response = await fetch("/api/recordings/upload", {
          method: "POST",
          body: formData,
        })

        const contentType = response.headers.get("content-type") || ""
        let data: any
        
        if (contentType.includes("application/json")) {
          data = await response.json()
        } else {
          const text = await response.text()
          console.error("Non-JSON response received:", text.substring(0, 500))
          throw new Error(`Server returned non-JSON response (${response.status}). Please check server logs.`)
        }

        if (!response.ok) {
          throw new Error(data.error || data.message || "Upload failed")
        }

        toast.success(data.message || "Video uploaded successfully!")
        
        // Reset form and return early for standard upload
        setSoloYouTubeFile(null)
        if (soloYouTubeFileInputRef.current) {
          soloYouTubeFileInputRef.current.value = ""
        }
        setSoloYouTubePromptId("")
        setSoloYouTubeIdeaId("")

        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
        return
      }

      // Step 3: Create recording entry via API (for large files)
      const createResponse = await fetch("/api/recordings/create-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingUrl,
          filePath,
          fileName: soloYouTubeFile.name,
          contentType: "solo_youtube",
          editingPromptId: soloYouTubePromptId,
          contentIdeaId: soloYouTubeIdeaId && soloYouTubeIdeaId !== "__new_idea__" ? soloYouTubeIdeaId : null,
          platform: "manual",
          autoProcess: soloYouTubeAutoProcess,
        }),
      })

      const createData = await createResponse.json()
      if (!createResponse.ok) {
        throw new Error(createData.error || "Failed to create recording entry")
      }

      toast.success(createData.message || "Video uploaded successfully!")
      
      // Reset form
      setSoloYouTubeFile(null)
      if (soloYouTubeFileInputRef.current) {
        soloYouTubeFileInputRef.current.value = ""
      }
      setSoloYouTubePromptId("")
      setSoloYouTubeIdeaId("")

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Failed to upload video")
    } finally {
      setSoloYouTubeUploading(false)
    }
  }

  const activePodcastPrompt = podcastPrompts.find(p => p.id === podcastPromptId)
  const activeSoloYouTubePrompt = soloYouTubePrompts.find(p => p.id === soloYouTubePromptId)

  return (
    <div className="space-y-6">
      {/* Podcast Upload Section */}
      <Card className="p-6 bg-card border-border">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Headphones className="w-5 h-5 text-brand" />
                <h3 className="text-lg font-semibold text-foreground">
                  Upload Podcast Episode
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a podcast episode and automatically process it with your podcast editing prompt
              </p>
            </div>
            <Link href="/prompts">
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Manage Prompts
                <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {/* Podcast Editing Prompt Selection */}
          <div className="space-y-2">
            <Label htmlFor="podcast-prompt">Podcast Editing Prompt *</Label>
            <Select 
              value={podcastPromptId} 
              onValueChange={setPodcastPromptId}
              disabled={podcastUploading}
            >
              <SelectTrigger id="podcast-prompt">
                <SelectValue placeholder="Select a podcast editing prompt" />
              </SelectTrigger>
              <SelectContent>
                {podcastPrompts.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No prompts available - Create one in Prompts page
                  </div>
                ) : (
                  podcastPrompts.map(prompt => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      {prompt.name} (v{prompt.version_number})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!podcastPromptId && podcastPrompts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Select the editing prompt to use for this podcast episode
              </p>
            )}
            {podcastPrompts.length === 0 && (
              <div className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded">
                No podcast editing prompts found. <Link href="/prompts" className="underline">Create one here</Link>
              </div>
            )}
            {activePodcastPrompt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{activePodcastPrompt.name}</Badge>
                <Link href="/prompts" className="text-brand hover:underline flex items-center gap-1">
                  <Edit className="w-3 h-3" />
                  Edit Prompt
                </Link>
              </div>
            )}
          </div>

          {/* Podcast File Input */}
          <div className="space-y-2">
            <Label htmlFor="podcast-file">Podcast Episode File *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="podcast-file"
                ref={podcastFileInputRef}
                type="file"
                accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/mov,audio/mp3,audio/mpeg,audio/wav"
                onChange={handlePodcastFileSelect}
                className="flex-1"
                disabled={podcastUploading}
              />
              {podcastFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{podcastFile.name}</span>
                  <span className="text-xs">({formatFileSize(podcastFile.size)})</span>
                </div>
              )}
            </div>
          </div>

          {/* Podcast Content Idea Selection */}
          {ideas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="podcast-idea">Link to Content Idea (Optional)</Label>
              <Select 
                value={podcastIdeaId} 
                onValueChange={setPodcastIdeaId}
                disabled={podcastUploading}
              >
                <SelectTrigger id="podcast-idea">
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

          {/* Podcast Auto Process */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="podcast-autoProcess"
              checked={podcastAutoProcess}
              onCheckedChange={(checked) => setPodcastAutoProcess(checked === true)}
              disabled={podcastUploading}
            />
            <Label
              htmlFor="podcast-autoProcess"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Automatically start workflow (Edit with prompt → Submagic → Thumbnails → YouTube)
            </Label>
          </div>

          {/* Podcast Upload Button */}
          <Button
            onClick={handlePodcastUpload}
            disabled={!podcastFile || !podcastPromptId || podcastUploading}
            className="w-full bg-brand hover:bg-brand/90"
            size="lg"
          >
            {podcastUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading Podcast...
              </>
            ) : (
              <>
                <Headphones className="w-4 h-4 mr-2" />
                Upload Podcast Episode
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Solo YouTube Upload Section */}
      <Card className="p-6 bg-card border-border">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-5 h-5 text-brand" />
                <h3 className="text-lg font-semibold text-foreground">
                  Upload Solo YouTube Video
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a solo YouTube video and automatically process it with your solo YouTube editing prompt
              </p>
            </div>
            <Link href="/prompts">
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Manage Prompts
                <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {/* Solo YouTube Editing Prompt Selection */}
          <div className="space-y-2">
            <Label htmlFor="solo-prompt">Solo YouTube Editing Prompt *</Label>
            <Select 
              value={soloYouTubePromptId} 
              onValueChange={setSoloYouTubePromptId}
              disabled={soloYouTubeUploading}
            >
              <SelectTrigger id="solo-prompt">
                <SelectValue placeholder="Select a solo YouTube editing prompt" />
              </SelectTrigger>
              <SelectContent>
                {soloYouTubePrompts.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No prompts available - Create one in Prompts page
                  </div>
                ) : (
                  soloYouTubePrompts.map(prompt => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      {prompt.name} (v{prompt.version_number})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!soloYouTubePromptId && soloYouTubePrompts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Select the editing prompt to use for this solo YouTube video
              </p>
            )}
            {soloYouTubePrompts.length === 0 && (
              <div className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded">
                No solo YouTube editing prompts found. <Link href="/prompts" className="underline">Create one here</Link>
              </div>
            )}
            {activeSoloYouTubePrompt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{activeSoloYouTubePrompt.name}</Badge>
                <Link href="/prompts" className="text-brand hover:underline flex items-center gap-1">
                  <Edit className="w-3 h-3" />
                  Edit Prompt
                </Link>
              </div>
            )}
          </div>

          {/* Solo YouTube File Input */}
          <div className="space-y-2">
            <Label htmlFor="solo-file">Video File *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="solo-file"
                ref={soloYouTubeFileInputRef}
                type="file"
                accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/mov"
                onChange={handleSoloYouTubeFileSelect}
                className="flex-1"
                disabled={soloYouTubeUploading}
              />
              {soloYouTubeFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Video className="w-4 h-4" />
                  <span>{soloYouTubeFile.name}</span>
                  <span className="text-xs">({formatFileSize(soloYouTubeFile.size)})</span>
                </div>
              )}
            </div>
          </div>

          {/* Solo YouTube Content Idea Selection */}
          {ideas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="solo-idea">Link to Content Idea (Optional)</Label>
              <Select 
                value={soloYouTubeIdeaId} 
                onValueChange={setSoloYouTubeIdeaId}
                disabled={soloYouTubeUploading}
              >
                <SelectTrigger id="solo-idea">
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

          {/* Solo YouTube Auto Process */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="solo-autoProcess"
              checked={soloYouTubeAutoProcess}
              onCheckedChange={(checked) => setSoloYouTubeAutoProcess(checked === true)}
              disabled={soloYouTubeUploading}
            />
            <Label
              htmlFor="solo-autoProcess"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Automatically start workflow (Edit with prompt → Submagic → Thumbnails → YouTube)
            </Label>
          </div>

          {/* Solo YouTube Upload Button */}
          <Button
            onClick={handleSoloYouTubeUpload}
            disabled={!soloYouTubeFile || !soloYouTubePromptId || soloYouTubeUploading}
            className="w-full bg-brand hover:bg-brand/90"
            size="lg"
          >
            {soloYouTubeUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading Video...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Upload Solo YouTube Video
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}








