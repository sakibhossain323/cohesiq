# AI Agent Instructions for Cohesiq

This document contains strictly enforced conventions and rules for any AI agent or LLM operating within the `cohesiq` codebase. 

## Documentation index

**`docs/index.md`** is the navigation map for every file under `docs/` — source-of-truth hierarchy, task backlogs, diagrams, design, concepts, revisions, and operations. Read it before opening any doc file.

Source-of-truth order when docs disagree: `docs/requirements.md` → `docs/srs.md` → `docs/plan.md` → `docs/schema.md` → `docs/tasks/tasks-*.md`. The SRS is IEEE-style (FR/NFR only); user stories are in `docs/user-stories.md`, personas in `docs/personas.md`, diagrams in `docs/diagrams/`. Self-contained component refs: `docs/matching-engine.md`, `docs/youtube-integration.md`. Claude-specific guidance (graphify-first workflow, design system) lives in `CLAUDE.md` — this file (`AGENTS.md`) is the agent-agnostic counterpart; keep the two complementary.

## Project Overview

Cohesiq is a B2B SaaS Influencer Matching Platform. It utilizes a Modular Monolith architecture for the backend (FastAPI + PostgreSQL) and a modern frontend (Next.js App Router). Authentication is fully managed via Clerk.

## Current Implementation Snapshot (June 10, 2026)

- **Stack:** Next.js 16 + React 19 (frontend); FastAPI + Python 3.12 + SQLAlchemy 2.0 async + PostgreSQL 16 (backend). Alembic migration head is **`0022`**.
- **Matching engine** (`backend/app/services/matching.py` + `matching_config.py`): a 5-stage pipeline — hard SQL filter → 90-day relational conflict-of-interest check → deterministic niche scoring + capped semantic rescue → 6-factor weighted linear score (niche **0.45**, budget **0.20**, platform 0.15, engagement 0.10, language 0.08, recency 0.02) → heuristic rationale (Groq LLM personalizes the top 5; the LLM never alters the numeric score). Full detail: `docs/matching-engine.md`.
- **AI/LLM:** Groq `llama-3.1-8b-instant` (rationale + synthetic seed), Groq Whisper `large-v3-turbo` (voice→text campaign creation), Gemini `1.5-flash` + `text-embedding-004` (rationale / semantic fallback, embeddings computed live, **not persisted**).
- **Shipped:** voice + PDF campaign creation, AI brief analysis, multi-turn negotiation (4s polling), admin panel, conflict-of-interest check, ROI/rate-benchmark tools, offer-driven lifecycle (launch→shortlist→offer→negotiate→accept→contract via `campaign_applications` + `negotiation_turns` + `contracts`).
- **YouTube enrichment is implemented** — `app/youtube/` reads YouTube Data API v3 and persists into `creator_social_profiles` with a `data_source` provenance label (`docs/youtube-integration.md`). **Neo4j graph matching and pgvector/Redis/TimescaleDB remain deferred (Phase E).**
- API URL routing uses a two-variable strategy: `BACKEND_API_URL` (server-side) and `NEXT_PUBLIC_API_URL` (client/browser). See Environment Variables section.

## Core Architecture & Stack Conventions

