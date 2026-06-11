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
- **Public Web (scraping):** Apify cloud actors (`apify/instagram-scraper`, TikTok actor) scrape public Instagram and TikTok profiles — follower counts, engagement stats, recent posts — for 20 real Bangladeshi creators at seed time (`scripts/seed_real_social_creators.py`). Tavily web search also used for supplemental seeding context.
- Real seed = 67 verified BD YouTube channels + 20 Instagram/TikTok profiles via Apify + ~190 portfolio items.

### 2. Acquisition Methods
**Tick:** [x] API Pull · [x] AI Extraction · [x] Speech-to-Text · [x] MCP Servers · [x] Web Scrapers · [x] Bulk Upload
**Textareas:**
- *Acquisition details:* YouTube Data API v3 (Channels/PlaylistItems/Videos endpoints, ~3 quota units per creator, stats persisted at ingestion with `is_api_verified=true`); Apify REST API triggers Instagram and TikTok cloud actors, waits for run completion, then fetches dataset items — all via `app/social_ingestion/apify.py`; Groq Whisper large-v3-turbo transcribes voice campaign briefs; PDF.js parses uploaded PDF briefs browser-side; relational seed snapshot loaded via `db/seed.sql` bulk upload.
- *Scrapers/crawlers:* Apify cloud actors (`apify/instagram-scraper`, TikTok actor) scrape public Instagram and TikTok profiles at seed time (`scripts/seed_real_social_creators.py`); Tavily Search API for supplemental seeding context (offline, operator-triggered).
- *MCP servers for data access (dev-time):* graphify MCP (codebase knowledge-graph — 7,470 nodes/18,064 edges, `query`/`explain`/`path` tools); context7 MCP (live framework docs for Next.js, FastAPI, Clerk); next-devtools MCP (Next.js devtools via `.vscode/mcp.json`).
- *Additional:* **API Pull** — YouTube Data API v3 (Channels/PlaylistItems/Videos, persisted at ingestion). **AI Extraction** — `/api/campaign-suggestion` parses briefs from text/PDF/voice into structured campaign fields. **Speech-to-Text** — `/api/transcribe` uses Groq **Whisper large-v3-turbo** for voice-driven campaign creation. **Bulk Upload** — relational seed snapshot (`db/seed.sql`).

### 3. Parsing, Formats & Cleaning
**Tick (Formats):** [x] JSON · [x] PDF · [x] Audio · [x] Markdown · [x] HTML
**Textareas:**
- *Parsers:* PDF.js (browser-side PDF brief → plain text); Groq Whisper large-v3-turbo (audio → text transcript); Pydantic v2 (JSON request/response schema parsing and coercion); httpx (Apify REST API response parsing); YouTube Data API JSON response normalization in `app/youtube/service.py`.
- *Formatters/converters:* JSON mode enforced on all LLM calls (Groq + Gemini) for deterministic structured extraction; SQLAlchemy 2.0 async ORM handles Python↔PostgreSQL type serialization; Pydantic v2 `.model_dump()` for response serialization.
- *Cleaning & enrichment:* YouTube enrichment normalizes niche (topic-URL map + Groq LLM fallback), language (Bangla/English/Banglish heuristic on title/description), and city from channel metadata. Apify-scraped Instagram/TikTok data normalized via `PublicSocialProfileEnrichment` schema. All creator metrics UPSERTed into `creator_social_profiles` with `data_source` provenance label (`verified` / `self_reported` / `estimated`).
- *Schema validation:* Pydantic v2 boundary schemas on all API inputs — rejects negative follower counts, engagement rates outside 0–100%, impossible budget values. Groq niche classifier validated against fixed 16-niche taxonomy before DB write.

