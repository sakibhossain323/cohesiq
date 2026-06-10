# Cohesiq — Software Requirements Specification (SRS)

**Bangladesh's Creator & Talent Marketplace, powered by AI**

The Infinity AI BuildFest 2026 · MarTech Track · Influencer Matching Engine Challenge
Version 2.0 · Revised June 2026

---

## How to read this document

This is the IEEE-style Software Requirements Specification for Cohesiq. It states **what the system must do** and **how well it must do it**, reconciled against the **real, shipped codebase** (code is the source of truth). It deliberately contains **no user stories, no persona prose, and no diagrams** — those live in dedicated, cross-referenced files so each artefact has a single home:

| Concern | Lives in |
|---|---|
| User stories (INVEST) | [`docs/user-stories.md`](user-stories.md) |
| Personas (demand / supply / internal) | [`docs/personas.md`](personas.md) |
| Use-case diagram | [`docs/diagrams/use-case.md`](diagrams/use-case.md) |
| Entity-relationship diagram | [`docs/diagrams/erd.md`](diagrams/erd.md) |
| Data-flow diagram | [`docs/diagrams/dfd.md`](diagrams/dfd.md) |
| Architecture diagram | [`docs/diagrams/architecture.md`](diagrams/architecture.md) |
| Code-true relational schema | [`docs/schema.md`](schema.md) |
| Implementation status & divergence ledger | [`docs/plan.md`](plan.md) |

Document structure: **§1 Introduction & Scope** → **§2 Overall Description** (segments, data, AI, KPIs) → **§3 Functional Requirements** → **§4 Non-Functional Requirements** → **§5 References**.

> **Reality-check policy.** Where this SRS once described aspirational infrastructure (pgvector, Neo4j, TimescaleDB, Redis), it has been corrected to the relational-only PostgreSQL 16 build that actually ships; those four stores are marked **DEFERRED (Phase E)**. Where competition prose claimed features that are only simulated (escrow, full Bangla UI, authenticity trust score), this is stated honestly. See `docs/plan.md` §3 Divergence Ledger.

---

# 1. Introduction & Scope

## 1.1 Purpose

Cohesiq is a B2B influencer-matching platform that connects Bangladeshi brands / SMEs with content creators and other talent for marketing engagements. It replaces the manual, unverifiable, trust-deficient deal-making that dominates Bangladesh's brand–talent economy today with a structured, AI-assisted, BDT-native marketplace covering the full lifecycle: discover → match → negotiate → contract → deliver → review.

## 1.2 Problem context

A Bangladeshi SME running a creator campaign today must manually search Facebook/Instagram, DM 20–30 creators to gauge interest, negotiate price over WhatsApp with no market benchmark, trust unverified follower counts (≈49% of Instagram accounts globally show follower fraud), pay over bKash with no contract or delivery guarantee, and has no way to measure outcomes. **No organised intermediary platform exists** for this market — deals run on DMs and personal connections, the exact stage Upwork solved for freelancing.

Market timing makes this urgent: the Bangladesh influencer ad market is ~$30.4M (2024) growing to a projected ~$45.3M by 2028 (Statista), with 500,000+ creators having 10K+ followers and 50M+ active social users (Financial Express BD). Whoever builds the first structured, trusted, BDT-native, Bangla-capable platform owns the default position.

## 1.3 Why AI is essential

The problem is not solvable with a flat directory. Matching is multi-dimensional (niche, budget, platform, engagement, language, recency) and requires conflict-of-interest reasoning over prior collaborations; trust must be **computed** (engagement-vs-tier benchmarking) rather than claimed; and the market is bilingual (Bangla / English / Banglish), demanding genuine NLP for niche classification and rationale generation rather than string matching.

## 1.4 Product scope