1. **Frontend (Next.js 16 App Router)**
   - Located in `/frontend/cohesiq-v0/`.
   - Uses `shadcn/ui` and `Tailwind CSS v4`.
   - Authentication is handled by `@clerk/nextjs`. Use `<SignedIn>`, `<SignedOut>`, and `auth()` server-side.

   **Colocation Conventions (Official Next.js `_folderName` pattern):**
   The `_` prefix opts a folder and all its subfolders out of the routing system at the compiler level. Use it to colocate non-route files inside `app/`:
   - `_actions/` — Server Actions colocated with the feature they belong to
   - `_components/` — Private Client Components colocated with the page that uses them
   - `lib/` — Reserved for utilities genuinely shared across multiple feature areas (e.g., `fetchApi`, types)
   - **NEVER put feature-specific actions in `app/actions/`** — use `_actions/` inside the relevant route segment

   **Server Component → Client Island Pattern (required):**
   ```tsx
   // page.tsx (async Server Component)
   export default async function Page({ searchParams }) {
     const params = await searchParams;
     const data = await fetchApi(`/data?q=${params.q}`);
     return <PageClient initialData={data} />;
   }
   
   // _components/PageClient.tsx (Client Component)
   "use client";
   export function PageClient({ initialData }) { ... }
   ```
   - `page.tsx` MUST be an async Server Component unless the page is entirely driven by interactive state (forms, dialogs, tab state).
   - NEVER use `useEffect` or `useState` for data fetching, pagination, or searching.
   - **URL-Driven Filtering:** When filters, search, or pagination are involved, use Next.js `searchParams` in the Server Component. Client islands must update the URL using `useRouter().push('?filter=value')` rather than storing filter state locally.
   **When to use `"use client"` (legitimate cases only):**
   - Multi-step forms with complex local state
   - Pages with dialogs, dropdowns, confirmation flows
   - Pages with optimistic mutations (e.g., campaign status change)
   - Multi-step onboarding flows

   **Data Mutation:** Use Server Actions (colocated in `_actions/`) for mutations. Client components that must call the backend directly MUST use `fetchApi()` from `lib/api/client.ts` — never raw `fetch(process.env.NEXT_PUBLIC_API_URL)`.

   **STRICTLY FORBIDDEN:** Calling `fetch(process.env.NEXT_PUBLIC_API_URL + '/...')` directly from any `"use client"` component. Always use `fetchApi()` from `lib/api/client.ts`.

   For multi-step forms, use React Context Providers (e.g., `OnboardingProvider`) to manage state across routes before finalizing to the backend.

2. **Backend (FastAPI + SQLAlchemy 2.0 Async)**
   - Located in `/backend/`.
   - Follows Domain-Driven Design: `auth/`, `creators/`, `brands/`, `campaigns/`.
   - **No cross-domain imports in routers:** Always use the service layer for logic. Routers should only parse requests and format responses using Pydantic.
   - **JWT Validation:** The backend uses Clerk's JWKS to validate `Authorization: Bearer <token>` requests via RS256. See `common.dependencies.get_current_user`.
   - All external API calls MUST be asynchronous using `httpx`.

3. **Database (PostgreSQL 16 + Alembic)**
   - Schema defined purely relationally in `docs/schema.md`.
   - User identity is managed by Clerk. The `users` table maps `clerk_id` to our internal `user_id`.
   - Avoid nullable enums; use lookup tables (`niches`, `languages`) for extensible properties.

## Design System

Cohesiq has a defined design system. **All frontend UI work must use design tokens — never hardcode colors, font sizes, spacing, or shadows.**

Full token reference: `docs/design-system.md`
Live visual showcase: start the stack and visit `/design-system`

### Token files

| File | Purpose |
|---|---|
| `frontend/cohesiq-v0/frontend/design/cohesiq.css` | Token definitions (source) |
| `frontend/cohesiq-v0/app/globals.css` | Tailwind v4 `@theme inline` — exposes all tokens as utility classes |
| `frontend/cohesiq-v0/app/layout.tsx` | Font loading — `Plus Jakarta Sans` (`--font-display`) + `DM Sans` (`--font-body`) |
| `frontend/cohesiq-v0/app/(public)/design-system/` | Interactive token showcase |

### Rules

1. **Colors:** use `--brand-primary`, `--brand-secondary`, `--n-*` warm neutral scale, or `--color-*` semantic tokens. No hex literals in new CSS or `style={}` props.
2. **Typography:** `font-display` for headings, `font-body` for UI text (Tailwind utilities). Font sizes from the `--text-*` modular scale.
3. **Spacing:** `--space-*` 4px-grid tokens or their Tailwind equivalents. No arbitrary `px` values.
4. **Dark mode:** all tokens remap automatically in dark mode — do not add `dark:` utility overrides unless handling a genuine one-off that cannot use a token.
5. **shadcn/ui components** are already wired to the design system bridge tokens — do not override their CSS variables (`--background`, `--primary`, `--ring`, etc.).
6. Before writing new styles, check `docs/design-system.md` for the correct token name.

