# Core Database Schema
## Influencer Matching Platform — PostgreSQL

> **Scope:** Pure relational schema only. No graph DB, no vector columns, no API
> integrations, no LLM fields. Those are additive layers applied later without
> touching this schema. Every table here has a single clear responsibility.

---

## Design Principles

**1. Separate identity from profile.**
A `users` table owns authentication (email, password). Creator and brand profiles
reference it. This means one account could later hold both roles, and auth logic
never touches business tables.

**2. Lookup tables over enums for anything that grows.**
`niches` and `languages` are rows in tables, not PostgreSQL enum values.
Adding a new niche later is `INSERT`, not `ALTER TYPE` + migration.
Only use enums for things that are truly fixed (platform names, status states).

**3. One row per platform per creator.**
`creator_social_profiles` has one row for YouTube, one for Instagram, one for
Facebook — same table, same columns, different `platform` value.
Adding TikTok support in the future means no schema change — just a new enum value
and a new row.

**4. All fields in `creator_social_profiles` are manually enterable.**
No field in this table requires an API call. A creator fills in their own stats.
The YouTube enrichment sync can overwrite the same metric columns with API-verified values
and marks those rows with `is_api_verified`, `api_verified_at`, `api_channel_id`, and
`data_source = 'verified'`.

**5. Soft deletes only where recovery matters.**
`users`, `creator_profiles`, `brand_profiles` use `deleted_at` for soft delete.
Junction tables and lookup rows are hard-deleted.

**6. No polymorphic foreign keys.**
`reviews.reviewer_id` does not point ambiguously to "either a creator or a brand."
Instead, `reviews` has explicit `brand_id` and `creator_id` columns with one
always NULL depending on who is reviewing. Clean, indexable, joinable.

---

## Entity Overview

```
users
  ├── creator_profiles          (1:1)
  │     ├── creator_social_profiles      (1:many — one per platform)
  │     ├── creator_niches               (many:many with niches)
  │     ├── creator_languages            (1:many)
  │     ├── creator_rate_cards           (1:many)
  │     ├── creator_portfolio_items      (1:many — sample content URLs)
  │     └── creator_collaboration_history (1:many — past brand work)
  │
  └── brand_profiles            (1:1)
        └── campaigns           (1:many)
              ├── campaign_niche_targets        (many:many with niches)
              ├── campaign_language_targets     (many:many with languages)
              ├── campaign_deliverable_requirements (1:many)
              ├── campaign_application_questions (1:many — gatekeeper)
              ├── campaign_acknowledgments      (1:many — gatekeeper)
              └── campaign_applications  (many:many with creator_profiles)
                    ├── campaign_application_answers          (1:many)
                    ├── campaign_application_acknowledgments  (1:many)
                    ├── negotiation_turns      (1:many — offer/counter thread)
                    ├── reviews                (1:many — after completion)
                    └── contracts              (1:1 — created at offer time)
                          ├── contract_deliverables          (1:many — per-creator subset)
                          └── live_content_metric_snapshots  (1:many — performance over time)

-- AI / cross-domain --
ai_match_scores  (one row per campaign×creator ranked match)

-- Shared lookup tables --
niches       (referenced by creator_niches + campaign_niche_targets + brand_profiles + portfolio/history)
languages    (referenced by creator_languages + campaign_language_targets)
```

> **Migration head: `0022`** (`0022_offer_contract_deliverables_negotiation`). The numbered chain
> `0001 → 0022` plus three hash-revision migrations in history
> (`53f8d9a8a155` ai_match_scores, `959ef947cd0f` campaign visibility + invitation statuses,
> `fd300ea6267e` archived campaign status) make up the full schema. Storage is **relational-only
> PostgreSQL 16** — no pgvector / Neo4j / Redis / TimescaleDB.

---

## Step 1: Enums

Create these before any table that references them.

```sql
-- Platform type: fixed list. Adding a new platform = add enum value + migration.
-- Acceptable tradeoff since platforms rarely appear.
CREATE TYPE platform_type AS ENUM (
    'youtube',
    'instagram',
    'facebook',
    'tiktok',
    'twitter_x',
    'linkedin',
    'snapchat',
    'other'
);

-- User roles
CREATE TYPE user_role AS ENUM (
    'creator',
    'brand',
    'admin'
);

-- Campaign lifecycle
CREATE TYPE campaign_status AS ENUM (
    'draft',       -- brand is still editing
    'active',      -- open for applications
    'in_progress', -- creators selected, work ongoing
    'completed',   -- all deliverables received
    'cancelled',
    'archived'     -- campaign is archived
);

-- Application lifecycle
CREATE TYPE application_status AS ENUM (
    'pending',      -- creator applied, brand hasn't responded
    'shortlisted',  -- brand interested, not final
    'pending_agreement', -- brand selected creator and sent final terms
    'accepted',     -- brand confirmed this creator
    'rejected',     -- brand passed
    'withdrawn',    -- creator pulled out
    'completed',    -- collaboration done, review can be left
    'invited',      -- brand invited creator to campaign
    'declined'      -- creator declined brand's invitation
);

-- Campaign visibility
CREATE TYPE campaign_visibility AS ENUM (
    'public',
    'private'
);

-- Campaign deliverable types (what a brand expects)
CREATE TYPE deliverable_type AS ENUM (
    'dedicated_video',    -- Full YouTube video about the brand
    'integrated_mention', -- Brand mention within a video
    'short_video',        -- YouTube Shorts / Reels / TikTok
    'photo_post',         -- Instagram/Facebook photo post
    'story',              -- Instagram/Facebook story (24h)
    'live_stream',        -- Live mention or dedicated live
    'blog_post',          -- Written content
    'other'
);

-- Collaboration preference: what kinds of deals a creator accepts
CREATE TYPE collaboration_type AS ENUM (
    'sponsored_post',
    'product_review',
    'brand_ambassador',
    'affiliate',
    'gifted_product',  -- No payment, only free product
    'event_coverage',
    'other'
);

-- Gender options (for audience demographic fields)
CREATE TYPE gender_type AS ENUM (
    'male',
    'female',
    'non_binary',
    'prefer_not_to_say'
);
```

