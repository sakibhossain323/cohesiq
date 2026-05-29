**Initial Plan — Influencer Matching Platform (Phase 1)**  
**What You Are Building**  
A two-sided marketplace that matches brands with YouTube content creators (influencers). Brands post campaign briefs. Creators register with their YouTube channel. An AI-powered matching engine ranks creators by niche fit, engagement quality, budget compatibility, and audience language. A large language model generates a natural-language rationale for each match.  
Phase 1 is scoped to YouTube only. Every schema, API route, and component must be designed so that Instagram, TikTok, and Facebook can be added as new platform modules without touching existing code. Do not hard-code "YouTube" into business logic — use a platform enum throughout.

**Tech Stack**  
| | | |  
|-|-|-|  
| **Layer** | **Technology** | **Notes** |   
| Backend | FastAPI (Python 3.12+) | Async throughout. Use httpx for all external HTTP. |   
| ORM | SQLAlchemy 2.0 (async) + Alembic | Declarative models, typed columns. |   
| Primary DB | PostgreSQL 16 + pgvector extension | All relational data + content embeddings. |   
| Graph DB | Neo4j 5 Community Edition | Creator-Niche-Brand-Campaign relationships. |   
| LLM | Google Gemini 2.5 Flash via google-generativeai SDK | Free tier. 1,500 req/day. |   
| Embeddings | sentence-transformers paraphrase-multilingual-MiniLM-L12-v2 | Runs locally, CPU-only. Handles Bangla + English. |   
| YouTube API | YouTube Data API v3 via httpx | API key only. No OAuth in Phase 1. |   
| Frontend | Next.js 16 (App Router) + TypeScript |   |   
| UI Components | shadcn/ui + Tailwind CSS v4 |   |   
| Data Fetching | TanStack Query v5 |   |   
| Containerization | Docker Compose | One command to start the full stack. |   
   
**Repository Structure**  
Create this exact folder layout before writing any code:  
/  
 ├── backend/  
 │   ├── app/  
 │   │   ├── __init__.py  
 │   │   ├── main.py                  # FastAPI app factory  
 │   │   ├── config.py                # Settings via pydantic-settings  
 │   │   ├── database.py              # SQLAlchemy async engine + session  
 │   │   ├── graph.py                 # Neo4j driver singleton  
 │   │   ├── models/                  # SQLAlchemy ORM models  
 │   │   │   ├── __init__.py  
 │   │   │   ├── creator.py  
 │   │   │   ├── brand.py  
 │   │   │   └── campaign.py  
 │   │   ├── schemas/                 # Pydantic v2 request/response schemas  
 │   │   │   ├── __init__.py  
 │   │   │   ├── creator.py  
 │   │   │   ├── brand.py  
 │   │   │   └── campaign.py  
 │   │   ├── routers/                 # FastAPI routers, one per domain  
 │   │   │   ├── __init__.py  
 │   │   │   ├── creators.py  
 │   │   │   ├── brands.py  
 │   │   │   └── campaigns.py  
 │   │   └── services/               # Business logic, external API calls  
 │   │       ├── __init__.py  
 │   │       ├── youtube.py           # YouTube Data API v3 client  
 │   │       ├── embedding.py         # Sentence transformer wrapper  
 │   │       ├── matching.py          # Core matching engine  
 │   │       ├── llm.py               # Gemini rationale generation  
 │   │       └── graph_sync.py        # Sync Postgres to Neo4j  
 │   ├── alembic/  
 │   │   ├── env.py  
 │   │   └── versions/  
 │   ├── alembic.ini  
 │   ├── requirements.txt  
 │   └── Dockerfile  
 ├── frontend/  
 │   ├── app/  
 │   │   ├── layout.tsx  
 │   │   ├── page.tsx                 # Landing / home  
 │   │   ├── creators/  
 │   │   │   ├── page.tsx             # Creator registration  
 │   │   │   └── [id]/page.tsx        # Creator profile view  
 │   │   ├── brands/  
 │   │   │   ├── page.tsx             # Brand registration  
 │   │   │   └── [id]/page.tsx        # Brand dashboard  
 │   │   └── campaigns/  
 │   │       ├── new/page.tsx         # Campaign brief form  
 │   │       └── [id]/page.tsx        # Match results  
 │   ├── components/  
 │   │   ├── ui/                      # shadcn primitives (auto-generated)  
 │   │   ├── creator-card.tsx  
 │   │   ├── match-result-card.tsx  
 │   │   ├── campaign-brief-form.tsx  
 │   │   └── platform-badge.tsx  
 │   ├── lib/  
 │   │   ├── api.ts                   # Typed fetch wrappers  
 │   │   └── types.ts                 # Shared TypeScript types  
 │   ├── package.json  
 │   └── Dockerfile  
 └── docker-compose.yml  
   

