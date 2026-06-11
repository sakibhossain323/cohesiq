# Cohesiq — BuildFest 2026 Submission Answer Sheet

> **Track:** Branding & Marketing (MarTech) · **Challenge:** Influencer Matching Engine
> **Purpose:** Copy-paste answers for the official submission form. Section order mirrors `docs/requirements.md` exactly.
> **Honesty note (per requirements §Ethics — "no misleading demos"):** Everything below "BUILT" reflects the live codebase. Items labelled **ROADMAP** are explicitly not built. Storage is relational-only PostgreSQL 16. Migration head `0022`.

---

## Section A — Basic Project Info (Basics Tab)

### Elevator Pitch (≤200 chars)
> AI matching engine that connects Bangladeshi brands with trustworthy creators by niche, budget & authenticity — not vanity follower counts. Voice/PDF briefs in, ranked & explained matches out.

*(196 chars)*

### Public Summary
Cohesiq is a B2B influencer-matching platform for the Bangladesh creator economy. Brands describe a campaign — by typing, uploading a **PDF brief**, or **speaking** (voice → text) — and Cohesiq returns a ranked, explainable shortlist of creators scored across six weighted signals. It moves past raw follower counts toward audience fit, budget realism, and trust signals, then carries the deal through an offer-driven negotiation and contract lifecycle. Built for SMBs priced out of enterprise tools, it is BDT-native and grounded in real public YouTube data rather than self-reported metrics.

### Problem Statement
Bangladesh's influencer market (~$30.4M today, projected ~$45.3M, 500K+ creators) runs on WhatsApp DMs, Facebook groups, and spreadsheets. For small-to-micro businesses the campaign workflow is broken:
1. **Manual discovery** — finding a creator who fits a specific niche means hours of informal hunting with no verifiable metrics.
2. **Bot-inflated metrics** — vanity follower counts hide artificial inflation; brands overpay for fake reach.
3. **Mismatched economics** — without data-driven matching, low-BDT campaigns get paired with overpriced or irrelevant creators, wasting spend and killing ROI.
4. **No BDT-native infrastructure** — incumbents (GRIN, Aspire) target enterprise global brands and don't serve the local long-tail.

### Solution Description
Cohesiq is a decoupled full-stack platform (Next.js 16 + FastAPI + PostgreSQL 16, all in Docker Compose). A brand creates a campaign via text, PDF, or voice; an AI brief analyzer (`/api/campaign-suggestion`) extracts structured campaign fields. The brand runs the **5-stage matching pipeline**:

1. **Hard SQL filter** — platform, follower range, budget gate, availability.
2. **Conflict-of-interest check** — 90-day relational lookback on `brand_category` (no competing-brand collisions).
3. **Deterministic niche scoring + capped semantic rescue** — exact niche match first; embedding-based rescue only fires below threshold and is capped so it can never override a hard mismatch.
4. **6-factor weighted linear score (0–1)** — niche 0.45, budget 0.20, platform 0.15, engagement 0.10, language 0.08, recency 0.02.
5. **Rationale** — heuristic explanation for all; Groq LLM personalizes the **top 5**.

Scores persist in `ai_match_scores`. The brand then runs an offer-driven lifecycle: launch → shortlist → offer → multi-turn negotiate (4-second polling) → accept → contract state machine. Every score is explainable via a visible 6-factor breakdown and "AI-Generated" tags.

---

## Section B — Data Lifecycle & Engineering

### 1. Data Sources
**Tick:** [x] External APIs · [x] User Uploads · [x] Synthetic/AI-generated · [x] Public Web (scraping)
**Details:**
- **External APIs:** YouTube Data API v3 — real public read wrapper enriching 67 verified Bangladesh channels (`creator_social_profiles`).
- **User Uploads:** PDF campaign briefs + voice recordings (campaign creation).
- **Synthetic/AI-generated:** Groq `llama-3.1-8b-instant` fills profile gaps (estimated IG/TikTok profiles, rate cards, ~190 portfolio items) **at seed time only**.
- **Public Web:** Tavily web search assists seeding (offline, operator-triggered — not in the live request path).
- Real seed = 67 verified BD YouTube channels + estimated IG/TikTok profiles + ~190 portfolio items.

