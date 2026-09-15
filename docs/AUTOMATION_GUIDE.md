# LifeLink Connect - Supabase Keep-Alive Automation Guide

This guide explains how the automated keep-alive system works to prevent your Supabase Free Tier project from pausing due to inactivity.

---

## 1. Project Architecture Findings
- **Frontend / Framework**: Vite + React 18 SPA (Single Page Application) with TypeScript, React Router v6, Tailwind CSS, TanStack Query, and Radix UI / shadcn.
  *(Note: There is no server-side Next.js framework in this repository; the app is compiled to static files in `dist/` and deployed to Vercel using an SPA rewrite rule in `vercel.json`).*
- **Database / Backend**: Supabase PostgreSQL with PostgREST API and Supabase Auth.
- **Row-Level Security (RLS)**: User tables (`blood_requests`, `donors`, `emergency_posts`, `profiles`) enforce foreign key constraints to `auth.users(id)` and restrict writes to authenticated user sessions.
- **Deployment & Scheduling**: Previously had no scheduled automation, health checks, or CI/CD workflows configured.

---

## 2. Approach Selection: Why GitHub Actions?

| Solution | Evaluation for LifeLink Connect | Decision |
| :--- | :--- | :--- |
| **GitHub Actions (Chosen)** | Runs independently in your existing GitHub repository. Completely decoupled from the frontend build. Free (2,000 mins/mo; uses ~1 min/mo). Supports 1-click manual trigger (`workflow_dispatch`). Zero risk to Vite SPA routing. | **SELECTED (Best & Safest)** |
| **Vercel Cron** | Requires creating a serverless API route in a static Vite SPA. Limited to 1 daily cron on Hobby tier, and exposes an HTTP endpoint requiring secret token verification. | *Alternative / Backup* |
| **Supabase pg_cron** | Internal to PostgreSQL. If the Supabase instance is paused by the platform, internal crons cannot wake it up or prevent external ingress pauses. | *Not recommended for external keep-alive* |

---

## 3. Files Created and Modified

1. **`scripts/keep-alive.js`** *(NEW)*:
   - Standalone Node.js script.
   - Performs a lightweight read ping against PostgREST (`blood_banks`).
   - Automatically detects and updates `_system_heartbeat` (if migration applied).
   - Reports latency and success/failure status code.
2. **`.github/workflows/supabase-keep-alive.yml`** *(NEW)*:
   - Scheduled GitHub Action running every 3 days (`0 0 */3 * *`).
   - Supports on-demand manual trigger via the GitHub "Run workflow" button.
3. **`supabase/migrations/20260916000000_create_system_heartbeat.sql`** *(NEW)*:
   - Creates a dedicated 1-row table (`_system_heartbeat`) for optional write pings.
   - Fully isolated from domain data; prevents table growth with upsert.
4. **`package.json`** *(MODIFIED)*:
   - Added `"keep-alive": "node scripts/keep-alive.js"` script for easy local testing.
5. **`docs/AUTOMATION_GUIDE.md`** *(NEW)*:
   - This documentation guide.

---

## 4. How the Automation Works Step-by-Step

```
[Every 3 Days @ 00:00 UTC] 
         │
         ▼
[GitHub Actions Runner (Ubuntu)]
         │  (Loads SUPABASE_URL & SUPABASE_ANON_KEY from GitHub Secrets)
         ▼
[node scripts/keep-alive.js]
         │
         ├──► 1. PostgREST Read Ping: Queries `blood_banks` count
         │       └─ Registers HTTPS API activity on Supabase gateway
         │
         ├──► 2. Isolated Heartbeat Upsert: Updates row in `_system_heartbeat`
         │       └─ Registers database write activity (if table exists)
         │
         ▼
[Exit Code 0 / Green Status Logged]
```

---

## 5. Required Secrets Configuration

To enable the GitHub Action in production, add these secrets to your GitHub repository:

1. In GitHub, go to: **Settings > Secrets and variables > Actions**.
2. Click **New repository secret**.
3. Add:
   - **`SUPABASE_URL`**: Your Supabase project URL (e.g. `https://whuingnruqnnndhzqkth.supabase.co`).
   - **`SUPABASE_ANON_KEY`**: Your Supabase anon / publishable key.

*(Note: The workflow also accepts `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` if you prefer to use those names).*

---

## 6. How to Test Manually

### Option A: Run Locally in Terminal
From the project root:
```bash
npm run keep-alive
```
Expected output:
```
====================================================
[KEEP-ALIVE] LifeLink Connect Heartbeat Starting...
[SUCCESS] Read ping successful: 'blood_banks' has 6 records (1390ms).
[KEEP-ALIVE] Completed in 2104ms.
[KEEP-ALIVE] Read Activity:  ACTIVE (OK)
====================================================
```

### Option B: Trigger from GitHub Actions Tab
1. Push branch `automate` (or merge into `main`).
2. In GitHub, click the **Actions** tab.
3. Select **Supabase Keep-Alive** from the left sidebar.
4. Click **Run workflow** -> **Run workflow**.
5. Watch the workflow execute and verify the green checkmark.

---

## 7. How to Verify Activity in Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to your project -> **Logs** -> **API Logs** or **Reports / API**.
3. You will see incoming requests to `/rest/v1/blood_banks` (and `/_system_heartbeat`) from the GitHub runner, confirming genuine API activity.

---

## 8. Safety & Data Protection Guarantees

- **Zero Fake Domain Records**: The automation **never** creates dummy blood requests, dummy donors, fake emergencies, or fake camp registrations.
- **Zero UI Pollution**: Because domain tables are untouched, the user-facing Dashboard counters, Emergency Feed, and Leaderboard remain 100% authentic.
- **Zero Database Growth**: If `_system_heartbeat` is used, it upserts a single row (`id = 'primary'`). It never creates new rows or increases table storage.
- **No Secret Leaks**: No service-role key is required; only public anon credentials with read-only/isolated write access are used.

---

## 9. How to Disable or Remove Later

- **To pause temporarily**: Go to GitHub **Actions** -> **Supabase Keep-Alive** -> Click `...` -> **Disable workflow**.
- **To remove completely**: Delete `.github/workflows/supabase-keep-alive.yml` and `scripts/keep-alive.js`.