**Docker Compose Setup**  
Create docker-compose.yml at the project root:  
version: "3.9"  
   
 services:  
   postgres:  
     image: pgvector/pgvector:pg16  
     environment:  
       POSTGRES_USER: cohesiq  
       POSTGRES_PASSWORD: cohesiq  
       POSTGRES_DB: cohesiq  
     ports:  
       - "5432:5432"  
     volumes:  
       - postgres_data:/var/lib/postgresql/data  
   
   neo4j:  
     image: neo4j:5-community  
     environment:  
       NEO4J_AUTH: neo4j/cohesiq_neo4j  
       NEO4J_PLUGINS: '["apoc"]'  
     ports:  
       - "7474:7474"  
       - "7687:7687"  
     volumes:  
       - neo4j_data:/data  
   
   backend:  
     build: ./backend  
     ports:  
       - "8000:8000"  
     environment:  
       DATABASE_URL: postgresql+asyncpg://cohesiq:cohesiq@postgres:5432/cohesiq  
       NEO4J_URI: bolt://neo4j:7687  
       NEO4J_USER: neo4j  
       NEO4J_PASSWORD: cohesiq_neo4j  
       YOUTUBE_API_KEY: ${YOUTUBE_API_KEY}  
       GEMINI_API_KEY: ${GEMINI_API_KEY}  
     depends_on:  
       - postgres  
       - neo4j  
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
   neo4j_data:  
   
Create a .env file at root (never commit this):  
YOUTUBE_API_KEY=your_key_here  
 GEMINI_API_KEY=your_key_here  
   
**Step 1: PostgreSQL Schema**  
Enable the pgvector extension first. Add this to the first Alembic migration:  
CREATE EXTENSION IF NOT EXISTS vector;  
 CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  
   
**1.1 Enums**  
Define these PostgreSQL enums before the tables that reference them:  
CREATE TYPE platform_type AS ENUM (  
   'youtube',  
   'instagram',  
   'tiktok',  
   'facebook'  
 );  
   
 CREATE TYPE niche_category AS ENUM (  
   'technology', 'gaming', 'fashion', 'beauty', 'food',  
   'travel', 'lifestyle', 'education', 'finance', 'fitness',  
   'parenting', 'entertainment', 'news', 'other'  
 );  
   
 CREATE TYPE content_language AS ENUM (  
   'bangla',  
   'english',  
   'banglish'  
 );  
   
 CREATE TYPE campaign_status AS ENUM (  
   'draft', 'matching', 'completed', 'cancelled'  
 );  
   
 CREATE TYPE match_status AS ENUM (  
   'suggested', 'shortlisted', 'contacted', 'accepted', 'rejected'  
 );  
   
**1.2 Creators Table**  
CREATE TABLE creators (  
   id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
   display_name   VARCHAR(120) NOT NULL,  
   email          VARCHAR(255) UNIQUE NOT NULL,  
   bio            TEXT,  
   country        VARCHAR(2) DEFAULT 'BD',  
   city           VARCHAR(100),  
   rate_per_post  INTEGER,        -- BDT, self-reported  
   rate_per_video INTEGER,        -- BDT, self-reported  
   primary_niche  niche_category NOT NULL,  
   sub_niches     niche_category[] DEFAULT '{}',  
   languages      content_language[] NOT NULL DEFAULT '{bangla}',  
   is_verified    BOOLEAN DEFAULT FALSE,   -- Phase 2: OAuth-verified  
   created_at     TIMESTAMPTZ DEFAULT NOW(),  
   updated_at     TIMESTAMPTZ DEFAULT NOW()  
 );  
   
**1.3 Creator Platform Connections**  
One creator can connect multiple platforms. Phase 1 populates YouTube only. This table is the extension point: adding Instagram in Phase 2 means inserting a new row with platform = 'instagram'. Nothing else changes.  
CREATE TABLE creator_platforms (  
   id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
   creator_id       UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,  
   platform         platform_type NOT NULL,  
   platform_handle  VARCHAR(255) NOT NULL,   -- YouTube: channel ID (UCxxxxx)  
   platform_url     TEXT,  
   follower_count   INTEGER,                 -- Rounded (YouTube: 3 sig fig)  
   is_connected     BOOLEAN DEFAULT FALSE,   -- TRUE when OAuth verified (Phase 2)  
   last_synced_at   TIMESTAMPTZ,  
   raw_stats        JSONB DEFAULT '{}',  
   created_at       TIMESTAMPTZ DEFAULT NOW(),  
   
   UNIQUE(creator_id, platform)  
 );  
   
**1.4 YouTube Channel Snapshots**  
Time series of channel stats for growth anomaly detection (authenticity scoring).  
CREATE TABLE youtube_channel_snapshots (  
   id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
   creator_id        UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,  
   channel_id        VARCHAR(50) NOT NULL,  
   subscriber_count  INTEGER,  
   view_count        BIGINT,  
   video_count       INTEGER,  
   topic_categories  TEXT[],              -- Raw Wikipedia URLs from API  
   snapshotted_at    TIMESTAMPTZ DEFAULT NOW()  
 );  
   
 CREATE INDEX idx_yt_snapshots_creator ON youtube_channel_snapshots(creator_id, snapshotted_at DESC);  
   
**1.5 YouTube Videos**  
Recent video stats for engagement rate calculation. Fetch last 10 per sync.  
CREATE TABLE youtube_videos (  
   id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
   creator_id     UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,  
   video_id       VARCHAR(20) NOT NULL UNIQUE,  
   title          TEXT,  
   description    TEXT,  
   published_at   TIMESTAMPTZ,  
   view_count     BIGINT DEFAULT 0,  
   like_count     INTEGER DEFAULT 0,  
   comment_count  INTEGER DEFAULT 0,  
   is_short       BOOLEAN DEFAULT FALSE,  
   engaged_views  BIGINT,   -- For Shorts: use instead of view_count  
   tags           TEXT[] DEFAULT '{}',  
   fetched_at     TIMESTAMPTZ DEFAULT NOW()  
 );  
   
 CREATE INDEX idx_yt_videos_creator ON youtube_videos(creator_id, published_at DESC);  
   
