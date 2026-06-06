# Cohesiq — Executive Summary

> **Prepared for:** Internal team alignment + two external meetings (2026-06-08)
> **Platform status:** Fully operational in Docker Compose · BuildFest 2026 MarTech Track

---

## Current State — Team Alignment

Before the meetings, everyone should be aligned on exactly what is live and what is not.

### What is built and working today

- Brand + creator onboarding, Clerk auth, role routing
- Creator profile: niches, languages, rate cards, portfolio
- Profile-strength meter (9-item, 0–100, 4 tiers)
- 4-step campaign creation wizard + edit form
- Campaign Kanban (Invited → Needs Review → Shortlisted → Accepted)
- Application drawer: shortlist / accept / reject + rejection reason
- **Full contract lifecycle** (3 types, 6-state machine, clauses, fee breakdown)
- Brand contract management (ContractCard + state actions)
- Creator contracts page (submit draft, publish URL, view status)
- AI Brief Analyzer (Groq primary → Gemini 2.0 Flash fallback)
- ROI calculator, rate benchmark, creator comparison tools
- Ethical-AI disclosure tags (self-reported / estimated / AI-scored)
- 6-signal deterministic matching engine
- Matching weights tuned for BD market (niche .35, budget .30)
- YouTube Data API v3 Tier-0 wrapper + persistence layer
- Niche classification (Groq + YouTube topic categories fallback)
- 19 real BD YouTube channels seeded + 190 portfolio items
- Semantic rescue via Gemini text-embedding-004
- Sub-score breakdown UI (6 bars + semantic similarity bar)
- Design system (token-based, dark mode, shadcn/ui bridge)

### What is explicitly deferred (not missing — decided)

| Item | Reason | When |
|---|---|---|
| pgvector / Neo4j / Redis / TimescaleDB | Relational MVP sufficient for demo scale | Phase E |
| Real BDT escrow (bKash/Nagad) | Simulated correctly; payment rail not needed for BuildFest | Phase E |
| Full Bangla UI toggle | i18n library not integrated; currency/dates are BDT/Dhaka | Phase D |
| Authenticity trust score (BanglaBERT) | Engagement-vs-tier proxy ships first | Phase D |
| Per-campaign real engagement snapshots | C02 UI done with estimates; DB table (N10) pending | Phase D |

---

## Business Value & Market Opportunity

### The problem

Bangladesh's influencer economy is projected to reach **$45.3 million by 2028**, but it operates through WhatsApp DMs and spreadsheets. Brands cannot find the right creators. Creators have no professional way to receive, negotiate, or track brand deals. Fraud is rampant — 49% of Instagram accounts exhibit artificial inflation globally. There is no trusted infrastructure.

### Market structure — how deals happen by segment

The influencer market operates differently depending on brand size and creator tier:

| | Small Brand | Mid Brand | Large Brand |
|---|---|---|---|
| **Nano/Micro creator** | Inbound-heavy | Inbound + product seeding | Open calls / platforms |
| **Mid-tier creator** | Outbound (brand hustles) | Mix | Mix |
| **Macro/Celebrity** | Rarely accessible | Outbound via agency | Agency-to-agency |

> *Inbound — creator discovers the brand's campaign and applies. Outbound — brand identifies and contacts the creator directly.*

The large-brand and macro-creator segment is a relationship and agency business by nature. The high-growth opportunity lies in the small-to-mid brand paired with nano-to-mid-tier creator — high in volume, underserved by existing tools, and directly dependent on structured discovery and a trusted way to transact.

### Where Cohesiq serves

| | Small Brand | Mid Brand | Large Brand |
|---|---|---|---|
| **Nano/Micro** | **Cohesiq** | **Cohesiq** | **Cohesiq** |
| **Mid-tier** | **Cohesiq** | **Cohesiq** | edges |
| **Macro/Celebrity** | out of scope | out of scope | out of scope |

**Primary ICP:** small-to-mid brands that lack a dedicated influencer team, paired with nano-to-mid-tier creators who lack management. Both sides share the same problem — no efficient way to find each other. The matching engine is the moat; discovery is the bottleneck this segment faces.

### Competitive landscape

| Platform | Pricing | Bangladesh | Positioning |
|---|---|---|---|
| GRIN / Aspire | $999–$2,000+/mo | Not supported | Enterprise SaaS built for global brands with large influencer teams |
| Collabstr / Modash | Free–$299/mo | Limited | Self-serve discovery tools; analytics and payments require upgrades |
| HypeScout (BD) | BDT-priced | Yes | Established local player; directory-based without AI matching or contract infrastructure |
| **Cohesiq** | Commission-based · BDT-native | Yes | AI-ranked matching + verified creator data + end-to-end contract lifecycle |

### What Cohesiq is

Cohesiq is a **two-sided B2B marketplace** — like Upwork, but for influencer marketing in Bangladesh.

