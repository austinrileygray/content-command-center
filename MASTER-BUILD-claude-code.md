# CONTENT COMMAND CENTER - BUILD INSTRUCTIONS FOR CLAUDE CODE
# AI Media Production Dashboard

---

## WHAT TO BUILD

A Next.js dashboard for managing AI-powered content production. User records video → system automatically edits, generates clips, and publishes everywhere.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui, Supabase
**Design:** Dark theme (Stripe-style), brand color #f15e13 (orange)

---

## STEP 0: INITIALIZE REPO (Run these commands first)

```bash
# Create Next.js project in current directory
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install all dependencies
npm install @supabase/supabase-js @supabase/ssr @tanstack/react-query zustand date-fns lucide-react framer-motion clsx tailwind-merge zod react-hook-form @hookform/resolvers

# Setup shadcn/ui (select: Default style, Neutral color, CSS variables: Yes)
npx shadcn@latest init -y

# Add all needed shadcn components
npx shadcn@latest add button card dialog dropdown-menu input label select tabs textarea toast avatar badge calendar checkbox command form popover scroll-area separator sheet skeleton table tooltip
```

---

## CREDENTIALS (.env.local)

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://sfwslpahuxcofwnyoukg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmd3NscGFodXhjb2Z3bnlvdWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzQyMzIsImV4cCI6MjA3OTg1MDIzMn0.o7dgmKv7MnSx56FuW1nWWZAEvPHVa_nabol_3w6Yspo
SUPABASE_SERVICE_ROLE_KEY=sb_secret_zYWIK8C7YFRQ_7UQ-uBsFw_in-utksh
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## DATABASE (Already in Supabase - just reference this)

**Tables:** `profiles`, `content_ideas`, `guests`, `recordings`, `assets`, `publishing_queue`, `analytics_snapshots`

**content_ideas.status values:**
`idea` → `selected` → `guest_outreach` → `scheduled` → `recording` → `processing` → `ready_to_publish` → `published` → `archived`

**content_ideas.format values:**
`solo_youtube` (Loom) | `guest_interview` (SquadCast) | `live_stream` (Restream)

---

## FILE STRUCTURE TO CREATE

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── ideas/
│   │   │   ├── page.tsx                # Ideas pipeline/list
│   │   │   └── [id]/page.tsx           # Idea detail
│   │   ├── record/
│   │   │   └── page.tsx                # Recording launcher
│   │   ├── assets/
│   │   │   └── page.tsx                # Generated assets
│   │   ├── publish/
│   │   │   └── page.tsx                # Publishing queue
│   │   ├── analytics/
│   │   │   └── page.tsx                # Performance metrics
│   │   └── settings/
│   │       └── page.tsx                # Settings
│   ├── api/
│   │   └── webhooks/
│   │       ├── squadcast/route.ts      # SquadCast webhook
│   │       ├── loom/route.ts           # Loom webhook
│   │       └── opus/route.ts           # Opus Clip webhook
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                             # shadcn components (auto-generated)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── user-menu.tsx
│   ├── dashboard/
│   │   ├── stats-cards.tsx
│   │   ├── pipeline-overview.tsx
│   │   ├── quick-actions.tsx
│   │   └── recent-activity.tsx
│   ├── ideas/
│   │   ├── idea-card.tsx
│   │   ├── idea-detail.tsx
│   │   ├── pipeline-board.tsx
│   │   └── status-badge.tsx
│   └── shared/
│       ├── page-header.tsx
│       ├── empty-state.tsx
│       └── loading-state.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── utils.ts
│   └── constants.ts
├── hooks/
│   ├── use-ideas.ts
│   └── use-supabase.ts
├── types/
│   └── database.ts
└── stores/
    └── app-store.ts
```

---

## STEP 1: TAILWIND CONFIG

**File: `tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f15e13",
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f15e13",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

**File: `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 98%;
    --card: 0 0% 7%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 7%;
    --popover-foreground: 0 0% 98%;
    --primary: 21 89% 51%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 12%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 12%;
    --muted-foreground: 0 0% 64%;
    --accent: 21 89% 51%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14%;
    --input: 0 0% 14%;
    --ring: 21 89% 51%;
    --radius: 0.75rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: hsl(0 0% 7%);
}
::-webkit-scrollbar-thumb {
  background: hsl(0 0% 20%);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: hsl(0 0% 30%);
}
```