**1.6 Creator Metrics (Computed Summary)**  
Updated after every YouTube sync. The matching engine reads only from here.  
   
 Never joins raw video/snapshot tables during matching — always this summary.  
CREATE TABLE creator_metrics (  
   creator_id              UUID PRIMARY KEY REFERENCES creators(id) ON DELETE CASCADE,  
   platform                platform_type NOT NULL DEFAULT 'youtube',  
   
   avg_engagement_rate     FLOAT,  
   avg_views_per_video     FLOAT,  
   avg_likes_per_video     FLOAT,  
   avg_comments_per_video  FLOAT,  
   
   posts_per_month         FLOAT,          -- Rolling 90-day average  
   days_since_last_post    INTEGER,  
   posting_consistency     FLOAT,          -- Std dev of inter-post intervals (lower = consistent)  
   
   authenticity_score      FLOAT,          -- 0.0-1.0 composite  
   follower_growth_zscore  FLOAT,  
   comment_like_ratio      FLOAT,  
   
   llm_primary_niche       niche_category,  
   llm_sub_niches          niche_category[] DEFAULT '{}',  
   llm_language_profile    JSONB DEFAULT '{}',   -- {"bangla": 0.65, "english": 0.20, "banglish": 0.15}  
   llm_niche_confidence    FLOAT,  
   
   content_embedding       vector(384),    -- pgvector: bio + niche + video titles  
   
   updated_at              TIMESTAMPTZ DEFAULT NOW()  
 );  
   
**1.7 Brands Table**  
CREATE TABLE brands (  
   id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
   name        VARCHAR(120) NOT NULL,  
   email       VARCHAR(255) UNIQUE NOT NULL,  
   website     TEXT,  
   industry    niche_category NOT NULL,  
   description TEXT,  
   country     VARCHAR(2) DEFAULT 'BD',  
   created_at  TIMESTAMPTZ DEFAULT NOW(),  
   updated_at  TIMESTAMPTZ DEFAULT NOW()  
 );  
   
**1.8 Campaigns Table**  
CREATE TABLE campaigns (  
   id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
   brand_id             UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,  
   title                VARCHAR(200) NOT NULL,  
   brief                TEXT NOT NULL,  
   niche                niche_category NOT NULL,  
   target_language      content_language NOT NULL DEFAULT 'bangla',  
   required_platforms   platform_type[] DEFAULT '{youtube}',  
   budget_per_creator   INTEGER NOT NULL,          -- BDT  
   target_min_followers INTEGER DEFAULT 1000,  
   target_max_followers INTEGER DEFAULT 10000000,  
   target_cities        TEXT[] DEFAULT '{}',  
   status               campaign_status DEFAULT 'draft',  
   brief_embedding      vector(384),               -- Embedded at creation  
   created_at           TIMESTAMPTZ DEFAULT NOW(),  
   updated_at           TIMESTAMPTZ DEFAULT NOW()  
 );  
   
**1.9 Campaign Matches Table**  
CREATE TABLE campaign_matches (  
   id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
   campaign_id         UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,  
   creator_id          UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,  
   status              match_status DEFAULT 'suggested',  
   
   score_niche         FLOAT,   -- Weight: 0.30  
   score_engagement    FLOAT,   -- Weight: 0.20  
   score_budget        FLOAT,   -- Weight: 0.20  
   score_platform      FLOAT,   -- Weight: 0.15  
   score_language      FLOAT,   -- Weight: 0.10  
   score_recency       FLOAT,   -- Weight: 0.05  
   total_score         FLOAT,  
   
   semantic_similarity FLOAT,  
   
   match_rationale     TEXT,  
   rationale_language  content_language DEFAULT 'english',  
   
   rank                INTEGER,  
   created_at          TIMESTAMPTZ DEFAULT NOW(),  
   
   UNIQUE(campaign_id, creator_id)  
 );  
   
 CREATE INDEX idx_matches_campaign ON campaign_matches(campaign_id, rank ASC);  
   
**1.10 Collaboration History**  
CREATE TABLE collaborations (  
   id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
   creator_id      UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,  
   brand_id        UUID REFERENCES brands(id) ON DELETE SET NULL,  
   brand_name      VARCHAR(120),  
   brand_niche     niche_category,  
   collaborated_at DATE NOT NULL,  
   is_verified     BOOLEAN DEFAULT FALSE,  
   notes           TEXT,  
   created_at      TIMESTAMPTZ DEFAULT NOW()  
 );  
   
**Step 2: Neo4j Graph Schema**  
**Node Labels and Properties**  
(:Creator {id, name, primary_niche, sub_niches, country, city,  
            authenticity_score, avg_engagement_rate, follower_count, rate_per_post})  
   
 (:Brand {id, name, industry, country})  
   
 (:Niche {name})  
   
 (:Platform {name})  
   
 (:Campaign {id, title, niche, budget_per_creator, status})  
   
**Relationships**  
(:Creator)-[:WORKS_IN {confidence: 0.87}]->(:Niche)  
 (:Creator)-[:ACTIVE_ON {follower_count: 0, verified: false}]->(:Platform)  
 (:Brand)-[:TARGETS]->(:Niche)  
 (:Creator)-[:COLLABORATED_WITH {date: "2025-01-01", verified: false}]->(:Brand)  
 (:Campaign)-[:REQUIRES]->(:Niche)  
 (:Campaign)-[:OWNED_BY]->(:Brand)  
 (:Creator)-[:MATCHED_TO {score: 0.0, rank: 1}]->(:Campaign)  
   