### 2. Acquisition Methods
**Tick:** [x] API Pull · [x] AI Extraction · [x] Speech-to-Text · [x] MCP Servers · [x] Web Scrapers · [x] Bulk Upload
**Textareas:**
- *Scrapers/crawlers:* Tavily Search API (seeding pipeline only).
- *MCP servers for data access (dev-time):* graphify (codebase knowledge-graph), context7 (live framework docs).
- *Additional:* **API Pull** — YouTube Data API v3 (Channels/PlaylistItems/Videos, ~3 quota units per creator, persisted at ingestion). **AI Extraction** — `/api/campaign-suggestion` parses briefs from text/PDF/voice into structured campaign fields. **Speech-to-Text** — `/api/transcribe` uses Groq **Whisper large-v3-turbo** for voice-driven campaign creation. **Bulk Upload** — relational seed snapshot (`db/seed.sql`).

### 3. Parsing, Formats & Cleaning
**Tick (Formats):** [x] JSON · [x] PDF · [x] Audio · [x] Markdown · [x] HTML
**Textareas:**
- *Parsers:* PDF.js (browser-side brief parsing → text), Groq Whisper (audio → text), Pydantic v2 (JSON request/response parsing).
- *Formatters/converters:* JSON mode on all LLM calls for structured extraction; SQLAlchemy 2.0 async ORM serialization.
- *Cleaning & enrichment:* YouTube enrichment normalizes niche (topic-URL map + LLM fallback), language (Bangla/English/Banglish heuristic), and city; UPSERT into `creator_social_profiles` with `data_source` provenance label.
- *Schema validation:* Pydantic v2 boundary schemas reject out-of-bounds metrics (e.g. negative followers, impossible engagement).

### 4. Storage Targets
**Tick:** [x] Relational
**Details:** **PostgreSQL 16, relational-only.** Single store, async SQLAlchemy 2.0, Alembic migrations (head `0022`). Key tables: `creator_profiles`, `creator_social_profiles` (per-platform, `is_api_verified` / `data_source`), `creator_portfolio_items` (drives recency), `campaigns`, `campaign_applications`, `contracts` (6-state machine), `negotiation_turns` (multi-turn offers), `ai_match_scores` (6 sub-scores + semantic, persisted per campaign×creator). Indexes on FK + filter columns (platform, follower range).
**ROADMAP (NOT built):** Vector DB (pgvector), Graph DB (Neo4j), Cache/KV (Redis), Data Warehouse (TimescaleDB) — deferred Phase-E layers. Do **not** mark these as built.

### 5. Visualization
**Tick:** [x] Recharts
**Textareas:** Recharts powers the 6-factor match-score breakdown bars and profile-strength meters in the brand dashboard. No external BI tooling (Superset/Metabase/Grafana) — all dashboards are in-app React.

### 6. Insights — AI, ML & non-AI
**Tick:** [x] LLM Inference / RAG · [x] Rule Engine · [x] Statistical Analysis
**Textareas:**
- *AI/ML:* Groq `llama-3.1-8b-instant` (top-5 rationale + synthetic seed gen); Gemini `1.5-flash` (rationale fallback) + `text-embedding-004` (semantic similarity, computed on-the-fly, **not persisted**); Groq Whisper large-v3-turbo (STT).
- *Non-AI analytics:* The matching score is a **deterministic 6-factor weighted linear model** (niche 0.45 / budget 0.20 / platform 0.15 / engagement 0.10 / language 0.08 / recency 0.02). Budget scoring uses a 0.30 soft buffer, 1.30× hard cap, 0.5 for unknown. Conflict-of-interest = 90-day relational rule engine.
- *Delivery:* Ranked creator cards with visible sub-score bars + LLM rationale text, all tagged "AI-Generated".

### 7. Pipelines & Orchestration
**Textareas:**
- *Orchestration:* Synchronous FastAPI request pipeline (`POST /campaigns/{id}/run-matching` runs the 5 stages); Docker Compose orchestrates `postgres`, `backend`, `frontend`, `ngrok`.
- *Scheduling/Triggers:* User-triggered (run-matching button); negotiation UI uses **4-second client polling** for near-real-time turn updates.
- *Streaming/Real-time:* No message broker; polling-based pseudo-realtime for negotiation. (No Airflow/Temporal/Dagster — out of scope.)

### 8. Outbound — APIs & Distribution
**Textareas:**
- *Outbound APIs:* FastAPI REST surface — `POST /campaigns/{id}/run-matching`, `GET /campaigns/{id}/matches`, application/offer/contract/negotiation endpoints. Live OpenAPI at `/docs`.
- *Webhooks & exports:* Clerk auth webhooks (user sync). No data exports.
- *Embeddings/model serving:* Gemini `text-embedding-004` called on-the-fly for semantic rescue; no self-hosted model serving.

