# Content Command Center

A world-class AI-powered media production dashboard for managing content creation, recording, processing, and publishing workflows.

## 🚀 Features

### Core Functionality
- **Dashboard** - Real-time stats, pipeline overview, and quick actions
- **Content Ideas Management** - Full CRUD with search, filters, and status workflow
- **Guest Management** - Track and manage interview guests
- **Recording Platform Integration** - Launch Loom, SquadCast, and Restream
- **Assets Management** - View and manage generated clips, thumbnails, and content
- **Publishing Queue** - Track content ready to publish across platforms
- **Analytics Dashboard** - Performance metrics and insights
- **Settings** - Profile, integrations, notifications, and API key management

### Advanced Features
- **Search & Filtering** - Real-time search with status and format filters
- **Export Functionality** - Export ideas as CSV or JSON
- **Status Workflow** - Visual pipeline with drag-and-drop ready structure
- **Webhook Integration** - Ready for Loom, SquadCast, and Opus Clip webhooks
- **Responsive Design** - Beautiful dark theme optimized for all devices
- **Error Handling** - Comprehensive error boundaries and loading states

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v3
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **State Management:** Zustand
- **Data Fetching:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod validation
- **Deployment:** Vercel

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

## 🔧 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📊 Database Schema

The database includes:
- `profiles` - User profiles
- `content_ideas` - Content ideas with full workflow
- `guests` - Guest interview management
- `recordings` - Recording metadata
- `assets` - Generated clips and content
- `publishing_queue` - Publishing status tracking
- `analytics_snapshots` - Performance metrics

See `supabase-schema.sql` for full schema.

## 🌐 Webhook Endpoints

Configure these URLs in your external services:

- **Loom:** `https://your-domain.com/api/webhooks/loom`
- **SquadCast:** `https://your-domain.com/api/webhooks/squadcast`
- **Opus Clip:** `https://your-domain.com/api/webhooks/opus`

## 🚢 Deployment

The app is automatically deployed to Vercel on every push to `main`.

**Production URL:** https://content-command-center-p7t3i4s8e-austins-projects-c461c44a.vercel.app

## 📝 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (dashboard)/        # Dashboard routes
│   └── api/                # API routes (webhooks)
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Layout components
│   ├── dashboard/          # Dashboard components
│   ├── ideas/              # Idea management components
│   └── shared/             # Shared components
├── lib/                    # Utilities and helpers
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
└── types/                  # TypeScript types
```

## 🎯 Roadmap

### Phase 3 (Requires API Keys)
- [ ] Opus Clip API integration
- [ ] YouTube API OAuth integration
- [ ] LinkedIn API integration
- [ ] Twitter/X API integration
- [ ] AI idea generation (OpenAI/Claude)
- [ ] Automated publishing workflows

### Phase 4 (Enhancements)
- [ ] Drag-and-drop pipeline board
- [ ] Bulk operations
- [ ] Advanced analytics charts
- [ ] Guest form creation
- [ ] Recording scheduling calendar
- [ ] Asset preview/player
- [ ] Keyboard shortcuts
- [ ] Dark/light theme toggle

## 📄 License

ISC

## 👤 Author

Built for The Owner Operator - World-class AI media production team
