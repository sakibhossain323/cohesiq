# Architecture Diagram

> **As-built system architecture** — reflects what is actually running in Docker Compose.
> Focuses on *how the system is deployed and structured* — not what data flows where (see `dfd.md`).
>
> Two views are provided:
> 1. **Runtime topology** — containers, ports, network, and external services
> 2. **Internal structure** — Next.js rendering model and FastAPI domain layout

---

## 1. Runtime Topology

```mermaid
flowchart TB
    subgraph Browser[Browser]
        BrandUI[Brand Dashboard\nNext.js hydrated client]
        CreatorUI[Creator Dashboard\nNext.js hydrated client]
    end

    subgraph Docker["Docker Compose Network (cohesiq_default)"]
        subgraph FE["frontend container · :3000"]
            NextJS["Next.js 16 App Router\nReact 19 · Tailwind v4 · shadcn/ui"]
            ClerkMW["Clerk Middleware\nproxy.ts — auth gate +\nrole-based redirect"]
        end

        subgraph BE["backend container · :8000"]
            FastAPI["FastAPI · Python 3.12\nSQLAlchemy 2.0 Async"]
            Domains["Domains\nauth · brands · creators (+ normalization)\ncampaigns (+ contracts) · common"]
            Services["Services\nmatching.py · matching_config.py\nsemantic_match.py · llm_matching.py · youtube/"]
            Alembic["Alembic\nmigrations (0001 → 0017)"]
        end

        subgraph DB["db container · :5432"]
            PG["PostgreSQL 16\nRelational store\nAll business data"]
        end
    end

    subgraph External[External Services]
        ClerkSvc["Clerk\nRS256 JWT auth\nuser identity + webhooks"]
        GroqAPI["Groq API\nLLaMA-3.1-8b-instant\nPrimary LLM for:\n• match rationale\n• brief analyzer\n• niche classification"]
        GeminiAPI["Gemini API\ntext-embedding-004 (semantic embeddings)\ngemini-1.5-flash (matching rationale fallback)\ngemini-2.0-flash (brief analyzer fallback)"]
        YTAPI["YouTube Data API v3\nPublic channel & video stats\nChannels.list · Videos.list\nPlaylistItems.list · TopicDetails"]
        TavilyAPI["Tavily Search API\nReal creator discovery\n(seeding pipeline — Operator only)"]
    end

    Browser -->|HTTP/HTTPS :3000| ClerkMW
    ClerkMW --> NextJS
    NextJS -->|BACKEND_API_URL\nhttp://backend:8000\nServer Components & Actions| FastAPI
    Browser -->|NEXT_PUBLIC_API_URL\nhttp://localhost:8000\nClient Components| FastAPI
    FastAPI --> Domains --> Services
    Services --> PG
    Domains --> PG
    Alembic -.manages schema.-> PG

    FastAPI <-->|RS256 JWT validation| ClerkSvc
    ClerkSvc -->|webhook: user.created / deleted| FastAPI
    NextJS -->|analyze-brief Server Action\nLLaMA primary · Gemini 2.0 fallback| GroqAPI
    NextJS -->|analyze-brief fallback| GeminiAPI
    Services -->|match rationale · niche classification\nLLaMA primary| GroqAPI
    Services -->|matching rationale fallback\ntext-embedding-004 semantic embeddings| GeminiAPI
    GroqAPI -->|JSON structured output| Services
    GroqAPI -->|JSON structured output| NextJS
    GeminiAPI -->|embeddings · fallback rationale| Services
    GeminiAPI -->|fallback brief analysis| NextJS
    Domains -->|Channels.list · PlaylistItems.list\nVideos.list · 1–3 units/call| YTAPI
    YTAPI -->|channel stats · recent videos\ntopic categories| Domains
    Domains -->|channel discovery during seeding| TavilyAPI
```

---

## 2. Internal Structure

### 2a. Next.js — Server / Client Island Pattern

