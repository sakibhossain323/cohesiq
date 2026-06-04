# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cohesiq is a B2B SaaS Influencer Matching Platform connecting brands with content creators in the Bangladeshi market. Modular Monolith backend (FastAPI + PostgreSQL), Next.js App Router frontend, Clerk for auth.

## Development Commands

**Run everything via Docker Compose at the repo root:**

```bash
docker compose up --build          # first run or after Dockerfile changes
docker compose up                  # subsequent runs
docker compose ps                  # verify container health
docker compose logs --tail 50 backend
docker compose logs -t -f frontend
```

**Backend tasks (inside the container):**

```bash
# Migrations
docker compose exec backend alembic upgrade head
docker compose exec backend alembic revision --autogenerate -m "description"

# Data seeding — run in this order
docker compose exec backend python -m scripts.generate_seed_data  # writes JSON to backend/data/
docker compose exec backend python -m scripts.sync_clerk_users    # grants roles to @test.com users
docker compose exec backend python -m scripts.seed_db             # truncates + re-seeds

docker compose exec backend python -m scripts.reset_db
docker compose exec backend python -m scripts.test_matching
```

**Frontend (local tooling only — do not run the app outside Docker):**

```bash
cd frontend/cohesiq-v0
pnpm lint
pnpm build    # catches type/export errors before committing
```

## Architecture

### Backend (`/backend/app/`)

Domain-Driven Design. Each domain (`auth/`, `creators/`, `brands/`, `campaigns/`) has `models.py`, `schemas.py`, `router.py`, and `service.py`. The `common/` module holds shared dependencies.

**Rule:** Routers must never contain business logic or cross-domain imports. All logic lives in the service layer. Cross-domain read-only endpoints live in `main.py`.

**Auth:** `common/dependencies.get_current_user` validates `Authorization: Bearer <token>`. Uses Clerk RS256 JWTs via JWKS when `CLERK_ISSUER_URL` is set; falls back to local HS256 when not. All protected endpoints use `Depends(get_current_user)`.

**Matching engine (`app/services/matching.py`):** Pure function `compute_match_score` with no DB calls — fully unit-testable. Weights: niche 35%, budget/tier 30%, platform 15%, engagement 10%, language 8%, recency 2%. All constants (weights, tier ranges, budget gates) are at the top of that file — edit them there, not inline. Called from `campaigns/service.py` which handles DB I/O. Semantic fallback (`app/services/semantic_match.py`) uses Gemini embeddings when `GEMINI_API_KEY` is available, otherwise Jaccard similarity.

**Database:** SQLAlchemy 2.0 async via `asyncpg`. All DB operations are `async`. Canonical schema is `docs/schema.md` — read it before touching models. `users.clerk_id` maps Clerk identity to internal `user_id`. Niches and languages use lookup tables, not enums.

### Frontend (`/frontend/cohesiq-v0/`)

Next.js 16 App Router. Three route groups:

- `(public)/` — landing page, public creator and campaign browsing
- `(auth)/onboarding/` — multi-step role-selection flow
- `(dashboards)/brand/dashboard/` and `(dashboards)/creator/dashboard/` — role-gated dashboards

**Server Component → Client Island pattern (required):**

```tsx
// page.tsx — async Server Component fetches data
export default async function Page({ searchParams }) {
  const data = await fetchApi(`/endpoint?q=${(await searchParams).q}`);
  return <PageClient initialData={data} />;
}

// _components/PageClient.tsx — "use client" island receives data as props
"use client";
export function PageClient({ initialData }) { ... }
```

`page.tsx` must be an async Server Component. Never use `useEffect`/`useState` for data fetching. When filters or pagination are involved, drive them via `searchParams` on the server; client islands update the URL with `useRouter().push('?filter=value')` rather than storing state locally.

**Colocation (`_` prefix opts out of routing at compiler level):**
- `_actions/` — Server Actions, colocated with the route segment they belong to
- `_components/` — Client Components private to one page

Never put feature-specific actions in a top-level `app/actions/` directory.

**API calls — two-variable contract:**

`lib/api/client.ts` is the single source of truth. It auto-selects between:
- `BACKEND_API_URL` (server-side: Docker-internal `http://backend:8000`)
- `NEXT_PUBLIC_API_URL` (client-side: public URL like `http://localhost:8000`)

All backend calls go through `fetchApi()` from `lib/api/client.ts`. **Never** call `fetch(process.env.NEXT_PUBLIC_API_URL + '/...')` directly from a `"use client"` component. **Never** read `process.env.BACKEND_API_URL` in a client component — it is `undefined` in the browser.

## Key Conventions

- **`.env` files must never be committed.** When adding an env var, update `.env.example` in both `backend/` and `frontend/cohesiq-v0/`.
- **After any backend or Docker change:** check `docker compose ps` and logs — never assume a clean restart.
- **After schema model changes:** update `docs/schema.md` and run `alembic revision --autogenerate`.
- **All external HTTP calls in the backend** use `httpx` async client.
- When unsure about the schema, read `docs/schema.md` or the SQLAlchemy models — do not guess.