**Constraints and Indexes (run once at startup)**  
CREATE CONSTRAINT creator_id IF NOT EXISTS FOR (c:Creator) REQUIRE c.id IS UNIQUE;  
 CREATE CONSTRAINT brand_id IF NOT EXISTS FOR (b:Brand) REQUIRE b.id IS UNIQUE;  
 CREATE CONSTRAINT niche_name IF NOT EXISTS FOR (n:Niche) REQUIRE n.name IS UNIQUE;  
 CREATE CONSTRAINT campaign_id IF NOT EXISTS FOR (c:Campaign) REQUIRE c.id IS UNIQUE;  
 CREATE INDEX creator_niche IF NOT EXISTS FOR (c:Creator) ON (c.primary_niche);  
 CREATE INDEX creator_engagement IF NOT EXISTS FOR (c:Creator) ON (c.avg_engagement_rate);  
   
**Step 3: Backend Implementation**  
**3.1 Config (app/config.py)**  
from pydantic_settings import BaseSettings  
   
 class Settings(BaseSettings):  
     database_url: str  
     neo4j_uri: str  
     neo4j_user: str  
     neo4j_password: str  
     youtube_api_key: str  
     gemini_api_key: str  
     youtube_quota_daily: int = 10000  
     embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"  
   
     class Config:  
         env_file = ".env"  
   
 settings = Settings()  
   
**3.2 YouTube Service (services/youtube.py)**  
Design this so adding Instagram in Phase 2 means creating services/instagram.py  
   
 with the same interface. Never modify this file for other platforms.  
import httpx  
 from app.config import settings  
   
 YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"  
   
   
 class YouTubeService:  
     """  
     YouTube Data API v3 client.  
     All calls use API key only. No OAuth in Phase 1.  
     Public channel data does not require user consent.  
     """  
   
     async def get_channel_stats(self, channel_id: str) -> dict:  
         """  
         Fetch public stats for a YouTube channel.  
         Cost: 1 quota unit.  
         Returns subscriber count (rounded to 3 sig fig by Google),  
         view count, video count, and topic categories.  
         """  
         params = {  
             "part": "statistics,topicDetails,snippet,contentDetails",  
             "id": channel_id,  
             "key": settings.youtube_api_key,  
         }  
         async with httpx.AsyncClient() as client:  
             r = await client.get(f"{YOUTUBE_API_BASE}/channels", params=params)  
             r.raise_for_status()  
             data = r.json()  
   
         if not data.get("items"):  
             raise ValueError(f"Channel not found: {channel_id}")  
   
         return data["items"][0]  
   
     async def get_recent_videos(self, channel_id: str, max_results: int = 10) -> list[dict]:  
         """  
         Fetch recent video stats for engagement rate calculation.  
         Total cost: ~3 quota units for 10 videos.  
         Step 1: Get upload playlist ID (from channel_stats response).  
         Step 2: List playlist items (1 unit).  
         Step 3: Batch fetch video stats (1 unit per 50 videos).  
         """  
         channel_data = await self.get_channel_stats(channel_id)  
         uploads_playlist = (  
             channel_data  
             .get("contentDetails", {})  
             .get("relatedPlaylists", {})  
             .get("uploads")  
         )  
         if not uploads_playlist:  
             return []  
   
         params = {  
             "part": "contentDetails",  
             "playlistId": uploads_playlist,  
             "maxResults": max_results,  
             "key": settings.youtube_api_key,  
         }  
         async with httpx.AsyncClient() as client:  
             r = await client.get(f"{YOUTUBE_API_BASE}/playlistItems", params=params)  
             r.raise_for_status()  
             playlist_data = r.json()  
   
         video_ids = [  
             item["contentDetails"]["videoId"]  
             for item in playlist_data.get("items", [])  
         ]  
         if not video_ids:  
             return []  
   
         params = {  
             "part": "statistics,snippet,contentDetails",  
             "id": ",".join(video_ids),  
             "key": settings.youtube_api_key,  
         }  
         async with httpx.AsyncClient() as client:  
             r = await client.get(f"{YOUTUBE_API_BASE}/videos", params=params)  
             r.raise_for_status()  
             return r.json().get("items", [])  
   
     def extract_channel_id_from_url(self, url: str) -> str | None:  
         """  
         Parse /channel/UCxxxxx format. Free — no API call.  
         Returns None for @handle or /c/ formats (use resolve_handle_to_channel_id).  
         """  
         import re  
         match = re.search(r"youtube\.com/channel/(UC[a-zA-Z0-9_-]{22})", url)  
         return match.group(1) if match else None  
   
     async def resolve_handle_to_channel_id(self, handle: str) -> str | None:  
         """  
         Resolve a @handle to a channel ID via search.list.  
         WARNING: Costs 100 quota units. Cache results aggressively.  
         Only call this when extract_channel_id_from_url returns None.  
         """  
         params = {  
             "part": "snippet",  
             "q": handle.lstrip("@"),  
             "type": "channel",  
             "maxResults": 1,  
             "key": settings.youtube_api_key,  
         }  
         async with httpx.AsyncClient() as client:  
             r = await client.get(f"{YOUTUBE_API_BASE}/search", params=params)  
             r.raise_for_status()  
             items = r.json().get("items", [])  
             if items:  
                 return items[0]["snippet"]["channelId"]  
         return None  
   
