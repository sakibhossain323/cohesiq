# agents.md — Influencer Matching Platform

## Current Scope

Build a traditional CRUD-based web application. No external API calls, no AI/LLM
features, no graph database, no vector embeddings. Those are Phase 2 and beyond.

The goal right now is a working system where:
- Creators register and fill in their profile and social media stats manually
- Brands register and post campaign briefs
- Creators apply to campaigns
- Brands manage applications (shortlist, accept, reject)
- Both sides can leave reviews after a collaboration

Everything is stored in PostgreSQL. All data is entered by users.
The matching in Phase 1 is a filtered SQL query — no algorithm, no scoring.

---

## Architecture: Modular Monolith

One codebase. One database. Code organized by domain so future extraction
into services is a matter of moving a folder, not rewriting logic.

```
Each domain owns:
  - its SQLAlchemy models
  - its Pydantic schemas
  - its FastAPI router
  - its service layer (business logic)

Cross-domain access: always through a service function call.
Never import another domain's models directly into a router.
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.12+) |
| ORM | SQLAlchemy 2.0 (async) + Alembic |
| Database | PostgreSQL 16 |
| Validation | Pydantic v2 |
| Frontend | Next.js 15 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Data Fetching | TanStack Query v5 |
| Containers | Docker Compose |

No other dependencies until Phase 2 explicitly introduces them.

---

## Repository Structure

```
/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   │
│   │   ├── auth/                    -- authentication only
│   │   │   ├── router.py            -- POST /auth/register, POST /auth/login
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   │
│   │   ├── creators/                -- everything about creators
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   │
│   │   ├── brands/                  -- everything about brands
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   │
│   │   ├── campaigns/               -- campaigns + applications + reviews
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   │
│   │   └── common/                  -- shared utilities
│   │       ├── models.py            -- base model class with id/timestamps
│   │       └── dependencies.py      -- get_db, get_current_user
│   │
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 -- landing page
│   │   ├── (auth)/
│   │   │   ├── register/page.tsx
│   │   │   └── login/page.tsx
│   │   ├── creators/
│   │   │   ├── register/page.tsx    -- creator onboarding
│   │   │   ├── [id]/page.tsx        -- public creator profile
│   │   │   └── dashboard/page.tsx   -- creator's own dashboard
│   │   ├── brands/
│   │   │   ├── register/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── dashboard/page.tsx
│   │   └── campaigns/
│   │       ├── page.tsx             -- browse all active campaigns
│   │       ├── new/page.tsx         -- brand creates a campaign
│   │       └── [id]/page.tsx        -- campaign detail + apply button
│   │
│   ├── components/
│   │   ├── ui/                      -- shadcn primitives
│   │   ├── creator-card.tsx
│   │   ├── campaign-card.tsx
│   │   └── application-row.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                   -- typed fetch wrappers
│   │   └── types.ts                 -- TypeScript interfaces
│   │
│   └── package.json
│
└── docker-compose.yml
```

---

## Docker Compose

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: cohesiq
      POSTGRES_PASSWORD: cohesiq
      POSTGRES_DB: cohesiq
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://cohesiq:cohesiq@postgres:5432/cohesiq
      SECRET_KEY: change_this_in_production
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

---

## Database Schema

The full schema is defined in schema.md. Implement it exactly as written there.
Summary of tables to create via Alembic in this order:

```
1.  CREATE EXTENSION uuid-ossp (or use gen_random_uuid() built-in)
2.  Enums: platform_type, user_role, campaign_status, application_status,
           deliverable_type, collaboration_type, gender_type
3.  niches
4.  languages
5.  users
6.  creator_profiles
7.  brand_profiles
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
20. Indexes (defined at end of schema.md)
```

Do not add pgvector, vector columns, or any AI-related columns.
Those are not part of the current scope.

---

## Backend Implementation

### common/models.py — Base Model

```python
import uuid
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
```

### database.py

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

### config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## API Routes to Implement

Each domain's router.py implements these endpoints.
All routes return typed Pydantic v2 response models — never raw ORM objects.

### Auth Routes

```
POST /auth/register      -- create user + creator_profile or brand_profile
POST /auth/login         -- return JWT access token
GET  /auth/me            -- return current user info
```

### Creator Routes

```
GET    /creators/                       -- browse creators (filters below)
GET    /creators/{id}                   -- public creator profile
PUT    /creators/{id}                   -- update own profile (auth required)

POST   /creators/{id}/platforms         -- add a social profile
PUT    /creators/{id}/platforms/{pid}   -- update platform stats
DELETE /creators/{id}/platforms/{pid}   -- remove a platform

POST   /creators/{id}/rate-cards        -- add rate card entry
PUT    /creators/{id}/rate-cards/{rid}  -- update rate
DELETE /creators/{id}/rate-cards/{rid}

POST   /creators/{id}/portfolio         -- add portfolio item
DELETE /creators/{id}/portfolio/{iid}