In scope (shipped):
- Two-sided marketplace: brand and creator onboarding, role selection, profiles.
- Campaign creation including **voice-driven** and **PDF-driven** brief capture with AI brief analysis.
- AI matching engine: deterministic 6-factor weighted scoring with a capped semantic rescue and LLM-personalised rationale.
- Offer-driven collaboration lifecycle: launch → shortlist → offer → multi-turn negotiation → accept → contract → deliverables → review.
- Relational conflict-of-interest check (90-day lookback).
- Admin / operator panel.
- ROI and rate-benchmark tooling; simulated platform-fee computation.

Out of scope for this version (roadmap, see §4.6 and `docs/plan.md`):
- Real payment rails (bKash/Nagad escrow) — only simulated fee computation ships.
- Full bilingual UI toggle — only LLM rationale **text** localises today.
- Vector (pgvector) and graph (Neo4j) retrieval, time-series store, Redis cache.
- Statistical authenticity / fraud trust score — an engagement-vs-tier proxy ships instead.
- LLM fine-tuning.

## 1.5 Definitions

- **Talent / Creator** — supply side; *Creator* is the social-content subset of the broader *Talent* umbrella.
- **Brand / SME** — demand side; the paying customer and revenue engine.
- **Operator** — internal trust, moderation, and admin role.
- **Campaign** — a brand's type-agnostic job posting (intent: brief, budget, requirements, visibility).
- **Contract** — a first-class bilateral agreement created after a creator is accepted; owns the engagement type, structured clauses, and execution state machine. (See `docs/revisions/srs-revisions-26-06-06.md` for the rationale behind separating Campaign intent from Contract execution.)

---

# 2. Overall Description

## 2.1 User segments (summary)

Cohesiq is a two-sided marketplace with a third internal segment. **Brands / SMEs** are the demand side and sole revenue source (micro-SMEs running BDT 5,000–30,000 campaigns, growth SMEs running multiple campaigns/month, and NRB/diaspora brands). **Creators / talent** are the supply side that must be seeded first to solve the cold start (social creators matched on niche/engagement/audience fit, plus roadmap talent types such as hosts and UGC creators). **Platform operators** handle trust, moderation, and administration. Full, self-contained persona cards — including the named personas **Rasha** (brand), **Zara** (growth brand), and **Arif** (creator) — are maintained in [`docs/personas.md`](personas.md).

## 2.2 Data strategy

**Governing principle:** assume every external API is constrained, deprecated, or compliance-gated until proven otherwise, and design around it from day one.

### 2.2.1 Opt-in / own-platform data model

Cohesiq does **not** scrape. It acquires data through three legitimate channels in priority order:

1. **Public APIs, no OAuth** — YouTube Data API v3 channel/video stats (instant, free, legal). `app/youtube/` is a **stateless public read wrapper** — it does not persist to the database.
2. **Creator self-reported at sign-up** — rate cards, platform presence, languages, niches, conflict disclosures.
3. **Creator-authorised OAuth** (roadmap) — YouTube Analytics, Instagram/Facebook Insights, unlocked only with creator consent in exchange for discoverability.

This flips data acquisition from adversarial scraping to a cooperative model where creators *want* to share to get paid — legal, verifiable, and a defensible moat.

### 2.2.2 Normalization at ingestion

The platforms encode the same facts incompatibly; a normalization layer is mandatory:
- **Geography** — YouTube returns country-level (`BD`); Meta returns unstructured city strings. A canonical city dictionary maps variants to a `location_id`; unrecognised strings go to an `unknown_location` bucket, never silently dropped.
- **Age/Gender** — stored in separate columns; Meta's combined `"F.18-24"` key is parsed at ingestion into a unified taxonomy (`under_18`, `18_24`, `25_34`, `35_44`, `45_plus`).
- **Niche/category** — YouTube topic URLs are translated to an internal taxonomy.
- **Incomplete demographics** — the unaccounted remainder is shown explicitly as "Uncategorized %", **never** redistributed (that would fabricate signal).

### 2.2.3 Storage — relational-only PostgreSQL 16 (CORRECTED)