**3.3 Matching Engine (services/matching.py)**  
All weights are constants at the top. Change them without touching any other file.  
   
 This module is pure — no database calls, no async, no side effects. Unit-testable in isolation.  
from dataclasses import dataclass  
   
 # --- Weights (must sum to 1.0) ---  
 W_NICHE      = 0.30  
 W_ENGAGEMENT = 0.20  
 W_BUDGET     = 0.20  
 W_PLATFORM   = 0.15  
 W_LANGUAGE   = 0.10  
 W_RECENCY    = 0.05  
   
 # --- Tier engagement benchmarks for normalization ---  
 ENGAGEMENT_BENCHMARKS = {  
     "nano":  0.060,   # 1K-10K followers  
     "micro": 0.0386,  # 10K-100K  
     "macro": 0.018,   # 100K-500K  
     "mega":  0.012,   # 500K+  
 }  
   
   
 @dataclass  
 class MatchScores:  
     niche: float  
     engagement: float  
     budget: float  
     platform: float  
     language: float  
     recency: float  
     total: float  
     semantic_similarity: float = 0.0  
   
   
 def get_tier(follower_count: int) -> str:  
     if follower_count <= 10_000:  
         return "nano"  
     elif follower_count <= 100_000:  
         return "micro"  
     elif follower_count <= 500_000:  
         return "macro"  
     return "mega"  
   
   
 def score_niche(campaign_niche: str, creator_primary: str, creator_sub: list[str]) -> float:  
     if campaign_niche == creator_primary:  
         return 1.0  
     if campaign_niche in (creator_sub or []):  
         return 0.6  
     return 0.0  
   
   
 def score_engagement(engagement_rate: float | None, follower_count: int) -> float:  
     if not engagement_rate or engagement_rate <= 0:  
         return 0.0  
     tier = get_tier(follower_count)  
     benchmark = ENGAGEMENT_BENCHMARKS[tier]  
     return min((engagement_rate / benchmark) / 1.5, 1.0)  
   
   
 def score_budget(budget_per_creator: int, creator_rate: int | None) -> float:  
     if not creator_rate or creator_rate <= 0:  
         return 0.5   # No rate set: treat as negotiable  
     if creator_rate <= budget_per_creator:  
        return 1.0  
     if creator_rate <= budget_per_creator * 1.3:  
         return 0.5  
     return 0.0  
   
   
 def score_platform(required_platforms: list[str], creator_platforms: list[str]) -> float:  
     if not required_platforms:  
         return 1.0  
     covered = sum(1 for p in required_platforms if p in creator_platforms)  
     return covered / len(required_platforms)  
   
   
 def score_language(target_language: str, creator_language_profile: dict) -> float:  
     return float(creator_language_profile.get(target_language, 0.0))  
   
   
 def score_recency(days_since_last_post: int | None) -> float:  
     if days_since_last_post is None:  
         return 0.3  
     if days_since_last_post <= 7:  
         return 1.0  
     if days_since_last_post <= 30:  
         return 0.7  
     if days_since_last_post <= 90:  
         return 0.3  
     return 0.0  
   
   
 def compute_match_score(  
     campaign_niche: str,  
     campaign_budget: int,  
     campaign_platforms: list[str],  
     campaign_target_language: str,  
     creator_primary_niche: str,  
     creator_sub_niches: list[str],  
     creator_engagement_rate: float | None,  
     creator_follower_count: int,  
     creator_rate: int | None,  
     creator_platforms: list[str],  
     creator_language_profile: dict,  
     creator_days_since_post: int | None,  
 ) -> MatchScores:  
     """  
     Pure function. All inputs are pre-fetched primitives.  
     No database calls. Fully unit-testable.  
     """  
     niche    = score_niche(campaign_niche, creator_primary_niche, creator_sub_niches)  
     engage   = score_engagement(creator_engagement_rate, creator_follower_count)  
     budget   = score_budget(campaign_budget, creator_rate)  
     platform = score_platform(campaign_platforms, creator_platforms)  
     language = score_language(campaign_target_language, creator_language_profile)  
     recency  = score_recency(creator_days_since_post)  
   
     total = (  
         niche    * W_NICHE      +  
         engage   * W_ENGAGEMENT +  
         budget   * W_BUDGET     +  
         platform * W_PLATFORM   +  
         language * W_LANGUAGE   +  
         recency  * W_RECENCY  
     )  
   
     return MatchScores(  
         niche=round(niche, 4),  
         engagement=round(engage, 4),  
         budget=round(budget, 4),  
         platform=round(platform, 4),  
         language=round(language, 4),  
         recency=round(recency, 4),  
         total=round(total, 4),  
     )  
   
