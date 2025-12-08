"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, FileText, ImageIcon, Edit, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PromptsClientProps {
  youtubeInitialized: boolean
  shortFormInitialized: boolean
  youtubeVersion: number
  shortFormVersion: number
  youtubeSections: Record<string, any> | null
  shortFormSections: Record<string, any> | null
}

export function PromptsClient({
  youtubeInitialized,
  shortFormInitialized,
  youtubeVersion,
  shortFormVersion,
  youtubeSections,
  shortFormSections,
}: PromptsClientProps) {
  const router = useRouter()
  const [youtubePrompt, setYoutubePrompt] = useState("")
  const [shortFormPrompt, setShortFormPrompt] = useState("")
  const [initializing, setInitializing] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null) // "youtube" | "short_form" | null

  // Reconstruct mega prompt from sections (for editing)
  const reconstructPrompt = (sections: Record<string, any> | null): string => {
    if (!sections) return ""
    return Object.entries(sections)
      .map(([name, data]) => {
        const content = typeof data === "object" ? data.content : data
        return `## ${name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}\n${content}`
      })
      .join("\n\n")
  }

  // Load prompt for editing
  const handleEdit = (category: "youtube" | "short_form") => {
    const sections = category === "youtube" ? youtubeSections : shortFormSections
    const reconstructed = reconstructPrompt(sections)
    
    if (category === "youtube") {
      setYoutubePrompt(reconstructed)
    } else {
      setShortFormPrompt(reconstructed)
    }
    setEditing(category)
  }

  const handleCancelEdit = (category: "youtube" | "short_form") => {
    if (category === "youtube") {
      setYoutubePrompt("")
    } else {
      setShortFormPrompt("")
    }
    setEditing(null)
  }

  const handleInitialize = async (category: "youtube" | "short_form", isUpdate: boolean = false) => {
    const prompt = category === "youtube" ? youtubePrompt : shortFormPrompt

    if (!prompt.trim()) {
      toast.error("Please enter your mega prompt")
      return
    }

    setInitializing(category)

    // Create an AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

    try {
      toast.info("Analyzing prompt with Claude Opus 4.5... This may take 30-60 seconds for large prompts.", {
        duration: 10000,
      })

      const endpoint = isUpdate 
        ? "/api/thumbnails/prompts/update"
        : "/api/thumbnails/prompts/initialize"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          megaPrompt: prompt.trim(),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMsg = data.error || "Failed to initialize prompt"
        const details = data.details ? `: ${data.details}` : ""
        toast.error(`${errorMsg}${details}`, {
          duration: 8000,
        })
        console.error("Initialization error:", data)
        setInitializing(null)
        return
      }

      const data = await response.json()
      const sectionCount = Object.keys(data.sections || {}).length

      toast.success(
        `✅ Success! Prompt ${isUpdate ? 'updated' : 'initialized'} and broken into ${sectionCount} modular sections.`,
        { 
          duration: 6000,
          description: isUpdate 
            ? `Updated to version ${data.template?.version_number || 'new'}. Your prompt is now active.`
            : "Your prompt is now active and ready to use for thumbnail generation."
        }
      )
      
      // Clear editing state and refresh
      setEditing(null)
      if (category === "youtube") {
        setYoutubePrompt("")
      } else {
        setShortFormPrompt("")
      }
      router.refresh()
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === "AbortError") {
        toast.error("Request timed out. The prompt may be too large. Please try again or split into smaller sections.", {
          duration: 10000,
        })
      } else if (error.message?.includes("fetch")) {
        toast.error("Network error. Please check your connection and try again.", {
          duration: 8000,
        })
      } else {
        toast.error(error.message || "Failed to initialize prompt. Please try again.", {
          duration: 8000,
        })
      }
      console.error("Initialization error:", error)
    } finally {
      setInitializing(null)
    }
  }

  return (
    <Tabs defaultValue="youtube" className="space-y-4">
      <TabsList>
        <TabsTrigger value="youtube">YouTube Thumbnails</TabsTrigger>
        <TabsTrigger value="short_form">Short Form Thumbnails</TabsTrigger>
      </TabsList>

      <TabsContent value="youtube" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>YouTube Thumbnail Prompt</CardTitle>
            <CardDescription>
              {youtubeInitialized
                ? `Version ${youtubeVersion} - Prompt is active and being used for generation`
                : "Enter your mega prompt for YouTube thumbnail generation. This will be broken into modular sections."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {youtubeInitialized && editing !== "youtube" ? (
              <div className="space-y-4">
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <AlertTitle className="text-green-500 font-semibold">
                    ✅ Prompt Successfully Initialized!
                  </AlertTitle>
                  <AlertDescription className="text-foreground mt-2">
                    <div className="space-y-3">
                      <p>
                        Your YouTube thumbnail prompt has been uploaded and broken into <strong>{youtubeVersion > 0 ? 'modular sections' : 'sections'}</strong>. 
                        The AI model is now ready to use this prompt for generating thumbnails.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleEdit("youtube")}
                        >
                          <Edit className="h-4 w-4" />
                          Edit Prompt
                        </Button>
                        <Link href="/thumbnails">
                          <Button variant="outline" size="sm" className="gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Upload Thumbnails
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="gap-2" disabled>
                          <FileText className="h-4 w-4" />
                          View Sections
                          <span className="text-xs text-muted-foreground ml-1">(Coming soon)</span>
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="youtube-prompt">Mega Prompt</Label>
                  <Textarea
                    id="youtube-prompt"
                    placeholder="Enter your comprehensive prompt for YouTube thumbnail generation. Include details about colors, text style, layout, visual elements, emotion, technical specs, and best practices..."
                    value={youtubePrompt}
                    onChange={(e) => setYoutubePrompt(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    The AI will automatically break this into modular sections that can be updated independently.
                  </p>
                </div>
                <div className="flex gap-2">
                  {editing === "youtube" && (
                    <Button
                      variant="outline"
                      onClick={() => handleCancelEdit("youtube")}
                      disabled={initializing === "youtube"}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={() => handleInitialize("youtube", editing === "youtube")}
                    disabled={!youtubePrompt.trim() || initializing === "youtube"}
                    className={editing === "youtube" ? "flex-1" : "w-full"}
                  >
                    {initializing === "youtube" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editing === "youtube" ? "Updating..." : "Initializing..."}
                      </>
                    ) : (
                      <>
                        {editing === "youtube" ? (
                          <>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Prompt
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Initialize YouTube Prompt
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

      <TabsContent value="short_form" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Short Form Thumbnail Prompt</CardTitle>
            <CardDescription>
              {shortFormInitialized
                ? `Version ${shortFormVersion} - Prompt is active and being used for generation`
                : "Enter your mega prompt for Short Form thumbnail generation. This will be broken into modular sections."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {shortFormInitialized && editing !== "short_form" ? (
              <div className="space-y-4">
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <AlertTitle className="text-green-500 font-semibold">
                    ✅ Prompt Successfully Initialized!
                  </AlertTitle>
                  <AlertDescription className="text-foreground mt-2">
                    <div className="space-y-3">
                      <p>
                        Your Short Form thumbnail prompt has been uploaded and broken into <strong>{shortFormVersion > 0 ? 'modular sections' : 'sections'}</strong>. 
                        The AI model is now ready to use this prompt for generating thumbnails.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleEdit("short_form")}
                        >
                          <Edit className="h-4 w-4" />
                          Edit Prompt
                        </Button>
                        <Link href="/thumbnails">
                          <Button variant="outline" size="sm" className="gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Upload Thumbnails
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="gap-2" disabled>
                          <FileText className="h-4 w-4" />
                          View Sections
                          <span className="text-xs text-muted-foreground ml-1">(Coming soon)</span>
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="short-form-prompt">Mega Prompt</Label>
                  <Textarea
                    id="short-form-prompt"
                    placeholder="Enter your comprehensive prompt for Short Form thumbnail generation. Include details about colors, text style, layout, visual elements, emotion, technical specs, and best practices..."
                    value={shortFormPrompt}
                    onChange={(e) => setShortFormPrompt(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    The AI will automatically break this into modular sections that can be updated independently.
                  </p>
                </div>
                <div className="flex gap-2">
                  {editing === "short_form" && (
                    <Button
                      variant="outline"
                      onClick={() => handleCancelEdit("short_form")}
                      disabled={initializing === "short_form"}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={() => handleInitialize("short_form", editing === "short_form")}
                    disabled={!shortFormPrompt.trim() || initializing === "short_form"}
                    className={editing === "short_form" ? "flex-1" : "w-full"}
                  >
                    {initializing === "short_form" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editing === "short_form" ? "Updating..." : "Initializing..."}
                      </>
                    ) : (
                      <>
                        {editing === "short_form" ? (
                          <>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Prompt
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Initialize Short Form Prompt
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