---

## Step 2: Lookup Tables

Standalone tables with no foreign key dependencies. Create these first.

### 2.1 Niches

```sql
-- Content/industry niches. Stored as rows so new niches need only an INSERT.
-- parent_id allows hierarchy: "food" → "bangla_recipes", "food" → "street_food"
CREATE TABLE niches (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(80) NOT NULL UNIQUE,
    slug        VARCHAR(80) NOT NULL UNIQUE,   -- URL-safe, e.g. "street-food"
    description TEXT,
    parent_id   INTEGER REFERENCES niches(id) ON DELETE SET NULL,
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data (insert these rows):
-- (1,  'Technology',    'technology',    NULL, NULL)
-- (2,  'Gaming',        'gaming',        NULL, NULL)
-- (3,  'Fashion',       'fashion',       NULL, NULL)
-- (4,  'Beauty',        'beauty',        NULL, NULL)
-- (5,  'Food',          'food',          NULL, NULL)
-- (6,  'Travel',        'travel',        NULL, NULL)
-- (7,  'Lifestyle',     'lifestyle',     NULL, NULL)
-- (8,  'Education',     'education',     NULL, NULL)
-- (9,  'Finance',       'finance',       NULL, NULL)
-- (10, 'Fitness',       'fitness',       NULL, NULL)
-- (11, 'Parenting',     'parenting',     NULL, NULL)
-- (12, 'Entertainment', 'entertainment', NULL, NULL)
-- (13, 'News',          'news',          NULL, NULL)
-- (14, 'Other',         'other',         NULL, NULL)
```

### 2.2 Languages

```sql
-- ISO 639-1 language codes. Pre-seeded with languages relevant to Bangladesh.
CREATE TABLE languages (
    code        CHAR(2) PRIMARY KEY,   -- ISO 639-1: 'bn', 'en'
    name        VARCHAR(60) NOT NULL,  -- 'Bengali', 'English'
    native_name VARCHAR(60),           -- 'বাংলা', 'English'
    is_active   BOOLEAN DEFAULT TRUE
);

-- Seed data:
-- ('bn', 'Bengali', 'বাংলা')
-- ('en', 'English', 'English')
-- ('ar', 'Arabic',  'العربية')
-- ('hi', 'Hindi',   'हिन्दी')
-- ('ur', 'Urdu',    'اردو')
```

---

## Step 3: Users Table

```sql
-- Authentication and identity only. No business profile fields here.
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),          -- Nullable since Clerk handles auth
    clerk_id        VARCHAR(255) UNIQUE,   -- Maps to Clerk's user identity
    role            user_role NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ            -- soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);
```

---

## Step 4: Creator Profile

### 4.1 Core Profile

```sql
-- One row per creator. All personal/professional info the creator fills out once.
CREATE TABLE creator_profiles (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Identity
    display_name     VARCHAR(120) NOT NULL,
    full_name        VARCHAR(120),            -- Optional, kept private unless disclosed
    profile_photo_url TEXT,
    bio              TEXT,                    -- About the creator, shown to brands
    tagline          VARCHAR(160),            -- Short one-liner, shown in search results

    -- Location
    country_code     CHAR(2) DEFAULT 'BD',    -- ISO 3166-1 alpha-2
    city             VARCHAR(100),
    timezone         VARCHAR(60) DEFAULT 'Asia/Dhaka',

    -- Demographics (creator's own demographics, not audience)
    gender           gender_type,
    date_of_birth    DATE,                    -- Stored but not shown publicly; used for age-gating

    -- Collaboration settings
    is_available     BOOLEAN DEFAULT TRUE,    -- Accepting new brand deals?
    min_budget       INTEGER,                 -- BDT: minimum deal size creator accepts
    response_time_hours INTEGER DEFAULT 48,  -- How quickly they typically reply
    preferred_collaboration_types collaboration_type[] DEFAULT '{}',

    -- Contact preferences (how brands should reach out outside the platform)
    contact_whatsapp  VARCHAR(20),
    contact_email     VARCHAR(255),           -- May differ from login email

    -- Verification and trust
    is_identity_verified BOOLEAN DEFAULT FALSE,
    verified_at          TIMESTAMPTZ,
    total_collaborations INTEGER DEFAULT 0,  -- Denormalized counter, updated on completion
    average_rating       NUMERIC(3,2),       -- Denormalized, updated on new review

    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_creator_profiles_user    ON creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_city    ON creator_profiles(city);
CREATE INDEX idx_creator_profiles_avail   ON creator_profiles(is_available);
CREATE INDEX idx_creator_profiles_country ON creator_profiles(country_code);
```

