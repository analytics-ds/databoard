@AGENTS.md

# Databoard - SEO Project Management Platform

## Project Overview

**Databoard** is a comprehensive SEO project management SaaS platform built for **Datashake**, a full-service SEO agency. The platform consolidates all SEO tools into a single ecosystem: keyword tracking, content writing, project management, netlinking, Google Search Console & GA4 dashboards, GEO monitoring, and client documentation.

**Vision**: Create an Apple-like ecosystem that clients depend on — everything in one place so they never want to leave. Replace the current scattered workflow (Notion for docs/todos, separate platforms for content writing, netlinking, SEO dashboards).

**Target users**: Datashake's SEO clients + internal team (project managers, content writers, SEO consultants).

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui (new-york style)
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM — local dev uses better-sqlite3
- **Auth**: NextAuth.js v5 (Auth.js) with Credentials provider, JWT strategy
- **Icons**: Lucide React
- **Tables**: @tanstack/react-table
- **Deployment**: Cloudflare Pages (@cloudflare/next-on-pages)

---

## Project Structure

```
databoard/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Auth pages (login, register) — no sidebar
│   │   ├── (dashboard)/      # Main app — sidebar + topbar layout
│   │   │   ├── dashboard/    # Overview with KPIs
│   │   │   ├── keywords/     # Keyword tracking & history
│   │   │   ├── projects/     # Kanban / task management
│   │   │   ├── content/      # Content writing + SEO scoring
│   │   │   ├── clients/      # Client management & docs
│   │   │   ├── netlinking/   # Backlink management
│   │   │   ├── alerts/       # Alert center
│   │   │   └── settings/     # User profile + integrations
│   │   └── api/              # API routes (CRUD endpoints)
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (DO NOT edit manually)
│   │   ├── layout/           # Sidebar, Topbar, Breadcrumbs
│   │   ├── dashboard/        # KPI cards, charts, activity feed
│   │   ├── keywords/         # Keyword table, filters, dialogs
│   │   ├── projects/         # Kanban board, task cards
│   │   ├── content/          # Editor, scoring panel
│   │   ├── auth/             # Login/register forms
│   │   └── shared/           # Reusable: DataTable, PageHeader, EmptyState
│   ├── lib/
│   │   ├── db/               # Drizzle schema, client, migrations
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── utils.ts          # cn() helper, formatters
│   │   └── constants.ts      # Nav items, app config
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── middleware.ts          # Auth route protection
├── drizzle/                   # Generated SQL migrations
├── public/                    # Static assets (logo, favicon)
└── CLAUDE.md                  # This file
```

---

## Branding — Datashake

- **Primary color**: `#2563EB` (blue) — buttons, active states, links
- **Sidebar bg**: `#0F172A` (dark navy)
- **Background**: `#F8FAFC` (light grey)
- **Success**: `#10B981` (green) — position gains, good scores
- **Danger**: `#EF4444` (red) — position drops, errors
- **Warning**: `#F59E0B` (amber)
- **Font**: Geist Sans (body) + Geist Mono (data/numbers)
- **Style**: Modern, tech, clean. Rounded corners (rounded-lg). Subtle shadows. UX-friendly.

---

## Modules & Features

### 1. Dashboard Overview
- KPI cards: total keywords, avg position, top 3/10/30 counts, active projects, content in progress, alerts
- Activity feed (recent actions by team)
- Quick action buttons

### 2. Keyword Tracking (Core Module)
- Keyword table with sorting, filtering, pagination
- Position badges (color-coded: Top 3 green, Top 10 blue, Top 20 yellow, 50+ red)
- Trend arrows (up/down/stable)
- Filters: search, position range, tags, URL, date range, search engine
- Bulk add keywords, export
- Keyword history detail view
- **Future**: Haloscan API integration for keyword research

### 3. Project Management
- Kanban board (To Do → In Progress → Review → Done)
- Task cards with priority, assignee, due date, client
- List view alternative
- Replace Notion for client task management

### 4. Content Writing Platform
- Article list with status (draft/writing/review/published)
- Rich text editor (TipTap-based in future versions)
- Real-time SEO scoring (0-100):
  - Keyword in title, meta description length, word count, heading structure, keyword density
- Meta title/description fields
- Word counter

### 5. Client Management
- Client directory with domain, stats
- Per-client documentation (replaces Notion docs)
- GSC/GA4 connection per client (future)

### 6. Netlinking
- Backlink management table: domain, DA/DR, status, URL, anchor, date, price
- Pipeline tracking (contacted → negotiation → published → rejected)

### 7. Alerts
- Position drops/gains alerts
- Content deadlines
- Custom alerts
- Severity levels (info/warning/critical)

### 8. Settings & Integrations
- User profile management
- **Google Search Console** integration (OAuth, future)
- **Google Analytics 4** integration (OAuth, future)
- **Haloscan API** key for keyword research (future)
- **Meteoria API** for GEO monitoring (future)

### 9. GEO Monitoring (Future)
- AI overview / generative search monitoring
- Performance tracking via Meteoria API
- Dashboard with GEO visibility metrics

---

## Database Schema (Drizzle ORM / SQLite/D1)

### Key tables:
- `users` — id, name, email, passwordHash, role (admin/manager/editor/viewer)
- `clients` — id, name, domain, gscPropertyUrl, ga4PropertyId, notes
- `keywords` — id, clientId, keyword, url, searchEngine, currentPosition, previousPosition, searchVolume, tags
- `keyword_history` — id, keywordId, position, url, date
- `projects` — id, clientId, name, status
- `tasks` — id, projectId, title, status (todo/in_progress/review/done), priority, assigneeId, dueDate, order
- `content_items` — id, clientId, title, body, status, targetKeyword, seoScore, wordCount, authorId
- `client_documents` — id, clientId, title, content, category
- `alerts` — id, clientId, type, title, message, severity, isRead
- `backlinks` — id, clientId, targetUrl, sourceDomain, anchor, status, da, price

---

## Security Standards (OWASP)

- bcrypt password hashing (cost 12)
- JWT auth with short expiry
- Zod validation on all inputs (client + server)
- Parameterized queries via Drizzle (no SQL injection)
- CSRF protection via NextAuth
- XSS prevention via React auto-escaping
- Rate limiting on auth endpoints
- Role-based access control (admin/manager/editor/viewer)

---

## Conventions

- Use Server Components by default, Client Components only when needed ("use client")
- API routes use Zod validation and return consistent JSON: `{ data, error, message }`
- File naming: kebab-case for files, PascalCase for components
- All dates stored as ISO 8601 strings in SQLite
- IDs are text UUIDs (crypto.randomUUID())
- Imports use `@/` alias

---

## Development

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to local SQLite
```

---

## Deployment

- Target: Cloudflare Pages with D1 database
- Database: Cloudflare D1 (SQLite)
- Config: wrangler.toml

---

## History

- **2026-04-03**: Project initialized. V1 prototype with all core modules (dashboard, keywords, projects, content, clients, netlinking, alerts, settings). Auth system with login/register. Datashake branding. CLAUDE.md created.