**Cohesiq persists to relational PostgreSQL 16 only.** Earlier drafts of this SRS claimed pgvector, Neo4j, TimescaleDB, and Redis were built; that was aspirational. The corrected, code-true position:

| Store | Status | Holds / purpose |
|---|---|---|
| **PostgreSQL 16** | **BUILT** | Profiles, campaigns, applications, contracts, negotiation turns, AI match scores, deliverables, content-metric snapshots, reviews — the entire relational core. |
| pgvector (content embeddings) | **DEFERRED (Phase E)** | Semantic similarity is currently computed in-process via embedding API at request time and **not persisted**. |
| Neo4j (creator–brand graph) | **DEFERRED (Phase E)** | The conflict-of-interest check is implemented as a **relational 90-day query**, not a graph traversal. |
| TimescaleDB (follower time-series) | **DEFERRED (Phase E)** | A `live_content_metric_snapshots` table captures point-in-time metrics relationally. |
| Redis (cache / quota) | **DEFERRED (Phase E)** | No external cache; matching runs synchronously within target latency. |

The current Alembic migration head is **0022**. Tables added across the offer-driven rework include `negotiation_turns`, `ai_match_scores`, `contract_deliverables`, and `live_content_metric_snapshots`, plus campaign visibility/invitation fields and an `archived` status. See [`docs/schema.md`](schema.md) for the authoritative schema.

## 2.3 AI logic

**Guiding principle:** deterministic math decides *who matches*; the LLM only *explains why*. Hard constraints (budget, platform) are enforced mathematically before any LLM call, because a pure-LLM matcher hallucinated budget constraints in early testing.

### 2.3.1 Five-stage matching pipeline

1. **Hard SQL filter** — eliminate candidates on binary requirements (platform coverage, budget ceiling, language requirement) at near-zero cost.
2. **Relational conflict-of-interest check (CORRECTED)** — a **relational 90-day query** (`CONFLICT_LOOKBACK_DAYS = 90`) excludes creators who collaborated with a competing brand in the lookback window. **This is built — as a relational check, not a Neo4j traversal.**
3. **Deterministic niche scoring + capped semantic rescue** — niche alignment is scored deterministically; a semantic embedding similarity (threshold `0.28`) can *rescue* a borderline candidate, but the rescued niche score is capped at `0.40` (`SEMANTIC_RESCUE_NICHE_CAP`) so semantics can never override hard niche mismatch. Embeddings are computed at request time and **not persisted** (no pgvector).
4. **Six-factor weighted linear score** — the math core (weights below).
5. **Heuristic rationale + LLM personalisation** — a deterministic heuristic rationale is generated for all results; a Groq LLM personalises a 2–3 sentence explanation for the **top 5** (`LLM_RATIONALE_TOP_N = 5`). The ranked result set is capped at **10** (`TOP_MATCH_LIMIT = 10`).

### 2.3.2 Scoring weights (CORRECTED — authoritative)

`backend/app/services/matching_config.py` is the single source of truth. Earlier SRS drafts listed niche 0.35 / budget 0.30; the **shipped** weights are:

| Factor | Weight | Notes |
|---|---|---|
| Niche | **0.45** | Primary relevance driver; semantic rescue capped at 0.40. |
| Budget | **0.20** | `1.0` if rate ≤ budget; soft buffer `0.30` → graded down to a hard cap of `1.30×` budget; unknown rate scores `0.5`. |
| Platform | **0.15** | Binary coverage of required platforms. |
| Engagement | **0.10** | Engagement rate normalised vs tier benchmark (tier floor `0.5`). |
| Language | **0.08** | Bangla / English / Banglish content-language fit. |
| Recency | **0.02** | Posting recency; unknown recency scores `0.20`. |

### 2.3.3 LLM / model roles

