# Cohesiq — Unified Implementation Plan

**Bangladesh's Creator & Talent Marketplace, powered by Graph AI**
The Infinity AI BuildFest 2026 · MarTech Track · Influencer Matching Engine

> **Status:** Living document · Last unified **2026-06-05** · Phase B complete · Phase D partially done (D03/D04/D05 shipped) · Supersedes the original
> "Phase 1 YouTube-only" plan (archived in git history at commit before this rewrite).

---

## 0. How to read this document (source-of-truth hierarchy)

This plan is the bridge between *what we promised* and *what the code actually is*. When
any two documents disagree, resolve in this order:

| Rank | Document | Role | Authority |
|---|---|---|---|
| 1 | `docs/requirements.md` | BuildFest competition baseline — challenge definition, judging rubric, AI-native reference architecture, top-10 mistakes | **Immutable.** The contest defines it. |
| 2 | `docs/srs.md` | Cohesiq product spec — problem, segments, KPIs, data strategy, AI logic, FR/NFR, user stories US-1…US-20, ER diagram | **Authoritative vision.** What we are building toward. |
| 3 | `docs/plan.md` *(this file)* | Implementation plan — reconciles the SRS vision against the real codebase; defines phased, demo-first goals | **Operational truth.** What we actually do next. |
| 4 | `docs/schema.md` | Authoritative relational schema reference | **Code-true.** Mirrors the live DB. |
| 5 | `docs/tasks/tasks-*.md` | Per-developer execution backlogs derived from this plan | Tactical. |

**Rule for contributors:** never let a downstream doc contradict an upstream one silently.
If the code forces a divergence from the SRS (it often will, within a 4-day build), record
it in **§3 Divergence Ledger** below — do not quietly rewrite the SRS to match a shortcut.

---

## 1. What Cohesiq is (one paragraph, from the SRS)

Cohesiq is a two-sided **Creator & Talent Marketplace** for Bangladesh: brands post BDT-budgeted
campaign briefs; creators join with self-reported and (Tier-0) public-API-verified profiles; a
deterministic-math-first matching engine ranks creators by niche, engagement, budget, platform,
language, and recency, then an LLM explains *why* each match fits. The decisive innovations are the
**opt-in / own-platform data model** (creators volunteer data to be discovered, so nothing is
scraped) and **computed trust** (authenticity scored, not claimed). Brands are the revenue engine;
talent is the supply side seeded first to beat the cold start.

---

## 2. Current architecture (code reality, 2026-06-05)

This is what actually runs today — the baseline every new task builds on.

### 2.1 Stack as-built

| Layer | As-built | SRS target | Gap |
|---|---|---|---|
| Frontend | Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, Clerk | same | — |
| Backend | FastAPI async, Python 3.12, SQLAlchemy 2.0 async, Alembic | same | — |
| Primary DB | **PostgreSQL 16 (plain)** | pgvector | pgvector extension not enabled |
| Graph DB | **none** | Neo4j 5 | not deployed |
| Time-series | **none** | TimescaleDB | not deployed |
| Cache | **none** | Redis (score cache, quota) | not deployed |
| Auth | Clerk RS256 JWT (`common.dependencies.get_current_user`) | email/password in SRS ER | Clerk chosen instead — **better**, keep |
| LLM | Google Gemini (semantic + optional rationale) | Gemini 1.5 Flash | aligned |
| Embeddings | Gemini embeddings with token-similarity fallback (`services/semantic_match.py`) | sentence-transformers + pgvector | not persisted; computed on the fly |
| YouTube | **Tier-0 public read wrapper** (`app/youtube/`) | YouTube Data API v3 Tier-0 | aligned; persistence pending |
| Seeding | Tavily + Groq synthetic generator + DB seeder (`backend/scripts/`) | 18–20 real channels via `Channels.list` | synthetic-first; real-YT seeding now unblocked by the wrapper |
| Containerization | Docker Compose (`postgres`, `backend`, `frontend`) | + neo4j/redis | 3 services only |

**Consequence:** the platform is a **relational marketplace with AI matching**, not the full
graph/vector/timeseries system the SRS paints. That is the correct MVP shape for a 4-day build —
graph/vector/timeseries are **additive layers** (see §4 phases), never MVP blockers (SRS §4.3, NFR-3).