---

## STEP 2: SUPABASE CLIENT

**File: `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**File: `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle server component
          }
        },
      },
    }
  )
}
```

---

## STEP 3: UTILITY FUNCTIONS

**File: `src/lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
  if (num >= 1000) return (num / 1000).toFixed(1) + "K"
  return num.toString()
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    idea: "bg-zinc-500/20 text-zinc-400",
    selected: "bg-blue-500/20 text-blue-400",
    guest_outreach: "bg-yellow-500/20 text-yellow-400",
    scheduled: "bg-purple-500/20 text-purple-400",
    recording: "bg-red-500/20 text-red-400",
    processing: "bg-orange-500/20 text-orange-400",
    ready_to_publish: "bg-teal-500/20 text-teal-400",
    published: "bg-green-500/20 text-green-400",
    archived: "bg-zinc-500/20 text-zinc-400",
  }
  return colors[status] || colors.idea
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    idea: "Idea",
    selected: "Selected",
    guest_outreach: "Guest Outreach",
    scheduled: "Scheduled",
    recording: "Recording",
    processing: "Processing",
    ready_to_publish: "Ready",
    published: "Published",
    archived: "Archived",
  }
  return labels[status] || status
}
```

**File: `src/lib/constants.ts`**

```typescript
export const CONTENT_FORMATS = [
  { value: "solo_youtube", label: "Solo YouTube", icon: "Video", platform: "loom" },
  { value: "guest_interview", label: "Guest Interview", icon: "Users", platform: "squadcast" },
  { value: "live_stream", label: "Live Stream", icon: "Radio", platform: "restream" },
] as const

export const CONTENT_STATUSES = [
  { value: "idea", label: "Idea", color: "zinc" },
  { value: "selected", label: "Selected", color: "blue" },
  { value: "guest_outreach", label: "Guest Outreach", color: "yellow" },
  { value: "scheduled", label: "Scheduled", color: "purple" },
  { value: "recording", label: "Recording", color: "red" },
  { value: "processing", label: "Processing", color: "orange" },
  { value: "ready_to_publish", label: "Ready to Publish", color: "teal" },
  { value: "published", label: "Published", color: "green" },
  { value: "archived", label: "Archived", color: "zinc" },
] as const

export const RECORDING_PLATFORMS = {
  loom: {
    name: "Loom",
    description: "Solo educational content",
    url: "https://www.loom.com/record",
  },
  squadcast: {
    name: "SquadCast",
    description: "Guest interviews",
    url: "https://app.squadcast.fm",
  },
  restream: {
    name: "Restream",
    description: "Live streaming",
    url: "https://app.restream.io/studio",
  },
} as const
```

---

## STEP 4: TYPESCRIPT TYPES

**File: `src/types/database.ts`**

```typescript
export type ContentStatus =
  | "idea"
  | "selected"
  | "guest_outreach"
  | "scheduled"
  | "recording"
  | "processing"
  | "ready_to_publish"
  | "published"
  | "archived"

export type ContentFormat = "solo_youtube" | "guest_interview" | "live_stream"

export type RecordingPlatform = "loom" | "squadcast" | "restream"

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  youtube_channel_id: string | null
  created_at: string
  updated_at: string
}

export interface ContentIdea {
  id: string
  user_id: string
  title: string
  hook: string | null
  description: string | null
  format: ContentFormat
  status: ContentStatus
  confidence_score: number | null
  estimated_length: number | null
  script: ScriptData | null
  thumbnail_concept: ThumbnailConcept | null
  seo_keywords: string[] | null
  why_this_will_work: string | null
  source_inspiration: string | null
  guest_id: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  recording_url: string | null
  recording_platform: RecordingPlatform | null
  opus_project_id: string | null
  transcript: string | null
  created_at: string
  updated_at: string
  selected_at: string | null
  recorded_at: string | null
  published_at: string | null
  week_generated: string | null
  // Joined data
  guest?: Guest | null
}