**3.4 LLM Service (services/llm.py)**  
import json  
 import google.generativeai as genai  
 from app.config import settings  
   
 genai.configure(api_key=settings.gemini_api_key)  
   
 NICHE_CLASSIFICATION_PROMPT = """  
 You are a content classification expert. Analyze this YouTube channel and return a JSON object.  
   
 Fields required:  
 - primary_niche: exactly one of [technology, gaming, fashion, beauty, food, travel, lifestyle,  
   education, finance, fitness, parenting, entertainment, news, other]  
 - sub_niches: list of up to 3 from the same list (excluding primary_niche)  
 - language_profile: object with keys "bangla", "english", "banglish" summing to 1.0  
 - confidence: float 0.0-1.0  
   
 Channel name: {name}  
 Channel description: {description}  
 Recent video titles: {video_titles}  
 Tags: {tags}  
   
 Return ONLY valid JSON. No markdown. No explanation.  
 """  
   
 MATCH_RATIONALE_PROMPT = """  
 Write a 2-3 sentence match rationale in {language} for this brand-creator pairing.  
 Be specific — mention niche, engagement, audience fit. No generic phrases.  
   
 Brand campaign: {campaign_brief}  
 Creator: {creator_summary}  
 Total match score: {total_score:.0%}  
 Score breakdown: Niche {niche:.0%} | Engagement {engagement:.0%} | Budget fit {budget:.0%}  
   
 Return only the rationale text.  
 """  
   
   
 async def classify_creator_niche(  
     name: str,  
     description: str,  
     video_titles: list[str],  
     tags: list[str],  
 ) -> dict:  
     model = genai.GenerativeModel("gemini-2.5-flash")  
     prompt = NICHE_CLASSIFICATION_PROMPT.format(  
         name=name,  
         description=description or "",  
         video_titles=", ".join(video_titles[:10]),  
         tags=", ".join(tags[:20]),  
     )  
     response = await model.generate_content_async(prompt)  
     return json.loads(response.text)  
   
   
 async def generate_match_rationale(  
     campaign_brief: str,  
     creator_summary: str,  
     scores: dict,  
     language: str = "English",  
 ) -> str:  
     model = genai.GenerativeModel("gemini-2.5-flash")  
     prompt = MATCH_RATIONALE_PROMPT.format(  
         language=language,  
         campaign_brief=campaign_brief,  
         creator_summary=creator_summary,  
         total_score=scores["total"],  
         niche=scores["niche"],  
         engagement=scores["engagement"],  
         budget=scores["budget"],  
     )  
     response = await model.generate_content_async(prompt)  
     return response.text.strip()  
   
**3.5 API Routes to Implement**  
**Creators router (routers/creators.py):**  
POST   /creators/                      Register creator (basic profile only)  
 POST   /creators/{id}/connect-youtube  Submit YouTube URL, triggers full sync  
 GET    /creators/{id}                  Full profile + computed metrics  
 GET    /creators/                      List with filters: niche, min_followers, language  
 POST   /creators/{id}/sync             Manual re-sync YouTube stats  
   
**Brands router (routers/brands.py):**  
POST   /brands/                        Register brand  
 GET    /brands/{id}                    Brand profile  
 GET    /brands/{id}/campaigns          All campaigns for this brand  
   
**Campaigns router (routers/campaigns.py):**  
POST   /campaigns/                                          Create campaign (status=draft)  
 POST   /campaigns/{id}/run-matching                         Run engine (status: draft -> completed)  
 GET    /campaigns/{id}/matches                              Ranked results  
 PATCH  /campaigns/{id}/matches/{creator_id}/status         Update match status  
   
Every route returns typed Pydantic v2 response models. No raw ORM objects in responses.  
**3.6 YouTube Sync Sequence**  
When a creator connects their YouTube channel, execute in order:  
1. Parse URL:  
    - /channel/UCxxxxx format → extract channel_id directly (free, no API call)  
    - /@handle format → call resolve_handle_to_channel_id (costs 100 units, cache result)  
   
 2. get_channel_stats(channel_id) → 1 quota unit  
    - Store in youtube_channel_snapshots  
    - Update creator_platforms row (platform_handle, follower_count, raw_stats, last_synced_at)  
   
 3. get_recent_videos(channel_id, max_results=10) → ~3 quota units  
    - Upsert each video into youtube_videos  
    - For Shorts (is_short=True): use engaged_views field if present  
   
 4. Compute creator_metrics:  
    avg_engagement_rate = mean((likes + comments) / views) for last 10 videos  
    posts_per_month     = count of videos in last 90 days / 3.0  
    days_since_last_post = (now - max(published_at)).days  
    posting_consistency = stdev of gaps between consecutive published_at values  
   
 5. Authenticity score (simple composite for Phase 1):  
    tier_benchmark = ENGAGEMENT_BENCHMARKS[get_tier(subscriber_count)]  
    engagement_score = min(avg_engagement_rate / tier_benchmark, 1.0)  
    authenticity_score = engagement_score  # Expand with more signals in Phase 2  
   
 6. LLM niche classification:  
    Call classify_creator_niche(name, description, video_titles, tags)  
    Store llm_primary_niche, llm_sub_niches, llm_language_profile, llm_niche_confidence  
   
 7. Generate content embedding:  
    text = f"{bio} {primary_niche} {sub_niches_joined} {recent_video_titles_joined}"  
    embedding = SentenceTransformer(settings.embedding_model).encode(text)  
    Store 384-dim vector in creator_metrics.content_embedding  
   
 8. Upsert creator_metrics row  
   
 9. Sync creator node to Neo4j (call graph_sync.upsert_creator)  
   
