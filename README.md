# Bonzaipon 🌱

A mobile-first productivity app: complete daily tasks → earn tickets → roll a
gachapon lootbox for gold / vice / copper coins. Built with Next.js (App Router)
and Supabase (Postgres + Auth).

## Concepts

| Thing | Meaning |
|-------|---------|
| **Task** | A preset action you check off (repeatable, with an optional note) |
| **Ticket** | Earned 1:1 from tasks completed when the day rolls over |
| **Gold coin** | Rare (default 0.5%) — for the future cosmetics shop |
| **Vice coin** | Uncommon (default 3.0%) — spend to enjoy a vice |
| **Copper coin** | Common (the remainder) — auto-converts to a vice coin every N (default 100) |

## Prerequisites

1. **Node.js 20+** — install the LTS from <https://nodejs.org> (this machine
   doesn't have it yet). Reopen your terminal afterward so `node -v` works.
2. **A Supabase project** — free tier at <https://supabase.com>.

## Setup

```bash
cd "C:\Users\Chris\OneDrive\Documents\Claude\Bonzaipon\web"
npm install
```

### 1. Create the database

In the Supabase dashboard → **SQL Editor** → **New query**, paste the entire
contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates
the tables, row-level security, the new-user bootstrap trigger, and the
server-side RPC functions (rolling, day rollover, etc.).

### 2. Configure auth (for easy local testing)

Supabase **Authentication → Providers → Email**: turn **"Confirm email" OFF**
while developing, so a new signup logs in immediately. (Leave it on in
production if you want verified emails.)

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in from
Supabase **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000> on your phone (same Wi-Fi, use your PC's LAN IP) or
in a desktop browser's mobile view.

## Deploying to Vercel

1. Push this `web/` folder to a GitHub repo.
2. Import it in Vercel; set the same two env vars in the Vercel project settings.
3. Deploy. Point Supabase **Auth → URL Configuration → Site URL** at your Vercel
   domain.

## How the day works

The day rolls over **on app open**, using your device's local date. When the
stored day is older than today: that day's task completions convert 1:1 into
tickets (and into running-total + streak), then the task log clears. The
server is authoritative for all coin math and RNG, so balances can't be edited
from the browser.

## Project layout

```
supabase/schema.sql          # the whole database (run once)
src/middleware.ts            # session refresh + auth gate
src/lib/supabase/            # browser/server/middleware Supabase clients
src/lib/types.ts             # shared types
src/lib/day.ts               # device-local date helper
src/app/login/               # email+password auth
src/app/(app)/               # authed app (bottom-tab shell)
  page.tsx                   #   Today  – tasks + end-of-day review
  roll/                      #   Roll   – gachapon w/ tension animation
  progress/                  #   Progress – jar of sand + streaks
  settings/                  #   Settings – odds, presets, sign out
  actions.ts                 #   server actions (call the RPCs)
```

## Not built yet (next steps)

- Cosmetics **shop** that spends gold coins.
- Richer jar-of-sand visualization / long-term progress views.
- Reordering presets by drag.