### 2.2 Backend domains (DDD, `backend/app/`)

`auth/` · `brands/` · `creators/` · `campaigns/` · `youtube/` *(new, Navid)* · `common/` (shared deps)
· `services/` (cross-domain: `matching.py`, `semantic_match.py`, `llm_matching.py`) · `webhooks/` (Clerk).
Routers parse/return only; logic lives in services; no cross-domain imports in routers.

### 2.3 Live data model (authoritative: `docs/schema.md`)

Relational core, all present and migrated (heads `0001`→`0013` plus three merge migrations):
`users` → `creator_profiles` / `brand_profiles`; creator extension tables
(`creator_social_profiles` one-row-per-platform, `creator_niches`, `creator_languages`,
`creator_rate_cards`, `creator_portfolio_items`, `creator_collaboration_history`);
`campaigns` + targeting junctions (`campaign_niche_targets`, `campaign_language_targets`,
`campaign_deliverable_requirements`); `campaign_applications`; `reviews`; `ai_match_scores`;
lookup tables `niches`, `languages`.

**Migration 0013 (Sakib) added to `campaigns`:** `campaign_type` enum (six values),
`kpi_targets` JSONB, `hashtags` TEXT[], `tracking_notes` TEXT.

### 2.4 Navid's YouTube module — exact scope

`app/youtube/` is a **stateless, read-only public-API client** mounted at `/youtube`. It does
**not** touch the database. Endpoints:

| Endpoint | Purpose | Quota |
|---|---|---|
| `GET /youtube/search` | search videos/channels/playlists | **100 units** (`Search.list`) ⚠ |
| `GET /youtube/videos/{id}` | one video's public stats | 1 unit |
| `GET /youtube/channels?id=\|handle=\|username=` | channel identity + stats | 1 unit |
| `GET /youtube/channels/enrichment?channel_ref=…` | **creator-ready** metrics: subs, avg views/likes/comments, est. engagement rate, uploads/month | ~3 units |

It accepts channel IDs, `@handles`, legacy usernames, or full URLs (`parse_channel_ref`), and is
unit-tested (`tests/test_youtube_service.py`, `scripts/test_youtube_api.py`). **This is the Tier-0
ingestion primitive the SRS §4.2 calls for** — the next unit is persisting `enrichment` onto
`creator_social_profiles` (see §4 Phase D and `tasks-navid.md`).

---

## 3. Divergence ledger (SRS target → as-built decision)

Every place the build intentionally diverges from `srs.md`. This is the single list that keeps the
SRS honest without rewriting it. Each entry is a *decision*, not an accident.