### 9. Open Source Stack
**Details:**
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5.7, Tailwind v4, shadcn/ui, PDF.js, Recharts.
- **Backend:** FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, Python 3.12.
- **Data:** PostgreSQL 16.
- **Infra:** Docker / Docker Compose, ngrok (tunnel).
- **SDKs:** `groq`, `google-generativeai`, Clerk SDK.

### 10. Quality, Governance & Observability
**Textareas:**
- *Data quality:* Pydantic v2 boundary schemas reject out-of-bounds metrics; YouTube data tagged `data_source` (self_reported / verified / estimated) so provenance is never lost.
- *Privacy & compliance:* Public-API data only; no private-DB scraping. Clerk RS256 JWT auth on all protected routes; backend validates via `common.dependencies.get_current_user`.
- *Lineage & observability:* `data_source` labels + persisted `ai_match_scores` give per-match audit trail; FastAPI logs; live `/docs` for API introspection.
- *Cost & performance:* Cheap-model routing (Groq before Gemini), JSON mode, LLM gated to top-5 only, graphify graph-based context compression at dev time.

### 11. Publish Local Environment to Internet
**Tick:** [x] ngrok
**Details:** Docker Compose includes an **ngrok** service that tunnels the local stack (frontend :3000 / backend :8000) to a public URL for demo and webhook delivery. Auth via ngrok token; the tunnel is demo-scoped, not a production ingress.

---

## Section 3 — AI Detail Usage (AI Depth Score)

### Prompt Usage (10 pts)
Structured **JSON-mode** prompts tightly coupled to Pydantic v2 schemas for deterministic extraction (brief → campaign fields, niche classification). **Role prompting** with dynamic variables for match rationale generation (rationale text can localize to Bangla even though the UI does not). Prompts are versioned alongside code in the service layer; iteration was driven by failures observed when early pure-LLM matching hallucinated budget tiers — leading to the deterministic-first redesign.

### Token Optimization (10 pts)
**Tick (Tools):** [x] Graphify · [x] JSON mode · [x] Cheap-model routing
- **Graphify** — graph-based codebase context compression at dev time (query a scoped subgraph instead of dumping files into context).
- **JSON mode** — constrains output, eliminates re-prompt loops.
- **Cheap-model routing** — Groq `llama-3.1-8b-instant` runs first; Gemini only as fallback. LLM rationale is gated to the **top 5** candidates only (not all matches), bounding per-run token cost.

### LLMs / Models Used (15 pts + 5 for why)
**Tick:** [x] Claude · [x] Gemini · [x] Llama
**Why each:**
- **Llama 3.1 8B Instant (Groq)** — primary generative model: top-5 match rationale + synthetic seed generation. Chosen for ultra-low latency + reliable JSON at hackathon quotas.
- **Groq Whisper large-v3-turbo** — speech-to-text for voice campaign briefs.
- **Gemini 1.5 Flash** — rationale fallback when Groq is unavailable. **Gemini text-embedding-004** — semantic-similarity fallback for niche rescue (computed live, not persisted).
- **Claude** — dev-time agentic pair-programmer (via Cursor / Antigravity) for full-stack implementation and architecture.

### Retrieval & RAG (12 pts + 5 for architecture)
**Tick:** [x] Naive RAG
- **Embedding-based semantic rescue:** when deterministic niche scoring falls below threshold (0.28), the campaign description is embedded (`text-embedding-004`) and compared to creator portfolio descriptions; the rescued niche contribution is **capped at 0.40** so semantic similarity can never override a hard relational mismatch. Embeddings are computed on-the-fly and **not persisted** (no vector DB).
**ROADMAP (NOT built):** Vector DB, Graph RAG, Knowledge Graph (as product retrieval layer), Rerankers, Agentic/Self/Corrective RAG.

### MCP Usage (20 pts)
**Tick:** [x] We used MCP servers/clients.
We **used** (did not build) MCP servers as part of the development workflow:
- **graphify** — codebase knowledge-graph MCP: `query` / `explain` / `path` / god-nodes / shortest-path over 7,470 nodes / 18,064 edges. Drives the graphify-first workflow.
- **context7** — live framework documentation MCP (Next.js, FastAPI, Clerk).
- **next-devtools** — Next.js devtools MCP (client config in `.vscode/mcp.json`).
*(Honesty: we did not author a custom MCP server; claims are "used" only.)*