**3.7 Matching Engine Sequence**  
When POST /campaigns/{id}/run-matching is called:  
1. Fetch campaign from Postgres  
    Generate brief_embedding if null:  
    embedding = SentenceTransformer.encode(campaign.brief)  
    Update campaigns.brief_embedding  
   
 2. Query eligible creators:  
    SELECT c.*, cm.*, cp.follower_count, cp.platform  
    FROM creators c  
    JOIN creator_metrics cm ON cm.creator_id = c.id  
    JOIN creator_platforms cp ON cp.creator_id = c.id  
    WHERE cp.platform = ANY(campaign.required_platforms)  
      AND cp.follower_count BETWEEN campaign.target_min_followers AND campaign.target_max_followers  
      AND cm.llm_primary_niche IS NOT NULL  
   
 3. For each eligible creator:  
   
    a. Check conflict via Neo4j:  
       MATCH (cr:Creator {id: $creator_id})-[:COLLABORATED_WITH]->(b:Brand)  
       WHERE b.industry = $campaign_niche  
         AND collaborated_at > date() - duration({days: 90})  
       RETURN count(b) > 0 AS has_conflict  
       Skip creator if has_conflict = true  
   
    b. Compute match score (pure function call, no I/O):  
       scores = compute_match_score(  
         campaign_niche=campaign.niche,  
         campaign_budget=campaign.budget_per_creator,  
         campaign_platforms=campaign.required_platforms,  
         campaign_target_language=campaign.target_language,  
         creator_primary_niche=cm.llm_primary_niche,  
         creator_sub_niches=cm.llm_sub_niches,  
         creator_engagement_rate=cm.avg_engagement_rate,  
         creator_follower_count=cp.follower_count,  
         creator_rate=c.rate_per_video,  
         creator_platforms=[cp.platform],  
         creator_language_profile=cm.llm_language_profile,  
         creator_days_since_post=cm.days_since_last_post,  
       )  
   
    c. Compute semantic similarity:  
       similarity = cosine_similarity(campaign.brief_embedding, cm.content_embedding)  
       scores.semantic_similarity = float(similarity)  
   
 4. Sort all creators by total_score DESC  
   
 5. Generate rationales for top 10 in parallel:  
    await asyncio.gather(*[  
      generate_match_rationale(campaign.brief, creator_summary, scores)  
      for creator, scores in top_10  
    ])  
   
 6. Bulk insert into campaign_matches (rank = position + 1)  
   
 7. Update campaign.status = 'completed'  
   
 8. Sync match edges to Neo4j  
   
