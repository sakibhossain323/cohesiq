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
            Domains["Domains\nauth · brands · creators\ncampaigns (+ contracts) · common"]
            Services["Services\nmatching.py · semantic_match.py\nllm_matching.py · youtube/"]
            Alembic["Alembic\nmigrations (0001 → 0015)"]
        end

        subgraph DB["db container · :5432"]
            PG["PostgreSQL 16\nRelational store\nAll business data"]
        end
    end

    subgraph External[External Services]
        ClerkSvc["Clerk\nRS256 JWT auth\nuser identity + webhooks"]
        GeminiAPI["Gemini 1.5 Flash\nMatch rationale\nBrief analyzer\nNiche classification"]
        YTAPI["YouTube Data API v3\nPublic channel &\nvideo stats"]
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
    Services -->|LLM prompts| GeminiAPI
    GeminiAPI -->|JSON rationale| Services
    Services -->|Channels.list · Videos.list\n1 unit/call| YTAPI
    YTAPI -->|channel stats| Services
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
            BPA["_actions/\n— Server Actions\n— analyze-brief, update-application, etc."]
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
            Types["types.ts\nContract · Application · Campaign\nContractType · ContractStatus"]
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
            Creators["creators/\nrouter · service · schemas\nCreator + social profiles\nrate cards · portfolio"]
            Campaigns["campaigns/\nrouter · service · schemas · models\n★ Campaign · Application\n★ Contract (as-built)\nReview · AIMatchScore"]
            Common["common/\ndependencies.py\nget_db · get_current_user"]
            Webhooks["webhooks/\nClerk webhook handler\nuser.created → sync to DB"]
        end

        subgraph ServiceLayer["services/ (cross-domain)"]
            Matching["matching.py\nDeterministic weighted scorer\nniche·engagement·budget\nplatform·language·recency"]
            Semantic["semantic_match.py\nGemini embedding\n+ token-similarity fallback"]
            LLMMatch["llm_matching.py\nGemini rationale generation"]
            YouTube["youtube/\nStateless API client\nChannels.list · Videos.list"]
        end

        MainPY --> Auth & Brands & Creators & Campaigns & Webhooks
        Campaigns --> Matching & Semantic & LLMMatch
        Matching & Semantic & LLMMatch --> YouTube
        Common -.injected into.-> Auth & Brands & Creators & Campaigns
    end
```

---

## 3. Request Paths

### Brand: "Run Matching"
```
Browser → Next.js (Client) → POST http://localhost:8000/campaigns/{id}/run-matching
→ FastAPI → campaigns/router → campaigns/service → services/matching.py
→ services/semantic_match.py (Gemini embedding)
→ services/llm_matching.py (Gemini rationale, top-N only)
→ ai_match_scores (INSERT / UPDATE) → PostgreSQL
→ JSON response → CampaignDetailClient (Matches tab)
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
| `GEMINI_API_KEY` | services/llm_matching.py, analyze-brief action | Google AI Studio |
| `DATABASE_URL` | SQLAlchemy engine (backend) | `postgresql+asyncpg://…@db:5432/cohesiq` |

> **Critical rule:** Never use `BACKEND_API_URL` in a Client Component — it is not exposed to the browser. Never use `NEXT_PUBLIC_API_URL` in a Server Component — it routes to localhost which is not reachable from inside the Docker network.
