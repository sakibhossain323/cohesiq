# Data Flow Diagram (DFD)

> **Logical view** — shows what data moves through the system and how it is transformed.
> Technology-agnostic: does not specify Docker, PostgreSQL, FastAPI, React, or any vendor.
> For physical deployment and technology stack, see `architecture.md`.
>
> **Validated against** (2026-06-10): `backend/app/campaigns/service.py` (offer/negotiate/conflict),
> `backend/app/campaigns/router.py`, `backend/app/admin/router.py`,
> `frontend/cohesiq-v0/app/api/transcribe/route.ts`,
> `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/new/_components/StepIntro.tsx`,
> `frontend/cohesiq-v0/components/negotiation/NegotiationDrawer.tsx`.
>
> **Changelog (corrections applied 2026-06-10):**
> - Added process **P9 Offer & Negotiation** (offer → counter → accept/decline; new data store D7).
> - Added the **Speech-to-Text** flow into P2 (voice brief → AI speech service → transcript).
> - Noted that **PDF brief extraction happens client-side** (in the brand's browser) — only the
>   extracted text enters P2, so no PDF document store exists server-side.
> - Added process **P10 Platform Administration** (admin moderation over existing stores).
> - Web Search / synthetic-seed (P8 → SearchSvc) demoted to a deprecated seeding note — primary
>   seeding is now a bulk SQL load, not a runtime flow.
>
> Notation:
> - **Rounded rectangles** (`([Name])`) — External entities (people or systems outside Cohesiq)
> - **Stadiums** (`([Name])`) — Processes (transform or act on data)
> - **Cylinders** (`[(Name)]`) — Data stores (persistent data at rest)
> - **Arrows** — labeled with the *data payload* only, not the mechanism or condition

---

## Context Diagram (Level 0)

The system as a black box. External actors exchange data with Cohesiq.

```mermaid
flowchart LR
    Brand([Brand / SME])
    Creator([Social Creator])
    Operator([Platform Operator])
    AdminA([Platform Admin])
    YouTube([YouTube\nPublic Channel Data])
    LLM([AI Language Service\nrationale · brief · niche])
    STT([AI Speech Service\nvoice → text])
    Embed([AI Embedding Service\nsemantic similarity])
    Auth([Identity Provider])

    subgraph COHESIQ[Cohesiq Platform]
        SYS((Cohesiq\nInfluencer Marketplace))
    end

    Brand    -->|campaign briefs, voice/PDF input, offers, contract terms| SYS
    Creator  -->|profile data, proposals, counter-offers, content submissions| SYS
    Operator -->|seed commands, sync triggers| SYS
    AdminA   -->|moderation actions (toggle, delete, status)| SYS

    SYS -->|match results, ranked creators, offer/contract status| Brand
    SYS -->|campaign listings, offers, contract terms, notifications| Creator
    SYS -->|platform stats, user/campaign/review lists| AdminA

    Auth  <-->|identity verification, user events| SYS
    YouTube -->|public channel stats, video metadata, topic categories| SYS
    LLM   <-->|natural language prompts and responses| SYS
    STT   -->|transcript from voice brief| SYS
    Embed <-->|text for embedding, similarity vectors| SYS
```

> **Seeding note:** demo data is bulk-loaded from `db/seed.sql` (real platform data) by the
> Operator. The legacy Web Search (Tavily) synthetic-discovery path is deprecated and no longer a
> live data flow.

---

## Level 1 DFD — Major Processes

```mermaid
flowchart TB
    %% ── EXTERNAL ENTITIES ──────────────────────────────────────
    Brand([Brand])
    Creator([Creator])
    Operator([Operator])
    Admin([Admin])
    Auth([Identity Provider])
    YouTube([YouTube\nPublic Channel Data])
    LLMSvc([AI Language Service])
    STTSvc([AI Speech Service])
    EmbedSvc([AI Embedding Service])

    %% ── DATA STORES ────────────────────────────────────────────
    D1[(D1\nUser & Profile Data)]
    D2[(D2\nCampaign &\nApplication Data)]
    D3[(D3\nContract Data)]
    D4[(D4\nMatch Scores)]
    D5[(D5\nReviews)]
    D6[(D6\nCreator Portfolio)]
    D7[(D7\nNegotiation Turns)]

    %% ── PROCESSES ──────────────────────────────────────────────
    P1([P1\nIdentity &\nOnboarding])
    P2([P2\nCampaign\nCreation])
    P3([P3\nCreator Profile\nManagement])
    P4([P4\nAI Matching\n& Ranking])
    P5([P5\nApplication\nPipeline])
    P6([P6\nContract\nManagement])
    P7([P7\nContent\nExecution])
    P8([P8\nCreator Data\nEnrichment])
    P9([P9\nOffer &\nNegotiation])
    P10([P10\nPlatform\nAdministration])

    %% ── P1: IDENTITY & ONBOARDING ──────────────────────────────
    Brand   -->|registration details, role| P1
    Creator -->|registration details, role| P1
    P1      <-->|identity token, user events| Auth
    P1      -->|verified user record| D1

    %% ── P2: CAMPAIGN CREATION ──────────────────────────────────
    Brand   -->|title, brief, budget, platforms, requirements| P2
    Brand   -->|voice brief (audio)| P2
    P2      -->|audio clip| STTSvc
    STTSvc  -->|transcript| P2
    Brand   -->|PDF brief text (extracted in browser)| P2
    P2      -->|campaign brief| LLMSvc
    LLMSvc  -->|suggested campaign type, niche, hashtags, KPIs| P2
    D1      -->|brand profile| P2
    P2      -->|campaign record| D2

    %% ── P3: CREATOR PROFILE MANAGEMENT ─────────────────────────
    Creator -->|name, niches, languages, social handles, rate cards| P3
    P3      -->|creator profile| D1

    P3      -->|channel identifier| YouTube
    YouTube -->|channel stats, video metadata, topic categories| P3
    P3      -->|channel and video descriptions| LLMSvc
    LLMSvc  -->|inferred content niche| P3
    P3      -->|verified channel profile| D1
    P3      -->|recent video items| D6

    %% ── P4: AI MATCHING & RANKING ──────────────────────────────
    Brand   -->|match request| P4
    D2      -->|campaign requirements| P4
    D1      -->|creator profiles| P4
    D6      -->|recent content items| P4

    P4      -->|campaign and creator text| EmbedSvc
    EmbedSvc -->|semantic similarity score| P4

    P4      -->|top candidate profiles and campaign brief| LLMSvc
    LLMSvc  -->|match rationale| P4

    P4      -->|ranked matches with scores and rationale| D4
    D4      -->|ranked creator cards with explanations| Brand

    %% ── P5: APPLICATION PIPELINE ───────────────────────────────
    Creator -->|proposal text, proposed rate| P5
    Brand   -->|invitation to creator| P5
    Brand   -->|shortlist, accept, or reject decision| P5
    Creator -->|accept or decline invitation| P5
    P5      -->|application record| D2
    P5      -->|status update| D2
    D2      -->|application list| Brand
    D2      -->|applications and invitations| Creator

    %% ── P9: OFFER & NEGOTIATION ─────────────────────────────────
    Brand   -->|offer (type, clauses, deliverable subset, rate)| P9
    D2      -->|shortlisted / applied application| P9
    P9      -->|drafted contract + deliverable subset| D3
    P9      -->|opening offer turn| D7
    Creator -->|counter-offer (message, rate, term deltas)| P9
    Brand   -->|counter-offer| P9
    P9      -->|negotiation turn| D7
    D7      -->|offer/counter thread (polled live)| Brand
    D7      -->|offer/counter thread (polled live)| Creator
    Brand   -->|accept / decline offer| P9
    Creator -->|accept / decline offer| P9
    P9      -->|activated contract, agreed rate| D3
    P9      -->|application status (pending_agreement → accepted)| D2

    %% ── P6: CONTRACT MANAGEMENT ────────────────────────────────
    Brand   -->|clause adjustments| P6
    D2      -->|accepted application| P6
    P6      -->|contract terms and status| D3
    D3      -->|contract details and state| Brand
    D3      -->|contract details and next action| Creator

    %% ── P7: CONTENT EXECUTION ──────────────────────────────────
    Creator -->|draft content link| P7
    P7      -->|draft submission| D3
    D3      -->|draft link| Brand
    Brand   -->|approval or revision request| P7
    P7      -->|status update| D3
    Creator -->|published content link| P7
    P7      -->|live content link| D3
    Brand   -->|close instruction| P7
    P7      -->|closed status| D3
    P7      -->|collaboration completed| D2
    Brand   -->|rating and review| P7
    Creator -->|rating and review| P7
    P7      -->|review record| D5
    D5      -->|updated average rating| D1

    %% ── P8: CREATOR DATA ENRICHMENT ─────────────────────────────
    Operator  -->|seed (bulk SQL) and sync commands| P8

    P8      -->|channel identifier| YouTube
    YouTube -->|channel stats, video metadata, topic categories| P8
    P8      -->|channel and video descriptions| LLMSvc
    LLMSvc  -->|inferred niche label| P8

    P8      -->|normalised creator profiles| D1
    P8      -->|video portfolio items| D6

    %% ── P10: PLATFORM ADMINISTRATION ────────────────────────────
    Admin   -->|moderation action (toggle active, delete)| P10
    Admin   -->|campaign status update / archive| P10
    Admin   -->|review removal| P10
    D1      -->|users & profiles| P10
    D2      -->|campaigns & applications| P10
    D5      -->|reviews| P10
    P10     -->|user status / deletion| D1
    P10     -->|campaign status change| D2
    P10     -->|review deletion| D5
    P10     -->|aggregate platform stats| Admin
```

> **Seeding note:** the legacy P8 → Web Search synthetic-discovery and LLM profile-generation
> sub-flows are deprecated. Demo data is now bulk-loaded from `db/seed.sql`; only the live YouTube
> enrichment + niche-inference sub-flows remain active in P8.

---

## Data Flow Annotations

| Arrow | Data payload | Significance |
|---|---|---|
| Brand → P2 → LLM → P2 | Campaign brief | AI brief analyzer extracts structure from free text; brand reviews and edits before saving |
| P4 → EmbedSvc → P4 | Campaign and creator text | Semantic similarity used as a rescue signal when niche matching fails; score is capped to prevent overriding hard mismatches |
| P4 → LLM → P4 | Top candidate profiles and brief | Rationale generated on top candidates only, after all scoring is complete |
| P4 → D4 | Ranked matches with scores and rationale | Six scoring signals surfaced to brand UI; semantic score shown only when rescue fired |
| P3 → YouTube → P3 | Channel identifier → channel stats | API-verified stats overwrite self-reported data; creator profile flagged as verified |
| P3 → LLM → P3 | Channel and video descriptions | Niche inferred from content text when platform topic data is insufficient |
| P3 → D6 | Recent video items | Portfolio items drive recency scoring in P4 |
| P6 → D3 | Contract terms and status | Platform fee percentage is locked at contract creation and cannot be changed retroactively |
| P7 → D3 (revision count) | Status update | Each revision request increments a counter; further requests are rejected once the limit is reached |
| P7 → D2 | Collaboration completed | Marks the application as review-eligible for both parties |
| P8 → D1 | Normalised creator profiles | All ingested data is tagged with a provenance label (verified, estimated, or self-reported) for ethical-AI disclosure in the UI |
| Brand → P2 → STTSvc → P2 | Voice brief audio → transcript | Brand can dictate a campaign brief; the speech service returns a transcript that feeds the same AI brief analyzer as typed/PDF input |
| Brand → P2 (PDF text) | Extracted PDF brief text | PDF parsing happens entirely in the brand's browser; only plain text enters the system, so no PDF document is stored server-side |
| P9 ↔ D7 | Offer / counter-offer turns | Each turn snapshots the proposed rate and clause deltas; the thread is polled live (~4 s) by both parties until one accepts |
| P9 → D3 / D2 | Activated contract + status | Sending an offer creates a `drafted` contract; accepting the latest turn activates it and moves the application to `accepted` |
| Admin → P10 → D1/D2/D5 | Moderation actions | Admin-only (role-guarded) operations: toggle/delete users, change/archive campaign status, delete reviews |