```mermaid
flowchart TB
    subgraph AppRouter["Next.js App Router · app/(dashboards)/"]
        subgraph BrandRoutes["brand/dashboard/"]
            BP["campaigns/page.tsx\n— async Server Component\n— fetches via BACKEND_API_URL"]
            BPC["_components/CampaignDetailClient.tsx\n— 'use client'\n— Pipeline Kanban + Contract tabs"]
            BPM["_components/ContractCreateModal.tsx\n— 'use client' Dialog\n— 3-step: type → clauses → summary"]
            BPCard["_components/ContractCard.tsx\n— 'use client'\n— state machine + brand actions"]
            BPA["_actions/\n— Server Actions\n— analyze-brief (Groq primary · Gemini 2.0 fallback)\n— update-application · campaign-actions"]
        end

        subgraph CreatorRoutes["creator/dashboard/"]
            CP["contracts/page.tsx\n— async Server Component"]
            CPC["_components/CreatorContractsClient.tsx\n— 'use client'\n— Active / Completed tabs\n— inline draft + live URL submit"]
            COLLAB["collaborations/\nCollaborationsClient.tsx\n— invitations, applications\n— links to contracts page"]
        end

        subgraph SharedLib["lib/"]
            APIClient["api/client.ts\nfetchApi() — base fetch wrapper\nroutes BACKEND vs NEXT_PUBLIC"]
            Contracts["api/contracts.ts\nAll contract API calls"]
            Campaigns["api/campaigns.ts\ncreateApplication, updateStatus, etc."]
            Types["types.ts\nContract · Application · Campaign\nContractType · ContractStatus\nAIMatchScore (6 sub-scores)"]
            Utils["utils.ts\nformatBDT · formatDate · daysUntil"]
        end
    end

    BP --> APIClient
    BPC --> APIClient
    BPM --> Contracts
    BPCard --> Contracts
    CP --> APIClient
    CPC --> Contracts

    APIClient --> Contracts & Campaigns
    Contracts & Campaigns --> Types
```

### 2b. FastAPI — Domain Structure

```mermaid
flowchart TB
    subgraph FastAPIApp["FastAPI app · backend/app/"]
        MainPY["main.py\napp factory + router mounts\nCORS · lifespan"]

        subgraph Domains["Domains (DDD layout)"]
            Auth["auth/\nrouter · service\nClerk JWT → get_current_user"]
            Brands["brands/\nrouter · service · schemas\nBrand profile CRUD"]
            Creators["creators/\nrouter · service · schemas\n★ normalization.py\nCreator + social profiles · rate cards\nportfolio · YouTube enrichment endpoint\nPOST /creators/{id}/platforms/youtube/enrich"]
            Campaigns["campaigns/\nrouter · service · schemas · models\n★ Campaign · Application\n★ Contract (as-built)\nReview · AIMatchScore (6 sub-scores)"]
            YouTubeDomain["youtube/\nStateless public-API client\nrouter · service · schemas\nChannels · Videos · Enrichment"]
            Common["common/\ndependencies.py\nget_db · get_current_user"]
            Webhooks["webhooks/\nClerk webhook handler\nuser.created → sync to DB"]
        end

        subgraph ServiceLayer["services/ (cross-domain)"]
            MatchConfig["matching_config.py\nSCORE_WEIGHTS · budget thresholds\nsemantic caps · TOP_MATCH_LIMIT"]
            Matching["matching.py\nDeterministic weighted scorer\nniche(.35) · budget(.30) · platform(.15)\nengagement(.10) · language(.08) · recency(.02)"]
            Semantic["semantic_match.py\nGemini text-embedding-004\n+ token-similarity fallback"]
            LLMMatch["llm_matching.py\nGroq LLaMA-3.1-8b-instant (primary)\nGemini 1.5 Flash (fallback)\nHeuristic (final fallback)"]
        end

        subgraph Scripts["scripts/ (Operator)"]
            SeedReal["seed_real_youtube_creators.py\n19 BD YouTube channels\nGroq niche classification"]
            SeedSynth["generate_seed_data.py\nTavily + Groq LLaMA\nsynthetic creators + brands"]
        end

        MainPY --> Auth & Brands & Creators & Campaigns & YouTubeDomain & Webhooks
        Campaigns --> MatchConfig & Matching & Semantic & LLMMatch
        Matching --> MatchConfig
        Creators --> YouTubeDomain
        Common -.injected into.-> Auth & Brands & Creators & Campaigns
        Scripts -.operator-only.-> Creators & YouTubeDomain
    end
```

---

## 3. Request Paths

