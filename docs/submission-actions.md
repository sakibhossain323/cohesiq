# Submission Actions — AI-Usage Stack Config Handbook

> Branch: **`sakib/ai-score-max`**. Everything here is additive and gated behind Docker
> Compose `profiles:` — the default `docker compose up` (postgres/backend/frontend) is
> **unchanged**, so the live demo cannot break. This file is the single place that tells you
> what to configure and how to turn each piece on.

What was built on this branch (all real, all demonstrable):

| Piece | What it is | Profile | Default state |
|---|---|---|---|
| **Cohesiq MCP server** | FastMCP server exposing the matching engine + admin reads as MCP tools (stdio + HTTP) | `ai` / `mcp` | Off (opt-in) |
| **Admin AI Assistant** | LangChain agent (Groq) that calls the MCP server's tools — new admin tab | always in backend | On if `GROQ_API_KEY` set |
| **Prometheus + Grafana** | `/metrics` on backend + scraping + a provisioned dashboard | `ai` / `observability` | Off (opt-in) |
| **Ollama (Hermes)** | Local open-weight LLM runtime | `local-llm` | Off, model NOT pulled |
| **n8n** | Workflow automation (enrich-on-register stub) | `automation` | Off, workflow not imported |

---

## 1. Environment variables to set

All live in **`backend/.env`** (copy from `backend/.env.example`). The assistant reuses your
existing `GROQ_API_KEY` — if that's already set, the assistant works with zero extra config.

| Var | Default | Needed for | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | — | Admin Assistant | **Required** for the assistant to answer (already used elsewhere). |
| `ASSISTANT_ENABLED` | `true` | Admin Assistant | Set `false` to hard-disable the feature. |
| `ASSISTANT_MODEL` | `llama-3.1-8b-instant` | Admin Assistant | Any Groq chat model. |
| `MCP_HTTP_URL` | `http://mcp:8001/mcp` | Admin Assistant | URL of the MCP server (Docker service name). |
| `OLLAMA_BASE_URL` | _(empty)_ | Local LLM | Leave empty to stay on Groq. Set to `http://ollama:11434` to use Hermes. |
| `OLLAMA_MODEL` | `hermes3` | Local LLM | Model tag to pull/run. |
| `GRAFANA_ADMIN_USER` | `admin` | Grafana | Login user. |
| `GRAFANA_ADMIN_PASSWORD` | `cohesiq` | Grafana | **Change before any public demo.** |
| `N8N_BASIC_AUTH_USER` | `admin` | n8n | Login user. |
| `N8N_BASIC_AUTH_PASSWORD` | `cohesiq` | n8n | **Change before any public demo.** |

> The frontend needs **no** new env vars — the assistant calls the backend through the existing
> `fetchApi()` server-action path.

---

## 2. Turn it on — exact commands

### a) Default stack (unchanged — what the demo runs)
```bash
docker compose up --build           # postgres + backend + frontend, exactly as before
```

### b) AI stack (MCP + Prometheus + Grafana) — the score-maxing demo
```bash
docker compose --profile ai up -d --build mcp prometheus grafana
```
Then:
- **MCP server (HTTP):** `http://localhost:8001/mcp`
- **Backend metrics:** `http://localhost:8000/metrics` (Prometheus text)
- **Prometheus UI:** `http://localhost:9090`
- **Grafana:** `http://localhost:3001` (login `admin` / `$GRAFANA_ADMIN_PASSWORD`) → dashboard
  **Cohesiq → API & Matching** is auto-provisioned.

### c) Admin AI Assistant
1. Make sure `GROQ_API_KEY` is set in `backend/.env` and the `mcp` service is up (step b).
2. Log in as an admin user → sidebar → **AI Assistant**.
3. Ask e.g. *"How many active campaigns are there?"* or *"List the top creators in Beauty."*
   The agent calls the MCP tools and shows which tools it used.
> If Groq or the MCP server is unavailable, the assistant returns a friendly "offline" message
> instead of erroring — the rest of the admin panel is unaffected.

### d) Connect the MCP server to a desktop client (stdio) — optional, extra proof
From `backend/`, an MCP client (Claude Code / Cursor) can launch the server over stdio:
```bash
MCP_TRANSPORT=stdio python -m mcp_server
```
Register it in your MCP client config to call `platform_stats`, `run_matching`, etc. directly.

### e) Local LLM (Ollama + Hermes) — OPTIONAL, heavy (multi-GB)
```bash
docker compose --profile local-llm up -d ollama
docker compose exec ollama ollama pull hermes3      # downloads the model (one-time, large)
# then point the backend at it:
#   OLLAMA_BASE_URL=http://ollama:11434  in backend/.env, and restart backend
```

### f) n8n automation — OPTIONAL
```bash
docker compose --profile automation up -d n8n
# open http://localhost:5678 (admin / $N8N_BASIC_AUTH_PASSWORD)
# Import ops/n8n/workflows/creator-enrich-on-register.json via the UI.
```

---

## 3. What to fill into the submission form after this branch

These move from 0 → scored because they are now **actually built**:

- **MCP servers built:** `cohesiq-matching-mcp` — tools: `platform_stats`, `list_creators`,
  `get_creator`, `run_matching`, `get_match_scores`, `enrich_creator_youtube`.
- **MCP servers used:** Cohesiq MCP (consumed by the admin assistant via `langchain-mcp-adapters`)
  + context7 + graphify.
- **MCP transports used:** stdio **and** streamable HTTP.
- **Agentic frameworks used:** LangChain (+ LangGraph ReAct agent) — the admin AI Assistant.
- **Agent / orchestration notes:** assistant agent loads MCP tools and runs a tool-calling loop.
- **Local LLM runtimes:** Ollama (profile `local-llm`); **model:** Hermes (`hermes3`).
- **Workflow automation:** n8n (profile `automation`) — enrich-on-register workflow.
- **Lineage / observability + Cost & performance:** Prometheus `/metrics` + Grafana dashboard
  (request rate, p95 latency, matching-run + creators-scored + LLM-call counters).
- **Open-source AI tools:** LangChain, LangGraph, FastMCP, prometheus-fastapi-instrumentator.

---

## 4. Safety / rollback
- Nothing here touches the DB schema → no migration → `docs/schema.md` unchanged.
- All new services are profiled; `docker compose down` removes them; named volumes
  (`prometheus_data`, `grafana_data`, `ollama_data`, `n8n_data`) hold their state.
- The whole branch is isolated; merging is optional. To discard: `git checkout main`.
