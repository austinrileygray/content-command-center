"use client"

import { useState, useEffect } from "react"
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
import { Button } from "@/components/ui/button"
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
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Guest } from "@/types/database"

const guestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  company: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  twitter_handle: z.string().optional(),
  status: z.enum(["prospect", "contacted", "confirmed", "declined"]),
}).refine(
  (data) => {
    if (data.linkedin_url && data.linkedin_url !== "") {
      try {
        new URL(data.linkedin_url)
        return true
      } catch {
        return false
      }
    }
    return true
  },
  { message: "Invalid LinkedIn URL", path: ["linkedin_url"] }
)

interface GuestFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guest?: Guest
}

export function GuestForm({ open, onOpenChange, guest }: GuestFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof guestSchema>>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: guest?.name || "",
      email: guest?.email || "",
      company: guest?.company || "",
      title: guest?.title || "",
      bio: guest?.bio || "",
      linkedin_url: guest?.linkedin_url || "",
      twitter_handle: guest?.twitter_handle || "",
      status: guest?.status || "prospect",
    },
  })

  useEffect(() => {
    if (guest) {
      form.reset({
        name: guest.name || "",
        email: guest.email || "",
        company: guest.company || "",
        title: guest.title || "",
        bio: guest.bio || "",
        linkedin_url: guest.linkedin_url || "",
        twitter_handle: guest.twitter_handle || "",
        status: guest.status || "prospect",
      })
    } else {
      form.reset({
        name: "",
        email: "",
        company: "",
        title: "",
        bio: "",
        linkedin_url: "",
        twitter_handle: "",
        status: "prospect",
      })
    }
  }, [guest, form])

  const onSubmit = async (values: z.infer<typeof guestSchema>) => {
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

      if (guest) {
        // Update existing guest
        const { error } = await supabase
          .from("guests")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq("id", guest.id)

        if (error) throw error
        toast.success("Guest updated successfully")
      } else {
        // Create new guest
        const { error } = await supabase
          .from("guests")
          .insert([{
            user_id: profile.id,
            ...values,
          }])

        if (error) throw error
        toast.success("Guest created successfully")
      }

      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to save guest")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{guest ? "Edit Guest" : "Add Guest"}</DialogTitle>
          <DialogDescription>
            {guest ? "Update guest information" : "Add a new guest to your pipeline"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="CEO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio / Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief bio or background..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitter_handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter/X Handle</FormLabel>
                    <FormControl>
                      <Input placeholder="@username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-brand hover:bg-brand/90">
                {loading ? "Saving..." : guest ? "Update Guest" : "Create Guest"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