| Task | Model | Trusted with money/constraints? |
|---|---|---|
| Match rationale (top 5 personalisation) | Groq **llama-3.1-8b-instant** | No — explains, never decides |
| Rationale fallback | Gemini **1.5-flash** | No |
| Semantic embeddings (fallback, not persisted) | Gemini **text-embedding-004** | No — similarity signal only |
| Voice brief → text | Groq **Whisper large-v3-turbo** | Output is editable before commit |
| Synthetic seed generation (build-time) | Groq llama-3.1-8b-instant | Seed only |
| Dev-time coding agent | Claude | Not in production path |

**Explainability** (a rubric requirement): every match exposes its sub-scores (niche, budget, platform, engagement, language, recency) plus the rationale — the brand sees exactly why a creator ranked where they did.

## 2.4 Key performance indicators

| Category | KPI | Definition | Target |
|---|---|---|---|
| North star | GMV facilitated (BDT) | Total value of campaigns transacted | Growth |
| Liquidity | Match-to-shortlist rate | % of AI-matched creators a brand shortlists | ≥ 40% demo / ≥ 55% mature |
| Liquidity | Time-to-first-match | Seconds from "Run Matching" to ranked results | < 5 s (target < 3 s) |
| Liquidity | Take rate | Platform fee ÷ GMV | 8–12% blended (simulated) |
| AI quality | Niche-classification accuracy | Correct primary-niche on a Bangla/Banglish test set | ≥ 85% |
| AI quality | Match-score stability | Variance on repeated identical runs | Deterministic (0 variance on math core) |
| AI quality | Rationale usefulness | Brand-rated 1–5 on explanation clarity | ≥ 4.0 |
| Trust | Authenticity coverage | % of creators with a computed engagement-vs-tier proxy | 100% of seeded creators |
| Supply | Verified creators onboarded | Seeded creators with real platform data | 67 BD YouTube channels (see §2.2 seed) |

**Seed corpus:** 67 verified Bangladesh YouTube channels + estimated IG/TikTok companion profiles + ~190 portfolio items. Estimated fields are labelled; verified fields show a check.

**Revenue model (for projections):** simulated platform fee per contract type — Content Collaboration 15%, Product Seeding 10%, Talent Engagement 18%.

---

# 3. Functional Requirements

**P0** = required for a presentable demo · **P1** = contest-strengthening · **P2** = post-contest/roadmap.
Each FR is reconciled to the shipped code. FRs are cross-referenced from [`docs/user-stories.md`](user-stories.md).

## 3.1 Identity & onboarding
- **FR-1 (P0)** Users can register and log in via Clerk and select a role (brand / creator / operator), landing in the role-appropriate workspace.
- **FR-2 (P0)** Creators create a profile with niche, platforms, rate card, languages, and bio.
- **FR-3 (P0)** Creators submit a YouTube Channel ID / handle; the platform fetches public stats via the stateless YouTube read wrapper.
- **FR-4 (P2)** Creators can OAuth-link platforms to unlock verified analytics. *(Roadmap — not shipped.)*
- **FR-5 (P1)** Profile-strength indicator shows completeness.

## 3.2 Campaign creation
- **FR-6 (P0)** Brands create a **type-agnostic** campaign via a guided wizard: brief, BDT budget, talent requirements, and **visibility** (Public / Private). No engagement-type step — type is chosen at contract creation (revised; supersedes the original six-type campaign field).
- **FR-7 (P0)** Brands set a **Public** or **Private** visibility. Public campaigns appear in the marketplace/discovery feed; Private campaigns are invitation-only.
- **FR-8 (P1)** **AI Brief Analysis** — a brand-typed (or voice/PDF-derived) natural-language description is parsed into structured campaign params (niche, demographics, format, budget range, suggested tier), brand-editable before commit.
- **FR-9 (P1)** **Voice-driven campaign creation** — brands dictate a brief; Groq Whisper large-v3-turbo transcribes it, then FR-8 structures it.
- **FR-10 (P1)** **PDF-driven campaign creation** — brands upload a brief PDF (parsed via PDF.js); content feeds FR-8.