### 4.2 Creator Social Profiles

```sql
-- One row per platform per creator.
-- Metric fields start as self-reported, then can be overwritten by API-verified enrichment.
CREATE TABLE creator_social_profiles (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id           UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    platform             platform_type NOT NULL,

    -- Identity on the platform
    handle               VARCHAR(255) NOT NULL,   -- @username or channel name
    profile_url          TEXT NOT NULL,            -- Full URL to their profile
    platform_user_id     VARCHAR(255),             -- Platform's internal ID (if known)
    api_channel_id       VARCHAR(255),             -- API-confirmed channel/account ID
    display_name_on_platform VARCHAR(120),         -- Name as shown on the platform

    -- Audience size (self-reported, approximate)
    follower_count       INTEGER,                  -- Subscribers / followers / fans
    following_count      INTEGER,                  -- Who they follow (signal for follow-back fraud)

    -- Engagement metrics (self-reported, based on recent content)
    -- Creator fills these based on their own analytics dashboard
    avg_views_per_post   INTEGER,
    avg_likes_per_post   INTEGER,
    avg_comments_per_post INTEGER,
    avg_shares_per_post  INTEGER,

    -- Engagement rate: stored explicitly so it doesn't need recalculation on every query
    -- Creator can fill this; system can recalculate it from the avg_ fields above
    -- Formula: (avg_likes + avg_comments) / follower_count
    engagement_rate      NUMERIC(5,4),             -- e.g. 0.0386 = 3.86%

    -- Content behaviour
    posts_per_month      NUMERIC(5,1),             -- Average posts per month
    is_primary_platform  BOOLEAN DEFAULT FALSE,    -- Creator's main active platform
    account_created_year SMALLINT,                 -- Year they joined the platform
    is_monetized         BOOLEAN DEFAULT FALSE,    -- YouTube Partner, Meta Stars, etc.
    has_verified_badge   BOOLEAN DEFAULT FALSE,    -- Blue tick / checkmark
    is_api_verified      BOOLEAN DEFAULT FALSE,    -- Public API confirmed this row's stats
    api_verified_at      TIMESTAMPTZ,              -- When the public API last confirmed stats
    data_source          VARCHAR(30) DEFAULT 'self_reported', -- self_reported|verified|estimated

    -- Audience demographics (self-assessed by creator from their analytics)
    audience_country_primary   CHAR(2) DEFAULT 'BD',   -- ISO: primary audience country
    audience_city_primary      VARCHAR(100),             -- e.g. "Dhaka"
    audience_age_range_min     SMALLINT,                 -- e.g. 18
    audience_age_range_max     SMALLINT,                 -- e.g. 34
    audience_gender_majority   gender_type,              -- Which gender is the majority
    audience_gender_pct        SMALLINT,                 -- % of that majority gender (0-100)

    -- Content language(s) on this specific platform
    -- A creator might post in Bangla on Facebook but English on YouTube
    content_languages    CHAR(2)[] DEFAULT '{bn}',      -- Array of ISO 639-1 codes

    -- Manual notes
    notes                TEXT,   -- Creator's own notes about this platform/account

    -- Data freshness tracking (who provided the data and when)
    stats_reported_at    TIMESTAMPTZ DEFAULT NOW(),     -- When creator last updated these stats
    stats_reported_for_period VARCHAR(30),               -- e.g. "last 30 days", "last 3 months"

    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(creator_id, platform)  -- One profile per platform per creator
);

CREATE INDEX idx_social_profiles_creator  ON creator_social_profiles(creator_id);
CREATE INDEX idx_social_profiles_platform ON creator_social_profiles(platform);
CREATE INDEX idx_social_profiles_followers ON creator_social_profiles(follower_count);
CREATE INDEX idx_social_profiles_engagement ON creator_social_profiles(engagement_rate);
```

### 4.3 Creator Niches

```sql
-- Many-to-many: a creator works in multiple niches.
CREATE TABLE creator_niches (
    creator_id   UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    niche_id     INTEGER NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
    is_primary   BOOLEAN DEFAULT FALSE,  -- Only one row per creator should have TRUE

    PRIMARY KEY (creator_id, niche_id)
);

CREATE INDEX idx_creator_niches_niche ON creator_niches(niche_id);
```

### 4.4 Creator Languages

```sql
-- Languages the creator actively uses in their content across all platforms.
-- Platform-specific language is tracked in creator_social_profiles.content_languages.
-- This table captures the creator's overall language capability.
CREATE TABLE creator_languages (
    creator_id    UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    language_code CHAR(2) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
    is_primary    BOOLEAN DEFAULT FALSE,

    PRIMARY KEY (creator_id, language_code)
);
```

### 4.5 Creator Rate Cards