**Step 4: Frontend Implementation**  
**4.1 Design Direction**  
Dark background (#0D1117) with electric teal accent (#00E5CC).  
   
 Typography: DM Mono for headings and metric values (monospaced gives a data-terminal feel),  
   
 Inter for body text and labels.  
Every numeric metric (subscriber count, engagement rate, match score) lives inside  
   
 a styled card with a label, value, and optional trend indicator. Match scores render  
   
 as colored arc gauges (green above 70%, amber 40-70%, red below 40%).  
Use shadcn/ui components as primitives but override colors to match the palette via  
   
 Tailwind CSS variables. The match results page is the hero — spend most design effort there.  
**4.2 Pages to Build**  
**/creators — Creator Registration**  
Fields: display name, email, bio, city, primary niche (select from niche enum),  
   
 content languages (multi-select), rate per post (BDT), rate per video (BDT),  
   
 YouTube channel URL (text input with format hint).  
On submit: POST /creators/ then immediately POST /creators/{id}/connect-youtube.  
   
 Show spinner during YouTube sync (3-5 seconds). On success, display:  
   
 channel thumbnail, subscriber count, engagement rate, detected niche, top 3 video thumbnails.  
**/brands — Brand Registration**  
Fields: brand name, email, website, industry (select), description.  
   
 Simple. Redirect to /brands/{id} on success.  
**/campaigns/new — Campaign Brief**  
Fields: title, brief (textarea, min 50 words with live word count), niche, target language,  
   
 required platforms (YouTube checked + enabled; Instagram/TikTok/Facebook visible but  
   
 greyed out with "Coming in Phase 2" tooltip), budget per creator (BDT input),  
   
 min/max follower range (dual slider).  
Show brief quality indicator: "Too short / Good / Detailed" based on word count.  
**/campaigns/{id} — Match Results (Most Important Page)**  
Header: campaign title, brief summary, total creators matched, run date.  
For each match: creator card showing  
- Channel thumbnail + display name + city  
- Large match score with arc gauge  
- Subscriber count, engagement rate, primary niche, language profile pills  
- Score breakdown: 6 small progress bars (niche, engagement, budget, platform, language, recency)  
- LLM rationale in a distinct quote block  
- Status dropdown (Suggested / Shortlisted / Contacted)  
Button: "Re-run Matching" at top right.  
**4.3 Typed API Client (lib/api.ts)**  
Generate a typed function for every backend endpoint. No any types. Example:  
const API = process.env.NEXT_PUBLIC_API_URL;  
   
 export async function registerCreator(data: CreateCreatorRequest): Promise<Creator> {  
   const res = await fetch(`${API}/creators/`, {  
     method: "POST",  
     headers: { "Content-Type": "application/json" },  
     body: JSON.stringify(data),  
   });  
   if (!res.ok) throw new Error(await res.text());  
   return res.json();  
 }  
   
 export async function connectYouTube(creatorId: string, channelUrl: string): Promise<CreatorPlatform> {  
   const res = await fetch(`${API}/creators/${creatorId}/connect-youtube`, {  
     method: "POST",  
     headers: { "Content-Type": "application/json" },  
     body: JSON.stringify({ channel_url: channelUrl }),  
   });  
   if (!res.ok) throw new Error(await res.text());  
   return res.json();  
 }  
   
 export async function runMatching(campaignId: string): Promise<CampaignMatch[]> {  
   const res = await fetch(`${API}/campaigns/${campaignId}/run-matching`, {  
     method: "POST",  
   });  
   if (!res.ok) throw new Error(await res.text());  
   return res.json();  
 }  
   
**Step 5: Requirements**  
**backend/requirements.txt:**  
fastapi==0.115.0  
 uvicorn[standard]==0.30.0  
 sqlalchemy[asyncio]==2.0.36  
 asyncpg==0.30.0  
 alembic==1.14.0  
 pydantic==2.10.0  
 pydantic-settings==2.7.0  
 pgvector==0.3.6  
 neo4j==5.27.0  
 httpx==0.28.0  
 google-generativeai==0.8.3  
 sentence-transformers==3.3.0  
 scikit-learn==1.5.2  
 python-multipart==0.0.20  
   
**frontend — install with npm install:**  
next@15.1.0  
 react@^19.0.0  
 react-dom@^19.0.0  
 @tanstack/react-query@^5.62.0  
 lucide-react@^0.469.0  
 class-variance-authority@^0.7.1  
 clsx@^2.1.1  
 tailwind-merge@^2.6.0  
   
**Step 6: Seed Data Script**  
Create backend/scripts/seed.py. Running it produces a fully working demo state:  
1. Create 2 brands:  
    - "TechGuru BD" (industry: technology)  
    - "Foodie Hub" (industry: food)  
   
 2. Find and hardcode 15-20 real Bangladeshi YouTube channel IDs.  
    Research these manually before running (look for 10K-500K subscribers):  
    - 5 technology channels  
    - 4 food/cooking channels  
    - 3 travel channels  
    - 3 gaming channels  
    - 2-3 lifestyle channels  
   
    Format:  
    SEED_CHANNELS = [  
      {"channel_id": "UCxxxxxxx", "display_name": "...", "email": "seed+1@test.com",  
       "primary_niche": "technology", "rate_per_video": 5000},  
      ...  
    ]  
   
 3. For each: POST /creators/ then POST /creators/{id}/connect-youtube  
    This runs the full YouTube sync + LLM classification automatically.  
   
 4. Create 2 campaigns:  
    - TechGuru: "Smartphone accessory launch", budget BDT 8000, niche technology  
    - FoodieHub: "Ramadan recipe campaign", budget BDT 4000, niche food  
   
 5. Run matching for both campaigns.  
   
 Total time: ~5 minutes. All API quotas: ~60 YouTube units + ~20 Gemini calls.     

**Extension Points — How Phase 2 Plugs In**  
Every design decision preserves these extension points. Adding a new platform  
   
 requires only new files, never changes to existing logic.  
| | | |  
|-|-|-|  
| **Feature** | **Where to add** | **What to build** |   
| Instagram public data | services/instagram.py | get_profile_stats() mirroring YouTubeService interface |   
| Instagram OAuth insights | services/instagram.py | get_audience_demographics() |   
| TikTok Login Kit | services/tiktok.py | Same interface pattern |   
| Facebook Page insights | services/facebook.py | Same interface pattern |   
| New platform in DB | creator_platforms table | Insert row with new platform_type value |   
| New platform in UI | components/platform-badge.tsx | Add icon + color for new enum value |   
| Geographic scoring (S1) | services/matching.py | Add score_geography() function + adjust weights |   
| Demographic scoring (S2) | services/matching.py | Add score_demographics() function |   
| BanglaBERT comment scoring | services/authenticity.py | New service, called from sync flow |   
| KOS affiliate tracking | services/affiliate.py | Link generator + brand webhook handler |   
| Background sync jobs | services/scheduler.py | APScheduler: nightly YouTube sync per tier |   
| Audience overlap detection | services/graph_sync.py + Neo4j | Graph query comparing audience demographic vectors |   
   
Rules for extension:  
- Never add if platform == "youtube" conditionals in matching.py, graph_sync.py, or any router  
- Platform-specific behavior lives only inside the platform service file  
- The matching engine receives platform-agnostic primitives only  
- The graph schema stays unchanged: new platforms add ACTIVE_ON edges, not new node types  

**Implementation Order**  
Execute in this sequence. Do not start a step until the previous one is testable.  
 1. docker-compose up (postgres + neo4j only, backend optional for now)  
  2. Create all PostgreSQL enums and tables via Alembic migration  
  3. Create Neo4j constraints and indexes (run Cypher in browser at localhost:7474)  
  4. Implement config.py and database.py — verify async session works  
  5. Implement SQLAlchemy ORM models — no routes yet  
  6. Run first Alembic migration — verify tables exist with \dt in psql  
  7. Implement YouTubeService — test get_channel_stats with one real BD channel ID  
  8. Implement EmbeddingService — test encode() returns shape (384,)  
  9. Implement LLM service — test classify_creator_niche with sample video titles  
 10. Implement graph.py (Neo4j driver) and graph_sync.py  
 11. Implement matching.py pure functions — unit test with no database  
 12. Implement creator router + full YouTube sync flow end-to-end  
     (URL in -> YouTube API -> Postgres -> Neo4j -> metrics computed -> LLM classified)  
 13. Implement brand router  
 14. Implement campaign router + matching engine endpoint  
 15. Run seed script — verify 15+ creators and 2 match result sets in database  
 16. Build Next.js frontend pages in order: creators -> brands -> campaigns/new -> campaigns/{id}  
 17. Wire all frontend pages to backend — verify full user journey  
 18. Polish match results page — this is the demo centrepiece  
   
*This is the source of truth for the coding agent. When in doubt about any design decision,*  
 *  
 choose the option that keeps the most extension points open without adding premature complexity.*  