## 3.3 Matching & discovery
- **FR-11 (P0)** "Run Matching" returns a ranked list (top 10) of creator cards with a 0–100 match score and an AI-generated rationale (top 5 LLM-personalised).
- **FR-12 (P0)** Each match exposes its sub-score breakdown (niche, budget, platform, engagement, language, recency).
- **FR-13 (P0)** Live discovery: clicking a card opens a full creator profile drawer without leaving the page; filters update the result grid.
- **FR-14 (P1)** **Conflict-of-interest exclusion** — creators who collaborated with a competing brand within the last 90 days are excluded via a **relational** check. *(Built relationally, not via Neo4j.)*
- **FR-15 (P1)** **Semantic rescue** — borderline candidates may be rescued by embedding similarity (threshold 0.28) with the niche contribution capped at 0.40; embeddings are not persisted.
- **FR-16 (P1)** **Authenticity proxy** — an engagement-vs-tier proxy is shown per creator. *(Full statistical fraud trust score is roadmap.)*

## 3.4 Application funnel & collaboration lifecycle
- **FR-17 (P0)** Brands manage the **application funnel** on a Kanban board (Applied → Needs Review → Shortlisted → Accepted). The Kanban tracks the funnel only, not execution.
- **FR-18 (P0)** Creators apply to Public campaigns with proposal text and a proposed rate; brands invite creators to Private campaigns (Sent Invitations sub-tab).
- **FR-19 (P0)** **Offer / multi-turn negotiation** — brand and creator exchange offers in a negotiation thread; the conversation polls for new turns every ~4 s (`negotiation_turns` table). Either party can accept.
- **FR-20 (P0)** Accepting a creator opens a **Contract creation** flow: the brand selects an engagement type (Content Collaboration / Product Seeding / Talent Engagement) and configures structured clauses (deliverable notes, max revision rounds, kill fee, payment structure/schedule, exclusivity, usage rights, product disposition).
- **FR-21 (P0)** **Contract execution state machine** — Active → In Production → Content Submitted → Content Approved → Published → Closed, with timestamped transitions visible in an audit trail. A `disputed` state is reachable for sad paths.
- **FR-22 (P1)** **Deliverables tracking** — contract deliverables are stored and tracked (`contract_deliverables` table); revision requests are blocked once `max_revision_rounds` is reached (HTTP 409).
- **FR-23 (P1)** Post-engagement metrics are captured as content-metric snapshots (`live_content_metric_snapshots`) for completed contracts (ROI input).
- **FR-24 (P1)** **Reviews** — on contract close both parties can leave a review.

## 3.5 Payments & trust (simulated)
- **FR-25 (P0, simulated)** Platform fee is computed and locked at contract creation by contract type (Content Collaboration 15%, Product Seeding 10%, Talent Engagement 18%); a payment breakdown (gross, fee, net to creator) is shown to both parties with a "Held in escrow (simulated)" label.
- **FR-26 (P2)** Real escrow via bKash/Nagad. *(Roadmap — only simulated fee computation ships.)*
- **FR-27 (P1)** **ROI summary** — completed contracts show reach, spend, and estimated ROI; a rate-card benchmark widget shows the creator market rate.

## 3.6 Operations & administration
- **FR-28 (P0)** **Admin panel** — operators access moderation and administration tools (user/role oversight, campaign audit visibility).
- **FR-29 (P0)** **Normalization middleware** runs at ingestion (city dictionary, age/gender decoupling, niche-URL map).
- **FR-30 (P1)** **Seeding pipeline** — 67 real BD YouTube channels + estimated IG/TikTok companions + portfolio items; estimated fields visibly tagged, verified fields show a check.
- **FR-31 (P2)** Campaign **archival** — campaigns can be moved to an `archived` status.

---

# 4. Non-Functional Requirements