```sql
-- What the creator charges per deliverable type per platform.
-- One row per (creator, platform, deliverable_type) combination.
-- Brands use this to pre-filter by budget before reaching out.
CREATE TABLE creator_rate_cards (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id        UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    platform          platform_type NOT NULL,
    deliverable_type  deliverable_type NOT NULL,
    deliverable_code  VARCHAR(50),             -- canonical deliverable code (migration 0019)

    price_bdt         INTEGER NOT NULL,        -- Price in BDT (Bangladeshi Taka)
    suggested_price_bdt INTEGER,               -- System-suggested benchmark price
    price_usd         INTEGER,                 -- Optional USD equivalent
    includes          TEXT,                    -- What's included: "1 video, 2 revisions, 30-day exclusivity"
    excludes          TEXT,                    -- What's NOT included
    turnaround_days   SMALLINT,                -- Typical delivery time in days
    is_negotiable     BOOLEAN DEFAULT TRUE,
    is_active         BOOLEAN DEFAULT TRUE,    -- Can deactivate without deleting

    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(creator_id, platform, deliverable_type)
);

CREATE INDEX idx_rate_cards_creator ON creator_rate_cards(creator_id);
```

### 4.6 Creator Portfolio Items

```sql
-- Links to the creator's best or most representative content.
-- Brands review these to evaluate content quality before shortlisting.
CREATE TABLE creator_portfolio_items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id     UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    platform       platform_type NOT NULL,
    content_url    TEXT NOT NULL,             -- Direct link to the post/video
    title          VARCHAR(255),              -- Creator-written title or description
    thumbnail_url  TEXT,                      -- Optional: custom thumbnail
    niche_id       INTEGER REFERENCES niches(id) ON DELETE SET NULL,

    -- Performance at time of adding (self-reported, optional)
    views          INTEGER,
    likes          INTEGER,
    comments       INTEGER,
    published_at   DATE,

    is_featured    BOOLEAN DEFAULT FALSE,     -- Pin to top of portfolio
    sort_order     INTEGER DEFAULT 0,

    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_creator ON creator_portfolio_items(creator_id);
```

### 4.7 Creator Past Collaboration History

```sql
-- Self-reported past brand collaborations. Used for credibility + conflict detection.
-- A creator lists brands they've worked with before to build trust.
CREATE TABLE creator_collaboration_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,

    -- Brand info (may or may not be a registered brand on the platform)
    brand_id        UUID REFERENCES brand_profiles(id) ON DELETE SET NULL, -- If registered
    brand_name      VARCHAR(120) NOT NULL,   -- Always store the name explicitly
    brand_website   TEXT,
    niche_id        INTEGER REFERENCES niches(id) ON DELETE SET NULL,

    -- Collaboration details
    platform        platform_type,
    collaboration_type collaboration_type,
    collaborated_on DATE,                    -- Month/year is sufficient (day optional)
    deliverable_description TEXT,            -- What was produced

    -- Proof (optional link to the published content)
    content_url     TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collab_history_creator ON creator_collaboration_history(creator_id);
CREATE INDEX idx_collab_history_brand   ON creator_collaboration_history(brand_id);
```

---

## Step 5: Brand Profile

```sql
CREATE TABLE brand_profiles (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Identity
    brand_name       VARCHAR(120) NOT NULL,
    legal_name       VARCHAR(180),            -- Legal registered name if different
    logo_url         TEXT,
    description      TEXT,                    -- What the brand does
    tagline          VARCHAR(160),

    -- Online presence
    website          TEXT,
    facebook_page_url TEXT,
    instagram_url    TEXT,

    -- Business details
    niche_id         INTEGER REFERENCES niches(id) ON DELETE SET NULL,
    brand_category   VARCHAR(50),             -- Product category for competitor checks, e.g. edtech/stationery
    company_size     VARCHAR(20) CHECK (company_size IN (
                         'individual',         -- Sole proprietor / freelancer
                         'small',              -- 2-20 employees
                         'medium',             -- 21-200 employees
                         'large'               -- 200+ employees
                     )),
    country_code     CHAR(2) DEFAULT 'BD',
    city             VARCHAR(100),

    -- Contact
    contact_name     VARCHAR(120),            -- Primary contact person name
    contact_phone    VARCHAR(20),
    contact_whatsapp VARCHAR(20),

    -- Trust signals
    is_verified      BOOLEAN DEFAULT FALSE,   -- Platform-verified legitimate business
    verified_at      TIMESTAMPTZ,
    total_campaigns  INTEGER DEFAULT 0,       -- Denormalized counter
    average_rating   NUMERIC(3,2),            -- Denormalized, updated on review

    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_brand_profiles_user  ON brand_profiles(user_id);
CREATE INDEX idx_brand_profiles_niche ON brand_profiles(niche_id);
CREATE INDEX idx_brand_profiles_brand_category ON brand_profiles(brand_category);
```

---

## Step 6: Campaigns

### 6.1 Campaign Table