## Environment Variables

- `.env` files must NEVER be committed.
- Any time a new environment variable is added, it must also be added to `.env.example` in both `frontend` and `backend` (if applicable).
- Critical variables include `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `DATABASE_URL`.

### Frontend API URL — Two-Variable Contract

The frontend uses **two separate env vars** to route API calls correctly based on execution context. `lib/api/client.ts` is the single source of truth and selects between them automatically using `typeof window === 'undefined'`.

| Variable | Read By | Value (Local) | Value (Staging) |
|---|---|---|---|
| `BACKEND_API_URL` | Next.js server ONLY (Server Components, Server Actions, Route Handlers) | `http://backend:8000` | `http://backend:8000` (unchanged — Docker-internal) |
| `NEXT_PUBLIC_API_URL` | Browser ONLY (client components) | `http://localhost:8000` | `http://<staging-server-ip>:8000` |

**Rules agents MUST follow:**
- NEVER read `process.env.BACKEND_API_URL` directly in a `"use client"` component. It will be `undefined` in the browser.
- NEVER read `process.env.NEXT_PUBLIC_API_URL` in a Server Component or Server Action. Use `BACKEND_API_URL` there.
- NEVER call `fetch(process.env.NEXT_PUBLIC_API_URL + '/endpoint')` directly from a client component. Always use `fetchApi()` from `lib/api/client.ts`.
- ALWAYS update `.env.example` when adding a new env var.

## Development & Execution Rules

1. **Run via Docker Compose:**
   - The entire stack runs via `docker compose up --build` at the root directory.
   - Backend is accessible at `http://localhost:8000`. Frontend is at `http://localhost:3000`.
   - Never run `npm run dev` or `uvicorn` outside the Docker container unless explicitly debugging locally.

2. **Agent Safety & Verification Checks (Mandatory):**
   - **Verify Services:** After making backend or docker changes, ALWAYS check if containers are healthy using `docker compose ps` and `docker compose logs --tail 50 backend`. Do not assume the system restarted cleanly.
   - **Double Check Imports:** When deleting or moving variables/functions (e.g., `ALGORITHM`), use `grep_search` to verify you aren't breaking imports elsewhere in the codebase.
   - **Frontend Validation:** Next.js build errors (like "Export not found") indicate an immediate problem. Check `docker compose logs -t -f frontend` if necessary. Fix them before moving to the next task.
   - **No Assumptions:** If you are unsure about the database schema, ALWAYS read `docs/schema.md` or the actual SQLAlchemy models first.

## Documentation Sync

- Read **`docs/index.md`** first to locate the right doc file before opening anything under `docs/`.
- Use `graphify` (if available via workflow) to maintain up-to-date knowledge of the codebase structure.
- When making substantial architectural or model changes, you MUST update `docs/schema.md` and `docs/plan.md`.

## Data Seeding & Mock Data
Primary seeding is the relational snapshot `db/seed.sql` (real YouTube/Instagram/TikTok data; `db/seed.sql` is a symlink to the latest snapshot in `db/snapshots/`). See `docs/seeding.md` for the full reference.

```bash
docker compose exec -T postgres psql -U cohesiq -d cohesiq < db/seed.sql   # load real seed snapshot
docker compose exec backend python -m scripts.reset_db                     # wipe business data (skips alembic_version)
docker compose exec backend python -m scripts.sync_clerk_users             # grant brand/creator roles to @test.com Clerk users
```

> The old `scripts/generate_seed_data.py` and `scripts/seed_db.py` (Tavily+Groq synthetic generation) are **superseded by `seed.sql`** — do not use them.
