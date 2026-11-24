# Project Eclipse — The Ascension Quiz

A full-stack real-time multiplayer technical tournament quiz built with **React + TypeScript + Tailwind + Framer Motion** (`/client`) and **Express + Socket.io** (`/server`).

Combines the **Project Eclipse Dark Gothic UI/UX** and **60-Level + 4 Recovery Rooms Cascade mechanism** with **Ouroboros**'s live multiplayer architecture, Junior/Senior year question banks, anti-cheat system, host management, and CSV export.

## Game Mechanism (The Cascade)

- **60 Levels**, every level has a **MAIN** question (`45s` default) and **4 Recovery Rooms** (`30s` default) of strictly decreasing difficulty (`0.8, 0.6, 0.4, 0.2`).
- **MAIN Correct:** Advance to `level + 1` (solving Level 60 triggers Ascension Victory).
- **MAIN Wrong / Timeout:** Drop into **Room 1 (Buffer)**.
- **Room k Wrong / Timeout (`k < 4`):** Drop deeper to **Room k + 1**.
- **Room 4 (Void) Wrong / Timeout:** **FULL RESET** back to Level 0 (`resets += 1`, score zeroed).
- **Room k Correct:** Recover back to **MAIN** on the **same level** with a fresh variant question (host-configurable to advance level instead).
- **Year Tracks:** 1st Year plays the Junior bank (149 questions across Levels 1–60); 2nd–4th Year plays the Senior bank (80 questions across Levels 1–60).

## Running Locally

### 1. Start Both Server & Client
```bash
npm run dev
```
This runs:
- **Backend Server:** `http://localhost:3001`
- **Frontend Client:** `http://localhost:5173`

*(Or run individually in separate terminals: `npm run dev:server` and `npm run dev:client`)*

### 2. Access Codes & Routes
- **Player Portal (`/` & `/join`):**
  - Default Match Code: `A7K3P9` (or `WIRE`)
- **Host Dashboard (`/host`):**
  - Default Host Passcode: `ECLIPSE2026` (override with `ADMIN_CODE` env var)
  - Configure timers, levels, recovery fractions, upload custom JSON/CSV question banks with 60-level coverage heatmap, pause/resume/end match, start global countdown, disqualify players, and export CSV results.
- **Big-Screen Projector (`/projector`):**
  - Real-time top-3 podium, full standings, and live Room 4 Danger Zone display.

### 3. Run All Tests & Production Build
```bash
npm test
npm run build
```
