# LifeLink AI  

A location-aware blood donation matching platform that connects eligible donors with urgent hospital blood requests using real transfusion compatibility rules.

# 🚀 Live Demo

### 🌐 **[Visit LifeLink Connect →](https://lifelink-connect-psi.vercel.app/)**

> Experience the application live without any installation.
> 
## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Blood Matching Logic](#blood-matching-logic)
- [Application Workflows](#application-workflows)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Security](#security)
- [Performance](#performance)
- [Testing and Quality](#testing-and-quality)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

LifeLink AI  helps voluntary blood donors, requesters, and community coordinators respond faster during blood shortage situations. The app lets authenticated users register as donors, create blood requests, find compatible donors in the same city, respond to matching requests, search blood bank stock, publish emergency posts, and manage blood donation camps.

The project addresses a real operational problem: blood supply is often fragmented across donors, hospitals, blood banks, and community networks. LifeLink AI  centralizes donor availability, biological compatibility, location filtering, and request response tracking in one Supabase-backed web application.

Intended users include:

- Individual voluntary blood donors
- Patients or family members creating blood requests
- Hospital or community coordinators managing urgent needs
- Blood bank and donation camp organizers.

## Key Features

### Donor and Request Management

- Donor registration with blood group, contact details, city, availability, and last donation date.
- Blood request creation with patient details, hospital location, urgency, units needed, contact phone, and notes.
- Matching request inbox where donors can accept or decline compatible open requests.
- Request response dashboard for requesters to track accepted, declined, and pending donor responses.

### Matching and Eligibility

- Centralized ABO/Rh compatibility matrix in `src/lib/bloodMatching.ts`.
- Recipient-to-donor matching for request creation and response counts.
- Donor-to-recipient matching for the donor matching inbox.
- Availability filtering with support for `available`, `busy`, and `emergency_only` donors.
- Requester exclusion so users do not match with their own requests.
- City normalization to avoid missed matches caused by casing or extra spaces.
- 90-day minimum donation interval check for donor eligibility.

### Blood Network Tools

- Blood bank search with location filtering and stock filtering by blood group.
- Emergency feed for donor requests, hospital help posts, and volunteer coordination.
- Donation camp discovery, registration, and camp creation.
- Donor leaderboard based on donation count and points.
- Authenticated profile page for donor status, donation history, and availability updates.

### User Experience

- Protected application routes for authenticated features.
- Responsive Tailwind CSS and shadcn/ui interface.
- Toast notifications for user actions and errors.
- SPA routing fallback for direct refresh and deep links.
- With clean UI/UX interface
## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vite, React 18, TypeScript |
| Routing | React Router DOM |
| Data and Auth | Supabase JavaScript client, Supabase Auth |
| Database | Supabase PostgreSQL |
| Security | Supabase Row Level Security policies |
| UI | Tailwind CSS, shadcn/ui, Radix UI primitives |
| Icons | Lucide React |
| Data Fetching State | TanStack React Query provider, component-level state |
| Notifications | Sonner and shadcn toast |
| Testing | Vitest, jsdom |
| Deployment | Static Vite build, Netlify `_redirects`, Vercel `rewrites`, Lovable-compatible workflow |

## Architecture

LifeLink AI  is a client-rendered React application backed directly by Supabase. There is no separate Express or Next.js API layer in this repository. Authenticated frontend pages call Supabase tables through the typed client in `src/integrations/supabase/client.ts`, while access control is enforced by Supabase Auth and database RLS policies.

High-level flow:

1. React routes render protected pages through `ProtectedRoute`.
2. Supabase Auth persists sessions in browser storage.
3. Pages query and mutate Supabase tables directly through the generated typed client.
4. Blood compatibility and local eligibility checks run in shared TypeScript helpers.
5. Supabase RLS policies restrict inserts and updates to the authenticated user's own records.

## Folder Structure

```text
.
|-- public/
|   |-- _redirects
|   |-- favicon.ico
|   |-- favicon.png
|   |-- placeholder.svg
|   `-- robots.txt
|-- scripts/
|   |-- diagnose-all.js
|   |-- diagnose-camps.js
|   |-- seed-blood-banks.js
|   |-- test-insert-camps.js
|   |-- test-query.js
|   |-- test-visibility.js
|   `-- verify-camps-schema.js
|-- src/
|   |-- components/
|   |-- contexts/
|   |-- hooks/
|   |-- integrations/supabase/
|   |-- lib/
|   |-- pages/
|   |-- test/
|   |-- App.tsx
|   |-- index.css
|   `-- main.tsx
|-- supabase/
|   |-- config.toml
|   `-- migrations/
|-- vercel.json
|-- vite.config.ts
|-- vitest.config.ts
|-- tailwind.config.ts
|-- package.json
`-- README.md
```

## Blood Matching Logic

Blood compatibility is implemented as lookup tables instead of long conditional chains.

Recipient blood group to compatible donor groups:

| Recipient Needs | Compatible Donors |
| --- | --- |
| O- | O- |
| O+ | O-, O+ |
| A- | O-, A- |
| A+ | O-, O+, A-, A+ |
| B- | O-, B- |
| B+ | O-, O+, B-, B+ |
| AB- | O-, A-, B-, AB- |
| AB+ | O-, O+, A-, A+, B-, B+, AB-, AB+ |

The app also keeps the reverse donor-to-recipient matrix so a donor can see requests they can safely support.

Matching considers:

- Blood compatibility
- Donor availability
- Active open request status
- Same-city location matching after normalization
- Requester exclusion
- Minimum 90-day donation interval
- Critical urgency support for `emergency_only` donors

Current location filtering is city-based. The schema includes latitude and longitude fields for donors, hospitals, blood banks, and camps, so radius-based filtering can be added later without changing the core data model.

## Application Workflows

### Donor Registration

1. User signs in.
2. User registers a donor profile with blood group, phone, email, city, availability, and optional last donation date.
3. Supabase stores the donor record with a unique `user_id`.
4. The donor can update availability and log donations from the profile page.

### Blood Request Matching

1. Requester creates a blood request with patient and hospital details.
2. The app finds compatible donor blood groups from the lookup table.
3. Donors are filtered by availability, city, requester exclusion, and donation interval.
4. Compatible donors appear in the requester-side matched donor list.
5. Donors can view compatible open requests in their matching inbox and accept or decline.
6. Requesters can review donor responses in the Request Responses page.

### Blood Bank Search

1. User searches by location or filters by required blood group.
2. The app queries `blood_banks`.
3. Results show stock counts, contact details, and map directions.

### Emergency Feed and Camps

1. Authenticated users can publish emergency posts with urgency, location, blood group, and contact details.
2. Users can discover active emergency posts.
3. Users can find upcoming donation camps, register for camps, or create new camp listings.

## Installation

### Prerequisites

- Node.js 18 or newer
- npm
- Supabase project with the required schema and RLS policies

### Local Setup

```bash
git clone https://github.com/lakshmi-prasad-1/lifelink-connect.git
cd lifelink-connect
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

If `.env.example` is not present, create `.env` manually with the variables listed below.

Start the development server:

```bash
npm run dev
```

The Vite dev server runs on port `8080` by default.

### Useful Scripts

```bash
npm run dev        # Start local development server
npm run build      # Build production assets
npm run preview    # Preview production build locally
npm test           # Run Vitest test suite
npm run lint       # Run ESLint
```

## Environment Variables

Only public Supabase browser keys are required by the Vite app:

```text
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Do not commit `.env` files or private Supabase service role keys.

### Vercel deployment

Vite reads `VITE_*` variables at **build time**, so they must be set in the Vercel dashboard before each deploy picks them up:

1. Open your project on [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**
2. Add these for **Production**, **Preview**, and **Development**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID` (optional)
3. **Redeploy** the project (Deployments → ⋯ → Redeploy)

Values are the same as in your local `.env` file (copy from Supabase → Project Settings → API).

## Database

The database is Supabase PostgreSQL. Migrations live in `supabase/migrations`.

### Core Tables

| Table | Purpose |
| --- | --- |
| `profiles` | User profile metadata created after signup |
| `donors` | Donor identity, blood group, contact, city, availability, and donation stats |
| `blood_requests` | Patient and hospital blood requests |
| `donor_matches` | Donor responses for specific requests |
| `blood_banks` | Blood bank directory and stock counts |
| `donations` | Donation records and verification status |
| `donation_camps` | Upcoming blood donation camps |
| `camp_registrations` | User registrations for donation camps |
| `emergency_posts` | Active emergency and volunteer coordination posts |

### Schema Notes

- Blood groups are constrained to `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, and `O-`.
- Donor availability is constrained to `available`, `busy`, and `emergency_only`.
- Blood requests support `normal`, `urgent`, and `critical` urgency.
- Request status supports `open`, `fulfilled`, and `cancelled`.
- `donor_matches` uses a unique `(request_id, donor_id)` index to prevent duplicate donor responses.

## Security

- Supabase Auth protects application routes and identifies the current user.
- Row Level Security is enabled on application tables.
- Users can insert and update their own profile, donor record, requests, camps registrations, emergency posts, and donor match responses according to policy.
- Authenticated users can read public operational data such as donors, open requests, blood banks, camps, and emergency posts where policies permit it.
- Requesters can view match responses for their own blood requests.
- Donors can create and update only their own match responses.
- Secrets are expected to live in `.env` files and must not be committed.

## Performance

- Vite provides fast local development and optimized static production builds.
- Supabase indexes support common query filters on donor blood group, donor availability, donor city, request status, request blood group, request urgency, emergency post status, and donation donor IDs.
- Matching uses lookup tables for constant-time blood compatibility resolution.
- UI pages query only the tables needed for each workflow.
- Static deployment works through SPA rewrites so direct deep links do not return 404.

## Testing and Quality

Current verification commands:

```bash
npm run build
npm test
npm run lint
```

Known quality note: the project currently has existing ESLint issues in generated shadcn/ui components and several page files, mostly `any` usage, empty interface rules, hook dependency warnings, and a CommonJS `require()` in Tailwind config. These do not prevent the production Vite build, but they should be cleaned up before enforcing lint in CI.

## Deployment

Build the app:

```bash
npm run build
```

Deploy the `dist` directory to any static hosting provider.

### Routing Fallbacks

This project uses React Router with browser history. Static hosts must route unknown paths to `index.html`.

- Netlify: `public/_redirects` contains `/* /index.html 200`.
- Vercel: `vercel.json` rewrites all routes to `/index.html`.
- Other static hosts: configure an equivalent SPA fallback.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Keep changes focused and preserve existing workflows.
4. Run `npm run build` and `npm test` before opening a pull request.
5. Include database migration changes when modifying Supabase schema.
6. Document user-facing behavior changes in this README or relevant project docs.

## License

No license file is currently included in this repository. Add a `LICENSE` file before distributing this project as open source.
