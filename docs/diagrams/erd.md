# Entity Relationship Diagram

> **As-built** — reflects the live PostgreSQL schema at migration head `0022`
> (`0022_offer_contract_deliverables_negotiation`).
> The SRS aspirational diagram (§9.2) has been superseded by this file.
> See `docs/schema.md` for full DDL and `docs/revisions/srs-revisions-26-06-06.md` for the Contract change request.
>
> **Validated against** (2026-06-10): `backend/app/auth/models.py`, `backend/app/brands/models.py`,
> `backend/app/creators/models.py`, `backend/app/campaigns/models.py`,
> `backend/alembic/versions/0022_offer_contract_deliverables_negotiation.py`,
> and the `959ef947cd0f` / `fd300ea6267e` / `53f8d9a8a155` hash migrations.
>
> **Changelog (corrections applied 2026-06-10):**
> - Head bumped `0017` → `0022`.
> - Added entities `NEGOTIATION_TURNS`, `CONTRACT_DELIVERABLES`, `LIVE_CONTENT_METRIC_SNAPSHOTS`
>   and their relationships.
> - Added gatekeeper tables `CAMPAIGN_APPLICATION_QUESTIONS`, `CAMPAIGN_ACKNOWLEDGMENTS`,
>   `CAMPAIGN_APPLICATION_ANSWERS`, `CAMPAIGN_APPLICATION_ACKNOWLEDGMENTS` (migration 0020).
> - `CONTRACTS.status` now includes `drafted` (offer-time contract creation, migration 0022).
> - `CONTRACTS.payment_structure` now includes `non_cash`; added `non_cash_compensation` column (migration 0022).
> - Added `deliverable_code` to `CAMPAIGN_DELIVERABLE_REQUIREMENTS` and `CREATOR_RATE_CARDS`,
>   and `suggested_price_bdt` to `CREATOR_RATE_CARDS` (migrations 0019 / rate-card benchmarking).
> - `CAMPAIGN_APPLICATIONS.status` enum ordering corrected to include `pending_agreement`.

---

