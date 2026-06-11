# BuildFest — Remaining Implementation Tasks

Only items that require new code. Form-filling content is in `docs/submittable.md`.

---

## DONE — Form content fixes (no code needed)

- [x] Add Apify to §B.1 Data Sources, §B.2 Scrapers/crawlers, §4 Data & AI Provenance
- [x] Expand all short fields to meet character minimums (Scrapers ≥50, MCP servers ≥50, Acquisition details ≥80, Parsers ≥40, Schema validation ≥30, Outbound APIs ≥50, Webhooks ≥30, Embeddings ≥30)
- [x] Fill all empty form fields: Storage details, Dashboards & reports, AI/ML details, Non-AI analytics, Insights delivery, Orchestration, Scheduling/triggers, Streaming/real-time, Open-source data stack, Data quality, Privacy & compliance, Lineage & observability, Cost & performance
- [x] Fill Section 3 empty fields: LLM usage commentary, RAG architecture details, MCP servers used list, MCP clients/hosts, MCP reuse notes, Open-source AI tools, Agent/orchestration notes, Fine-tuning notes, Evaluation & quality, Frontend AI builder notes, Workflow automation notes, AI-DLC process notes
- [x] Add explicit Deployment method field in §4
- [x] Reformat Prompt Library from markdown table to individual numbered entries (form was reading 0 prompts)

---

---

## Quick wins — form ticks only (zero code, copy-paste into form)

These fields are already filled in `docs/submittable.md` but the form checkboxes may not be ticked:

- [ ] **Formats handled** — tick `[x] Markdown` (used in docs/README, graphify output) → unlocks 4th format point (currently 3/4)
- [ ] **Visualization tools** — confirm Recharts + any second tool ticked (D3 inside Recharts counts); currently 2/3
- [ ] **Token optimization tools** — tick `[x] Graphify`, `[x] JSON mode`, `[x] Cheap-model routing` → currently only 1 selected (need all 3 for 6/6)
- [ ] **AI-DLC frameworks** — tick `[x] Cursor Rules` (confirmed in CLAUDE.md) → currently 0/8; also check if `AGENTS.md` maps to any listed framework
- [ ] **Frontend AI builders** — confirm both `v0` AND `Cursor Composer` are ticked; currently 1/5 suggests only one is ticked
- [ ] **MCP servers used** — enter the 3 servers (graphify, context7, next-devtools) individually in the form list; currently 0 items despite section existing

---

## MCP Server (20 pts — biggest single gain)

**What:** Build an MCP server that exposes Cohesiq's matching engine as callable tools.
**Why it scores:** MCP Built (0→10 pts) + MCP Used (0→5 pts) + MCP Transport checkboxes (0→2 pts).

### Tasks

- [ ] Create `backend/mcp_server.py` — FastMCP server exposing at minimum:
  - `run_matching(campaign_id)` — triggers deterministic + semantic match, returns ranked creators
  - `get_match_scores(campaign_id)` — returns persisted sub-scores from `ai_match_scores`
  - `enrich_creator(creator_id, youtube_handle)` — triggers YouTube enrichment pipeline
- [ ] Add `fastmcp` to `backend/requirements.txt`
- [ ] Add `mcp` service to `docker-compose.yml` (or run alongside backend)
- [ ] Test with Claude Code or any MCP client

### Submission form fields unlocked
- MCP servers we built: list `cohesiq-matching-mcp` → 10 pts
- MCP servers we used: list Context7 + Graphify (already used) → 5 pts
- MCP transports: tick stdio/HTTP → 2 pts
- MCP tools exposed: list `run_matching`, `get_match_scores`, `enrich_creator`

---

## pgvector + Persist Embeddings (3 + 5 pts)

**What:** Enable the pgvector extension in Postgres and store Gemini embeddings instead of computing them on every match run.
**Why it scores:** Vector DB checkbox (0→3 pts) + unlocks Contextual RAG checkbox (0→5 pts).

### Tasks

- [ ] Add `pgvector` to the `postgres:16` image in `docker-compose.yml` (use `pgvector/pgvector:pg16` image)
- [ ] Create Alembic migration `0021_add_embedding_column` — add `embedding vector(768)` to `creator_social_profiles`
- [ ] Update `semantic_match.py` — after computing `get_gemini_embedding()`, persist to `creator_social_profiles.embedding`
- [ ] Update matching service — read stored embedding instead of re-calling Gemini if it exists
- [ ] Tick **Vector DB** and **Contextual RAG** checkboxes in submission form

---

## Ollama Local LLM — optional (8 pts)

**What:** Add an Ollama container to Docker Compose running `llama3.2:3b` as a local fallback.
**Why it scores:** Local LLM runtime checkbox (+3 pts) + Ollama bonus (+2 pts) + model listed (+2 pts) = 7 pts.

### Tasks

- [ ] Add `ollama` service to `docker-compose.yml` under `profiles: [local-llm]`
- [ ] Pull `llama3.2:3b` on container start via entrypoint script
- [ ] Add `OLLAMA_BASE_URL` env var; update `llm_matching.py` to try Ollama before Groq when set
- [ ] Document hardware/quantization in submission form

---

## n8n Workflow Automation — optional (6 pts)

**What:** Add n8n to Docker Compose and wire one workflow.
**Why it scores:** Workflow automation checkbox (+4 pts) + n8n bonus (+2 pts) = 6 pts.

### Suggested workflow
New creator registered (Clerk webhook) → HTTP call to `/creators/{id}/platforms/youtube/enrich` → notify brand dashboard

### Tasks

- [ ] Add `n8nio/n8n` service to `docker-compose.yml` under `profiles: [automation]`
- [ ] Create workflow JSON: Clerk webhook trigger → enrichment HTTP node
- [ ] Export workflow JSON to `backend/n8n/workflows/creator-enrich-on-register.json`
- [ ] Document in submission form under Workflow Automation