## 4.1 Performance
- **NFR-1** Matching returns in **< 5 s** (target < 3 s) for a brief against the seeded creator set; matching runs synchronously (no Redis cache — roadmap).
- **NFR-2** External API reads (YouTube) do not block core interactive flows.
- **NFR-3** Negotiation threads poll every ~4 s; the UI remains responsive during polling.

## 4.2 Scalability
- **NFR-4** Modular monolith (FastAPI, DDD domains: auth, brands, creators, campaigns) with a stateless API layer, containerised via Docker, deployable to a single VM or container platform.
- **NFR-5** Architecture is currency/locale-abstracted (BDT-native) to support future South/Southeast-Asia expansion.
- **NFR-6** Vector/graph/time-series/cache layers are **deferred** but the data model is designed so they can be added without breaking the relational core (see `docs/plan.md` §3 D1–D5).

## 4.3 Reliability & data integrity
- **NFR-7** Match scoring is deterministic — identical inputs yield identical scores (0 variance on the math core).
- **NFR-8** External/estimated data is clearly distinguished from verified data; incomplete demographics are shown as explicit "Uncategorized %" and never redistributed.
- **NFR-9** Contract clauses (amount, fee) are **locked** at contract creation; payment amount cannot be edited after `active`.
- **NFR-10** Migrations are version-controlled via Alembic (head `0022`); `docs/schema.md` is kept code-true.

## 4.4 Security & compliance
- **NFR-11** Authentication via Clerk RS256 JWTs; the backend validates every request via `common.dependencies.get_current_user`.
- **NFR-12** Routers parse requests and return Pydantic responses only; all logic lives in the service layer; no cross-domain imports in routers.
- **NFR-13** API URL contract is enforced: Server Components/Actions use `BACKEND_API_URL`; Client Components use `NEXT_PUBLIC_API_URL`; all calls go through `fetchApi()`.
- **NFR-14** Lawful data usage only; creators retain ownership of their data; no scraping.

## 4.5 Ethical AI
- **NFR-15** **Transparency** — every AI match displays its sub-score breakdown plus rationale; no black-box scores.
- **NFR-16** **No fabricated data** — estimated/synthetic fields are labelled; incomplete demographics show "Uncategorized %".
- **NFR-17** **Advisory, not silent** — authenticity proxy flags are advisory and human-reviewable, not silent bans; the LLM never decides matches or money.
- **NFR-18** **Honest demos** — the demo states which data is real (67 YouTube channels) vs estimated; simulated escrow is labelled "simulated".

## 4.6 Usability & localization (roadmap-honest)
- **NFR-19** Progressive-disclosure UX — professional for brand managers, accessible for independent creators.
- **NFR-20** Built with the Cohesiq design system (design tokens only; no hardcoded colors/spacing — see `docs/design-system.md`).
- **NFR-21** **Localization (partial)** — only LLM rationale **text** localizes today; a full bilingual UI toggle is **roadmap**, not shipped.

---

# 5. References

- **Use-case diagram** — [`docs/diagrams/use-case.md`](diagrams/use-case.md)
- **Entity-relationship diagram** — [`docs/diagrams/erd.md`](diagrams/erd.md)
- **Data-flow diagram** — [`docs/diagrams/dfd.md`](diagrams/dfd.md)
- **Architecture diagram** — [`docs/diagrams/architecture.md`](diagrams/architecture.md)
- **User stories (INVEST)** — [`docs/user-stories.md`](user-stories.md)
- **Personas** — [`docs/personas.md`](personas.md)
- **Code-true relational schema** — [`docs/schema.md`](schema.md)
- **Implementation plan & divergence ledger** — [`docs/plan.md`](plan.md)
- **Contract-entity change request** — [`docs/revisions/srs-revisions-26-06-06.md`](revisions/srs-revisions-26-06-06.md)
- **Matching weights source of truth** — `backend/app/services/matching_config.py`

*Cohesiq — Build Locally. Connect Nationally. Scale Globally.*
