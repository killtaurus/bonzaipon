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