export interface Guest {
  id: string
  user_id: string
  name: string
  email: string | null
  linkedin_url: string | null
  twitter_handle: string | null
  title: string | null
  company: string | null
  expertise: string[] | null
  status: string
  relevance_score: number | null
  notes: string | null
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  confirmed_at: string | null
}

export interface Recording {
  id: string
  content_idea_id: string
  platform: RecordingPlatform
  external_id: string | null
  external_url: string | null
  status: string
  scheduled_start: string | null
  actual_start: string | null
  actual_end: string | null
  duration: number | null
  recording_urls: Record<string, string> | null
  transcript_url: string | null
  webhook_payload: any | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  content_idea_id: string
  type: "clip" | "thumbnail" | "blog" | "social_post" | "newsletter"
  status: "generating" | "ready" | "published" | "failed"
  title: string | null
  file_url: string | null
  metadata: any | null
  platform: string | null
  published_url: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface ScriptData {
  hook: string
  intro: string
  mainPoints: {
    point: string
    talkingPoints: string[]
    estimatedDuration: number
  }[]
  callToAction: string
  outro: string
}

export interface ThumbnailConcept {
  mainText: string
  subText?: string
  visualDescription: string
  emotionToConvey: string
  colorScheme: string[]
}
```

---

## STEP 5: LAYOUTS

**File: `src/app/layout.tsx`**

```typescript
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Content Command Center",
  description: "AI-powered content production dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

**File: `src/app/(dashboard)/layout.tsx`**

```typescript
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**File: `src/components/layout/sidebar.tsx`**

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Lightbulb,
  Video,
  Package,
  Send,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Record", href: "/record", icon: Video },
  { name: "Assets", href: "/assets", icon: Package },
  { name: "Publish", href: "/publish", icon: Send },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

const bottomNav = [
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-foreground">Command Center</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-border">
        {bottomNav.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
```

**File: `src/components/layout/header.tsx`**

```typescript
"use client"

import { Bell, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function Header() {
  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas, assets..."
            className="pl-10 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link href="/ideas?new=true">
          <Button size="sm" className="gap-2 bg-brand hover:bg-brand/90">
            <Plus className="w-4 h-4" />
            New Idea
          </Button>
        </Link>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full" />
        </Button>

        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-medium">
          O
        </div>
      </div>
    </header>
  )
}
```

---

## STEP 6: DASHBOARD PAGE

**File: `src/app/(dashboard)/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { PipelineOverview } from "@/components/dashboard/pipeline-overview"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Fetch content ideas for stats
  const { data: ideas } = await supabase
    .from("content_ideas")
    .select("*")
    .order("created_at", { ascending: false })

  const stats = {
    totalIdeas: ideas?.length || 0,
    inProgress: ideas?.filter(i => ["selected", "scheduled", "recording", "processing"].includes(i.status)).length || 0,
    readyToPublish: ideas?.filter(i => i.status === "ready_to_publish").length || 0,
    published: ideas?.filter(i => i.status === "published").length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your content.
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PipelineOverview ideas={ideas || []} />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity ideas={ideas?.slice(0, 5) || []} />
        </div>
      </div>
    </div>
  )
}
```

**File: `src/components/dashboard/stats-cards.tsx`**

```typescript
"use client"

import { Lightbulb, Play, CheckCircle, Send } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatsCardsProps {
  stats: {
    totalIdeas: number
    inProgress: number
    readyToPublish: number
    published: number
  }
}

const statConfig = [
  { key: "totalIdeas", label: "Total Ideas", icon: Lightbulb, color: "text-brand" },
  { key: "inProgress", label: "In Progress", icon: Play, color: "text-blue-400" },
  { key: "readyToPublish", label: "Ready to Publish", icon: CheckCircle, color: "text-teal-400" },
  { key: "published", label: "Published", icon: Send, color: "text-green-400" },
]

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((stat) => {
        const Icon = stat.icon
        const value = stats[stat.key as keyof typeof stats]
        
        return (
          <Card key={stat.key} className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
```

**File: `src/components/dashboard/pipeline-overview.tsx`**

```typescript
"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ContentIdea } from "@/types/database"
import { getStatusLabel } from "@/lib/utils"

interface PipelineOverviewProps {
  ideas: ContentIdea[]
}

const stages = [
  { status: "idea", label: "Ideas", color: "bg-zinc-500" },
  { status: "selected", label: "Selected", color: "bg-blue-500" },
  { status: "scheduled", label: "Scheduled", color: "bg-purple-500" },
  { status: "recording", label: "Recording", color: "bg-red-500" },
  { status: "processing", label: "Processing", color: "bg-orange-500" },
  { status: "ready_to_publish", label: "Ready", color: "bg-teal-500" },
  { status: "published", label: "Published", color: "bg-green-500" },
]

export function PipelineOverview({ ideas }: PipelineOverviewProps) {
  const getCounts = (status: string) => ideas.filter(i => i.status === status).length

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pipeline</h2>
          <p className="text-sm text-muted-foreground">Content production stages</p>
        </div>
        <Link 
          href="/ideas" 
          className="flex items-center gap-1 text-sm text-brand hover:text-brand/80"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {stages.map((stage) => {
          const count = getCounts(stage.status)
          const maxCount = Math.max(...stages.map(s => getCounts(s.status)), 1)
          const percentage = (count / maxCount) * 100

          return (
            <div key={stage.status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">{stage.label}</span>
                <span className="text-sm font-medium text-foreground">{count}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
```

**File: `src/components/dashboard/quick-actions.tsx`**

```typescript
"use client"

import Link from "next/link"
import { Sparkles, Plus, Video, Upload } from "lucide-react"
import { Card } from "@/components/ui/card"

const actions = [
  {
    name: "Generate Ideas",
    description: "AI-powered suggestions",
    icon: Sparkles,
    href: "/ideas?generate=true",
    primary: true,
  },
  {
    name: "New Idea",
    description: "Create manually",
    icon: Plus,
    href: "/ideas?new=true",
  },
  {
    name: "Start Recording",
    description: "Open recording platform",
    icon: Video,
    href: "/record",
  },
]

export function QuickActions() {
  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.name}
              href={action.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                action.primary
                  ? "bg-brand text-white hover:bg-brand/90"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <div className={`p-2 rounded-lg ${action.primary ? "bg-white/20" : "bg-background"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{action.name}</p>
                <p className={`text-xs ${action.primary ? "text-white/70" : "text-muted-foreground"}`}>
                  {action.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
```

**File: `src/components/dashboard/recent-activity.tsx`**

```typescript
"use client"

import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { ContentIdea } from "@/types/database"
import { getStatusColor, getStatusLabel } from "@/lib/utils"

interface RecentActivityProps {
  ideas: ContentIdea[]
}

export function RecentActivity({ ideas }: RecentActivityProps) {
  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {ideas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          ideas.map((idea) => (
            <div key={idea.id} className="flex items-start gap-3">
              <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(idea.status)}`}>
                {getStatusLabel(idea.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{idea.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(idea.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
```

---

## STEP 7: IDEAS PAGE

**File: `src/app/(dashboard)/ideas/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server"
import { IdeaCard } from "@/components/ideas/idea-card"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles } from "lucide-react"
import Link from "next/link"

export default async function IdeasPage() {
  const supabase = await createClient()
  
  const { data: ideas } = await supabase
    .from("content_ideas")
    .select("*, guest:guests(*)")
    .order("created_at", { ascending: false })

  // Group by status
  const grouped = {
    idea: ideas?.filter(i => i.status === "idea") || [],
    selected: ideas?.filter(i => i.status === "selected") || [],
    inProgress: ideas?.filter(i => ["scheduled", "recording", "processing"].includes(i.status)) || [],
    ready: ideas?.filter(i => i.status === "ready_to_publish") || [],
    published: ideas?.filter(i => i.status === "published") || [],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Ideas</h1>
          <p className="text-muted-foreground">Manage your content pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Ideas
          </Button>
          <Button className="gap-2 bg-brand hover:bg-brand/90">
            <Plus className="w-4 h-4" />
            New Idea
          </Button>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="space-y-8">
        {/* New Ideas */}
        {grouped.idea.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              💡 New Ideas ({grouped.idea.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.idea.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </section>
        )}

        {/* Selected */}
        {grouped.selected.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              ✅ Selected ({grouped.selected.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.selected.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </section>
        )}

        {/* In Progress */}
        {grouped.inProgress.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              🔄 In Progress ({grouped.inProgress.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.inProgress.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </section>
        )}

        {/* Ready to Publish */}
        {grouped.ready.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              🚀 Ready to Publish ({grouped.ready.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.ready.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </section>
        )}

        {/* Published */}
        {grouped.published.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              ✨ Published ({grouped.published.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.published.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
```

**File: `src/components/ideas/idea-card.tsx`**

```typescript
"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContentIdea } from "@/types/database"
import { getStatusColor, getStatusLabel, formatDuration } from "@/lib/utils"
import { Clock, Users, Video, Radio } from "lucide-react"

interface IdeaCardProps {
  idea: ContentIdea
}

const formatIcons = {
  solo_youtube: Video,
  guest_interview: Users,
  live_stream: Radio,
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const FormatIcon = formatIcons[idea.format] || Video

  return (
    <Link href={`/ideas/${idea.id}`}>
      <Card className="p-4 bg-card border-border hover:border-brand/50 transition-colors cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge className={getStatusColor(idea.status)}>
            {getStatusLabel(idea.status)}
          </Badge>
          {idea.confidence_score && (
            <span className="text-xs text-muted-foreground">
              {idea.confidence_score}% match
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {idea.title}
        </h3>

        {/* Hook */}
        {idea.hook && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {idea.hook}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FormatIcon className="w-3 h-3" />
            <span className="capitalize">{idea.format.replace("_", " ")}</span>
          </div>
          {idea.estimated_length && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(idea.estimated_length)}</span>
            </div>
          )}
        </div>

        {/* Guest indicator */}
        {idea.guest && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Guest: <span className="text-foreground">{idea.guest.name}</span>
            </p>
          </div>
        )}
      </Card>
    </Link>
  )
}
```

---

## STEP 8: RECORD PAGE

**File: `src/app/(dashboard)/record/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RECORDING_PLATFORMS } from "@/lib/constants"
import { Video, Users, Radio, ExternalLink } from "lucide-react"
import Link from "next/link"

const platformIcons = {
  loom: Video,
  squadcast: Users,
  restream: Radio,
}

export default async function RecordPage() {
  const supabase = await createClient()
  
  // Get scheduled recordings
  const { data: scheduled } = await supabase
    .from("content_ideas")
    .select("*")
    .eq("status", "scheduled")
    .order("scheduled_date", { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Record</h1>
        <p className="text-muted-foreground">Choose your recording platform</p>
      </div>

      {/* Recording Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(RECORDING_PLATFORMS).map(([key, platform]) => {
          const Icon = platformIcons[key as keyof typeof platformIcons]
          return (
            <Card key={key} className="p-6 bg-card border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-brand/10 text-brand">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                </div>
              </div>
              <a href={platform.url} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2 bg-brand hover:bg-brand/90">
                  <ExternalLink className="w-4 h-4" />
                  Open {platform.name}
                </Button>
              </a>
            </Card>
          )
        })}
      </div>

      {/* Scheduled Recordings */}
      {scheduled && scheduled.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Scheduled Recordings
          </h2>
          <div className="space-y-3">
            {scheduled.map((idea) => (
              <Card key={idea.id} className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{idea.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {idea.scheduled_date} {idea.scheduled_time && `at ${idea.scheduled_time}`}
                    </p>
                  </div>
                  <Link href={`/ideas/${idea.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## STEP 9: DEPLOY

```bash
# Commit and push
git add .
git commit -m "Initial Content Command Center build"
git push origin main

# Deploy to Vercel
npx vercel

# Add env vars in Vercel dashboard, then:
npx vercel --prod
```

---

## WHAT THIS BUILDS

✅ **Dashboard** - Stats, pipeline overview, quick actions
✅ **Ideas Page** - Content ideas grouped by status
✅ **Record Page** - Launch Loom/SquadCast/Restream
✅ **Dark Theme** - Brand orange #f15e13
✅ **Supabase Connected** - Real data persistence

**Phase 2 (after this works):**
- Webhook endpoints for recording platforms
- Opus Clip integration
- Zapier automation triggers
- Asset management + Publishing queue