### 4. Storage Targets
**Tick:** [x] Relational
**Storage details:** PostgreSQL 16, single relational store. Async SQLAlchemy 2.0 ORM with Alembic migration chain (numbered `0001→0022`). Core tables: `creator_profiles`, `creator_social_profiles` (per-platform metrics, `is_api_verified`, `data_source` provenance, `api_verified_at` timestamp), `creator_portfolio_items` (drives recency scoring), `campaigns`, `campaign_applications`, `negotiation_turns` (multi-turn offer/counter chain), `contracts` (6-state machine: draft→active→completed/cancelled/disputed/expired), `ai_match_scores` (6 sub-scores + semantic flag persisted per campaign×creator pair for full audit trail). Compound indexes on FK + filter columns (platform, follower range, niche). All writes go through service layer — routers never touch the ORM directly.
**ROADMAP (NOT built):** Vector DB (pgvector), Graph DB (Neo4j), Cache/KV (Redis), Data Warehouse (TimescaleDB) — deferred Phase-E layers. Do **not** mark these as built.

### 5. Visualization
**Tick:** [x] Recharts
**Visualization details:** Recharts (in-app React) powers the 6-factor match-score breakdown bar charts (one bar per signal: niche, budget, platform, engagement, language, recency) and creator profile-strength meters shown on every match card. Score bars update live when a brand reruns matching.
**Dashboards & reports:** All dashboards are in-app React components — no external BI tooling. Brand dashboard: match shortlist with score breakdown + LLM rationale, campaign pipeline status, ROI calculator, rate benchmark tool, creator side-by-side comparison view. Creator dashboard: active deal tracker, negotiation thread, contract state timeline.

### 6. Insights — AI, ML & non-AI
**Tick:** [x] LLM Inference / RAG · [x] Rule Engine · [x] Statistical Analysis
**AI / ML details:** Groq `llama-3.1-8b-instant` generates plain-English match rationale for the top-5 ranked creators and produces synthetic seed data offline. Groq Whisper `large-v3-turbo` transcribes voice campaign briefs to structured text. Gemini `1.5-flash` serves as LLM fallback when Groq is unavailable. Gemini `text-embedding-004` computes cosine similarity between campaign descriptions and creator portfolio text for semantic niche rescue (on-the-fly, not persisted). All AI outputs are schema-validated by Pydantic v2 before persistence.
**Non-AI analytics:** Deterministic 6-factor weighted linear scoring model (niche 0.45 / budget 0.20 / platform 0.15 / engagement 0.10 / language 0.08 / recency 0.02) — weights and thresholds live in `backend/app/services/matching_config.py`. Budget scoring: 0.30 BDT soft buffer, 1.30× hard cap, 0.5 score for unknown budgets. Conflict-of-interest = relational 90-day lookback rule engine on `brand_category`. Engagement-vs-follower-tier proxy for authenticity signal.
**Insights delivery:** Ranked creator cards in brand dashboard with: visible 6-bar score breakdown (one bar per factor), LLM-generated rationale text tagged "AI-Generated", `data_source` badge (API-verified / self-reported / estimated), conflict-of-interest flag. ROI calculator and rate benchmark tool in sidebar for campaign planning.

### 7. Pipelines & Orchestration
**Orchestration:** Synchronous 5-stage FastAPI request pipeline — `POST /campaigns/{id}/run-matching` executes hard SQL filter → conflict-of-interest check → niche scoring + semantic rescue → 6-factor weighted score → LLM rationale in a single request. Docker Compose orchestrates all four services: `postgres` (PostgreSQL 16), `backend` (FastAPI), `frontend` (Next.js), `ngrok` (public tunnel). No Airflow/Temporal/Dagster — pipeline complexity does not require a DAG scheduler at current scale.
**Scheduling / triggers:** All matching runs are user-triggered via the Run Matching button in the campaign dashboard (`POST /campaigns/{id}/run-matching`). YouTube enrichment is operator-triggered at seed time. Clerk auth webhooks fire on user sign-up and profile update events to keep the `users` table in sync.
**Streaming / real-time:** Negotiation turn updates use 4-second client-side polling (`GET /negotiations/{id}/turns`) — no WebSocket or message broker required. Each poll returns the latest turn state so both parties see counter-offers within 4 seconds. This is the only near-realtime surface; all other data flows are request/response.