```mermaid
erDiagram

    %% ─── IDENTITY ───────────────────────────────────────────────
    USERS {
        uuid    id          PK
        string  email       UK
        string  clerk_id    UK
        enum    role        "brand | creator | admin"
        bool    is_active
        ts      created_at
    }

    USERS ||--o| CREATOR_PROFILES   : "has profile"
    USERS ||--o| BRAND_PROFILES     : "has profile"

    %% ─── CREATOR ────────────────────────────────────────────────
    CREATOR_PROFILES {
        uuid    id                      PK
        uuid    user_id                 FK
        string  display_name
        string  city
        bool    is_available
        int     min_budget_bdt
        int     total_collaborations
        decimal average_rating
        ts      created_at
    }

    CREATOR_PROFILES ||--o{ CREATOR_SOCIAL_PROFILES       : "has"
    CREATOR_PROFILES ||--o{ CREATOR_NICHES                : "tagged with"
    CREATOR_PROFILES ||--o{ CREATOR_LANGUAGES             : "speaks"
    CREATOR_PROFILES ||--o{ CREATOR_RATE_CARDS            : "charges"
    CREATOR_PROFILES ||--o{ CREATOR_PORTFOLIO_ITEMS       : "showcases"
    CREATOR_PROFILES ||--o{ CREATOR_COLLABORATION_HISTORY : "history"

    CREATOR_SOCIAL_PROFILES {
        uuid    id                  PK
        uuid    creator_id          FK
        enum    platform            "youtube | instagram | facebook | tiktok | …"
        string  handle
        int     follower_count
        decimal engagement_rate
        int     avg_views_per_post
        bool    is_primary_platform
        bool    is_api_verified     "API-confirmed stats"
        ts      api_verified_at     "when last API-verified"
        string  api_channel_id      "YouTube channel ID from API"
        string  data_source         "self_reported | verified | estimated"
        ts      stats_reported_at
    }

    CREATOR_RATE_CARDS {
        uuid    id                  PK
        uuid    creator_id          FK
        enum    platform
        enum    deliverable_type    "dedicated_video | short_video | photo_post | …"
        string  deliverable_code    "canonical code (migration 0019)"
        int     price_bdt
        int     suggested_price_bdt "benchmark"
        bool    is_negotiable
        bool    is_active
    }

    CREATOR_PORTFOLIO_ITEMS {
        uuid    id          PK
        uuid    creator_id  FK
        enum    platform
        string  content_url
        string  title
        bool    is_featured
    }

    CREATOR_COLLABORATION_HISTORY {
        uuid    id                  PK
        uuid    creator_id          FK
        uuid    brand_id            FK "nullable — if brand is on platform"
        string  brand_name
        enum    collaboration_type
        date    collaborated_on
    }

    %% ─── BRAND ──────────────────────────────────────────────────
    BRAND_PROFILES {
        uuid    id              PK
        uuid    user_id         FK
        string  brand_name
        int     niche_id        FK
        bool    is_verified
        int     total_campaigns
        decimal average_rating
        ts      created_at
    }

    %% ─── LOOKUP TABLES ──────────────────────────────────────────
    NICHES {
        int     id      PK
        string  name    UK
        string  slug    UK
        int     parent_id FK "self-ref — hierarchy"
    }

    LANGUAGES {
        char2   code    PK "ISO 639-1"
        string  name
        string  native_name
    }

    NICHES    ||--o{ CREATOR_NICHES    : "categorises"
    LANGUAGES ||--o{ CREATOR_LANGUAGES : "spoken by"
    NICHES    ||--o{ BRAND_PROFILES    : "industry"

    CREATOR_NICHES {
        uuid    creator_id  FK
        int     niche_id    FK
        bool    is_primary
    }

    CREATOR_LANGUAGES {
        uuid    creator_id      FK
        char2   language_code   FK
        bool    is_primary
    }

    %% ─── CAMPAIGNS ──────────────────────────────────────────────
    BRAND_PROFILES ||--o{ CAMPAIGNS : "runs"

    CAMPAIGNS {
        uuid        id                      PK
        uuid        brand_id                FK
        string      title
        text        description
        int         primary_niche_id        FK
        int         budget_per_creator_min
        int         budget_per_creator_max
        int         creator_min_followers
        array       required_platforms
        enum        status                  "draft | active | in_progress | completed | cancelled | archived"
        enum        visibility              "public | private"
        date        application_deadline
        jsonb       kpi_targets
        array       hashtags
        ts          created_at
    }

    CAMPAIGNS ||--o{ CAMPAIGN_NICHE_TARGETS             : "targets"
    CAMPAIGNS ||--o{ CAMPAIGN_LANGUAGE_TARGETS          : "requires"
    CAMPAIGNS ||--o{ CAMPAIGN_DELIVERABLE_REQUIREMENTS  : "expects"
    CAMPAIGNS ||--o{ CAMPAIGN_APPLICATIONS              : "receives"
    CAMPAIGNS ||--o{ AI_MATCH_SCORES                    : "scored by"

    CAMPAIGN_NICHE_TARGETS {
        uuid    campaign_id FK
        int     niche_id    FK
    }

    CAMPAIGN_LANGUAGE_TARGETS {
        uuid    campaign_id     FK
        char2   language_code   FK
        bool    is_required
    }

    CAMPAIGN_DELIVERABLE_REQUIREMENTS {
        uuid    id                PK
        uuid    campaign_id       FK
        enum    platform
        enum    deliverable_type
        string  deliverable_code  "canonical code (migration 0019)"
        int     quantity
        text    notes
    }

    %% ─── APPLICATION GATEKEEPER (migration 0020) ────────────────
    CAMPAIGNS ||--o{ CAMPAIGN_APPLICATION_QUESTIONS : "screens with"
    CAMPAIGNS ||--o{ CAMPAIGN_ACKNOWLEDGMENTS       : "requires consent"

    CAMPAIGN_APPLICATION_QUESTIONS {
        uuid    id              PK
        uuid    campaign_id     FK
        text    question_text
        string  question_type   "text | single_choice | multi_choice"
        jsonb   options_json
        bool    is_required
        int     sort_order
    }

    CAMPAIGN_ACKNOWLEDGMENTS {
        uuid    id              PK
        uuid    campaign_id     FK
        text    statement_text
        bool    is_required
        int     sort_order
    }

    %% ─── APPLICATIONS (matching bridge) ─────────────────────────
    CREATOR_PROFILES ||--o{ CAMPAIGN_APPLICATIONS : "submits"

    CAMPAIGN_APPLICATIONS {
        uuid    id              PK
        uuid    campaign_id     FK
        uuid    creator_id      FK
        string  initiated_by    "creator | brand"
        text    proposal_text
        int     proposed_rate
        enum    status          "invited | pending | shortlisted | pending_agreement | accepted | rejected | declined | withdrawn | completed"
        text    rejection_reason
        int     agreed_rate
        ts      applied_at
        ts      accepted_at
        ts      completed_at
    }

    CAMPAIGN_APPLICATIONS ||--o| CONTRACTS                          : "becomes"
    CAMPAIGN_APPLICATIONS ||--o{ REVIEWS                            : "receives"
    CAMPAIGN_APPLICATIONS ||--o{ NEGOTIATION_TURNS                  : "negotiated via"
    CAMPAIGN_APPLICATIONS ||--o{ CAMPAIGN_APPLICATION_ANSWERS       : "answered with"
    CAMPAIGN_APPLICATIONS ||--o{ CAMPAIGN_APPLICATION_ACKNOWLEDGMENTS : "accepted"

    CAMPAIGN_APPLICATION_QUESTIONS ||--o{ CAMPAIGN_APPLICATION_ANSWERS         : "answered by"
    CAMPAIGN_ACKNOWLEDGMENTS       ||--o{ CAMPAIGN_APPLICATION_ACKNOWLEDGMENTS : "consented in"

    CAMPAIGN_APPLICATION_ANSWERS {
        uuid    id                  PK
        uuid    application_id      FK
        uuid    question_id         FK
        text    answer_text
        jsonb   answer_options_json
    }

    CAMPAIGN_APPLICATION_ACKNOWLEDGMENTS {
        uuid    id                  PK
        uuid    application_id      FK
        uuid    acknowledgment_id   FK
        ts      accepted_at
    }

    %% ─── NEGOTIATION (offer/counter thread — migration 0022) ─────
    NEGOTIATION_TURNS {
        uuid    id              PK
        uuid    application_id  FK
        string  author_role     "brand | creator"
        string  status          "proposed | accepted | superseded"
        text    message
        int     proposed_rate
        jsonb   proposed_terms  "clause deltas snapshot"
        ts      created_at
    }

    %% ─── CONTRACTS (first-class entity — migration 0015) ────────
    BRAND_PROFILES   ||--o{ CONTRACTS : "party to"
    CREATOR_PROFILES ||--o{ CONTRACTS : "party to"

    CONTRACTS {
        uuid    id                      PK
        uuid    application_id          FK  "UNIQUE"
        uuid    brand_id                FK
        uuid    creator_id              FK
        enum    contract_type           "content_collaboration | product_seeding | talent_engagement"
        enum    status                  "drafted | active | in_production | content_submitted | content_approved | published | closed | disputed"
        string  payment_structure       "flat_fee | non_cash | none"
        int     payment_amount_bdt
        enum    payment_schedule        "upfront | on_delivery | milestone"
        bool    has_product_transfer
        enum    product_disposition     "keep | return"
        text    deliverable_notes
        text    non_cash_compensation   "free product / SaaS / affiliate value"
        int     exclusivity_days
        int     usage_rights_days
        int     max_revision_rounds
        int     revisions_used
        int     kill_fee_percentage
        int     platform_fee_percentage "15 | 10 | 18"
        text    draft_content_url
        text    live_post_url
        ts      contracted_at
        ts      submitted_at
        ts      approved_at
        ts      published_at
        ts      closed_at
    }

    %% ─── CONTRACT EXECUTION (migration 0021 / 0022) ─────────────
    CONTRACTS ||--o{ CONTRACT_DELIVERABLES            : "owes"
    CONTRACTS ||--o{ LIVE_CONTENT_METRIC_SNAPSHOTS    : "tracked by"
    CAMPAIGN_DELIVERABLE_REQUIREMENTS ||--o{ CONTRACT_DELIVERABLES : "subset of"

    CONTRACT_DELIVERABLES {
        uuid    id              PK
        uuid    contract_id     FK
        uuid    requirement_id  FK
        int     quantity        "per-creator override"
        text    notes
    }

    LIVE_CONTENT_METRIC_SNAPSHOTS {
        uuid    id                    PK
        uuid    contract_id           FK
        string  platform
        ts      captured_at
        int     views
        int     impressions
        int     likes
        int     comments
        int     shares
        int     saves
        float   engagement_rate
        int     estimated_revenue_bdt
        string  source                "manual | sync"
    }

    %% ─── REVIEWS ────────────────────────────────────────────────
    REVIEWS {
        uuid    id                  PK
        uuid    application_id      FK
        uuid    reviewer_brand_id   FK "nullable"
        uuid    reviewer_creator_id FK "nullable"
        uuid    reviewee_brand_id   FK "nullable"
        uuid    reviewee_creator_id FK "nullable"
        int     rating              "1–5"
        text    review_text
        bool    is_public
        ts      created_at
    }

    %% ─── AI MATCHING ─────────────────────────────────────────────
    CREATOR_PROFILES ||--o{ AI_MATCH_SCORES : "ranked in"

    AI_MATCH_SCORES {
        uuid    id              PK
        uuid    campaign_id     FK
        uuid    creator_id      FK
        float   score_niche
        float   score_engagement
        float   score_budget
        float   score_language
        float   score_platform  "migration 0014"
        float   score_recency   "migration 0014"
        float   score_semantic  "migration 0014 — nullable, only when semantic rescue fires"
        float   score_total
        text    rationale
        ts      generated_at
    }
```