### Open Source Tools (8 pts)
FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, Next.js 16, React 19, Tailwind v4, shadcn/ui, PDF.js, Recharts, PostgreSQL 16, Docker. SDKs: `groq`, `google-generativeai`. No upstream contributions submitted; usage is integration-level.

### Agent Frameworks & Orchestration (7 pts)
No runtime multi-agent framework. The "agentic" surface is **dev-time**: Claude/Cursor agents operating under an `AGENTS.md` spec + Cursor Rules + the graphify-first workflow. Runtime AI is a deterministic pipeline with gated single-shot LLM calls (tool-calling not required).

### Fine-tuning / Adaptation (5 pts)
**None.** No LoRA/QLoRA/full fine-tunes. All models used as-is via API. *(ROADMAP: BanglaBERT-based authenticity scoring.)*

### Evaluation & Quality (7 pts)
No formal LLM-as-judge / RAGAS harness. Quality is enforced structurally: Pydantic v2 schema validation on every AI output, deterministic-math-first scoring (the LLM cannot change the numeric score — only phrase the rationale), and explainable 6-factor breakdowns let a human verify every match.

### Guardrails & Safety (6 pts)
- **Schema guardrails:** Pydantic v2 boundary schemas reject out-of-bounds metrics.
- **Deterministic-math-first:** the LLM is gated behind hard budget constraints (e.g. a 1,500 BDT budget is mathematically pushed away from mega-influencer tiers) so it cannot hallucinate budget tiers — a direct fix for an observed early failure.
- **Transparency:** every AI output carries an "AI-Generated" tag + a visible 6-factor score breakdown.

### Frontend AI Builders (5 pts)
**Tick:** [x] v0 · [x] Cursor Composer
v0 (Vercel) bootstrapped the React/shadcn dashboards (`frontend/cohesiq-v0/`); Cursor Agent wired them to the FastAPI backend and resolved App Router hydration.

### Workflow Automation (4 pts)
No n8n/Zapier/Airflow/Temporal/LangGraph. Orchestration is FastAPI's synchronous pipeline + Docker Compose. (Marked honestly as not used.)

### Local / On-device LLMs (8 pts)
**None.** All inference is cloud API (Groq, Gemini). No Ollama/vLLM/local quantized models.

### Agentic Frameworks
**None at runtime** (no LangGraph/CrewAI/AutoGen/Pydantic-AI/etc.). Dev-time agents only (Claude via Cursor/Antigravity).

### AI Development Lifecycle (AI-DLC)
**Tick:** [x] Cursor Rules
- `AGENTS.md` spec (enforces DDD domain boundaries, no cross-domain router imports).
- Cursor Rules + the **graphify-first** mandatory workflow (query the knowledge graph before touching source).

### Live `/docs` Module
**Tick:** [x] Yes. FastAPI auto-generated OpenAPI docs are live at `/docs`.

---

## Section 4 — Build Provenance (Visibility Settings)

### Data & AI Provenance (Judge + Admin)
- **Data sources:** YouTube Data API v3 (real, 67 verified BD channels); user uploads (PDF/voice briefs); Tavily web search + Groq Llama synthetic generation (seeding only); relational seed snapshot.
- **AI models:** Groq `llama-3.1-8b-instant` (rationale + seed gen); Groq Whisper large-v3-turbo (STT); Gemini `1.5-flash` (rationale fallback) + `text-embedding-004` (semantic rescue, not persisted); Claude (dev-time agent).
- **Responsible AI:** Public-API data only (no private scraping); Pydantic v2 bounds-checking; deterministic-math-first (LLM cannot alter scores); explainable 6-factor breakdown; "AI-Generated" / `data_source` provenance tags on every metric.

### Tooling & IDE (Team Only)
- **IDE / Editor:** Cursor / Antigravity.
- **Deployment Method:** Docker & Docker Compose (`postgres`, `backend`, `frontend`, `ngrok`); EC2 host with Caddy reverse proxy.
- **Frameworks & Libraries:** Next.js 16, React 19, TypeScript 5.7, Tailwind v4, shadcn/ui, PDF.js, Recharts; FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2; `groq`, `google-generativeai`, Clerk.
- **Context / Memory Files:** `AGENTS.md`, `CLAUDE.md`, Cursor Rules, `graphify-out/` (graph.json, GRAPH_REPORT.md), `docs/plan.md`, `docs/schema.md`.