### Brand: "Run Matching"
```
Browser → Next.js (Client) → POST http://localhost:8000/campaigns/{id}/run-matching
→ FastAPI → campaigns/router → campaigns/service.run_campaign_matching
→ services/matching_config.py (SCORE_WEIGHTS · thresholds)
→ services/matching.py (6-signal deterministic scorer)
→ services/semantic_match.py (Gemini text-embedding-004 — semantic rescue if niche=0)
→ services/llm_matching.py
    → Groq LLaMA-3.1-8b-instant (primary — match rationale top-N)
    → Gemini 1.5 Flash (fallback)
    → Heuristic (final fallback)
→ ai_match_scores (INSERT / UPDATE — all 6 sub-scores + score_semantic) → PostgreSQL
→ JSON response → CampaignDetailClient (Matches tab — 6-bar breakdown)
```

### Brand: "Analyze Campaign Brief"
```
Browser → Campaign Wizard → Server Action: analyzeBriefAction (analyze-brief.ts)
→ Groq LLaMA-3.1-8b-instant (primary — structured JSON: visibility, niche, budget, hashtags, KPIs)
→ Gemini 2.0 Flash (fallback if Groq unavailable)
→ pre-fills wizard fields; brand edits before submit
```

### Creator: "YouTube Channel Enrichment"
```
Backend or Operator → POST /creators/{id}/platforms/youtube/enrich
→ FastAPI → creators/router → creators/service
→ app/youtube/service.get_channel_enrichment (Channels.list + PlaylistItems.list + Videos.list · ~3 units)
→ creators/normalization.py
    → YOUTUBE_CATEGORY_MAP (deterministic niche from topic URLs)
    → Groq LLaMA-3.1-8b-instant (optional — niche from channel/video descriptions)
    → Bangla/English/Banglish heuristic (language detection)
    → city normalization
→ creator_social_profiles (UPSERT — is_api_verified=true, data_source="verified") → PostgreSQL
→ creator_portfolio_items (UPSERT by content_url — recent video imports) → PostgreSQL
```

### Brand: "Accept Creator → Create Contract"
```
Browser → ApplicationDrawer "Accept & Set Contract Terms" button
→ Server Action: updateApplicationStatus(accepted)
→ PATCH http://localhost:8000/campaigns/{id}/applications/{appId} → PostgreSQL
→ ContractCreateModal opens (client-side)
→ Step 1: choose type → Step 2: clauses → Step 3: review fee breakdown
→ POST http://localhost:8000/campaigns/{id}/applications/{appId}/contract
→ FastAPI: campaigns/service.create_contract
→ platform_fee_percentage locked from CONTRACT_FEE_MAP
→ contracts INSERT → PostgreSQL
→ Modal closes → CampaignDetailClient switches to "Contracts" tab
```

### Creator: "Submit Draft Content"
```
Browser → CreatorContractsClient draft URL input + submit
→ PATCH http://localhost:8000/contracts/{id}/submit-draft
→ FastAPI: campaigns/service.submit_content_draft
→ validates status == active | in_production, validates creator ownership
→ contracts UPDATE (draft_content_url, status → content_submitted, submitted_at)
→ PostgreSQL → response → UI updates status chip + next-action callout
```

---

## 4. Environment Variables

| Variable | Consumed by | Value in Docker |
|---|---|---|
| `BACKEND_API_URL` | Server Components, Server Actions | `http://backend:8000` |
| `NEXT_PUBLIC_API_URL` | Browser / Client Components | `http://localhost:8000` |
| `CLERK_SECRET_KEY` | FastAPI JWT validation | Clerk dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend SDK | Clerk dashboard |
| `GROQ_API_KEY` | `llm_matching.py` (primary), `normalization.py` (niche), `analyze-brief.ts` (primary), `generate_seed_data.py` | Groq console |
| `GEMINI_API_KEY` | `semantic_match.py` (embeddings), `llm_matching.py` (fallback), `analyze-brief.ts` (fallback) | Google AI Studio |
| `YOUTUBE_API_KEY` | `app/youtube/service.py` — all YouTube API calls | Google Cloud Console |
| `TAVILY_API_KEY` | `scripts/generate_seed_data.py` — real creator discovery (seeding only) | Tavily dashboard |
| `DATABASE_URL` | SQLAlchemy engine (backend) | `postgresql+asyncpg://…@db:5432/cohesiq` |

> **Critical rules:**
> - Never use `BACKEND_API_URL` in a Client Component — it is not exposed to the browser.
> - Never use `NEXT_PUBLIC_API_URL` in a Server Component — it routes to localhost which is not reachable inside the Docker network.
> - Never expose `YOUTUBE_API_KEY` through any `NEXT_PUBLIC_` variable — it is server-side only.
> - `GROQ_API_KEY` is server-side only. `GEMINI_API_KEY` is server-side only.
