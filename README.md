# Wapas Padhle • by Scale with Rai

> **"Consistent spaced repetition beats cramming every single time."**  
> A clean, zero-friction full-stack spaced repetition web app for engineers and lifelong learners — master technical concepts, system design patterns, and mental models using the **SuperMemo SM-2 algorithm**.

Built by **[Abhishek Rai • Scale with Rai](https://www.linkedin.com/in/abhishek-rai-atlassian/)**.

---

## ✨ Features

- **Universal Concept Cards** — Add any concept: system design patterns (e.g. *Consistent Hashing*, *Raft*), research papers, architecture docs, or tutorials. Each card has a Title, Category, optional URL, optional Tags, and free-form Notes.
- **SM-2 Spaced Repetition** — Full SuperMemo SM-2 algorithm implementation with interval, ease factor, and repetition tracking.
- **Three-tier Recall Confidence**:
  - 🔴 **Struggled** — resets interval to 1 day for prompt reinforcement
  - 🟡 **Comfortable** — standard SM-2 interval expansion
  - 🟢 **Mastered** — bonus interval spacing
- **Today's Queue** — Cards due today are surfaced in a focused review queue with an active recall modal.
- **Full Queue List** — Browse all concepts with status indicators (Overdue, Due Today, Upcoming, New) and inline re-evaluation.
- **Filter & Search Sidebar** — Filter by status, category, tags, or free-text search.
- **Analytics Dashboard** — Per-category breakdown, global retention curve, and streak/progress stats.
- **Graceful Backlog Handling** — Redistribute overdue cards across N days with configurable spread options (overdue-only or due + overdue, starting today or tomorrow).
- **CSV Import** — Bulk import up to 50 concepts per upload with three scheduling modes: *Spread across days*, *All due today*, or *Unscheduled (New)*.
- **CSV Export** — Export your entire library to CSV.
- **Light & Dark Mode** — Flicker-free theme toggle (persisted via `localStorage`, applied before hydration).
- **Sound Effects** — Optional audio feedback on card interactions (mastered chime, click sounds).
- **Telegram Bot Reminders (`@WapasPadhleBot`)** — Connect your Telegram account to receive a daily 8:00 AM digest of concepts due for active recall.
- **Author / Mentorship Page** — Dedicated `/author` page linking to 1:1 mentorship on TopMate and other social profiles.

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard (Today's Queue + Queue List)
│   ├── layout.tsx                  # Root layout with theme init script
│   ├── globals.css                 # Global styles (Tailwind CSS v4)
│   ├── analytics/page.tsx          # Analytics dashboard
│   ├── author/                     # Author & mentorship page
│   └── api/
│       ├── cron/daily-digest/      # Vercel Cron: sends daily Telegram digests
│       └── telegram/
│           ├── webhook/            # Telegram Bot webhook handler
│           └── test/               # Test endpoint for bot connectivity
├── components/
│   ├── Header.tsx                  # App header with nav, theme toggle, add button
│   ├── Footer.tsx                  # Footer with links
│   ├── TodayCard.tsx               # Today's queue card component
│   ├── QueueList.tsx               # Full concept queue with filters
│   ├── FilterSidebar.tsx           # Filter & search sidebar
│   ├── ActiveRecallModal.tsx       # Active recall session modal
│   ├── AddConceptModal.tsx         # Add new concept modal
│   ├── CsvImportModal.tsx          # CSV bulk import modal
│   ├── DeleteConfirmationModal.tsx # Delete confirmation dialog
│   ├── RedistributeModal.tsx       # Backlog redistribution modal
│   └── TelegramModal.tsx           # Telegram connection modal
├── lib/
│   ├── sm2.ts                      # SuperMemo SM-2 algorithm
│   ├── storage.ts                  # localStorage read/write layer
│   ├── csv.ts                      # CSV parse & export utilities
│   ├── telegram.ts                 # Telegram Bot API helpers
│   ├── sound.ts                    # Sound effect utilities
│   └── supabase.ts                 # Supabase client
├── data/
│   └── concepts.ts                 # Starter seed concepts
├── types/
│   └── index.ts                    # Shared TypeScript types
supabase/
└── schema.sql                      # Supabase Postgres schema (RLS-enabled)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Fonts | Inter, JetBrains Mono (Google Fonts) |
| Storage (local) | `localStorage` (offline-first) |
| Storage (cloud) | Supabase (Postgres + RLS) |
| Auth | Supabase Auth |
| Bot | Telegram Bot API |
| Cron | Vercel Cron Jobs |
| Hosting | Vercel |

---

## 🗄️ Database Schema

The Supabase schema (`supabase/schema.sql`) defines four tables, all with **Row Level Security** enabled:

| Table | Purpose |
|---|---|
| `profiles` | User profile linked to `auth.users` |
| `user_concept_reviews` | SM-2 review state per user per concept (interval, ease factor, next review date, history) |
| `user_concept_notes` | User-specific concept metadata (title, category, URL, notes, tags) |
| `telegram_subscribers` | Telegram chat IDs and daily digest preferences |

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env.local

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional* | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional* | Your Supabase anon/public key |
| `TELEGRAM_BOT_TOKEN` | Optional | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_BOT_USERNAME` | Optional | Bot username (e.g. `WapasPadhleBot`) |
| `CRON_SECRET` | Optional | Secret to protect the `/api/cron/daily-digest` route |

> *The app works fully offline using `localStorage` without Supabase credentials. Supabase is only required for cloud sync and multi-device support.

See [`.env.example`](.env.example) for the full template.

---

## ⏰ Vercel Cron

The daily Telegram digest is triggered by a Vercel Cron Job defined in [`vercel.json`](vercel.json):

```
Schedule: 0 8 * * *  (every day at 08:00 UTC)
Route:    /api/cron/daily-digest
```

---

## 👨‍💻 Creator & Links

- **Creator**: Abhishek Rai (Software Engineer @ Atlassian • Scale with Rai)
- **LinkedIn**: [linkedin.com/in/abhishek-rai-atlassian](https://www.linkedin.com/in/abhishek-rai-atlassian/)
- **TopMate (1:1 Mentorship)**: [topmate.io/arai_19999](https://topmate.io/arai_19999)
- **Twitter / X**: [@scale_with_rai](https://x.com/scale_with_rai)

---

## 📄 License & Attribution

A free developer utility built by **Abhishek Rai • Scale with Rai**.  
Distributed under the MIT License.