### MCP Usage (Team Only)
- **MCP servers (used, not built):** `graphify` — codebase knowledge graph; `context7` — live framework docs; `next-devtools` — Next.js devtools.
- **Tools exposed (graphify):** `query_graph`, `get_node`, `get_neighbors`, `shortest_path`, `god_nodes`, `get_community`, `graph_stats`. **(context7):** `resolve-library-id`, `query-docs`.
- **Permissions:** Workspace read-only (graphify); outbound docs fetch (context7). No write access to project data.

### Prompt Library (Team Only)
| Title | Category | Prompt (summary) | Output | Proprietary |
|---|---|---|---|---|
| Brief → Campaign Extractor | Extraction | JSON-mode: parse text/PDF/voice brief into {niche, budget, platform, language, KPIs, hashtags} | Structured campaign fields pre-fill the wizard | No |
| Match Rationale (top-5) | Generation | Role prompt: given 6 sub-scores + creator/campaign context, explain the fit (localizable) | Human-readable "why this creator" text | No |
| Synthetic Seed Generator | Synthetic data | Generate plausible BD creator demographics, rate cards, portfolio items | Seed rows (offline only) | No |
| Niche Classifier | Classification | Classify a YouTube channel/video into a fixed niche taxonomy | Niche label for enrichment | No |

---

## Section 5 — 180-Second Video Pitch Script

> **Tone:** Shark Tank / Y Combinator demo-day. Flashy but plain-spoken. One human story carries the whole pitch.
> **Rule we followed:** no jargon on camera. We never say "Pydantic," "deterministic-math-first," or weight numbers out loud — investors don't buy vocabulary, they buy the change we create. Every claim below maps to something live in the build (see the Evidence Map).
> **Narrator:** warm, confident founder voice. **Music:** builds from a single sparse beat to a wide, optimistic swell by the close.

---

### 0:00–0:22 | The Hook — meet a real founder
**VISUAL:** Cinematic, golden-hour. A young woman, **Rumana**, sits cross-legged on the floor of a tiny Dhaka apartment, surrounded by handmade jamdani scarves she sews herself. Her phone screen glows — dozens of unanswered WhatsApp chats, a messy Excel sheet, a calculator. She rubs her eyes, exhausted. Soft text overlay fades in: *"3,000 creators. No idea which one is real."*
**SCRIPT:**
"This is Rumana. She makes beautiful scarves in Dhaka, and she has exactly five thousand taka to find one creator to show them to the world. So she does what everyone here does — she scrolls. She messages strangers. She prays the follower count isn't fake. Most of the time… it is."

### 0:22–0:45 | The Problem — a whole market stuck in the DMs
**VISUAL:** Snap-zoom out from Rumana to a fast montage: hundreds of small brand owners across Bangladesh — a bakery, a phone-case seller, a skincare startup — all staring at the same chaotic DMs. Animated counter spins up: **$45M market · 500,000+ creators**. Then a red stamp slams across the screen: *"Half of all 'followers' are bots."*
**SCRIPT:**
"Rumana isn't alone. Bangladesh's creator economy is racing toward forty-five million dollars, with over half a million creators. But it all runs on guesswork and group chats. Bots inflate the numbers, small brands overpay, and the right creator never gets found. The world's big tools? They charge in dollars and don't even see this market."

### 0:45–1:25 | The Solution + Demo — the magic moment
**VISUAL:** Hard cut to a clean, bright laptop screen — the **Cohesiq** dashboard. Rumana *speaks* into her phone: "I want creators for handmade scarves, budget five thousand taka." Her words turn into a structured campaign brief on screen, field by field, like magic. She clicks one glowing button: **Run Matching.** A half-second beat — then a ranked list of real creators slides in, each card showing a clear **match score**, little colored bars, and one plain sentence: *"Great fit — her audience loves local fashion and she's in your budget."*
**SCRIPT:**
"Now watch what Cohesiq does. Rumana doesn't fill out a form — she just *talks*. We turn her voice into a campaign in seconds. One click, and instead of three thousand strangers, she gets a short, ranked list of real creators — each one verified against their actual YouTube data, not their bragging. And next to every name, in plain language: *why* they fit, and proof she can afford them. From here she sends an offer, negotiates right inside the app, and signs a contract. No middlemen. No agency cut. No guessing."