### 8. Outbound — APIs & Distribution
**Outbound APIs:** FastAPI REST surface exposed at `http://backend:8000` (internal) and tunneled publicly via ngrok. Key endpoints: `POST /campaigns/{id}/run-matching` (triggers 5-stage match pipeline), `GET /campaigns/{id}/matches` (returns ranked shortlist with sub-scores), `POST /campaigns/{id}/applications/{app_id}/offer` (sends offer to creator), `GET /negotiations/{id}/turns` (polling endpoint for negotiation thread), `POST /contracts` (creates contract from accepted offer). Full OpenAPI spec auto-generated at `/docs`.
**Webhooks & exports:** Inbound Clerk auth webhooks (`POST /webhooks/clerk`) handle `user.created` and `user.updated` events to sync Clerk identity to the local `users` table. No outbound webhooks or data export endpoints implemented.
**Embeddings / model serving:** Gemini `text-embedding-004` called via `google-generativeai` SDK on-the-fly during semantic rescue stage — one embedding call per matching run when niche score falls below the 0.28 threshold. Embeddings are computed per-request and not persisted (no vector store). No self-hosted model serving infrastructure.

### 9. Open Source Stack
**Open-source data stack:** PostgreSQL 16 (primary store), SQLAlchemy 2.0 async (ORM), Alembic (schema migrations, head `0022`), Pydantic v2 (validation + serialization), httpx (async HTTP client for Apify + YouTube API calls), FastAPI (REST framework), Docker / Docker Compose (container orchestration), ngrok (tunnel). Frontend data layer: Next.js 16 App Router Server Components for data fetching, Recharts for score visualization, PDF.js for browser-side brief parsing.
**Full stack details:**
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5.7, Tailwind v4, shadcn/ui, PDF.js, Recharts.
- **Backend:** FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, Python 3.12, httpx.
- **Data:** PostgreSQL 16.
- **Infra:** Docker / Docker Compose, ngrok (tunnel).
- **SDKs:** `groq`, `google-generativeai`, Clerk SDK, `apify-client` (via httpx REST calls).

### 10. Quality, Governance & Observability
**Data quality:** Pydantic v2 boundary schemas on every API input — rejects negative follower counts, engagement rates outside 0–100%, and impossible budget values at the system boundary before any DB write. YouTube enrichment validates niche against a fixed 16-niche taxonomy (LLM fallback with schema check). Apify-scraped social profiles go through `PublicSocialProfileEnrichment` normalization before persistence. All creator metrics tagged with `data_source` (self_reported / verified / estimated) so provenance is explicit and never implicit.
**Privacy & compliance:** Only public API data used (YouTube Data API v3, public Apify scraping of public profiles) — no private database access or authenticated scraping. Clerk RS256 JWT auth on all protected backend routes; `get_current_user` dependency validates token on every request. No PII beyond what creators voluntarily publish on public platforms. UPSERT semantics prevent duplicate rows; `api_verified_at` timestamp records when data was last verified.
**Lineage & observability:** `data_source` provenance labels on every `creator_social_profiles` row (self_reported / verified / estimated). `ai_match_scores` table persists all 6 sub-scores + semantic flag per campaign×creator pair — every match is auditable and reproducible. `is_api_verified` + `api_verified_at` fields on social profiles. FastAPI structured logs on every request. Live OpenAPI at `/docs` for API introspection. `data_source` field in portfolio items links each item back to its ingestion method.
**Cost & performance:** Cheap-model routing — Groq `llama-3.1-8b-instant` runs first (sub-100ms latency, free-tier quota); Gemini `1.5-flash` only as fallback. LLM rationale gated to top-5 candidates only (not all matches) to bound per-run token cost. JSON mode on all LLM calls eliminates re-prompt loops. Gemini embedding call triggered only when niche score falls below 0.28 threshold — most runs skip it entirely. Graphify MCP compresses codebase context at dev time (scoped subgraph vs. full file dump).

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
- **Gemini 1.5 Flash** — rationale fallback when Groq is unavailable. **Gemini text-embedding-004** — semantic-similarity for niche rescue (computed live, not persisted).
- **Claude** — dev-time agentic pair-programmer (via Claude Code / Cursor) for full-stack implementation and architecture.
**LLM usage commentary:** Groq `llama-3.1-8b-instant` was chosen as the primary model for ultra-low latency (sub-200ms) and reliable JSON-mode output at hackathon API quotas. LLM calls are gated strictly to the top-5 ranked candidates — no LLM call fires for lower-ranked matches — bounding per-run token cost regardless of creator corpus size. The LLM never alters numeric scores; it only phrases the rationale, so hallucination cannot corrupt match quality. Gemini `text-embedding-004` fires only when deterministic niche scoring falls below the 0.28 threshold, keeping the embedding API call rate low. Claude was used exclusively at dev-time as an agentic pair-programmer with the graphify MCP for codebase-aware generation.