```sql
CREATE TABLE campaigns (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id         UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,

    -- Basic info
    title            VARCHAR(200) NOT NULL,
    description      TEXT NOT NULL,          -- Full campaign brief
    objectives       TEXT,                   -- What the brand wants to achieve

    -- Targeting: niche
    -- Primary niche stored here. Additional niches in campaign_niche_targets table.
    primary_niche_id INTEGER REFERENCES niches(id) ON DELETE SET NULL,
    brand_category   VARCHAR(50),            -- Product category; defaults from brand profile when omitted

    -- Targeting: platform
    -- Which platforms the brand wants content on
    required_platforms platform_type[] DEFAULT '{youtube}',

    -- Targeting: budget
    budget_per_creator_min INTEGER,          -- BDT, minimum per creator
    budget_per_creator_max INTEGER NOT NULL, -- BDT, maximum per creator

    -- Targeting: audience size
    creator_min_followers INTEGER DEFAULT 1000,
    creator_max_followers INTEGER,           -- NULL = no upper limit

    -- Targeting: location
    target_countries  CHAR(2)[] DEFAULT '{BD}',
    target_cities     TEXT[] DEFAULT '{}',   -- Empty = national / no restriction

    -- Targeting: demographics
    target_age_min    SMALLINT,
    target_age_max    SMALLINT,
    target_gender     gender_type,           -- NULL = any gender

    -- Deliverables expected
    deliverables_description TEXT,           -- Free text description of what's expected
    number_of_creators INTEGER DEFAULT 1,   -- How many creators they want total

    -- Timeline
    application_deadline DATE,
    content_deadline     DATE,

    status           campaign_status DEFAULT 'draft',
    visibility       campaign_visibility DEFAULT 'public',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_brand       ON campaigns(brand_id);
CREATE INDEX idx_campaigns_status      ON campaigns(status);
CREATE INDEX idx_campaigns_primary_niche ON campaigns(primary_niche_id);
CREATE INDEX idx_campaigns_brand_category ON campaigns(brand_category);
CREATE INDEX idx_campaigns_budget      ON campaigns(budget_per_creator_max);
```

### 6.2 Campaign Niche Targets

```sql
-- A campaign can target multiple niches.
-- Primary niche is stored in campaigns.primary_niche_id.
-- Additional niches go here.
CREATE TABLE campaign_niche_targets (
    campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    niche_id     INTEGER NOT NULL REFERENCES niches(id) ON DELETE CASCADE,

    PRIMARY KEY (campaign_id, niche_id)
);
```

### 6.3 Campaign Language Targets

```sql
-- Languages the campaign content should be in.
CREATE TABLE campaign_language_targets (
    campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    language_code CHAR(2) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
    is_required   BOOLEAN DEFAULT TRUE,   -- FALSE = preferred but not mandatory

    PRIMARY KEY (campaign_id, language_code)
);
```

### 6.4 Campaign Deliverable Requirements

```sql
-- Specific deliverables the brand expects (can be multiple types).
CREATE TABLE campaign_deliverable_requirements (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id       UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    platform          platform_type NOT NULL,
    deliverable_type  deliverable_type NOT NULL,
    deliverable_code  VARCHAR(50),             -- canonical deliverable code (migration 0019)
    quantity          SMALLINT DEFAULT 1,      -- How many of this deliverable
    notes             TEXT                     -- Specific requirements (length, format, etc.)
);

CREATE INDEX idx_deliverable_req_campaign ON campaign_deliverable_requirements(campaign_id);
```

---

## Step 6.5: Campaign Application Gatekeeper

```sql
-- Brand-defined screening questions. Max 5 questions enforced by service layer.
CREATE TABLE campaign_application_questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id    UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    question_text  TEXT NOT NULL,
    question_type  VARCHAR(20) NOT NULL DEFAULT 'text'
                   CHECK (question_type IN ('text', 'single_choice', 'multi_choice')),
    options_json   JSONB,
    is_required    BOOLEAN DEFAULT TRUE,
    sort_order     SMALLINT DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_acknowledgments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    statement_text  TEXT NOT NULL,
    is_required     BOOLEAN DEFAULT TRUE,
    sort_order      SMALLINT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Step 7: Applications (The Matching Bridge)

```sql
-- A creator applies to a campaign. This is the core transaction table.
-- Also used when a brand directly invites a creator (initiated_by = 'brand').
CREATE TABLE campaign_applications (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id       UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,

    -- Who initiated this connection
    initiated_by     VARCHAR(10) NOT NULL CHECK (initiated_by IN ('creator', 'brand')),

    -- Creator's pitch to the brand
    proposal_text    TEXT,                    -- Why they're a good fit
    proposed_rate    INTEGER,                 -- BDT: what the creator is asking for

    -- Brand's response
    status           application_status DEFAULT 'pending',
    brand_notes      TEXT,                    -- Internal notes for the brand (not shown to creator)
    rejection_reason TEXT,                    -- Shown to creator if rejected

    -- Agreed terms (set when status → accepted)
    agreed_rate      INTEGER,                 -- BDT: final agreed payment
    agreed_deliverables TEXT,                -- Description of what was agreed

    -- Timestamps
    applied_at       TIMESTAMPTZ DEFAULT NOW(),
    responded_at     TIMESTAMPTZ,            -- When brand first responded
    accepted_at      TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    updated_at       TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(campaign_id, creator_id)          -- One application per creator per campaign
);

CREATE INDEX idx_applications_campaign ON campaign_applications(campaign_id);
CREATE INDEX idx_applications_creator  ON campaign_applications(creator_id);
CREATE INDEX idx_applications_status   ON campaign_applications(status);

-- Creator answers and accepted legal/campaign acknowledgments.
CREATE TABLE campaign_application_answers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,
    question_id         UUID NOT NULL REFERENCES campaign_application_questions(id) ON DELETE CASCADE,
    answer_text         TEXT,
    answer_options_json JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(application_id, question_id)
);

