# Cohesiq — Executive Summary

> **Audience:** Investors, mentors, and judges · BuildFest 2026 MarTech Track
> **Status:** Fully operational in Docker Compose (Next.js 16 frontend · FastAPI backend · PostgreSQL 16)
> **Last updated:** 2026-06-10

---

## 1. Overview

Cohesiq is a two-sided B2B influencer-matching marketplace built for Bangladesh — think Upwork, but for branded creator collaborations. Brands post campaigns with BDT budgets and receive an **explainable, AI-ranked shortlist** of creators; creators build profiles enriched with **verified public YouTube data** and receive, negotiate, and contract deals in one place. The entire workflow — discovery → AI matching → offer → negotiation → contract → review — runs end-to-end today on a relational, BDT-native platform.

---

## 2. The problem & why now

Bangladesh's influencer economy is growing fast: roughly **$30.4M today, projected to $45.3M**, with **500K+ active creators**. Yet the market still runs on WhatsApp DMs and spreadsheets. The pain is sharpest for small-to-mid businesses (SMBs):

- **Manual discovery** — brands find creators by scrolling DMs and asking around; there is no structured search.
- **Bot-inflated vanity metrics** — follower and engagement counts are gamed; ~half of accounts globally show artificial inflation, and brands have no way to verify.
- **Mismatched economics** — SMBs have hard BDT ceilings but no way to match budget to the right creator tier.
- **No BDT-native infrastructure** — global tools price in USD, exclude Bangladesh, and ignore the local nano/micro creator structure.

The result: wasted spend, slow deals, and a trust gap on both sides. The market is now large enough — and the AI tooling cheap enough — to build trusted, structured infrastructure for it.

---

## 3. The solution

A **two-sided B2B marketplace** with three pillars:

- **Brands (buyers)** post campaigns (with AI brief analysis from voice or PDF), get a ranked match list with a transparent score breakdown, and run the full collaboration lifecycle from one dashboard.
- **Creators (supply)** build profiles linked to their real YouTube channels (API-verified, not self-reported), then receive, negotiate, and track branded deals.
- **The engine in the middle** is an **explainable AI matching system** plus a **structured offer → negotiation → contract** workflow that protects both sides.

Cohesiq operates in BDT, is built around the Bangladeshi creator tier structure, and uses real public data to verify creators rather than trusting self-reported numbers.

---

## 4. How the AI matching engine works (the moat)

The engine is **deterministic-math-first and explainable** — not a black-box model. This is a deliberate strength: it never hallucinates budgets, niches, or scores.

```
Stage 1 — Hard filters: budget ceiling, platform availability
Stage 2 — 6-factor weighted score (every sub-score shown to the brand):
            niche 0.45 · budget 0.20 · platform 0.15 · engagement 0.10 · language 0.08 · recency 0.02
Stage 3 — Semantic rescue (Gemini text-embedding-004): fires only when the niche
            score is 0; capped at 0.40 so it can never override a real mismatch
Stage 4 — LLM rationale (top candidates only): Groq llama-3.1-8b-instant →
            Gemini 1.5-flash fallback → deterministic fallback. Prose only — the
            number always comes from the math
```

**Weight rationale for Bangladesh:** niche is weighted highest (0.45) because category fit matters more than raw reach at the micro tier; budget (0.20) reflects hard SMB BDT ceilings; engagement is held low (0.10) because it is a noisy proxy for micro creators. All weights and thresholds live in one file (`matching_config.py`) so they can be tuned without code changes. Scores are persisted per campaign × creator pair, so rankings are auditable and reproducible.

LLM embeddings are used live for the semantic rescue but are **not persisted** — vector storage is a deliberate Phase-E layer, not a gap.

---

## 5. Business model

Cohesiq takes a **per-contract platform fee** that scales with the value and volume of collaborations — classic take-rate marketplace economics. The fee varies by engagement type, with higher-risk types carrying a higher rate:

| Engagement type | What it is | Platform fee |
|---|---|---|
| **Content collaboration** | Creator produces and publishes branded content | **15%** |
| **Product seeding** | Brand sends a product; creator reviews / features it | **10%** |
| **Talent engagement** | Creator hosts or appears at a live brand event | **18%** |

The fee is locked at contract creation (brands cannot change it after the fact). Brands pay; creators receive net-of-fee. **Escrow is currently simulated** — the take-rate logic and fee-locking are fully built; the real bKash/Nagad payment rail is on the roadmap.

---

## 6. Market positioning & differentiators