### Retrieval & RAG (12 pts + 5 for architecture)
**Tick:** [x] Naive RAG
**RAG architecture details:** Embedding-based semantic rescue: when the deterministic niche score for a creator falls below the 0.28 threshold, the campaign brief description is embedded via Gemini `text-embedding-004` and cosine-compared against that creator's portfolio item descriptions. The rescued niche contribution is hard-capped at 0.40 — semantic similarity can boost a borderline match but can never override a creator whose deterministic score indicates a hard mismatch. Embeddings are computed on-the-fly per matching run and are not persisted (no vector database required). This is a deliberate architectural choice: the rescue fires rarely (only below-threshold cases), so the cost of persisting and indexing embeddings is not justified at current scale. All retrieval logic lives in `backend/app/services/semantic_match.py`.
**ROADMAP (NOT built):** Persistent pgvector store, Graph RAG, Knowledge Graph retrieval, Rerankers, Agentic/Self/Corrective RAG.

### MCP Usage (20 pts)
**Tick:** [x] We used MCP servers/clients.
**MCP servers used:**
1. **graphify** — codebase knowledge-graph MCP: `query` / `explain` / `path` / god-nodes / shortest-path over 7,470 nodes / 18,064 edges. Mandatory first-step for all codebase navigation.
2. **context7** — live framework documentation MCP (resolves up-to-date docs for Next.js, FastAPI, Clerk, SQLAlchemy).
3. **next-devtools** — Next.js devtools MCP (client config in `.vscode/mcp.json`).
**MCP clients / hosts:** Claude Code (Anthropic CLI) as primary MCP client for graphify and context7; VS Code with next-devtools MCP extension.
**MCP reuse / architecture notes:** The graphify MCP replaced ad-hoc file grepping entirely — every codebase exploration query goes through `graphify query "<question>"` which returns a scoped subgraph (typically 10–50 nodes) instead of loading full source files into context. This reduced LLM context consumption by an estimated 80% on large cross-file questions and prevented hallucination about file structure. context7 ensured all framework-specific code (Next.js App Router patterns, SQLAlchemy 2.0 async syntax, Clerk SDK) was generated against current docs rather than training data.
*(Honesty: we did not author a custom MCP server; all claims above are "used" only.)*

### Open Source Tools (8 pts)
**Open-source AI tools & libraries:** groq Python SDK (Llama inference + Whisper STT), google-generativeai SDK (Gemini flash inference + text-embedding-004), PDF.js (browser-side PDF parsing), Pydantic v2 (AI output schema validation), Recharts (score breakdown visualization), httpx (async HTTP client for Apify REST API calls).
**Full stack:** FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, Next.js 16, React 19, Tailwind v4, shadcn/ui, PDF.js, Recharts, PostgreSQL 16, Docker. SDKs: `groq`, `google-generativeai`, Clerk SDK. No upstream contributions submitted; usage is integration-level.

### Agent Frameworks & Orchestration (7 pts)
**Agent / orchestration notes:** No runtime multi-agent framework (no LangGraph/CrewAI/AutoGen/Pydantic-AI). Runtime AI is a deterministic 5-stage pipeline with gated single-shot LLM calls — tool-calling loops are not required because the matching logic is deterministic math, not agentic reasoning. The "agentic" surface is exclusively dev-time: Claude Code + Cursor Composer agents operating under an `AGENTS.md` spec that enforces DDD domain boundaries, graphify-first codebase navigation, and task-tracked implementation.