GET    /creators/{id}/applications      -- creator's own application history
```

**Filter parameters for GET /creators/:**
```
?niche=technology
?platform=youtube
?min_followers=10000
?max_followers=100000
?language=bn
?city=dhaka
?is_available=true
?max_rate=5000
```

These are plain SQL WHERE clauses. No scoring, no ranking — just filtered results.

### Brand Routes

```
GET    /brands/                         -- browse brands
GET    /brands/{id}                     -- public brand profile
PUT    /brands/{id}                     -- update own profile

GET    /brands/{id}/campaigns           -- brand's campaigns
GET    /brands/{id}/applications        -- all applications across brand's campaigns
```

### Campaign Routes

```
GET    /campaigns/                      -- browse active campaigns (filters below)
POST   /campaigns/                      -- brand creates a campaign
GET    /campaigns/{id}                  -- campaign detail
PUT    /campaigns/{id}                  -- brand edits campaign
PATCH  /campaigns/{id}/status           -- brand changes status (active/cancelled)

POST   /campaigns/{id}/apply            -- creator applies to a campaign
GET    /campaigns/{id}/applications     -- brand views all applications for a campaign
PATCH  /campaigns/{id}/applications/{aid}/status  -- brand updates application status
```

**Filter parameters for GET /campaigns/:**
```
?niche=food
?platform=youtube
?min_budget=2000
?max_budget=10000
?language=bn
?status=active
```

### Review Routes

```
POST /reviews/                          -- submit a review after application is completed
GET  /creators/{id}/reviews             -- public reviews for a creator
GET  /brands/{id}/reviews               -- public reviews for a brand
```

---

## Service Layer Pattern

Each domain has a service.py that contains all business logic.
Routers call service functions. Service functions call the database.
Never put database queries in routers.

```python
# Example: creators/service.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.creators.models import CreatorProfile, CreatorSocialProfile
from app.creators.schemas import CreatorCreate, CreatorUpdate, CreatorFilters

async def get_creator(db: AsyncSession, creator_id: str) -> CreatorProfile | None:
    result = await db.execute(
        select(CreatorProfile).where(CreatorProfile.id == creator_id)
    )
    return result.scalar_one_or_none()

async def list_creators(db: AsyncSession, filters: CreatorFilters) -> list[CreatorProfile]:
    query = (
        select(CreatorProfile)
        .join(CreatorProfile.social_profiles)
        .where(CreatorProfile.is_available == True)
        .where(CreatorProfile.deleted_at.is_(None))
    )
    if filters.platform:
        query = query.where(CreatorSocialProfile.platform == filters.platform)
    if filters.min_followers:
        query = query.where(CreatorSocialProfile.follower_count >= filters.min_followers)
    if filters.niche:
        # join creator_niches for niche filter
        pass
    result = await db.execute(query)
    return result.scalars().all()

async def create_creator_profile(
    db: AsyncSession, user_id: str, data: CreatorCreate
) -> CreatorProfile:
    profile = CreatorProfile(user_id=user_id, **data.model_dump())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile
```

---

## Frontend Pages

### Creator Registration Flow (multi-step)

Step 1 — Account: email, password, confirm password
Step 2 — Basic profile: display name, bio, tagline, city, gender (optional)
Step 3 — Niches: primary niche (required), sub-niches (up to 3)
Step 4 — Languages: which languages they post in
Step 5 — Platforms: add at least one platform
  - Select platform (YouTube, Instagram, Facebook, etc.)
  - Enter handle and profile URL
  - Enter follower count, avg views, avg likes, avg comments (all optional)
  - Enter posts per month (optional)
Step 6 — Rate cards: add pricing per deliverable (optional, can skip)

### Brand Registration Flow (single page)

Fields: brand name, email, password, industry/niche, description, website, city.

### Campaign Creation Form

Fields: title, description/brief (textarea), primary niche, required platforms
(checkboxes), budget min/max (BDT), creator follower range (min/max slider),
target cities (optional), content languages (checkboxes), application deadline,
content deadline.

### Browse Creators Page

Filter sidebar: platform, niche, follower range, language, city, budget range.
Grid of creator cards. Each card shows: profile photo, display name, city,
primary niche, top platform with follower count, engagement rate (if provided).
Click → full profile page.

### Browse Campaigns Page

Filter sidebar: niche, platform, budget range.
List of campaign cards. Each card shows: brand name, campaign title, niche,
budget range, deadline, required platform badges.
Click → campaign detail with Apply button (if creator is logged in).

### Creator Dashboard

My applications: table with campaign name, brand, applied date, status badge.
My profile: link to edit profile.

### Brand Dashboard

My campaigns: table with title, status, application count.
Click campaign → see all applications with creator name, follower count,
proposed rate, status dropdown to shortlist/accept/reject.

---

## Requirements

**backend/requirements.txt:**
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.0
pydantic==2.10.0
pydantic-settings==2.7.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.20
```

**frontend (npm install):**
```
next@15.1.0
react@^19.0.0
react-dom@^19.0.0
@tanstack/react-query@^5.62.0
lucide-react@^0.469.0
class-variance-authority@^0.7.1
clsx@^2.1.1
tailwind-merge@^2.6.0
```

---

