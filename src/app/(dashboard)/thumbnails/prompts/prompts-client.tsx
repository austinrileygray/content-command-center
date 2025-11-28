"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, FileText, ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PromptsClientProps {
  youtubeInitialized: boolean
  shortFormInitialized: boolean
  youtubeVersion: number
  shortFormVersion: number
}

export function PromptsClient({
  youtubeInitialized,
  shortFormInitialized,
  youtubeVersion,
  shortFormVersion,
}: PromptsClientProps) {
  const router = useRouter()
  const [youtubePrompt, setYoutubePrompt] = useState("")
  const [shortFormPrompt, setShortFormPrompt] = useState("")
  const [initializing, setInitializing] = useState<string | null>(null)

  const handleInitialize = async (category: "youtube" | "short_form") => {
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

      const response = await fetch("/api/thumbnails/prompts/initialize", {
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
        `✅ Success! Prompt initialized and broken into ${sectionCount} modular sections.`,
        { 
          duration: 6000,
          description: "Your prompt is now active and ready to use for thumbnail generation."
        }
      )
      
      // Refresh to show the success state
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
            {youtubeInitialized ? (
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
                <Button
                  onClick={() => handleInitialize("youtube")}
                  disabled={!youtubePrompt.trim() || initializing === "youtube"}
                  className="w-full"
                >
                  {initializing === "youtube" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    "Initialize YouTube Prompt"
                  )}
                </Button>
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
            {shortFormInitialized ? (
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
                <Button
                  onClick={() => handleInitialize("short_form")}
                  disabled={!shortFormPrompt.trim() || initializing === "short_form"}
                  className="w-full"
                >
                  {initializing === "short_form" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    "Initialize Short Form Prompt"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