CREATE TABLE campaign_application_acknowledgments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id     UUID NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,
    acknowledgment_id  UUID NOT NULL REFERENCES campaign_acknowledgments(id) ON DELETE CASCADE,
    accepted_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(application_id, acknowledgment_id)
);
```

---

## Step 8: Reviews

```sql
-- Bidirectional reviews after a collaboration is completed.
-- Either party can leave a review. One review per direction per application.
CREATE TABLE reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,

    -- Who is writing the review
    reviewer_brand_id   UUID REFERENCES brand_profiles(id) ON DELETE SET NULL,
    reviewer_creator_id UUID REFERENCES creator_profiles(id) ON DELETE SET NULL,

    -- Who is being reviewed
    reviewee_brand_id   UUID REFERENCES brand_profiles(id) ON DELETE SET NULL,
    reviewee_creator_id UUID REFERENCES creator_profiles(id) ON DELETE SET NULL,

    -- Review content
    rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text         TEXT,
    is_public           BOOLEAN DEFAULT TRUE,  -- Creator/brand can choose to make private

    created_at          TIMESTAMPTZ DEFAULT NOW(),

    -- Exactly one reviewer and one reviewee must be set
    CONSTRAINT chk_one_reviewer CHECK (
        (reviewer_brand_id IS NOT NULL AND reviewer_creator_id IS NULL) OR
        (reviewer_brand_id IS NULL AND reviewer_creator_id IS NOT NULL)
    ),
    CONSTRAINT chk_one_reviewee CHECK (
        (reviewee_brand_id IS NOT NULL AND reviewee_creator_id IS NULL) OR
        (reviewee_brand_id IS NULL AND reviewee_creator_id IS NOT NULL)
    ),
    -- Prevent self-review
    CONSTRAINT chk_no_self_review CHECK (
        reviewer_brand_id IS DISTINCT FROM reviewee_brand_id OR
        reviewer_creator_id IS DISTINCT FROM reviewee_creator_id
    ),
    -- One review per direction per application
    UNIQUE(application_id, reviewer_brand_id),
    UNIQUE(application_id, reviewer_creator_id)
);

CREATE INDEX idx_reviews_application       ON reviews(application_id);
CREATE INDEX idx_reviews_reviewee_creator  ON reviews(reviewee_creator_id);
CREATE INDEX idx_reviews_reviewee_brand    ON reviews(reviewee_brand_id);
```

---

## Step 9: Indexes Summary

All performance-critical indexes are already defined inline above.
Additional composite indexes to add once you have real query patterns:

```sql
-- Find available creators in a niche for a given follower range
CREATE INDEX idx_social_niche_followers ON creator_social_profiles(platform, follower_count)
    WHERE follower_count IS NOT NULL;

-- Find active campaigns accepting applications
CREATE INDEX idx_campaigns_active ON campaigns(status, application_deadline)
    WHERE status = 'active';

-- Find all applications for a creator across all campaigns
CREATE INDEX idx_applications_creator_status ON campaign_applications(creator_id, status);
```

---

## Relationship Summary

```
users (1) ──────────── (1) creator_profiles
users (1) ──────────── (1) brand_profiles

creator_profiles (1) ── (many) creator_social_profiles      [one per platform]
creator_profiles (1) ── (many) creator_niches               [junction with niches]
creator_profiles (1) ── (many) creator_languages            [junction with languages]
creator_profiles (1) ── (many) creator_rate_cards           [per platform + deliverable]
creator_profiles (1) ── (many) creator_portfolio_items      [sample content links]
creator_profiles (1) ── (many) creator_collaboration_history [past brands]

brand_profiles (1) ──── (many) campaigns

campaigns (1) ────────── (many) campaign_niche_targets      [junction with niches]
campaigns (1) ────────── (many) campaign_language_targets   [junction with languages]
campaigns (1) ────────── (many) campaign_deliverable_requirements
campaigns (1) ────────── (many) campaign_application_questions   [gatekeeper]
campaigns (1) ────────── (many) campaign_acknowledgments         [gatekeeper]
campaigns (1) ────────── (many) campaign_applications
campaigns (1) ────────── (many) ai_match_scores             [AI ranked matches]

campaign_applications (1) ── (many) campaign_application_answers
campaign_applications (1) ── (many) campaign_application_acknowledgments
campaign_applications (1) ── (many) negotiation_turns        [offer/counter thread]
campaign_applications (1) ── (many) reviews
campaign_applications (1) ── (1)    contracts                [created at offer time]

contracts (1) ── (many) contract_deliverables               [per-creator deliverable subset]
contracts (1) ── (many) live_content_metric_snapshots       [performance over time]

niches    (1) ── (many) creator_niches
niches    (1) ── (many) campaign_niche_targets
languages (1) ── (many) creator_languages
languages (1) ── (many) campaign_language_targets
```

---

## Implemented Since Phase 1 (live in the database)

> These were originally listed below as future extension points. They are now **migrated and
> live**. Kept here so this schema reference matches the running DB. See `docs/plan.md` §2.3.

### `campaigns` — campaign type & KPI columns (migration `0013_add_campaign_type_and_kpis`)
```sql
-- ⚠️  DEPRECATED: campaign_type is soft-deprecated as of migration 0015 (2026-06-06).
-- Engagement type now lives on the Contract entity (contracts.contract_type).
-- campaign_type is nullable with no default — do NOT write new values here.
-- Safe to DROP once all remaining code references are removed.
-- See docs/plan.md §3.1 and docs/revisions/srs-revisions-26-06-06.md §8 for the deprecation policy.
CREATE TYPE campaign_type AS ENUM (
    'paid_content', 'product_gifting', 'affiliate',
    'brand_ambassador', 'talent_booking', 'ugc_only'
);
ALTER TABLE campaigns
    ADD COLUMN campaign_type   campaign_type,      -- nullable, no default (deprecated)
    ADD COLUMN kpi_targets     JSONB,              -- {reach, engagement_rate, conversions, roi_target}
    ADD COLUMN hashtags        TEXT[] DEFAULT '{}',
    ADD COLUMN tracking_notes  TEXT;