| # | SRS expectation | As-built | Decision & rationale |
|---|---|---|---|
| D1 | pgvector for content embeddings | Gemini embeddings computed on the fly, token-similarity fallback; **not persisted** | **Keep relational for MVP.** pgvector is a Phase-E optimisation; semantic ranking already works without it. |
| D2 | Neo4j multi-hop graph (Stage 2 + conflict-of-interest) | none; conflict data lives in `creator_collaboration_history` (relational) | **Defer Neo4j to Phase E.** Conflict-of-interest can be done relationally first (90-day brand-niche check) to satisfy FR-13 without a new datastore. |
| D3 | TimescaleDB follower time-series (authenticity Z-scores) | none | **Defer to Phase E.** Authenticity MVP uses the single-point engagement-vs-tier proxy; growth Z-score needs history we don't collect yet. |
| D4 | Redis score cache + quota counter | none | **Defer.** Matching is fast enough on the seeded set (<5 s, NFR-1). Add Redis when quota or latency bites. |
| D5 | Polymorphic talent (`social\|host\|ugc\|speaker\|ambassador` + extension tables) | social creators only | **Phase E.** Host vertical (US-15) is the first extension; base table is ready, extension tables are additive (NFR-4). |
| D6 | `collaboration_type` enum `paid\|booking\|gifting\|affiliate\|hybrid\|ambassador` | **two distinct taxonomies coexist** (see §3.1) | **Documented split, not a merge.** See below. |
| D7 | Email/password auth in ER diagram | Clerk RS256 JWT | **Clerk is superior** (managed, RS256, webhooks). The SRS ER diagram's `password_hash` is vestigial; `users.clerk_id` is the real identity link. |
| D8 | YouTube discovery avoids `Search.list` (100 units; SRS §4.3 #5 wants a circuit-breaker) | `/youtube/search` exists and uses `Search.list` | **Allowed for demo, flagged.** Seeding/discovery should prefer `channels?handle=` (1 unit). Add a quota guard before any automated/looped search. Tracked in `tasks-navid.md`. |
| D9 | Authenticity engine (4 signals + BanglaBERT) | not implemented | **Phase D.** Ship the engagement-vs-tier proxy first (FR-12 partial), expand signals as data allows. |
| D10 | Full Bangla UI toggle (FR-24, P0) | not implemented (no i18n library) | **Phase C.** Currency/date already BDT/Asia-Dhaka; needs an i18n layer. High rubric value (localization), keep on the demo cut-line. |
| D11 | Escrow + per-type fee (FR-18/19, US-16) | fee % defined per `contract_type` on Contract entity; no real ledger | **Phase D, simulated.** Fee locked at contract creation (content_collaboration=15%, product_seeding=10%, talent_engagement=18%); displayed as escrow simulation. No real bKash/Nagad in the hackathon window. |
| D12 | `campaign_type` on Campaign (FR-6/7) | `contract_type` on Contract entity; `campaigns.campaign_type` **DEPRECATED** (nullable, no new writes) | **Contract as first-class entity.** Engagement type (Content Collaboration / Product Seeding / Talent Engagement) now lives on `Contract`, not `Campaign`. Campaign is type-agnostic with a `visibility` flag (public/private). `campaign_type` column kept nullable for backward compat — safe to DROP once all references are confirmed gone. See `docs/srs-revisions.md` for full change request. |

### 3.1 Type taxonomies — three systems, do not merge

The codebase has **three** type systems serving different concerns:

- **`contracts.contract_type`** *(engagement type — what a bilateral deal IS)* — introduced by D12.
  Three values: `content_collaboration`, `product_seeding`, `talent_engagement`. Lives on the
  `Contract` entity. Drives clause configuration, platform fee, and state machine semantics.
  **Do not write new `campaign_type` values — use `contract_type` instead.**
- **`campaigns.campaign_type`** *(DEPRECATED — brand demand intent)*: `paid_content`,
  `product_gifting`, `affiliate`, `brand_ambassador`, `talent_booking`, `ugc_only`. Column is now
  nullable with no default. Kept for backward compat only; will be DROPped once the final reference
  (`lib/campaignFees.ts`) is either removed or migrated.
  To find remaining references: `grep -r "campaign_type" backend/ frontend/`
- **`collaboration_type`** *(creator supply side — what deals a creator ACCEPTS)*:
  `sponsored_post`, `product_review`, `brand_ambassador`, `affiliate`, `gifted_product`,
  `event_coverage`, `other`. Used by `creator_profiles.preferred_collaboration_types` and
  `creator_collaboration_history`. Separate from the other two — do not merge.

---

## 4. Implementation roadmap (phased, demo-first)

Sequencing follows the SRS rule: **make it presentable first, then make it win** (SRS §8.2).
Phases are ordered by demo leverage, not by datastore. Each phase lists the SRS user stories /
FRs it satisfies and its current status.

**Status legend:** `[x]` done · `[~]` partial · `[ ]` not started.

### Phase A — Identity, profiles, onboarding *(SRS US-1, US-2; FR-1…FR-5)* — **[x] mostly done**
- `[x]` Clerk auth, role selection (brand/talent), backend JWT validation, webhook sync
- `[x]` Multi-step onboarding (brand + creator), dashboard layouts
- `[x]` Creator profile + manual social-profile CRUD, niches, languages, rate cards, portfolio
- `[~]` FR-3 "submit YouTube Channel ID → fetch public stats": the wrapper exists (`/youtube/channels/enrichment`); **persisting it onto the profile is the open item** (Phase D, Navid)
- `[x]` FR-5 profile-strength meter — 9-item weighted checklist (photo/bio/tagline/city/niche/language/social/stats/rate card), 0–100 score, four levels (Starter→Rising→Pro→Elite), shown in creator dashboard sidebar with actionable next-step tips

### Phase B — Brand campaign system *(SRS US-5, US-10; FR-6, FR-7, FR-14, FR-15)* — **[x] done (Sakib)**
- `[x]` 4-step campaign wizard UI: Type → Requirements → Budget/Timeline → Brief/KPIs (steps render correctly)
- `[x]` `campaign_type`, `kpi_targets`, `hashtags`, `tracking_notes` — SQLAlchemy model, Pydantic schemas (`CampaignCreate`/`CampaignUpdate`/`CampaignOut`), and service layer all updated; values round-trip correctly through the API
- `[x]` `CampaignTypeBadge` component; type column in campaign list
- `[x]` Kanban (Invited → Needs Review → Shortlisted → Accepted) with clickable cards
- `[x]` `ApplicationDrawer` imported and wired in `CampaignDetailClient.tsx`; opens on card click; Shortlist/Accept/Reject controls + rejection reason textarea fully reachable; status changes update Kanban optimistically via `localApplications` state
- `[x]` Active Contracts tab wired to `localApplications.filter(a => a.status === 'accepted' || a.status === 'completed')`; Sent Invitations tab wired to `initiated_by === 'brand'`
- `[x]` Edit form parity with the wizard (`campaigns/[id]/edit`) — "Campaign Type & Goals" card with campaign_type, hashtags, tracking_notes, KPI grid added (A11)
- `[ ]` FR-15 explicit state machine with timestamped audit-trail transitions (currently status-field only)

### Phase C — Matching transparency + localization *(SRS US-6, US-7, US-8, US-9; FR-9…FR-11, FR-24)* — **[~] partial**
- `[x]` `POST /campaigns/{id}/run-matching` + `GET /campaigns/{id}/matches`, persisted to `ai_match_scores`
- `[x]` Pure deterministic scorer (`services/matching.py`): niche .30 / engagement .20 / budget .20 / platform .15 / language .10 / recency .05
- `[x]` Sub-score breakdown UI: all six sub-scores now persisted (`score_niche`, `score_engagement`, `score_budget`, `score_language`, `score_platform`, `score_recency`) + `score_semantic` in `ai_match_scores` (migration 0014); `MatchesClient` renders Platform Fit, Recency, and Semantic Similarity bars alongside the original four
- `[~]` Rationale is heuristic; Gemini path is optional — formalize a bounded LLM rationale (FR-9)
- `[~]` Live discovery grid + profile drawer (matches page + creator detail exist; live-filter URL grid partial)
- `[ ]` **FR-24 full Bangla UI toggle** (D10) — add i18n, translate core flows

### Phase D — Differentiators: trust, real data, fees *(SRS US-3, US-4, US-11, US-12, US-16, US-19, US-20)* — **[~] partial**
- `[~]` US-20 ROI summary: brand-dashboard ROI cards done (Sakib C01); per-campaign Day-7/14/30 snapshots pending (C02, blocked on Navid N01/N02)
- `[x]` C03 Creator performance comparison — table in Active Contracts tab comparing accepted creators by niche, followers, proposed vs agreed rate (with savings diff), deliverables, and status; sorted by agreed rate; shown only when 2+ creators accepted
- `[x]` Budget & ROI Calculator — `/brand/dashboard/campaigns/roi-calculator`; pure client widget; per-tier (nano/micro/macro/mega) reach, engagements, conversions, revenue, ROI % — zero API calls (Sakib D03)
- `[x]` Rate Card Benchmark — `/brand/dashboard/campaigns/rate-benchmark`; Server Component fetches `/creators/?limit=200`, groups by `platform||deliverable_type||tier`, computes median/min/max; filterable client table (Sakib D04)
- `[x]` Creator Comparison Tool — `/brand/dashboard/creators/compare`; reads `?ids=` param, fetches up to 3 creators in parallel; side-by-side stat grid (Rating, Collaborations, Available, Platforms, Min Rate, Rate Cards, Niches) + AI brief placeholder pending N05; selection UI with checkbox overlay + sticky compare bar on Find Creators page (Sakib D05)
- `[ ]` US-2/US-3/US-4 **persist YouTube enrichment** → `creator_social_profiles`; seed 18–20 real BD channels via `channels?handle=`; normalize niche/language/tier at ingestion (Navid, Phase D core)
- `[ ]` US-11/FR-12 Authenticity/Trust Score (engagement-vs-tier proxy first; expand signals)
- `[~]` US-12 five-stage gated pipeline: hard filter + weighted score + optional semantic exist; **formalize the funnel** (Stage labels, top-N gating) and document which stages are active
- `[x]` US-16/FR-19 simulated per-type fee compute + display — `lib/campaignFees.ts` maps each `campaign_type` to a fee %; campaign list shows fee % column; campaign detail shows 3-cell breakdown (Budget / Platform Fee / Net to Creator) with "Simulated · No real payment" badge
- `[x]` US-19 ethical-AI safeguards: `EstimatedTag` component (3 variants: self-reported/estimated/ai-scored, each with tooltip explanation) applied to engagement rate and avg views on creator cards and profile, and to Overall Match + Engagement Strength on match cards
- `[ ]` US-14/FR-8 AI Brief Generator (Gemini → pre-filled wizard; coordinate with Navid N05)

### Phase E — Optional heavy layers *(SRS US-13, US-15; FR-13, FR-17; NFR-3/4)* — **[ ] deferred by design (D1–D5)**
- `[ ]` Neo4j graph + conflict-of-interest (FR-13) — *or* relational 90-day conflict check as a lighter first cut
- `[ ]` pgvector persistence for embeddings (D1)
- `[ ]` TimescaleDB follower history → authenticity growth Z-score (D3)
- `[ ]` Redis score cache + YouTube quota manager / `Search.list` circuit-breaker (D4, D8)
- `[ ]` Polymorphic talent + event-host availability matching (D5, US-15, FR-17)
- `[ ]` Vitality signals: Trending/Spotlight/Activity feed (US-18); creator earnings + rate-card benchmark (US-17)

### Demo-readiness cut-line (SRS §8.4 discipline)
Protect Phases A–C (the working happy path) above everything. If time slips, drop the
lowest-leverage Phase-D/E item rather than compromising the core. One flow that works perfectly
beats five half-built ones (top-10 mistake #7).

---

## 5. Rubric traceability (why each phase earns points)

| BuildFest criterion | Weight | Where this plan earns it |
|---|---|---|
| Innovation | 20% | Opt-in data model + AI matching (Phase C), authenticity (Phase D), talent repositioning (Phase E) |
| Technical Execution | 20% | Deterministic-math-then-LLM pipeline (Phase C/D), Tier-0 YouTube ingestion (Phase D), additive-layer architecture (§2.1, §3) |
| Business Model (+Global) | 20% | Six `campaign_type` models + fee logic (Phase B/D), ROI (Phase D), SE-Asia-ready relational core |
| Real-World Impact (+Ethical) | 20% | Trust score + ethical-AI tags (Phase D), transparent sub-scores (Phase C, FR-10/NFR-13) |
| Scalability (+NRB) | 10% | Modular monolith, additive layers (Phase E), no premature infra |
| Presentation | 10% | Presentable-first sequencing, explainable scores, three SRS diagrams (`srs.md` §9) |

---

## 6. Operating rules for contributors

1. **Schema first.** Before altering any model, read `docs/schema.md`; after a substantial change,
   update it (and this plan if a phase status moves).
2. **Services hold logic.** Routers parse and return Pydantic only; no cross-domain imports in routers.
3. **Two API URLs, never mixed.** `BACKEND_API_URL` (server) vs `NEXT_PUBLIC_API_URL` (browser);
   always call through `fetchApi()`.
4. **Platform-agnostic matching.** No `if platform == "youtube"` in `matching.py` or routers —
   platform behavior lives in the platform service (`app/youtube/`, future `app/instagram/`).
5. **Record divergences.** New shortcut from the SRS → add a row to §3, don't silently rewrite §1–2 of the SRS.
6. **Keep the graph fresh.** After code changes run `graphify update .` (AST-only, no API cost).

---

*Cohesiq — Build Locally. Connect Nationally. Scale Globally.*
*This plan reconciles `srs.md` (vision) with the live codebase (reality). When the two move, update §3 and §4 here first.*
