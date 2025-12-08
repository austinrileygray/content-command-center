"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ContentIdea } from "@/types/database"

const ideaSchema = z.object({
  title: z.string().min(1, "Title is required"),
  hook: z.string().optional(),
  description: z.string().optional(),
  format: z.enum(["solo_youtube", "guest_interview", "live_stream"]),
  status: z.string().optional(),
  confidence_score: z.number().min(0).max(100).optional(),
  estimated_length: z.number().min(1).optional(),
  why_this_will_work: z.string().optional(),
})

type IdeaFormValues = z.infer<typeof ideaSchema>

interface IdeaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  idea?: ContentIdea
}

export function IdeaForm({ open, onOpenChange, idea }: IdeaFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const form = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      title: idea?.title || "",
      hook: idea?.hook || "",
      description: idea?.description || "",
      format: idea?.format || "solo_youtube",
      status: idea?.status || "idea",
      confidence_score: idea?.confidence_score || undefined,
      estimated_length: idea?.estimated_length || undefined,
      why_this_will_work: idea?.why_this_will_work || "",
    },
  })

  const onSubmit = async (values: IdeaFormValues) => {
    setLoading(true)
    try {
      // Get user profile ID (simplified - should use auth)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single()

      if (!profile) {
        toast.error("User profile not found")
        return
      }

      if (idea) {
        // Update existing idea
        const { error } = await supabase
          .from("content_ideas")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq("id", idea.id)

        if (error) throw error
        toast.success("Idea updated successfully")
      } else {
        // Create new idea
        const { error } = await supabase.from("content_ideas").insert({
          user_id: profile.id,
          ...values,
        })

        if (error) throw error
        toast.success("Idea created successfully")
      }

      router.refresh()
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error.message || "Failed to save idea")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{idea ? "Edit Idea" : "Create New Idea"}</DialogTitle>
          <DialogDescription>
            {idea ? "Update your content idea" : "Add a new content idea to your pipeline"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter idea title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hook</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's the attention-grabbing opening?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the content idea..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="solo_youtube">Solo YouTube</SelectItem>
                        <SelectItem value="guest_interview">Guest Interview</SelectItem>
                        <SelectItem value="live_stream">Live Stream</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Length (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="18"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="confidence_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confidence Score (0-100)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="85"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="why_this_will_work"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why This Will Work</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this content will perform well..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-brand hover:bg-brand/90" disabled={loading}>
                {loading ? "Saving..." : idea ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}