- **Brands (the buyers):** post campaigns with BDT budgets, receive AI-ranked creator matches, manage the full collaboration lifecycle from one dashboard
- **Creators (the supply):** build verified profiles linked to their YouTube channels, receive and negotiate branded deals, track their active contracts

The platform operates in BDT, is built around the Bangladeshi creator ecosystem, and uses real public data from YouTube to verify creator metrics rather than relying on self-reported follower counts.

### The collaboration lifecycle

Cohesiq supports the full collaboration journey from discovery to payment. The platform accommodates both initiation directions — a brand can discover and invite a creator, or a creator can apply to a public campaign.

| Phase | What happens | How Cohesiq supports it |
|---|---|---|
| **Discovery** | Brand searches and filters creators by niche, tier, platform, and budget | Marketplace browse + AI-ranked matching across 6 signals |
| **Vetting** | Brand reviews creator profile, verified stats, portfolio, and past reviews | Creator profile with API-verified YouTube data and ethical-AI data labels |
| **Outreach / Application** | Brand invites a creator directly, or creator applies to a public campaign | Campaign visibility model (public / private) + application flow |
| **Negotiation** | Rate, deliverables, and timeline are proposed and agreed | Application with proposed rate → accepted rate |
| **Contract creation** | Contract type chosen, clauses configured, platform fee locked | Contract entity (type + clause set + fee breakdown) |
| **Escrow** | Payment held by the platform at contract activation | Simulated escrow locked at contract creation |
| **Content production** | Creator produces the agreed content | — |
| **Review & approval** | Brand reviews the draft; revisions tracked and capped by contract | Draft submission + revision rounds (limit enforced by revision clause) |
| **Publishing** | Creator posts publicly with required disclosure | Live URL recorded on contract |
| **Verification** | Brand confirms the post is live and meets the brief | Deliverable checklist against contract terms |
| **Payment release** | Escrow released to creator on contract close | Automated on brand approval |
| **Reviews** | Both parties rate and review each other | Bidirectional review model; ratings roll up to profiles |

Every phase in this table is built, functional, and demonstrable in the live platform.

### Three contract types

| Type | What it is | Platform fee |
|---|---|---|
| **Content Collaboration** | Creator produces and publishes branded content on their channels | 15% |
| **Product Seeding** | Brand sends a product; creator reviews or features it | 10% |
| **Talent Engagement** | Creator appears at or hosts a live brand event | 18% |

Contracts protect both parties: payment is locked at creation (brands cannot change it after the fact), revision rounds are capped (creators cannot be asked for unlimited changes), and every state transition is timestamped.

### Business model in one line

Cohesiq charges a percentage of the agreed collaboration fee. Higher-risk engagement types (talent booking) carry a higher fee. Brands pay; creators receive net-of-fee. Revenue scales directly with the volume and value of collaborations on the platform.

### What differentiates Cohesiq

| Feature | Why it matters |
|---|---|
| BDT-native, Bangladesh-first | No currency conversion friction; built for the local creator tier structure |
| AI matching (6 signals) | Not a directory — creators are ranked by fit, not by follower count |
| Verified YouTube data | Public API stats overwrite self-reported numbers; profiles are flagged as verified |
| Ethical-AI disclosure | Every metric is tagged: self-reported / API-verified / AI-estimated. No hidden scoring |
| Contract state machine | Legally structured agreements with clause configuration and audit trail — not a handshake deal |
| Simulated escrow | Payment protection concept demonstrated; ready for bKash/Nagad integration |

---

## Technical Architecture & System Design

### System overview

```
Browser
  ↓ HTTPS :3000
Next.js 16 App Router (React 19 · Tailwind v4 · shadcn/ui · Clerk SDK)
  ↓ BACKEND_API_URL (Docker-internal) — Server Components / Server Actions
  ↓ NEXT_PUBLIC_API_URL (browser) — Client Components
FastAPI (Python 3.12 · SQLAlchemy 2.0 Async)
  ↓
PostgreSQL 16 (single relational store · 17 Alembic migrations)
  ↓ (external)
Clerk (RS256 JWT auth + webhooks)
Groq API (LLaMA-3.1-8b-instant — primary generative model)
Gemini API (text-embedding-004 embeddings · 1.5 Flash fallback · 2.0 Flash brief fallback)
YouTube Data API v3 (Tier-0 public read · ~3 quota units per creator enrichment)
Tavily Search API (seeding pipeline only — Operator-triggered)
```

Everything runs in Docker Compose: `postgres`, `backend`, `frontend`. No Neo4j, Redis, or TimescaleDB in the current build — those are Phase E additions that the relational MVP does not need at hackathon scale.

### Backend — Domain-Driven Design

`backend/app/` follows strict DDD. Five domains: `auth/` · `brands/` · `creators/` · `campaigns/` · `youtube/`. Each domain owns `models.py`, `schemas.py`, `router.py`, `service.py`. Routers parse requests and return Pydantic responses only — all logic in services. No cross-domain imports in routers.