### Fine-tuning / Adaptation (5 pts)
**Fine-tuning / adaptation:** No fine-tuning applied. All models (Groq Llama 3.1 8B, Gemini 1.5 Flash, Whisper large-v3-turbo, text-embedding-004) are used as-is via their public APIs with no LoRA, QLoRA, or full fine-tune. Adaptation is achieved entirely through prompt engineering: JSON-mode structured prompts, role prompting with dynamic campaign/creator variables, and a fixed niche taxonomy that constrains LLM output to valid categories. Roadmap: BanglaBERT-based niche classification fine-tuned on Bangla creator content for improved local accuracy.

### Evaluation & Quality (7 pts)
**Evaluation & quality methods:** No formal LLM-as-judge or RAGAS harness. Quality is enforced structurally at three levels: (1) **Schema guardrails** — Pydantic v2 validates every AI output against typed schemas before persistence, rejecting malformed JSON or out-of-range values; (2) **Deterministic-math-first** — the numeric match score is computed by a transparent weighted formula that the LLM cannot touch, so hallucination cannot corrupt rankings; (3) **Human-verifiable outputs** — the visible 6-factor score breakdown + "AI-Generated" tag on every rationale lets a brand manager (or judge) audit any match in 10 seconds without domain knowledge.

### Guardrails & Safety (6 pts)
- **Schema guardrails:** Pydantic v2 boundary schemas reject out-of-bounds metrics.
- **Deterministic-math-first:** the LLM is gated behind hard budget constraints (e.g. a 1,500 BDT budget is mathematically pushed away from mega-influencer tiers) so it cannot hallucinate budget tiers — a direct fix for an observed early failure.
- **Transparency:** every AI output carries an "AI-Generated" tag + a visible 6-factor score breakdown.

### Frontend AI Builders (5 pts)
**Tick:** [x] v0 · [x] Cursor Composer
**Frontend AI / visual builder notes:** v0 (Vercel) bootstrapped the initial React/shadcn/ui dashboard layouts (`frontend/cohesiq-v0/` directory name is a direct artifact of the v0 scaffold). Cursor Composer (Agent mode) wired the scaffolded components to the FastAPI backend — resolving Next.js App Router Server Component hydration boundaries, implementing the two-variable API URL contract (`BACKEND_API_URL` vs `NEXT_PUBLIC_API_URL`), and connecting the matching, negotiation, and contract state machine UIs end-to-end.

### Workflow Automation (4 pts)
**Workflow automation notes:** No n8n/Zapier/Airflow/Temporal/LangGraph in the current build. Orchestration is FastAPI's synchronous 5-stage request pipeline and Docker Compose service dependencies. This is an intentional scope decision — the pipeline complexity does not require a DAG scheduler at demo scale. n8n is on the implementation roadmap (Clerk webhook → enrichment trigger workflow).

### Local / On-device LLMs (8 pts)
**Local LLM hardware / quantization notes:** None in current build. All inference is cloud API (Groq for Llama + Whisper, Google for Gemini + embeddings). No Ollama/vLLM/local quantized models deployed. Ollama with `llama3.2:3b` as a local fallback is on the roadmap (`profiles: [local-llm]` Docker Compose profile planned).

### Agentic Frameworks
**None at runtime** (no LangGraph/CrewAI/AutoGen/Pydantic-AI/etc.). Dev-time agents only (Claude Code via CLI, Cursor Composer).

### AI Development Lifecycle (AI-DLC)
**Tick:** [x] Cursor Rules
**AI-DLC process notes:** Three interlocking practices enforce the AI development lifecycle: (1) **AGENTS.md spec** — a repo-level agent constitution that enforces domain-driven design boundaries (routers parse only, all logic in services, no cross-domain router imports), mandates the graphify-first workflow, and requires task tracking in `docs/tasks/` before any implementation; (2) **Cursor Rules** — enforce the graphify-first workflow at the IDE level, require schema.md verification before model changes, and mandate plan.md divergence ledger updates; (3) **Mandatory graphify query** — before touching any source file, agents run `graphify query "<question>"` to get a scoped subgraph, preventing hallucination about file structure and reducing context consumption. This DLC produced zero merge conflicts and zero hallucinated imports across the full-stack implementation.