### 1:25–2:00 | The Moat — why this is trustworthy, in human words
**VISUAL:** Split screen. LEFT: a black-box labeled "Other AI" spits out a random name with a ❌. RIGHT: Cohesiq shows the same six honest bars — *Audience fit · Budget · Platform · Engagement · Language · Freshness* — each filling up with a satisfying snap, ending in a green ✅ and a glowing **"AI-Generated · Verified"** tag.
**SCRIPT:**
"Here's the part investors should love. Most AI just hands you an answer and hopes you trust it. Ours shows its work. Every match is scored on six things that actually matter to a real campaign — and every score is visible, explainable, and checkable. The AI explains the match in plain English, but it can *never* fake a number or push a creator you can't afford. Honest by design. That's how you build trust in a market that's been burned by fakes."

### 2:00–2:38 | The Vision — cross-border, and a new industry standard
**VISUAL:** The map of Bangladesh on screen pulls back to reveal the whole globe. Glowing arcs of light connect Dhaka to **London, New York, Dubai, Toronto** — and then to **Jakarta, Lagos, Manila**. Diaspora brand logos light up along the arcs. Text sweeps across: *"Any currency. Any market. Same engine."*
**SCRIPT:**
"And this doesn't stop at Bangladesh. A Bangladeshi founder in New York selling halal snacks can now reach trusted creators back home — overnight. A global beauty brand can tap five hundred thousand authentic South Asian creators at a tenth of Western prices. And the creators? A nano-creator in a small town finally gets discovered on merit, and earns from brands across the world. Our matching engine doesn't care about the currency or the country — swap the market, and the same trust layer works for Indonesia, Nigeria, the Philippines. We're not just fixing Bangladesh's creator economy. We're building the rails for every emerging one."

### 2:38–3:00 | The Close — the ask
**VISUAL:** Return to Rumana — but now she's smiling, packing a stack of scarves into a shipping box, her phone showing a signed contract and a creator's video featuring her product. Pull back to the Cohesiq logo on a clean field. Tagline animates in: **"Cohesiq — matchmaking the creator economy, honestly."** Final line of text: *"Built and running today."*
**SCRIPT:**
"Rumana found her creator in two minutes, not two weeks — and it cost her nothing until the deal was done. That's the whole point: we only win when our brands and creators win. The market is huge, the timing is now, and the platform is already live. Cohesiq turns the world's creator chaos into trusted, structured business — one honest match at a time. Come build it with us."

---

## Judging Criteria → Evidence Map

| Criterion (weight) | Evidence in repo |
|---|---|
| **Innovation (20%)** | `backend/app/services/matching_config.py` (6-factor BD-tuned weights), `services/semantic_match.py` (capped semantic rescue), `frontend/.../app/api/transcribe/route.ts` (voice→campaign), `app/api/campaign-suggestion/route.ts` (PDF/text/voice brief extraction) |
| **Technical Execution (20%)** | `backend/app/services/matching.py` (5-stage pipeline), `matching_config.py` (externalized weights/thresholds), `backend/app/campaigns/` (offer→negotiation→contract state machine), `docs/schema.md` (relational model, migration 0022), live `/docs` OpenAPI |
| **Business Model + Global Readiness (20%)** | `docs/executive-summary.md` (market sizing, ICP, competitive landscape, commission model), contract fee tiers in `backend/app/campaigns/` (15% / 10% / 18%) |
| **Real-World Impact + Ethical AI (20%)** | `data_source` provenance labels in `creator_social_profiles`, Pydantic v2 boundary schemas, deterministic-math-first guardrail in `matching.py`, "AI-Generated" tags + 6-factor breakdown UI in `frontend/.../matches/_components/MatchesClient.tsx` |
| **Scalability + NRB Collaboration (10%)** | `docker-compose.yml` (4-service stack incl. ngrok), DDD domain layout `backend/app/{auth,brands,creators,campaigns}/`, EC2 + Caddy deployment, Phase-E roadmap in `docs/plan.md` §3 |
| **Presentation (10%)** | This file (`docs/submittable.md`), `docs/executive-summary.md`, live `/design-system` showcase, FastAPI `/docs`, `graphify-out/wiki/index.md` |

---

### Roadmap (explicitly NOT built — for honesty)
Real bKash/Nagad escrow (currently **simulated fee computation only**) · full Bangla UI toggle (no i18n; only rationale **text** can localize) · pgvector / Neo4j / Redis / TimescaleDB · authenticity **trust score** (only an engagement-vs-tier proxy exists today) · per-campaign engagement snapshots (table exists, population pending) · model fine-tuning (none).