| | Global tools (GRIN, Aspire, Modash, Collabstr) | **Cohesiq** |
|---|---|---|
| Currency / market | USD, Western-centric; Bangladesh unsupported or limited | **BDT-native, Bangladesh-first** |
| Pricing | $299–$2,000+/mo SaaS subscriptions | Commission-based take rate |
| Discovery | Directory + filters, or enterprise CRM | **Explainable 6-factor AI matching** |
| Data trust | Self-reported or third-party estimates | **API-verified YouTube data + ethical-AI disclosure tags** |
| Transacting | External / manual | **Built-in offer → negotiation → contract state machine** |
| Brand safety | Limited | **Conflict-of-interest check** (90-day competitor lookback) |

Global platforms are enterprise SaaS built for large Western brands with dedicated influencer teams. Cohesiq targets the underserved high-volume segment — **small-to-mid brands paired with nano-to-mid creators** — that those tools price out and ignore. The matching engine is the moat; structured discovery is the bottleneck this segment faces.

---

## 7. Current state (honest)

### Built & working today

- **Auth & onboarding** — Clerk RS256 JWT auth, role-based redirect, dual brand/creator onboarding
- **Campaign creation** — 4-step wizard with **voice** (Groq Whisper large-v3-turbo) and **PDF** ingestion
- **AI brief analysis** — Groq llama-3.1-8b-instant (→ Gemini 2.0-flash fallback) pre-fills the wizard
- **AI matching** — 6-factor weighted score + semantic rescue, sub-scores persisted and shown as a breakdown
- **Offer & negotiation** — structured offer/counter turns with conversation polling
- **Contract lifecycle** — 3 engagement types, multi-state machine, configurable clauses, fee breakdown, audit timestamps
- **Admin panel** — users, campaigns, and reviews management
- **YouTube enrichment** — stateless public-API read wrapper; **67 real BD channels** seeded with verified stats and portfolio items
- **Conflict-of-interest check** — flags recent competitor collaborations (90-day lookback)
- **Decision tools** — ROI calculator, rate benchmark, creator comparison
- **Ethical-AI disclosure tags** — every metric labeled self-reported / API-verified / AI-estimated
- **Design system** — token-based, dark mode, shadcn/ui bridge

### Deferred / roadmap (decided, not missing)

| Item | Reason | Phase |
|---|---|---|
| Real bKash/Nagad escrow | Fee logic + locking simulated correctly; rail not needed for the demo | E |
| Full Bangla UI toggle | i18n not integrated; currency/dates already BDT/Dhaka | D |
| pgvector / Neo4j / Redis / TimescaleDB | Relational MVP sufficient at demo scale; additive layers | E |
| Authenticity trust score | Engagement-vs-tier **proxy** ships first; comment-level scoring later | D |
| Per-campaign engagement snapshots | UI uses estimates today; dedicated metric table pending | D |

---

## 8. Key metrics (KPIs)

**North-star: GMV facilitated (BDT)** — total collaboration value transacted on the platform; take-rate revenue scales directly with it.

| KPI | What it measures |
|---|---|
| Match-to-shortlist rate | % of AI matches a brand actually shortlists — engine quality |
| Brief-to-booking conversion | % of campaigns that reach a signed contract — funnel health |
| Time-to-first-match | Speed from campaign launch to first ranked shortlist — core value prop |
| Take rate | Blended platform fee across engagement types — revenue efficiency |
| Authenticity coverage | % of active creators with API-verified data — trust depth |

---

## 9. Tech & scalability

A decoupled, modern, container-first stack:

```
Browser
  ↓ HTTPS :3000
Next.js 16 App Router (React 19 · Tailwind v4 · shadcn/ui · Clerk SDK)
  ↓ BACKEND_API_URL (Docker-internal)  — Server Components / Server Actions
  ↓ NEXT_PUBLIC_API_URL (browser)      — Client Components
FastAPI (Python 3.12 · SQLAlchemy 2.0 Async) — Domain-Driven Design
  ↓
PostgreSQL 16 (single relational store · Alembic migrations, head 0022)
  ↓ (external)
Clerk (RS256 JWT + webhooks) · Groq (llama-3.1-8b-instant, Whisper large-v3-turbo)
Gemini (1.5-flash, 2.0-flash, text-embedding-004) · YouTube Data API v3
```

- **Backend DDD** — `auth` · `brands` · `creators` · `campaigns`, each owning `models/schemas/router/service`; routers parse only, all logic in services; cross-domain logic isolated in `services/` (matching, semantic match, LLM rationale).
- **Frontend** — strict Server Component → Client Island pattern, URL-driven filtering, two-variable API URL contract.
- **Scaling path** — the relational MVP is deliberately complete on its own; Phase-E layers (pgvector for persisted semantic search, Neo4j for multi-hop conflict checks, Redis for caching/quota, TimescaleDB for growth Z-scores) are **modular additive layers**, not rewrites — proving a credible path from hackathon scale to production.
- **Development** — built with graphify and context7 MCP servers for graph-grounded, docs-current engineering.

Everything runs in Docker Compose (`postgres`, `backend`, `frontend`). No Neo4j/Redis/TimescaleDB in the current build by design.
