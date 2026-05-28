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
Later, a sync layer can overwrite the same columns with API-verified values
by adding `is_verified BOOLEAN` and `last_verified_at TIMESTAMPTZ` columns.
The data model does not change.

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
  │     ├── creator_social_profiles   (1:many — one per platform)
  │     ├── creator_niches            (many:many with niches)
  │     ├── creator_languages         (1:many)
  │     ├── creator_rate_cards        (1:many)
  │     └── creator_portfolio_items   (1:many — sample content URLs)
  │
  └── brand_profiles            (1:1)
        └── campaigns           (1:many)
              └── campaign_applications  (many:many with creator_profiles)
                    └── reviews          (1:many — after completion)

-- Shared lookup tables --
niches       (referenced by creator_niches + campaign_niche_targets)
languages    (referenced by creator_languages + campaign_language_targets)
```

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
    'cancelled'
);

-- Application lifecycle
CREATE TYPE application_status AS ENUM (
    'pending',      -- creator applied, brand hasn't responded
    'shortlisted',  -- brand interested, not final
    'accepted',     -- brand confirmed this creator
    'rejected',     -- brand passed
    'withdrawn',    -- creator pulled out
    'completed'     -- collaboration done, review can be left
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
    password_hash   VARCHAR(255) NOT NULL,
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
-- All metric fields are SELF-REPORTED by the creator.
-- Later: add is_api_verified + last_verified_at columns to mark API-confirmed values.
-- The columns themselves do not change — only the verification flag gets added.
CREATE TABLE creator_social_profiles (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id           UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    platform             platform_type NOT NULL,

    -- Identity on the platform
    handle               VARCHAR(255) NOT NULL,   -- @username or channel name
    profile_url          TEXT NOT NULL,            -- Full URL to their profile
    platform_user_id     VARCHAR(255),             -- Platform's internal ID (if known)
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

    price_bdt         INTEGER NOT NULL,        -- Price in BDT (Bangladeshi Taka)
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
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_brand       ON campaigns(brand_id);
CREATE INDEX idx_campaigns_status      ON campaigns(status);
CREATE INDEX idx_campaigns_primary_niche ON campaigns(primary_niche_id);
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
    quantity          SMALLINT DEFAULT 1,      -- How many of this deliverable
    notes             TEXT                     -- Specific requirements (length, format, etc.)
);

CREATE INDEX idx_deliverable_req_campaign ON campaign_deliverable_requirements(campaign_id);
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
campaigns (1) ────────── (many) campaign_applications

campaign_applications (1) ── (many) reviews

niches    (1) ── (many) creator_niches
niches    (1) ── (many) campaign_niche_targets
languages (1) ── (many) creator_languages
languages (1) ── (many) campaign_language_targets
```

---

## Extension Points

These columns and tables are intentionally absent from Phase 1.
Add them without modifying existing tables.

### Adding API-verified social stats (no schema change)
```sql
-- Add to creator_social_profiles:
ALTER TABLE creator_social_profiles
    ADD COLUMN is_api_verified    BOOLEAN DEFAULT FALSE,
    ADD COLUMN api_verified_at    TIMESTAMPTZ,
    ADD COLUMN api_channel_id     VARCHAR(255);  -- Platform's internal channel ID
-- The existing metric columns (follower_count, avg_views, etc.) get overwritten
-- by the sync service. Same columns, now API-sourced instead of self-reported.
```

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
```sql
-- New table, does not touch any existing table:
CREATE TABLE ai_match_scores (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id       UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id        UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    score_niche       FLOAT,
    score_engagement  FLOAT,
    score_budget      FLOAT,
    score_language    FLOAT,
    score_total       FLOAT,
    rationale         TEXT,
    generated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(campaign_id, creator_id)
);
```

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