## Implementation Order

Complete each step before starting the next.
The system should be testable at the end of every step.

```
STEP 1 — Foundation
  a. docker-compose up (postgres only)
  b. Set up FastAPI app with health check GET /health → {"status": "ok"}
  c. Connect SQLAlchemy async engine, verify connection
  d. Create first Alembic migration: enums + lookup tables (niches, languages)
  e. Seed niches and languages tables with the values from schema.md
  f. Verify: rows exist in niches and languages tables

STEP 2 — Users and Auth
  a. Create users table via Alembic migration
  b. Implement SQLAlchemy User model
  c. Implement POST /auth/register (creates user row, hashes password)
  d. Implement POST /auth/login (returns JWT)
  e. Implement GET /auth/me (returns current user from JWT)
  f. Verify: register → login → /auth/me returns correct user

STEP 3 — Creator Profile
  a. Migrate: creator_profiles table
  b. SQLAlchemy model for CreatorProfile
  c. POST /auth/register extended: if role=creator, also create creator_profile row
  d. GET /creators/{id}
  e. PUT /creators/{id} (update own profile, auth required)
  f. Verify: register as creator → fetch profile → update bio → fetch again

STEP 4 — Creator Social Profiles
  a. Migrate: creator_social_profiles table
  b. SQLAlchemy model
  c. POST /creators/{id}/platforms
  d. PUT /creators/{id}/platforms/{pid}
  e. DELETE /creators/{id}/platforms/{pid}
  f. Verify: add YouTube platform → update follower count → delete it

STEP 5 — Creator Niches and Languages
  a. Migrate: creator_niches, creator_languages tables
  b. SQLAlchemy models (association tables)
  c. Include niches and languages in creator profile create/update flow
  d. Verify: creator has technology niche + bangla language stored correctly

STEP 6 — Creator Rate Cards and Portfolio
  a. Migrate: creator_rate_cards, creator_portfolio_items,
              creator_collaboration_history tables
  b. SQLAlchemy models
  c. CRUD routes for each
  d. Verify: add rate card for YouTube video → fetch creator profile → rate card present

STEP 7 — Brand Profile
  a. Migrate: brand_profiles table
  b. SQLAlchemy model
  c. POST /auth/register extended: if role=brand, also create brand_profile row
  d. GET /brands/{id}
  e. PUT /brands/{id}
  f. Verify: register as brand → fetch profile

STEP 8 — Campaigns
  a. Migrate: campaigns, campaign_niche_targets, campaign_language_targets,
              campaign_deliverable_requirements tables
  b. SQLAlchemy models
  c. POST /campaigns/ (brand creates campaign)
  d. GET /campaigns/ (browse with filters)
  e. GET /campaigns/{id}
  f. PUT /campaigns/{id}
  g. PATCH /campaigns/{id}/status
  h. Verify: create campaign → set status to active → appears in browse results

STEP 9 — Applications
  a. Migrate: campaign_applications table
  b. SQLAlchemy model
  c. POST /campaigns/{id}/apply (creator applies)
  d. GET /campaigns/{id}/applications (brand views applicants)
  e. PATCH /campaigns/{id}/applications/{aid}/status (brand shortlists/accepts/rejects)
  f. GET /creators/{id}/applications (creator views own applications)
  g. Verify: creator applies → brand shortlists → creator sees updated status

STEP 10 — Reviews
  a. Migrate: reviews table
  b. SQLAlchemy model
  c. POST /reviews/ (only allowed when application status = completed)
  d. GET /creators/{id}/reviews
  e. GET /brands/{id}/reviews
  f. Verify: complete an application → both sides submit reviews → show on profiles

STEP 11 — Browse Filters
  a. Implement full filter logic for GET /creators/ (platform, niche, followers, language)
  b. Implement full filter logic for GET /campaigns/ (niche, platform, budget)
  c. Verify: create 5 creators with different niches → filter by niche → correct subset

STEP 12 — Frontend
  a. Creator registration (multi-step form)
  b. Brand registration
  c. Login page + JWT storage
  d. Browse creators page with filters
  e. Creator public profile page
  f. Browse campaigns page
  g. Campaign detail + apply button
  h. Creator dashboard (my applications)
  i. Brand dashboard (my campaigns + application management)
  j. Review submission form
```

---

## What Comes After (Not Now)

These are the Phase 2 additions. Do not implement them during Phase 1.
The schema and code will accommodate them without structural changes.

```
YouTube API sync     → service reads creator_social_profiles, writes back verified stats
Instagram API sync   → same pattern, different service file
AI niche detection   → reads video titles from API, writes to creator_social_profiles
Scoring engine       → reads creator_metrics, writes to a new ai_match_scores table
pgvector embeddings  → ALTER TABLE to add vector column, no existing columns change
Neo4j graph          → syncs from PostgreSQL, no schema changes here
Payments / escrow    → new payments table referencing campaign_applications
Notifications        → new notifications table, background job
```

---

*Build Phase 1 completely before thinking about Phase 2.
A working traditional CRUD system is a better foundation than a
half-built AI system.*
