# Project Eclipse — The Ascension Quiz

A production-ready multiplayer 60-level tournament quiz optimized for **500+ concurrent players**, featuring:
- **Frontend:** React + TypeScript + Tailwind + Framer Motion (`/client`) — ready for **Vercel**
- **Serverless Backend:** **Supabase** Postgres + Row Level Security + atomic PL/pgSQL RPCs + optional Edge Function (`/supabase`)
- **Local / Self-Hosted Server:** Express + Socket.io (`/server`)
- **Interactive Solo Demo Mode:** Built-in offline sandbox with simulated bots and stage controls

---

## Game Mechanism (The Cascade)

- **60 Levels**, every level has a **MAIN** question (`45s` default) and **4 Recovery Rooms** (`30s` default) of strictly decreasing difficulty (`0.8, 0.6, 0.4, 0.2`).
- **MAIN Correct:** Advance to `level + 1` (solving Level 60 triggers Ascension Victory).
- **MAIN Wrong / Timeout:** Drop into **Room 1 (Buffer)**.
- **Room k Wrong / Timeout (`k < 4`):** Drop deeper to **Room k + 1**.
- **Room 4 (Void) Wrong / Timeout:** **FULL RESET** back to Level 0 (`resets += 1`, score zeroed).
- **Room k Correct:** Recover back to **MAIN** on the **same level** with a fresh variant question (host-configurable to advance level instead).
- **Year Tracks:** 1st Year plays the Junior bank (149 questions across Levels 1–60); 2nd–4th Year plays the Senior bank (80 questions across Levels 1–60).

---

## Architecture for 500 Concurrent Players (Vercel + Supabase)

1. **Zero Player Realtime WebSockets (`O(1)` scaling):** Players do not open persistent Supabase Realtime subscriptions (avoiding the 200-connection Free tier cap and $O(N^2)$ `postgres_changes` broadcast storms). Instead:
   - Joining, answer evaluation, question picking, and rank calculation run via **atomic `SECURITY DEFINER` Postgres RPCs** through Supabase's **Supavisor Connection Pooler**.
   - Every `eclipse_submit_answer` call uses row-level `FOR UPDATE` locking, computes the Cascade transition, shuffles the next question inside Postgres, and returns the player's updated rank in a single round-trip.
   - Leaderboard pulses poll every `11–15s` with randomized per-client jitter (preventing synchronized thundering-herd spikes).
2. **Zero Answer Leakage:** `questions.correct_option` and `players.active_correct_option_id` are protected by strict RLS with no `anon` `SELECT` policies. Tournament question banks are never bundled into the Vercel client JS.
3. **Host & Projector:** Poll standings every `3s` (or via the Edge Function `/standings` endpoint with `s-maxage=2` CDN caching).

---

## Deploying to Vercel + Supabase

### 1. Set Up Supabase Backend
1. Create a new Supabase project (for 500 concurrent players, **Supabase Pro + Small/Medium Compute** is recommended for sustained connection pool headroom).
2. Open the **SQL Editor** in Supabase and run:
   - First: [`supabase/schema.sql`](supabase/schema.sql) (creates tables, indexes, RLS policies, default match `A7K3P9`, and all RPC functions)
   - Second: [`supabase/seed.sql`](supabase/seed.sql) (seeds all 231 Junior & Senior questions)
3. *(Optional)* Deploy the edge gateway:
   ```bash
   supabase functions deploy eclipse-api
   ```

### 2. Deploy Frontend to Vercel
1. Import this repository in Vercel and set the **Root Directory** to `client` (uses `client/vercel.json` automatically).
2. Add Environment Variables in Vercel:
   ```env
   VITE_BACKEND_MODE=supabase
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
3. Deploy! Open your Vercel URL:
   - **Player Portal (`/` & `/join`):** Default Match Code `A7K3P9` (or `WIRE`)
   - **Solo Demo Mode:** Click **Try Interactive Solo Demo** on the home screen (no backend needed)
   - **Host Dashboard (`/host`):** Default Host Passcode `ECLIPSE2026`
   - **Projector View (`/projector`):** Live top-3 podium & Room 4 Danger Zone

---

## Running Locally & Load Testing

```powershell
# Start local Express + Socket.io server (:3001) + Vite client (:5173)
npm run dev

# Run all unit tests (Server + Client)
npm test

# Run 500-concurrent-player WebSocket load test
npm run loadtest:500

# Build production bundle
npm run build
```
