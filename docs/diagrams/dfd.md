# Data Flow Diagram (DFD)

> **Level 1 DFD** — shows how data moves through Cohesiq's major processes.
> Focuses on *what data* flows *between what* — not how the system is deployed (see `architecture.md`).
>
> Notation used in Mermaid approximation:
> - **Rectangles** (`[Name]`) — External entities (data sources/sinks outside the system)
> - **Stadiums** (`([Name])`) — Processes (transform or act on data)
> - **Cylinders** (`[(Name)]`) — Data stores (persistent data at rest)

---

## Context Diagram (Level 0)

```mermaid
flowchart LR
    Brand([Brand / SME])
    Creator([Social Creator])
    Operator([Platform Operator])
    YT([YouTube Data API v3])
    GEM([Gemini 1.5 Flash])
    Clerk([Clerk Auth Service])

    subgraph COHESIQ[Cohesiq Platform]
        SYS((Cohesiq\nInfluencer Marketplace))
    end

    Brand   -->|campaign briefs, application decisions, contract terms| SYS
    Creator -->|profile data, proposals, content URLs| SYS
    YT      -->|public channel stats, video metadata| SYS
    GEM     -->|match rationale, brief analysis| SYS
    Clerk   -->|JWT tokens, user identities, webhooks| SYS

    SYS -->|match results, contract status, review prompts| Brand
    SYS -->|campaign listings, contract terms, payment info| Creator
    Operator -->|seed commands, user sync triggers| SYS
```

---

## Level 1 DFD — Major Processes

```mermaid
flowchart TB
    %% ── EXTERNAL ENTITIES ──────────────────────────────────────
    Brand([Brand])
    Creator([Creator])
    Operator([Operator])
    Clerk([Clerk Auth])
    YouTube([YouTube API])
    Gemini([Gemini API])

    %% ── DATA STORES ────────────────────────────────────────────
    DS1[(D1 · Users &\nProfiles)]
    DS2[(D2 · Campaigns &\nApplications)]
    DS3[(D3 · Contracts)]
    DS4[(D4 · Match Scores)]
    DS5[(D5 · Reviews)]

    %% ── PROCESSES ──────────────────────────────────────────────
    P1([P1 · Auth &\nOnboarding])
    P2([P2 · Campaign\nCreation])
    P3([P3 · Creator\nProfile Build])
    P4([P4 · AI\nMatching Engine])
    P5([P5 · Application\nPipeline])
    P6([P6 · Contract\nManagement])
    P7([P7 · Content\nExecution])
    P8([P8 · Data\nIngestion])

    %% ── P1: AUTH & ONBOARDING ──────────────────────────────────
    Brand   -->|register / login| P1
    Creator -->|register / login| P1
    P1      <-->|RS256 JWT validation, user sync webhook| Clerk
    P1      -->|user record + role| DS1

    %% ── P2: CAMPAIGN CREATION ──────────────────────────────────
    Brand   -->|title, brief, budget, visibility, requirements| P2
    P2      -->|AI brief analysis request| Gemini
    Gemini  -->|suggested visibility, niche, hashtags| P2
    P2      -->|campaign record| DS2
    DS1     -->|brand profile (brand_id)| P2

    %% ── P3: CREATOR PROFILE BUILD ──────────────────────────────
    Creator -->|display name, niches, languages, social handles, rate cards| P3
    P3      -->|creator profile + social profiles| DS1

    %% ── P4: AI MATCHING ENGINE ─────────────────────────────────
    Brand   -->|"Run Matching" trigger| P4
    DS2     -->|campaign requirements (niche, budget, platform, language)| P4
    DS1     -->|creator profiles (followers, engagement, niches, rate cards)| P4
    P4      -->|niche · engagement · budget · platform · language · recency scores| P4
    P4      -->|top-N creator IDs + scores| Gemini
    Gemini  -->|match rationale text| P4
    P4      -->|scored + ranked results| DS4
    DS4     -->|ranked creator cards + rationale| Brand

    %% ── P5: APPLICATION PIPELINE ───────────────────────────────
    Creator -->|proposal text + proposed rate| P5
    Brand   -->|invitation message| P5
    P5      -->|application record (status: pending / invited)| DS2
    Brand   -->|shortlist / accept / reject decision| P5
    Creator -->|accept / decline invitation| P5
    P5      -->|updated application status| DS2
    DS2     -->|application list (kanban)| Brand
    DS2     -->|my applications / invitations| Creator

    %% ── P6: CONTRACT MANAGEMENT ────────────────────────────────
    Brand   -->|contract type + clause configuration| P6
    DS2     -->|accepted application (application_id, creator_id, brand_id)| P6
    P6      -->|contract record (status: active)| DS3
    P6      -->|platform fee % locked at creation| DS3
    DS3     -->|contract details + state| Brand
    DS3     -->|contract details + next action| Creator

    %% ── P7: CONTENT EXECUTION ──────────────────────────────────
    Creator -->|draft content URL| P7
    P7      -->|status → content_submitted; draft_url stored| DS3
    DS3     -->|draft URL for review| Brand
    Brand   -->|approve or request revision| P7
    P7      -->|status → content_approved / in_production; revisions_used++| DS3
    Creator -->|live post URL| P7
    P7      -->|status → published; live_url stored| DS3
    Brand   -->|close contract| P7
    P7      -->|status → closed; application.status → completed| DS3
    P7      -->|application.status = completed| DS2
    Brand   -->|rating + review text| P7
    Creator -->|rating + review text| P7
    P7      -->|review record| DS5
    DS5     -->|average_rating update| DS1

    %% ── P8: DATA INGESTION ─────────────────────────────────────
    Operator  -->|seed / sync commands| P8
    YouTube   -->|channel stats (followers, views, engagement)| P8
    P8        -->|creator social profile data| DS1
```

---

## Data flow annotations

| Flow | What moves | Why it matters |
|---|---|---|
| Brand → P2 → Gemini → P2 | campaign brief text | AI Brief Analyzer pre-fills wizard fields; brand always edits before submit |
| P4 → Gemini → P4 | top-N creator IDs + brief | LLM only sees top candidates (not all); rationale generation is the last gate, not the first |
| P6 locks `platform_fee_percentage` | fee % at contract creation time | Future platform fee changes don't retroactively affect in-flight contracts |
| P7 → DS3 (revisions_used++) | revision counter | Enforces `max_revision_rounds` limit — 3rd revision request rejected at service layer (HTTP 409) |
| P7 → DS2 (application.status = completed) | status transition | Completing a contract makes the application review-eligible (both parties can now leave a review) |
| Clerk → P1 (webhook) | user created / deleted events | Backend user record stays in sync with Clerk identity provider |
| YouTube → P8 → DS1 | public channel stats | Overwrites self-reported metrics on `creator_social_profiles` with API-verified values |