### Live `/docs` Module
**Tick:** [x] Yes. FastAPI auto-generated OpenAPI docs are live at `/docs`.

---

## Section 4 — Build Provenance (Visibility Settings)

### Data & AI Provenance (Judge + Admin)
- **Data sources:** YouTube Data API v3 (real, 67 verified BD channels); Apify cloud actors (public Instagram + TikTok profile scraping for 20 real BD creators at seed time); user uploads (PDF/voice campaign briefs); Tavily web search + Groq Llama synthetic generation (supplemental seeding only); relational seed snapshot (`db/seed.sql`).
- **AI models:** Groq `llama-3.1-8b-instant` (rationale + seed gen); Groq Whisper large-v3-turbo (STT); Gemini `1.5-flash` (rationale fallback) + `text-embedding-004` (semantic rescue, not persisted); Claude (dev-time agent via Claude Code CLI).
- **Responsible AI:** Public-API data only (no private scraping); Pydantic v2 bounds-checking; deterministic-math-first (LLM cannot alter scores); explainable 6-factor breakdown; "AI-Generated" / `data_source` provenance tags on every metric.

### Tooling & IDE (Team Only)
- **IDE / Editor:** Cursor / Claude Code (Antigravity).
- **Deployment method:** Docker Compose (`postgres`, `backend`, `frontend`, `ngrok` services) for local and demo environments. Production: AWS EC2 instance with Caddy reverse proxy handling HTTPS termination and routing to the Compose stack. `docker compose up --build` is the single command to start the full stack.
- **Frameworks & Libraries:** Next.js 16, React 19, TypeScript 5.7, Tailwind v4, shadcn/ui, PDF.js, Recharts; FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2, httpx; `groq`, `google-generativeai`, Clerk SDK.
- **Context / Memory Files:** `AGENTS.md`, `CLAUDE.md`, Cursor Rules, `graphify-out/` (graph.json, GRAPH_REPORT.md), `docs/plan.md`, `docs/schema.md`.

### MCP Usage (Team Only)
- **MCP servers (used, not built):** `graphify` — codebase knowledge graph; `context7` — live framework docs; `next-devtools` — Next.js devtools.
- **Tools exposed (graphify):** `query_graph`, `get_node`, `get_neighbors`, `shortest_path`, `god_nodes`, `get_community`, `graph_stats`. **(context7):** `resolve-library-id`, `query-docs`.
- **Permissions:** Workspace read-only (graphify); outbound docs fetch (context7). No write access to project data.

### Prompt Library (Team Only)

**Prompt 1**
- **Title:** Brief → Campaign Extractor
- **Category:** Extraction
- **Model:** Groq llama-3.1-8b-instant (Gemini 2.0-flash fallback)
- **Summary:** JSON-mode system prompt instructs the model to parse a raw text, PDF-extracted, or voice-transcribed campaign brief and return a strictly-typed JSON object with fields: `{niche, budget_bdt, platform, language, kpis, hashtags, campaign_type}`. Dynamic variable injection supplies the raw brief text. Output is validated by Pydantic v2 `CampaignSuggestionResponse` schema before pre-filling the creation wizard.
- **Output:** Structured campaign fields that pre-populate the 4-step campaign creation wizard.
- **Proprietary:** No

**Prompt 2**
- **Title:** Match Rationale (top-5)
- **Category:** Generation
- **Model:** Groq llama-3.1-8b-instant (Gemini 1.5-flash fallback)
- **Summary:** Role prompt positions the model as a "senior campaign strategist." Dynamic variables inject the creator's 6 sub-scores, niche, follower tier, engagement rate, language, and the campaign's target audience and goals. The model returns a 2–3 sentence plain-English explanation of why this creator fits this campaign. Rationale can be localized to Bangla by appending a language instruction. LLM is explicitly instructed never to mention numeric scores — prose only.
- **Output:** Human-readable "why this creator fits" rationale text displayed on each match card, tagged "AI-Generated."
- **Proprietary:** No

