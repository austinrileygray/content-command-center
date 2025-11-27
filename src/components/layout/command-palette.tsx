"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  Lightbulb,
  Video,
  Package,
  Send,
  BarChart3,
  Settings,
  Plus,
  Search,
  Radio,
} from "lucide-react"

const commands = [
  {
    group: "Navigation",
    items: [
      { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, href: "/", shortcut: "⌘K D" },
      { id: "ideas", label: "Go to Ideas", icon: Lightbulb, href: "/ideas", shortcut: "⌘K I" },
      { id: "record", label: "Go to Record", icon: Video, href: "/record", shortcut: "⌘K R" },
      { id: "recordings", label: "Go to Recordings", icon: Radio, href: "/recordings", shortcut: "⌘K O" },
      { id: "assets", label: "Go to Assets", icon: Package, href: "/assets", shortcut: "⌘K A" },
      { id: "publish", label: "Go to Publish", icon: Send, href: "/publish", shortcut: "⌘K P" },
      { id: "analytics", label: "Go to Analytics", icon: BarChart3, href: "/analytics", shortcut: "⌘K Y" },
      { id: "settings", label: "Go to Settings", icon: Settings, href: "/settings", shortcut: "⌘K ," },
    ],
  },
  {
    group: "Actions",
    items: [
      { id: "new-idea", label: "New Idea", icon: Plus, href: "/ideas?new=true", shortcut: "⌘N" },
      { id: "search", label: "Search", icon: Search, href: "#", shortcut: "⌘K" },
    ],
  },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (href: string) => {
    if (href === "#") return
    setOpen(false)
    if (href.startsWith("/")) {
      router.push(href)
    } else {
      window.location.href = href
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {commands.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item.href)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <CommandShortcut className="ml-auto">{item.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