```

### `contracts` — engagement contracts (migration `0015_add_contract_model`)
```sql
-- First-class contract entity. One contract per accepted campaign application.
-- Absorbs engagement type (formerly campaign_type) and owns the execution state machine.
-- Navid-safe: Contract FKs to campaign_applications.id — no changes to matching fields.

CREATE TYPE contract_type AS ENUM (
    'content_collaboration',   -- creator publishes branded content on their channels
    'product_seeding',         -- brand sends product; creator engages authentically
    'talent_engagement'        -- creator appears at or hosts a live event/activation
);
CREATE TYPE contract_status AS ENUM (
    'drafted', 'active', 'in_production', 'content_submitted',
    'content_approved', 'published', 'closed', 'disputed'
);
CREATE TYPE payment_schedule_type AS ENUM ('upfront', 'on_delivery', 'milestone');
CREATE TYPE product_disposition_type AS ENUM ('keep', 'return');

CREATE TABLE contracts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id          UUID NOT NULL UNIQUE REFERENCES campaign_applications(id) ON DELETE CASCADE,
    brand_id                UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    creator_id              UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    contract_type           contract_type NOT NULL,
    status                  contract_status NOT NULL DEFAULT 'active',
    -- Payment clause
    payment_structure       VARCHAR(20) NOT NULL DEFAULT 'none',   -- 'flat_fee' | 'non_cash' | 'none' (non_cash added migration 0022)
    payment_amount_bdt      INTEGER,
    payment_schedule        payment_schedule_type,
    -- Product transfer clause (product_seeding only)
    has_product_transfer    BOOLEAN NOT NULL DEFAULT false,
    product_disposition     product_disposition_type,
    -- Deliverable clause
    deliverable_notes       TEXT,
    non_cash_compensation   TEXT,  -- migration 0022: free product / SaaS access / affiliate value when payment_structure='non_cash'
    -- Exclusivity clause
    exclusivity_days        SMALLINT,
    usage_rights_days       SMALLINT,
    -- Revision clause
    max_revision_rounds     SMALLINT NOT NULL DEFAULT 2,
    revisions_used          SMALLINT NOT NULL DEFAULT 0,
    -- Kill fee clause
    kill_fee_percentage     SMALLINT,
    -- Content submission
    draft_content_url       TEXT,
    live_post_url           TEXT,
    -- Platform fee locked at contract creation
    platform_fee_percentage SMALLINT,  -- content_collaboration=15, product_seeding=10, talent_engagement=18
    -- Audit trail timestamps
    contracted_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    in_production_at        TIMESTAMPTZ,
    submitted_at            TIMESTAMPTZ,
    approved_at             TIMESTAMPTZ,
    published_at            TIMESTAMPTZ,
    closed_at               TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_contracts_brand_id   ON contracts(brand_id);
CREATE INDEX ix_contracts_creator_id ON contracts(creator_id);
CREATE INDEX ix_contracts_status     ON contracts(status);
```

### `live_content_metric_snapshots` — live post performance tracking (migration `0021_live_content_metric_snapshots`)
```sql
-- Time-series performance snapshots for approved creator content.
-- v1 attaches snapshots directly to contracts because contracts already own live_post_url.
-- Future platform sync jobs can write into the same table.

