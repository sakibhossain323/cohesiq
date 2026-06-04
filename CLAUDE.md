# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the stack

```bash
docker compose up --build          # start everything (frontend :3000, backend :8000)
docker compose ps                  # verify containers are healthy
docker compose logs --tail 50 backend   # check backend errors
docker compose logs -t -f frontend      # watch frontend build errors
```

Never run `pnpm run dev` or `uvicorn` outside Docker unless explicitly debugging locally.

## Frontend commands (inside the container or locally)

```bash
pnpm run dev      # local dev server
pnpm run build    # production build
pnpm run lint     # ESLint
```

## Backend scripts (run inside the backend container)

```bash
docker compose exec backend python -m scripts.generate_seed_data   # generate ~100 creators/brands via Tavily+Groq
docker compose exec backend python -m scripts.sync_clerk_users      # assign roles to @test.com Clerk users
docker compose exec backend python -m scripts.seed_db               # seed database with generated data
```

## Architecture

Cohesiq is a B2B influencer matching platform with a decoupled full-stack architecture:

- **Frontend**: `frontend/cohesiq-v0/` — Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui, Clerk auth
- **Backend**: `backend/` — FastAPI, Python 3.12, SQLAlchemy 2.0 Async, PostgreSQL 16, Alembic migrations
- **Auth**: Clerk RS256 JWTs — backend validates via `common.dependencies.get_current_user`

### Backend domain structure

`backend/app/` follows Domain-Driven Design with four domains, each containing `models.py`, `schemas.py`, `router.py`, `service.py`:
- `auth/` — Clerk JWT validation, user sync
- `brands/` — brand profiles
- `creators/` — creator profiles, social profiles, rate cards, portfolio
- `campaigns/` — campaigns, applications, collaborations, reviews
- `common/` — shared dependencies (`get_db`, `get_current_user`)
- `services/` — cross-domain: `matching.py`, `semantic_match.py`, `llm_matching.py`
- `webhooks/` — Clerk webhook handler

**Rule:** Routers only parse requests and return Pydantic responses. All logic lives in the service layer. No cross-domain imports in routers.

### Frontend colocation pattern

Inside `app/`, use the `_` prefix to opt folders out of routing:
- `_actions/` — Server Actions colocated with the feature (never put in a top-level `app/actions/`)
- `_components/` — Client Components colocated with the page that uses them

**Server Component → Client Island pattern (required):**
- `page.tsx` must be an async Server Component — data fetching only, no `useState`/`useEffect`
- Interactive UI goes in `_components/PageClient.tsx` marked `"use client"`
- URL-driven filtering: client islands update the URL via `useRouter().push('?filter=value')`; Server Component reads `searchParams`

**API call rules:**
- Server Components / Server Actions use `BACKEND_API_URL` (Docker-internal: `http://backend:8000`)
- Client Components use `NEXT_PUBLIC_API_URL` (browser-accessible)
- **Always use `fetchApi()` from `lib/api/client.ts`** — never call `fetch(process.env.NEXT_PUBLIC_API_URL + '/...')` directly

### Environment variables

Two-variable API URL contract — never mix them up:

| Variable | Used by | Local value |
|---|---|---|
| `BACKEND_API_URL` | Server Components, Server Actions | `http://backend:8000` |
| `NEXT_PUBLIC_API_URL` | Browser / Client Components | `http://localhost:8000` |

Always add new env vars to `.env.example` in both `frontend/` and `backend/`.

## Database schema

Before altering any SQLAlchemy model, read `docs/schema.md` first — it is the authoritative schema reference. After substantial model changes, update `docs/schema.md` and `docs/plan.md`.

## Documentation source-of-truth hierarchy

When docs disagree, resolve in this order (defined in `docs/plan.md` §0):

1. `docs/requirements.md` — BuildFest competition baseline (immutable: rubric, challenge definition)
2. `docs/srs.md` — Cohesiq product spec (authoritative vision: FR/NFR, user stories, ER diagram)
3. `docs/plan.md` — unified implementation plan; reconciles the SRS vision with the **real codebase**, lists every intentional divergence in its §3 Divergence Ledger, and tracks phased status
4. `docs/schema.md` — code-true relational schema
5. `docs/tasks/tasks-*.md` — per-developer backlogs (Sakib = marketplace UI/campaigns; Navid = YouTube/matching/data)

**Reality checks that prevent hallucination** (all confirmed live, not aspirational):
- Storage is **relational-only PostgreSQL** — no pgvector/Neo4j/Redis/TimescaleDB yet (they are deferred Phase-E layers; see plan §3 D1–D5).
- `app/youtube/` is a **stateless public-API read wrapper** — it does not persist to the DB.
- Two distinct type taxonomies coexist and must **not** be merged: `campaigns.campaign_type` (brand demand) vs `collaboration_type` (creator supply). See plan §3.1.

If the code forces a new divergence from the SRS, record it in `docs/plan.md` §3 — never silently edit the SRS to match a shortcut.

## Verification checklist (after backend or Docker changes)

1. `docker compose ps` — all containers healthy
2. `docker compose logs --tail 50 backend` — no startup errors
3. Check `docs/schema.md` matches the actual models before writing migrations

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
