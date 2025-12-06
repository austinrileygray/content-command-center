"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, CheckCircle2, Edit, Plus, Headphones, Video, ExternalLink, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

interface RecordingPrompt {
  id: string
  user_id: string
  category: "podcast" | "solo_youtube"
  name: string
  prompt_text: string
  is_active: boolean
  version_number: number
  created_at: string
  updated_at: string
}

interface RecordingPromptsClientProps {
  podcastPrompt: RecordingPrompt | null
  soloYouTubePrompt: RecordingPrompt | null
  allPodcastPrompts: RecordingPrompt[]
  allSoloYouTubePrompts: RecordingPrompt[]
}

export function RecordingPromptsClient({
  podcastPrompt,
  soloYouTubePrompt,
  allPodcastPrompts,
  allSoloYouTubePrompts,
}: RecordingPromptsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [podcastPromptText, setPodcastPromptText] = useState(podcastPrompt?.prompt_text || "")
  const [soloYouTubePromptText, setSoloYouTubePromptText] = useState(soloYouTubePrompt?.prompt_text || "")
  const [promptName, setPromptName] = useState("")
  const [saving, setSaving] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null) // "podcast" | "solo_youtube" | null
  const podcastFileInputRef = useRef<HTMLInputElement>(null)
  const soloYouTubeFileInputRef = useRef<HTMLInputElement>(null)

  const handleSavePrompt = async (category: "podcast" | "solo_youtube", isUpdate: boolean = false) => {
    const promptText = category === "podcast" ? podcastPromptText : soloYouTubePromptText
    const currentPrompt = category === "podcast" ? podcastPrompt : soloYouTubePrompt

    if (!promptText.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    if (!promptName.trim() && !currentPrompt) {
      toast.error("Please enter a name for this prompt")
      return
    }

    setSaving(category)

    try {
      // Get user profile
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)

      if (!profiles || profiles.length === 0) {
        throw new Error("User profile not found")
      }

      const userId = profiles[0].id

      if (isUpdate && currentPrompt) {
        // Update existing prompt - deactivate old, create new version
        await supabase
          .from("recording_editing_prompts")
          .update({ is_active: false })
          .eq("id", currentPrompt.id)

        const newVersionNumber = (currentPrompt.version_number || 1) + 1

        const { error } = await supabase
          .from("recording_editing_prompts")
          .insert({
            user_id: userId,
            category,
            name: promptName.trim() || `${category === "podcast" ? "Podcast" : "Solo YouTube"} Editing v${newVersionNumber}`,
            prompt_text: promptText.trim(),
            is_active: true,
            version_number: newVersionNumber,
          })

        if (error) throw error

        toast.success(`✅ ${category === "podcast" ? "Podcast" : "Solo YouTube"} editing prompt updated to version ${newVersionNumber}!`)
      } else {
        // Create new prompt
        // Deactivate any existing active prompts for this category
        await supabase
          .from("recording_editing_prompts")
          .update({ is_active: false })
          .eq("category", category)
          .eq("is_active", true)

        const { error } = await supabase
          .from("recording_editing_prompts")
          .insert({
            user_id: userId,
            category,
            name: promptName.trim() || `${category === "podcast" ? "Podcast" : "Solo YouTube"} Editing Prompt`,
            prompt_text: promptText.trim(),
            is_active: true,
            version_number: 1,
          })

        if (error) throw error

        toast.success(`✅ ${category === "podcast" ? "Podcast" : "Solo YouTube"} editing prompt created!`)
      }

      setEditing(null)
      setPromptName("")
      router.refresh()
    } catch (error: any) {
      console.error("Error saving prompt:", error)
      toast.error(error.message || "Failed to save prompt")
    } finally {
      setSaving(null)
    }
  }

  const handleEdit = (category: "podcast" | "solo_youtube") => {
    const currentPrompt = category === "podcast" ? podcastPrompt : soloYouTubePrompt
    if (currentPrompt) {
      if (category === "podcast") {
        setPodcastPromptText(currentPrompt.prompt_text)
      } else {
        setSoloYouTubePromptText(currentPrompt.prompt_text)
      }
      setPromptName(currentPrompt.name)
    }
    setEditing(category)
  }

  const handleCancelEdit = () => {
    setEditing(null)
    setPromptName("")
    if (podcastPrompt) {
      setPodcastPromptText(podcastPrompt.prompt_text)
    }
    if (soloYouTubePrompt) {
      setSoloYouTubePromptText(soloYouTubePrompt.prompt_text)
    }
  }

  const handleFileUpload = async (category: "podcast" | "solo_youtube", file: File) => {
    if (!file.name.toLowerCase().endsWith(".md") && !file.name.toLowerCase().endsWith(".markdown")) {
      toast.error("Please upload a markdown file (.md or .markdown)")
      return
    }

    try {
      const text = await file.text()
      
      if (category === "podcast") {
        setPodcastPromptText(text)
        toast.success("✅ Markdown file loaded! You can edit it before saving.")
      } else {
        setSoloYouTubePromptText(text)
        toast.success("✅ Markdown file loaded! You can edit it before saving.")
      }

      // Clear file input
      if (category === "podcast" && podcastFileInputRef.current) {
        podcastFileInputRef.current.value = ""
      } else if (category === "solo_youtube" && soloYouTubeFileInputRef.current) {
        soloYouTubeFileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Error reading file:", error)
      toast.error("Failed to read file: " + error.message)
    }
  }

  const handleFileInputChange = (category: "podcast" | "solo_youtube", event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(category, file)
    }
  }

  return (
    <Tabs defaultValue="podcast" className="space-y-4">
      <TabsList>
        <TabsTrigger value="podcast">
          <Headphones className="w-4 h-4 mr-2" />
          Podcast Editing
        </TabsTrigger>
        <TabsTrigger value="solo_youtube">
          <Video className="w-4 h-4 mr-2" />
          Solo YouTube Editing
        </TabsTrigger>
      </TabsList>

      <TabsContent value="podcast" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Podcast Episode Editing Prompt</CardTitle>
            <CardDescription>
              {podcastPrompt
                ? `Version ${podcastPrompt.version_number} - Active prompt for podcast editing workflows`
                : "Create a prompt that defines how podcast episodes should be edited. This prompt will guide the automated editing workflow."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {podcastPrompt && editing !== "podcast" ? (
              <div className="space-y-4">
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <AlertTitle className="text-green-500 font-semibold">
                    ✅ Podcast Editing Prompt Active
                  </AlertTitle>
                  <AlertDescription className="text-foreground mt-2">
                    <div className="space-y-3">
                      <p>
                        <strong>{podcastPrompt.name}</strong> (v{podcastPrompt.version_number}) is currently active and will be used for all podcast episode uploads.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleEdit("podcast")}
                        >
                          <Edit className="h-4 w-4" />
                          Update Prompt
                        </Button>
                        <Link href="/recordings">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Video className="h-4 w-4" />
                            Upload Podcast
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <Label className="text-sm font-medium mb-2 block">Current Prompt:</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{podcastPrompt.prompt_text}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="prompt-name">Prompt Name</Label>
                  <Input
                    id="prompt-name"
                    placeholder="e.g., Podcast Editing V1, Owner Ops Podcast Editing"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="podcast-prompt">Editing Prompt</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => podcastFileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Markdown
                    </Button>
                    <input
                      ref={podcastFileInputRef}
                      type="file"
                      accept=".md,.markdown"
                      onChange={(e) => handleFileInputChange("podcast", e)}
                      className="hidden"
                    />
                  </div>
                  <Textarea
                    id="podcast-prompt"
                    placeholder="Enter your comprehensive editing prompt for podcast episodes. Include instructions for pacing, silence removal, intro/outro, transitions, audio levels, etc... Or upload a .md file above."
                    value={podcastPromptText}
                    onChange={(e) => setPodcastPromptText(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    This prompt will be used when processing podcast episode uploads to guide the automated editing workflow. You can type directly or upload a markdown file (.md).
                  </p>
                </div>
                <div className="flex gap-2">
                  {editing === "podcast" && (
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving === "podcast"}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={() => handleSavePrompt("podcast", editing === "podcast")}
                    disabled={!podcastPromptText.trim() || saving === "podcast"}
                    className={editing === "podcast" ? "flex-1" : "w-full"}
                  >
                    {saving === "podcast" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editing === "podcast" ? (
                          <>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Prompt
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Podcast Editing Prompt
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="solo_youtube" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Solo YouTube Video Editing Prompt</CardTitle>
            <CardDescription>
              {soloYouTubePrompt
                ? `Version ${soloYouTubePrompt.version_number} - Active prompt for solo YouTube editing workflows`
                : "Create a prompt that defines how solo YouTube videos should be edited. This prompt will guide the automated editing workflow."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {soloYouTubePrompt && editing !== "solo_youtube" ? (
              <div className="space-y-4">
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <AlertTitle className="text-green-500 font-semibold">
                    ✅ Solo YouTube Editing Prompt Active
                  </AlertTitle>
                  <AlertDescription className="text-foreground mt-2">
                    <div className="space-y-3">
                      <p>
                        <strong>{soloYouTubePrompt.name}</strong> (v{soloYouTubePrompt.version_number}) is currently active and will be used for all solo YouTube video uploads.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleEdit("solo_youtube")}
                        >
                          <Edit className="h-4 w-4" />
                          Update Prompt
                        </Button>
                        <Link href="/recordings">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Video className="h-4 w-4" />
                            Upload Solo YouTube
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <Label className="text-sm font-medium mb-2 block">Current Prompt:</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{soloYouTubePrompt.prompt_text}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="solo-prompt-name">Prompt Name</Label>
                  <Input
                    id="solo-prompt-name"
                    placeholder="e.g., Solo YouTube Editing V1, Owner Ops Solo Editing"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="solo-youtube-prompt">Editing Prompt</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => soloYouTubeFileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Markdown
                    </Button>
                    <input
                      ref={soloYouTubeFileInputRef}
                      type="file"
                      accept=".md,.markdown"
                      onChange={(e) => handleFileInputChange("solo_youtube", e)}
                      className="hidden"
                    />
                  </div>
                  <Textarea
                    id="solo-youtube-prompt"
                    placeholder="Enter your comprehensive editing prompt for solo YouTube videos. Include instructions for pacing, jump cuts, b-roll, transitions, audio levels, visual effects, etc... Or upload a .md file above."
                    value={soloYouTubePromptText}
                    onChange={(e) => setSoloYouTubePromptText(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    This prompt will be used when processing solo YouTube video uploads to guide the automated editing workflow. You can type directly or upload a markdown file (.md).
                  </p>
                </div>
                <div className="flex gap-2">
                  {editing === "solo_youtube" && (
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving === "solo_youtube"}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={() => handleSavePrompt("solo_youtube", editing === "solo_youtube")}
                    disabled={!soloYouTubePromptText.trim() || saving === "solo_youtube"}
                    className={editing === "solo_youtube" ? "flex-1" : "w-full"}
                  >
                    {saving === "solo_youtube" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editing === "solo_youtube" ? (
                          <>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Prompt
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Solo YouTube Editing Prompt
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}








