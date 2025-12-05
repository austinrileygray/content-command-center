"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Mail, Linkedin, Twitter, Building, Briefcase, Edit, Trash2, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Guest } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { GuestForm } from "@/components/guests/guest-form"

interface GuestsClientProps {
  initialGuests: Guest[]
  showEmptyState?: boolean
}

const statusColors: Record<string, string> = {
  prospect: "bg-yellow-500/20 text-yellow-400",
  contacted: "bg-blue-500/20 text-blue-400",
  confirmed: "bg-green-500/20 text-green-400",
  declined: "bg-red-500/20 text-red-400",
}

export function GuestsClient({ initialGuests, showEmptyState }: GuestsClientProps) {
  // Show empty state if requested
  if (showEmptyState) {
    return (
      <Card className="p-12 bg-card border-border">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-secondary mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No guests yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Add guests to schedule interviews and create guest content.
          </p>
        </div>
      </Card>
    )
  }

  const router = useRouter()
  const supabase = createClient()
  const [guests, setGuests] = useState(initialGuests)
  const [showForm, setShowForm] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleEdit = (guest: Guest) => {
    setSelectedGuest(guest)
    setShowForm(true)
  }

  const handleNew = () => {
    setSelectedGuest(undefined)
    setShowForm(true)
  }

  const handleDelete = async (guestId: string) => {
    if (!confirm("Are you sure you want to delete this guest?")) return

    setDeleting(guestId)
    try {
      const { error } = await supabase
        .from("guests")
        .delete()
        .eq("id", guestId)

      if (error) throw error

      setGuests(guests.filter(g => g.id !== guestId))
      toast.success("Guest deleted")
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to delete guest")
      console.error(error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleNew} className="gap-2 bg-brand hover:bg-brand/90">
          <Plus className="w-4 h-4" />
          Add Guest
        </Button>
      </div>

      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Relevance</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>
                  {guest.company ? (
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-muted-foreground" />
                      <span>{guest.company}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {guest.title ? (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-muted-foreground" />
                      <span>{guest.title}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {guest.email && (
                      <a
                        href={`mailto:${guest.email}`}
                        className="text-brand hover:underline"
                        title={guest.email}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {guest.linkedin_url && (
                      <a
                        href={guest.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {guest.twitter_handle && (
                      <a
                        href={`https://twitter.com/${guest.twitter_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {!guest.email && !guest.linkedin_url && !guest.twitter_handle && (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[guest.status]}>
                    {guest.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {guest.relevance_score ? (
                    <span className="text-sm">{guest.relevance_score}%</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(guest.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(guest)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(guest.id)}
                      disabled={deleting === guest.id}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <GuestForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) {
            setSelectedGuest(undefined)
            router.refresh()
          }
        }}
        guest={selectedGuest}
      />
    </>
  )
}
