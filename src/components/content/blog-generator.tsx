"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Mail, Sparkles, Copy, Download } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface BlogGeneratorProps {
  ideaId: string
  transcript: string
  title: string
  type: "blog" | "newsletter"
}

export function BlogGenerator({ ideaId, transcript, title, type }: BlogGeneratorProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [content, setContent] = useState("")
  const [generated, setGenerated] = useState(false)

  const generateContent = async () => {
    if (!transcript || transcript.trim().length < 100) {
      toast.error("Transcript is too short. Need at least 100 characters.")
      return
    }

    setGenerating(true)
    try {
      // For now, we'll create a basic structure from the transcript
      // In the future, this can call an AI API (OpenAI/Claude) for better generation
      const generatedContent = generateFromTranscript(transcript, title, type)
      setContent(generatedContent)
      setGenerated(true)
      toast.success(`${type === "blog" ? "Blog post" : "Newsletter"} generated!`)
    } catch (error: any) {
      toast.error(`Failed to generate ${type}`)
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  const saveAsAsset = async () => {
    if (!content.trim()) {
      toast.error("No content to save")
      return
    }

    try {
      // Create a text file from the content
      const blob = new Blob([content], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      
      // For now, we'll store the content in metadata
      // In production, you'd upload this to Supabase Storage
      const { error } = await supabase.from("assets").insert({
        content_idea_id: ideaId,
        type: type,
        status: "ready",
        title: `${title} - ${type === "blog" ? "Blog Post" : "Newsletter"}`,
        metadata: {
          content: content,
          generatedFrom: "transcript",
          wordCount: content.split(/\s+/).length,
        },
        platform: "internal",
      })

      if (error) throw error

      toast.success(`${type === "blog" ? "Blog post" : "Newsletter"} saved as asset!`)
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(`Failed to save ${type}`)
      console.error(error)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    toast.success("Copied to clipboard!")
  }

  const downloadContent = () => {
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/\s+/g, "-")}-${type}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Downloaded!")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {type === "blog" ? (
            <>
              <FileText className="w-4 h-4" />
              Generate Blog
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Generate Newsletter
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Generate {type === "blog" ? "Blog Post" : "Newsletter"} from Transcript
          </DialogTitle>
          <DialogDescription>
            Create a {type === "blog" ? "blog post" : "newsletter"} from the video transcript.
            {!generated && " Click generate to create the content."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!generated ? (
            <>
              <div className="space-y-2">
                <Label>Source Transcript</Label>
                <Textarea
                  value={transcript}
                  readOnly
                  className="min-h-[200px] bg-secondary/50"
                />
                <p className="text-xs text-muted-foreground">
                  {transcript.length} characters • {transcript.split(/\s+/).length} words
                </p>
              </div>

              <Button
                onClick={generateContent}
                disabled={generating || !transcript}
                className="w-full bg-brand hover:bg-brand/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? "Generating..." : `Generate ${type === "blog" ? "Blog Post" : "Newsletter"}`}
              </Button>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This creates a basic structure from the transcript.
                  For AI-powered generation with better quality, configure OpenAI or Claude API in Settings.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="gap-2">
                  {type === "blog" ? <FileText className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                  {type === "blog" ? "Blog Post" : "Newsletter"}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadContent}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <Card className="p-4 bg-card border-border">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Generated content will appear here..."
                />
              </Card>

              <div className="flex items-center gap-2">
                <Button
                  onClick={saveAsAsset}
                  className="flex-1 bg-brand hover:bg-brand/90"
                >
                  Save as Asset
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGenerated(false)
                    setContent("")
                  }}
                >
                  Regenerate
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Generate basic blog/newsletter content from transcript
 * This is a simple implementation - can be enhanced with AI API
 */
function generateFromTranscript(
  transcript: string,
  title: string,
  type: "blog" | "newsletter"
): string {
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10)
  const paragraphs: string[] = []
  
  // Split into paragraphs (roughly 3-5 sentences each)
  for (let i = 0; i < sentences.length; i += 4) {
    const paragraph = sentences.slice(i, i + 4).join(". ").trim()
    if (paragraph) paragraphs.push(paragraph + ".")
  }

  if (type === "blog") {
    return `# ${title}

## Introduction

${paragraphs[0] || "This content was generated from a video transcript."}

## Main Content

${paragraphs.slice(1, -1).map((p, i) => `### Section ${i + 1}\n\n${p}\n`).join("\n")}

## Conclusion

${paragraphs[paragraphs.length - 1] || "Thank you for reading!"}

---

*This blog post was automatically generated from a video transcript.*`
  } else {
    return `# ${title}

## This Week's Highlights

${paragraphs[0] || "Welcome to this week's newsletter!"}

## Featured Content

${paragraphs.slice(1, 4).map((p, i) => `### Topic ${i + 1}\n\n${p}\n`).join("\n")}

## Key Takeaways

${paragraphs.slice(4, 6).map((p) => `- ${p.replace(/\.$/, "")}\n`).join("")}

---

*This newsletter was automatically generated from a video transcript.*`
  }
}