---

## Key design decisions

| Decision | Rationale |
|---|---|
| `contracts.application_id` is `UNIQUE` | One contract per application — enforced at DB level, not just application logic |
| `campaign_type` not shown | Deprecated (nullable, no new writes) — column exists for backward compat; will be `DROP`ped in a future migration |
| `campaigns.visibility` replaces `campaign_type` as the campaign-level discriminator | Public = open marketplace; Private = brand-initiated invite |
| Contract has direct `brand_id` + `creator_id` FKs despite being reachable via `application` | Enables efficient `WHERE brand_id = ?` / `WHERE creator_id = ?` queries without joining through applications |
| `platform_fee_percentage` stored on contract at creation time | Locks the fee at the moment of agreement; future fee changes don't retroactively affect existing contracts |
| Contract row created at **offer time** with status `drafted` (migration 0022) | The brand sending an offer creates the contract immediately; accepting the final offer flips it to `active`. Negotiation happens through `negotiation_turns` against the application |
| `contract_deliverables` is a subset of `campaign_deliverable_requirements` | A brand may take several creators and assign each only a portion of the campaign's deliverables, with a per-creator quantity override |
| `live_content_metric_snapshots` attaches to `contracts` (which own `live_post_url`) | Time-series post performance; `source` distinguishes manual entry from future platform-sync jobs. Relational-only — no TimescaleDB |
