"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { ContentIdea } from "@/types/database"
import { toast } from "sonner"

export function useIdeas() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: ideas, isLoading, error } = useQuery({
    queryKey: ["ideas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_ideas")
        .select("*, guest:guests(*)")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as ContentIdea[]
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("content_ideas")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] })
      toast.success("Status updated")
    },
    onError: (error) => {
      toast.error("Failed to update status")
      console.error(error)
    },
  })

  const deleteIdea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_ideas")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] })
      toast.success("Idea deleted")
    },
    onError: (error) => {
      toast.error("Failed to delete idea")
      console.error(error)
    },
  })

  return {
    ideas: ideas || [],
    isLoading,
    error,
    updateStatus,
    deleteIdea,
  }
}