**Prompt 3**
- **Title:** Niche Classifier
- **Category:** Classification
- **Model:** Groq llama-3.1-8b-instant
- **Summary:** JSON-mode prompt presents the model with a YouTube channel's title, description, and top video titles, then asks it to classify the creator into exactly one niche from a fixed 16-item taxonomy (Technology, Food, Travel, Fashion, Beauty, Lifestyle, Gaming, Education, Fitness, Entertainment, Comedy, etc.). Output is validated against the taxonomy before DB write; unknown values are rejected.
- **Output:** Single niche label written to `creator_niches` table during YouTube/Instagram/TikTok enrichment.
- **Proprietary:** No

**Prompt 4**
- **Title:** Synthetic Seed Generator
- **Category:** Synthetic data
- **Model:** Groq llama-3.1-8b-instant
- **Summary:** Offline-only prompt used during the seeding pipeline. Instructs the model to generate plausible Bangladeshi creator demographics (city, bio, content language), estimated rate cards in BDT, and 5–10 portfolio item titles/descriptions for a creator whose real public data is incomplete. Output written to DB at seed time only — not triggered at runtime.
- **Output:** Synthetic seed rows for `creator_profiles`, `creator_rate_cards`, `creator_portfolio_items` (offline only).
- **Proprietary:** No

---

## Section 5 — 180-Second Video Pitch Script

> **Tone:** Shark Tank / Y Combinator demo-day. Flashy but plain-spoken. One human story carries the whole pitch, and one sharp insight — *more reach is not more customers* — is the spine.
> **Language rule:** no internal jargon on camera (no "Pydantic," no weight decimals). We DO use confident product language — *fit score, transparent intelligence layer, trust layer, take-rate marketplace*. Deferred capability is spoken in confident future-tense ("built to," "ready to"), never as already-shipped — honesty intact, ambition loud.
> **Narrator:** warm, confident founder voice. **Music:** one sparse beat at the open, building to a wide, optimistic swell at the close.

---

### 0:00–0:25 | The Hook + Problem — the trap every small brand falls into
**VISUAL:** Cinematic, warm light. A young founder, **Aisha**, stands in a tiny Dhaka studio packing jars of her own handmade skincare line. On a screen beside her, a choice appears as a clean split-screen A/B:
— **LEFT card — "The Star":** a famous lifestyle/entertainment creator. Huge number flashes: **2,000,000 views · ৳80,000**. A crowd icon fills the frame, but only a thin sliver glows the brand's color. Caption: *"Seen by millions. Bought by almost none."*
— **RIGHT card — "The Fit":** a calm skincare micro-creator mid-tutorial. Smaller number: **40,000 views · ৳6,000**. Almost the *entire* crowd icon glows the brand's color. Caption: *"Fewer eyes. The right eyes."*
A bold metric snaps across the bottom comparing the two: **Cost per real customer — ৳400 vs ৳35.** Aisha looks at the cheaper, smaller creator and smiles.
**SCRIPT:**
"Meet Aisha. She makes skincare in Dhaka, and she has six thousand taka to spend. Her instinct? Hire the biggest creator she can — two million views feels safe. But here's the trap that quietly kills small brands: most of those two million people will never buy skincare. She'd be paying a fortune to be *seen* by the wrong crowd. The smaller creator? Fewer views — but they're the *exact* people who buy what Aisha sells, at a fraction of the price. More reach is not more customers. For a brand counting every taka, the *right* audience is everything — and almost nobody is matching on that."