Cross-domain logic lives in `services/`: `matching.py` · `matching_config.py` · `semantic_match.py` · `llm_matching.py`.

`app/youtube/` is a **stateless public-API read client** (no DB writes). Creator profile persistence flows through `creators/normalization.py` → `POST /creators/{id}/platforms/youtube/enrich`.

### AI / ML layer

**Matching engine (deterministic-first):**

```
Stage 1 — Hard filters: budget ceiling, platform availability
Stage 2 — 6-signal weighted score:
           niche .35 · budget .30 · platform .15 · engagement .10 · language .08 · recency .02
Stage 3 — Semantic rescue (Gemini text-embedding-004):
           fires only when niche score = 0; score capped to prevent override of hard mismatches
Stage 4 — LLM rationale (top-N candidates only):
           Groq LLaMA-3.1-8b-instant (primary) → Gemini 1.5 Flash (fallback) → heuristic
All weights and thresholds externalised to matching_config.py
```

Weight rationale for Bangladesh: budget raised to .30 (SMEs have hard BDT ceilings), niche raised to .35 (category fit matters more than reach at micro tier), engagement lowered to .10 (noisy proxy for micro creators).

**YouTube enrichment pipeline:**

```
POST /creators/{id}/platforms/youtube/enrich
  → youtube/service.get_channel_enrichment (Channels.list + PlaylistItems.list + Videos.list · ~3 units)
  → creators/normalization.py:
      · YOUTUBE_CATEGORY_MAP (deterministic niche from topic URLs)
      · Groq LLaMA-3.1-8b-instant (optional niche from channel/video descriptions)
      · Bangla/English/Banglish heuristic (language detection)
      · city normalization
  → creator_social_profiles UPSERT (is_api_verified=true, data_source="verified")
  → creator_portfolio_items UPSERT (recent videos — drives recency scoring)
```

**Brief analyzer (Server Action):**
```
analyzeBriefAction (analyze-brief.ts)
  → Groq LLaMA-3.1-8b-instant (structured JSON: visibility, niche, budget, hashtags, KPIs)
  → Gemini 2.0 Flash (fallback)
  → pre-fills campaign wizard; brand edits before submit
```

### Data model highlights

17 Alembic migrations (`0001`→`0017`). Key tables:

| Table | Purpose |
|---|---|
| `users` | Clerk identity bridge (`clerk_id` → internal `user_id`) |
| `creator_profiles` | Core creator entity + profile-strength fields |
| `creator_social_profiles` | One row per platform · `is_api_verified` / `api_channel_id` / `data_source` (self_reported / verified / estimated) |
| `creator_portfolio_items` | Recent YouTube videos imported during enrichment · drives recency scoring |
| `campaigns` | Brand demand: brief, budget, niche/platform/language targets, KPI targets, visibility |
| `campaign_applications` | Creator proposals + brand invitations · status state machine |
| `contracts` | **First-class entity** (migration 0015): type, clauses, 6-state machine, fee, audit timestamps |
| `ai_match_scores` | 6 sub-scores + `score_semantic` persisted per campaign × creator pair (migration 0014) |
| `reviews` | Post-contract star ratings; average rolled up to creator/brand profiles |

### Build decisions worth noting

| Decision | Rationale |
|---|---|
| Groq as primary LLM (not Gemini) | Lower latency, structured JSON output, more reliable for deterministic matching rationale at hackathon quotas |
| Relational-only (no pgvector/Neo4j) | MVP scale doesn't need vector persistence or graph traversal; semantic matching works on-the-fly via Gemini embeddings |
| Clerk for auth | RS256 JWT with JWKS validation, managed webhooks, role-based redirect — superior to rolling email/password for a 4-day build |
| Contract as first-class entity | Original SRS had collaboration type on Campaign; extracted to Contract entity to support per-clause configuration, fee locking, and state machine audit trail — a correct architectural decision, documented in Divergence Ledger D12 |
| Weights externalised to `matching_config.py` | Allows tuning without code changes; single source of truth for all scoring thresholds and caps |

### Frontend architecture

Next.js 16 App Router with strict **Server Component → Client Island** pattern:
- `page.tsx` is always an async Server Component (data fetching, no hooks)
- Interactive UI in `_components/PageClient.tsx` marked `"use client"`
- URL-driven filtering: client islands push `?param=value` to URL; Server Component reads `searchParams`
- Two-variable API URL contract: `BACKEND_API_URL` (Docker-internal, server only) / `NEXT_PUBLIC_API_URL` (browser only)
- Design system: CSS custom property tokens (brand colors, neutral scale, typography, spacing, shadows) exposed as Tailwind v4 utilities via `@theme inline`; shadcn/ui components wired to the token bridge

### What would be added in Phase E (post-hackathon)

pgvector for persisted semantic search · Neo4j for multi-hop conflict-of-interest checks · Redis for score caching and quota management · TimescaleDB for follower growth Z-scores · bKash/Nagad real escrow integration · BanglaBERT comment authenticity scoring · full Bangla UI i18n
