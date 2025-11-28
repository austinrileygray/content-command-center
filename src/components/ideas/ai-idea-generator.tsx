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
import { Sparkles, Loader2, Lightbulb } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ContentIdea } from "@/types/database"

interface AIIdeaGeneratorProps {
  onIdeaGenerated?: (idea: ContentIdea) => void
}

export function AIIdeaGenerator({ onIdeaGenerated }: AIIdeaGeneratorProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [generatedIdeas, setGeneratedIdeas] = useState<Partial<ContentIdea>[]>([])

  const generateIdeas = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt or topic")
      return
    }

    setGenerating(true)
    try {
      // Call the AI API route
      const response = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate ideas")
      }

      if (data.fallback) {
        toast.info("Using template ideas. AI API may not be configured.")
      } else {
        toast.success("AI-powered ideas generated!")
      }

      setGeneratedIdeas(data.ideas || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to generate ideas")
      console.error(error)
      // Fallback to template ideas
      const ideas = generateBasicIdeas(prompt)
      setGeneratedIdeas(ideas)
    } finally {
      setGenerating(false)
    }
  }

  const saveIdea = async (idea: Partial<ContentIdea>) => {
    try {
      // Get current user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single()

      if (!profile) {
        toast.error("User profile not found")
        return
      }

      const { data, error } = await supabase
        .from("content_ideas")
        .insert({
          user_id: profile.id,
          title: idea.title || "Untitled Idea",
          hook: idea.hook || null,
          description: idea.description || null,
          format: idea.format || "solo_youtube",
          status: "idea",
          confidence_score: idea.confidence_score || null,
          estimated_length: idea.estimated_length || null,
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Idea saved!")
      setOpen(false)
      router.refresh()
      
      if (onIdeaGenerated && data) {
        onIdeaGenerated(data)
      }
    } catch (error: any) {
      toast.error("Failed to save idea")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Ideas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Idea Generator</DialogTitle>
          <DialogDescription>
            Generate content ideas using AI. Enter a topic, keyword, or describe what you want to create.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Topic or Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., 'How to build a SaaS business', 'Productivity tips for entrepreneurs', 'Latest trends in AI'..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Describe the type of content you want to create. Be specific for better results.
            </p>
          </div>

          <Button
            onClick={generateIdeas}
            disabled={generating || !prompt.trim()}
            className="w-full bg-brand hover:bg-brand/90"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ideas
              </>
            )}
          </Button>

          {generatedIdeas.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground">
                Generated Ideas ({generatedIdeas.length})
              </h3>
              {generatedIdeas.map((idea, index) => (
                <Card key={index} className="p-4 bg-card border-border">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">
                          {idea.title || "Untitled Idea"}
                        </h4>
                        {idea.hook && (
                          <p className="text-sm text-muted-foreground mb-2">{idea.hook}</p>
                        )}
                        {idea.description && (
                          <p className="text-xs text-muted-foreground">{idea.description}</p>
                        )}
                      </div>
                      {idea.confidence_score && (
                        <Badge variant="outline" className="ml-2">
                          {idea.confidence_score}% match
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveIdea(idea)}
                      >
                        Save Idea
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // Open in new idea form with pre-filled data
                          router.push(`/ideas?new=true&title=${encodeURIComponent(idea.title || "")}&hook=${encodeURIComponent(idea.hook || "")}`)
                          setOpen(false)
                        }}
                      >
                        Edit & Save
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>AI-Powered:</strong> Ideas are generated using Claude AI. Enter a topic or describe what you want to create.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Generate basic ideas from prompt (template-based)
 * This is a fallback when AI API is not configured
 */
function generateBasicIdeas(prompt: string): Partial<ContentIdea>[] {
  const keywords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const baseIdeas = [
    {
      title: `How to ${prompt}`,
      hook: `Learn the essential steps to ${prompt} in this comprehensive guide.`,
      description: `A detailed breakdown of ${prompt}, covering all the key aspects you need to know.`,
      format: "solo_youtube" as const,
      confidence_score: 75,
      estimated_length: 15,
    },
    {
      title: `The Ultimate Guide to ${prompt}`,
      hook: `Everything you need to know about ${prompt} in one place.`,
      description: `Complete guide covering ${prompt} from basics to advanced strategies.`,
      format: "solo_youtube" as const,
      confidence_score: 80,
      estimated_length: 20,
    },
    {
      title: `${prompt}: Common Mistakes to Avoid`,
      hook: `Avoid these critical mistakes when ${prompt}.`,
      description: `Learn from others' mistakes and avoid common pitfalls in ${prompt}.`,
      format: "solo_youtube" as const,
      confidence_score: 70,
      estimated_length: 12,
    },
  ]

  return baseIdeas
}