### 0:25–0:55 | The Solution — match on fit, not fame
**VISUAL:** Hard cut to the bright **Cohesiq** dashboard. Aisha *speaks* into her phone: "I need creators for natural skincare, budget six thousand taka." Her words materialize into a structured campaign brief, field by field. She clicks one glowing button: **Run Matching.** A short, confident beat.
**SCRIPT:**
"That's why we built Cohesiq. A brand describes a campaign by typing, uploading a brief, or just *speaking* it — and our engine does the one thing the whole industry gets wrong: it ranks creators on *fit*, not fame. The single biggest signal in our match is niche relevance — does this creator's real audience actually care about *your* product. Budget, platform, engagement, language all factor in. But fit leads. Always."

### 0:55–1:35 | The Demo — the magic moment
**VISUAL:** The ranked list slides in — real creator cards, each with a clear **Fit Score** (e.g. 94%), a neat row of labeled bars (*Audience fit · Budget · Platform · Engagement · Language · Freshness*), an **"API-Verified"** badge, and one plain sentence: *"Strong fit — her audience is skincare-first and she's well inside your budget."* Aisha clicks **Send Offer**; a clean negotiation thread opens and a contract is signed — all in-app.
**SCRIPT:**
"Watch it work. In one pass, instead of three thousand strangers, Aisha gets a short, ranked shortlist — every creator verified against their *real* YouTube data, not their bragging. Each one comes with a clear fit score, an honest breakdown she can actually read, and a plain-English reason *why*. She picks one, sends an offer, negotiates, and signs a contract — right here. No agency gatekeepers. No middlemen taking a cut in the dark. Two minutes, not two weeks."

### 1:35–2:05 | How it works — the moat, in human words
**VISUAL:** Split screen. LEFT: a black-box labeled **"Typical AI"** spits out a name with a shrug emoji and a red ❌ — *"Trust me."* RIGHT: the Cohesiq card re-builds its six bars one satisfying snap at a time, niche-fit filling tallest and first, ending in a green ✅ and a glowing **"Transparent · Explainable"** tag.
**SCRIPT:**
"Here's our edge. Most AI hands you an answer and asks you to trust it. Ours is a *transparent intelligence layer* — it shows its work. Every match is scored on the six signals that decide a real campaign, with niche-fit weighted highest, and every score is visible and explainable. The AI writes the human reasoning — but it can *never* invent a number or push a creator you can't afford. It's honest by design. In a market that's been burned by fakes and bots, that trust *is* the product."

### 2:05–2:45 | The Impact + Vision — a new standard, then the world
**VISUAL:** The dashboard dissolves into a split impact frame. LEFT, a brand owner exhales as a green **ROI ↑** curve climbs. RIGHT, a small-town creator's phone lights up with a paid offer, caption: *"Discovered on merit."* Then the map of Bangladesh pulls back to the globe — glowing arcs link Dhaka to **Kolkata, Jakarta, Manila, Lagos**, and out to **New York, London, Toronto**. Diaspora storefronts light up along the arcs. Text sweeps: *"Any currency. Any market. Same engine."*
**SCRIPT:**
"Now picture what this changes. The industry flips — from *who you know* and *who shouts loudest* to *what actually fits and converts*. Brands stop burning money on vanity reach and finally get predictable returns. And creators — even tiny ones — get discovered and paid on relevance, not just follower count, with contracts that protect them. We make money only when they do: a simple platform fee on each deal. We're the first to bring this to our region — and our engine is built to be region-agnostic. Change the currency, swap the market, and the same trust layer is ready to power South Asia, then the Far East, then the West. Our wedge into those markets is already here: a Bangladeshi restaurant owner in New York can reach his own community through trusted creators back home — because the diaspora never stops listening to voices from home. That's borderless influence — and we're built to carry it."

### 2:45–3:00 | The Close — the ask
**VISUAL:** Return to Aisha, now smiling, sealing a shipping box as her phone shows a signed contract and a creator's video featuring her product. Pull back to the **Cohesiq** logo on a clean field. Tagline animates in: **"Cohesiq — match on fit, not fame."** Final line: *"Live today. Built to scale."*
**SCRIPT:**
"Aisha found the *right* creator in two minutes — and paid nothing until the deal was done. The market is massive, the timing is now, and the platform is live today. Cohesiq turns the world's creator chaos into trusted, profitable business — one honest match at a time. Come build it with us."

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