CREATE TABLE live_content_metric_snapshots (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id            UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    platform               VARCHAR(30),
    captured_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    views                  INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
    impressions            INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
    likes                  INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
    comments               INTEGER NOT NULL DEFAULT 0 CHECK (comments >= 0),
    shares                 INTEGER NOT NULL DEFAULT 0 CHECK (shares >= 0),
    saves                  INTEGER NOT NULL DEFAULT 0 CHECK (saves >= 0),
    engagement_rate        FLOAT NOT NULL DEFAULT 0,
    estimated_revenue_bdt  INTEGER NOT NULL DEFAULT 0,
    revenue_basis          VARCHAR(80),
    source                 VARCHAR(30) NOT NULL DEFAULT 'manual',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_metric_snapshots_contract_time
    ON live_content_metric_snapshots(contract_id, captured_at);
```

### `ai_match_scores` — AI matching results (migrations `53f8d9a8a155`, `0014_add_platform_recency_semantic_to_match_scores`)
```sql
-- Live table. One row per (campaign, creator) ranked match.
-- All six sub-scores and semantic boost are now persisted (migration 0014).
CREATE TABLE ai_match_scores (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id       UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id        UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    score_niche       FLOAT,
    score_engagement  FLOAT,
    score_budget      FLOAT,
    score_language    FLOAT,
    score_platform    FLOAT,    -- added migration 0014: platform match sub-score (0–1)
    score_recency     FLOAT,    -- added migration 0014: content recency sub-score (0–1)
    score_semantic    FLOAT,    -- added migration 0014: Gemini semantic boost (0–1, nullable — only when semantic rescue fires)
    score_total       FLOAT,
    rationale         TEXT,
    generated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, creator_id)
);
```

### `contract_deliverables` — per-creator deliverable subset (migration `0022_offer_contract_deliverables_negotiation`)
```sql
-- A brand may take a few creators across platforms and want only a PORTION of the
-- campaign's deliverables from a specific creator. Chosen at offer time; one row per
-- (contract, campaign deliverable requirement) with a per-creator quantity override.
CREATE TABLE contract_deliverables (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    requirement_id  UUID NOT NULL REFERENCES campaign_deliverable_requirements(id) ON DELETE CASCADE,
    quantity        SMALLINT NOT NULL DEFAULT 1,
    notes           TEXT,
    UNIQUE(contract_id, requirement_id)
);
```

### `negotiation_turns` — multi-turn offer/counter-offer thread (migration `0022_offer_contract_deliverables_negotiation`)
```sql
-- One turn per offer/counter in the bilateral negotiation for an application.
-- The brand opens with an offer (also creates the drafted contract); either party may
-- counter; either party may accept the OTHER party's latest 'proposed' turn — which
-- flips the contract to 'active' and the application to 'accepted'.
CREATE TABLE negotiation_turns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,
    author_role     VARCHAR(10) NOT NULL CHECK (author_role IN ('brand','creator')),
    status          VARCHAR(12) NOT NULL DEFAULT 'proposed',  -- 'proposed' | 'accepted' | 'superseded'
    message         TEXT,
    proposed_rate   INTEGER,
    proposed_terms  JSONB,          -- snapshot of clause deltas for this turn
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_negotiation_turns_application_time
    ON negotiation_turns(application_id, created_at);
```

> **Offer-time contract creation (migration 0022 behaviour change).** A `contracts` row is now
> created when the brand **sends an offer** (status `drafted`), not when the application reaches
> `accepted`. Accepting the final offer flips it to `active`. The legacy
> `POST …/applications/{id}/contract` endpoint (accepted-only) still exists; the new flow uses
> `POST …/applications/{id}/offer` + `…/negotiate` + `…/offer/accept|decline`.

### `campaign_status` — extra states (migrations `959ef947cd0f`, `fd300ea6267e`)
`campaign_visibility` plus `archived` were added to the campaign lifecycle; `application_status`
gained `invited` / `declined` for brand-initiated invitations. In the offer flow, `invited`
means **an offer was sent**, `pending_agreement` means **negotiation is in progress**, and
`shortlisted` is an independent pre-offer pool (filled from AI matches or Find Creators in any
campaign status, including draft).

### YouTube ingestion
`app/youtube/` is a **read-only public-API client**; it does not persist. The creator domain exposes
`POST /creators/{creator_id}/platforms/youtube/enrich`, which maps its `enrichment` output onto
`creator_social_profiles` and sets `is_api_verified`, `api_verified_at`, `api_channel_id`, and
`data_source = 'verified'`.

### `creator_social_profiles` — unique platform row restored (migration `0017`)
Migration `53f8d9a8a155` unintentionally dropped `uq_social_creator_platform`; migration `0017`
restores `UNIQUE(creator_id, platform)` so enrichment and seed scripts can safely upsert one row
per creator/platform.

---

## Extension Points (still future)

These remaining columns and tables are intentionally absent.
Add them without modifying existing tables.

### Adding content embeddings for semantic matching (pgvector)
```sql
-- Add to creator_social_profiles or creator_profiles:
ALTER TABLE creator_profiles
    ADD COLUMN bio_embedding vector(384);
```

### Adding the graph layer (Neo4j)
Neo4j syncs from PostgreSQL. No schema change here.
`creator_profiles.id` becomes the Creator node ID in Neo4j.
`brand_profiles.id` becomes the Brand node ID.
`campaign_applications` becomes the COLLABORATED_WITH edge.

### Adding AI match scores
> ✅ **Fully implemented** — see "Implemented Since Phase 1" above (`ai_match_scores`, migrations `53f8d9a8a155` + `0014`).
> All six sub-scores and `score_semantic` are now persisted. Stored `rank` column deferred (N04 — derivable from sorted response order).

### Adding payments and escrow
```sql
-- New table referencing campaign_applications:
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID NOT NULL REFERENCES campaign_applications(id),
    amount_bdt          INTEGER NOT NULL,
    status              VARCHAR(20),          -- pending, held, released, refunded
    bkash_transaction_id VARCHAR(100),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Creation Order

Run migrations in this exact order to satisfy foreign key dependencies:

```
1.  Enable extensions:        uuid-ossp, pgcrypto (or use gen_random_uuid() built-in)
2.  Create all enums
3.  niches
4.  languages
5.  users
6.  creator_profiles
7.  brand_profiles              (creator_collaboration_history references brand_profiles)
8.  creator_social_profiles
9.  creator_niches
10. creator_languages
11. creator_rate_cards
12. creator_portfolio_items
13. creator_collaboration_history
14. campaigns
15. campaign_niche_targets
16. campaign_language_targets
17. campaign_deliverable_requirements
18. campaign_applications
19. reviews
20. All additional indexes
```

---

*Schema is complete for Phase 1. No tables here need to change when adding
the API sync layer, AI matching layer, graph layer, or payment layer.
All future features extend this schema additively.*
