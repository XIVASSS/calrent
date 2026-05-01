# CalRent

CalRent is a map-first rental discovery and seeker-matching platform focused on Kolkata.
It helps renters quickly find homes and lets owners post listings in seconds.

## What This Project Includes

- Map-centric rental browsing with live listing markers and rich popups
- Fast "Add your flat" flow (quick modal)
- "Drop a seeker pin" flow for renters to publish preferences
- Area stats tool (draw an area on map and get aggregate stats)
- Kolkata metro overlay with line colors and station markers
- Listing cards with practical tags (BHK, parking, pets, maintenance, etc.)
- Supabase-backed API routes and RPC-driven search
- Responsive UI optimized for desktop and mobile

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** React + Tailwind CSS + custom reusable components
- **Maps:** Google Maps (`@react-google-maps/api`)
- **Backend services:** Supabase (Postgres + Auth + RPC)
- **Validation:** Zod

## Repository Structure

- `app/` - App Router pages and API routes
- `components/` - UI and feature components
- `lib/` - business logic, queries, Supabase clients, helpers
- `supabase/` - schema + migrations used by this app
- `pages/` - document-level files for Next.js

## Core Features

### 1) Discovery Home

- Main page loads listings server-side for fast first render
- Client refreshes data based on filters and map bounds
- Marker + popup UX for quick comparison
- Search and filters synced via shared discovery context

### 2) Quick Add Flat

- Modal-based short form for owners
- Captures essentials like rent, BHK, furnishing, location, and tags
- Map picker supports pin-drop + geolocation-assisted locality

### 3) Drop Seeker Pin

- Renters can post budget, move-in timeline, preferences, and location
- Seeker pins render on map and refresh periodically

### 4) Area Stats

- Rectangle-pick tool on map
- Aggregates total listings, average rent, and BHK buckets for the selected area

### 5) Metro Overlay

- Kolkata metro lines rendered with color-coded routes
- Station markers and legend for commute-aware discovery

## Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

A template is committed as `.env.example`.

## Local Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Open:

- `http://localhost:3000`

### If you hit macOS `EMFILE` watcher errors

Increase open file limit before `npm run dev`:

```bash
ulimit -n 10240
```

Or run production-mode locally for stability:

```bash
npm run build
npm run start -- -p 3000
```

## Database (Supabase)

This app expects Supabase schema/RPC support used by `lib/listings/queries.ts` and API routes.

### Important migration

A migration is included for improved text search matching:

- `supabase/migrations/20260202004500_search_live_listings_flexible_text.sql`

It improves token-based matching so queries like `sector v` return expected results.

### Notes

- Make sure your Supabase project has the required tables, enums, and RPCs
- If deploying to a different Supabase project, apply schema + migration files there

## API Routes (Highlights)

- `POST /api/listings/search` - listing search endpoint used by map/list
- `POST /api/quick-add/listing` - quick owner listing creation
- `GET/POST /api/seeker-pins` - fetch/create seeker pins
- `POST /api/area-stats` - area-level aggregate stats
- `GET /api/build-info` - lightweight deployment/build diagnostics

## Deployment to Vercel

### 1) Import the GitHub repository

- In Vercel dashboard: **Add New Project**
- Import this repo
- Framework should auto-detect as **Next.js**

### 2) Add Environment Variables in Vercel

Set all three:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3) Deploy

- Trigger first deploy from `main`
- After deployment, test:
  - Homepage map and listing cards
  - Quick Add Flat modal
  - Drop Seeker Pin modal
  - Search + filters behavior

## Build and Quality Checks

```bash
npm run build
```

This validates TypeScript and production build compatibility.

## UX Notes / Current Behavior

- Header search is the primary search input for discovery
- Secondary row focuses on filter controls
- Top nav quick-add links were consolidated into the bottom-right action flow
- Map has fullscreen toggle for better exploration

## Security and Secrets

- Never commit real `.env.local` values
- `.gitignore` already excludes `.env*` except `.env.example`
- Rotate keys if you accidentally exposed any sensitive values publicly

## Common Troubleshooting

### App shows stale or unexpected data

- Confirm you are on the intended port/environment
- Check `/api/build-info` for build identity
- Hard refresh browser after deploy

### No listings on map

- Verify Supabase env vars
- Check browser console and network calls to `/api/listings/search`
- Confirm DB contains live listings in expected Kolkata bounds

### Search feels too strict

- Ensure latest migration was applied
- Try shorter locality tokens and broad filters

## Product Vision

CalRent aims to make Kolkata rentals:

- Faster to discover
- Cleaner to compare
- Easier to list
- More map- and commute-aware

## License

No license specified yet.
If needed, add a LICENSE file and update this section.

## Maintainer

Created and maintained by Protyasish.
