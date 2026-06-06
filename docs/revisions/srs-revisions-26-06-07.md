# SRS Revisions — Matching Engine Rebalance & YouTube Enrichment Persistence

**Date:** 2026-06-07
**Author:** Navid
**Status:** Approved
**Affects:** `docs/srs.md` §4.2 (YouTube Tier-0), §5.1 (Matching Engine), FR-9 (rationale), FR-10 (sub-scores), FR-11 (weights), FR-26 (normalization)

> Records intentional divergences from `srs.md` introduced by the matching engine overhaul and YouTube persistence layer shipped 2026-06-07. Per the hierarchy in `docs/plan.md` §0, the SRS is never silently edited — all changes are captured here and referenced from `docs/plan.md` §3 (Divergence Ledger, D13).
>
> Supporting reference documents (also moved to `docs/revisions/` from the repo root):
> - [`matching-engine-plan-26-06-07.md`](matching-engine-plan-26-06-07.md) — full stage-by-stage engine architecture, weight rationale, and safe iteration strategy
> - [`youtube-implementation-26-06-07.md`](youtube-implementation-26-06-07.md) — YouTube API endpoints, field mappings, verification commands
> - [`youtube-task-26-06-07.md`](youtube-task-26-06-07.md) — unit-by-unit task tracker (Units 1–3 done, 4–5 pending)

---

## 1. Change Summary

Three related changes shipped in this batch:

| Change | SRS section affected | Type |
|---|---|---|
| Matching weight rebalance | FR-11 | Divergence |
| YouTube enrichment persistence + normalization pipeline | §4.2, FR-26 | Extension (exceeds scope) |
| Sub-score expansion (migration 0014) | FR-10 | Completed (exceeds spec) |

---

## 2. Matching Weight Rebalance (FR-11 divergence → plan.md D13)

### Original weights (SRS FR-11 / plan.md Phase C as-documented before this batch)

| Signal | Weight |
|---|---|
| Niche fit | 0.30 |
| Engagement quality | 0.20 |
| Budget compatibility | 0.20 |
| Platform match | 0.15 |
| Language match | 0.10 |
| Content recency | 0.05 |

### As-built weights (`backend/app/services/matching_config.py` — authoritative)

| Signal | Weight | Change | Rationale |
|---|---|---|---|
| Niche fit | **0.35** | +0.05 | Primary relevance signal — wrong niche = wrong audience regardless of other signals |
| Budget compatibility | **0.30** | +0.10 | Hard commercial constraint in the BD market; under-budget creators consistently under-deliver |
| Platform match | **0.15** | — | Unchanged |
| Engagement quality | **0.10** | −0.10 | Engagement is noisy at micro tier; budget + niche are stronger filters |
| Language match | **0.08** | −0.02 | Refinement, not primary gate |
| Content recency | **0.02** | −0.03 | Activity signal; low relative value vs niche/budget |

**Total: 1.00.** The rebalance prevents a large creator with good engagement from ranking above a correctly-priced niche creator — the commercially important case for BD SME brands.

**Rule:** `SCORE_WEIGHTS` in `matching_config.py` is the single source of truth for weights. Do not repeat weight values in docs, scripts, or comments — reference the config file instead.

### Supporting config constants

```python
BUDGET_SOFT_BUFFER_RATIO     = 0.30   # creators up to 30% over max budget still score (tapering)
BUDGET_RATE_HARD_CAP         = 1.30   # hard cutoff above 130% of campaign budget_per_creator_max
BUDGET_UNKNOWN_SCORE         = 0.5    # score when creator rate is unknown
SEMANTIC_SIMILARITY_THRESHOLD = 0.28  # minimum cosine similarity to fire semantic rescue
SEMANTIC_RESCUE_NICHE_CAP    = 0.40   # semantic boost cannot push mismatched niche past 40%
UNKNOWN_RECENCY_SCORE        = 0.20   # score when no portfolio items exist (slight penalty, not neutral)
TOP_MATCH_LIMIT              = 10     # max matches returned per campaign
LLM_RATIONALE_TOP_N          = 5      # Gemini rationale called on top N only
TIER_MIN_FLOOR               = 0.5    # budget sub-score floors at 0.5 for same-tier creators
```

---

## 3. YouTube Enrichment Persistence (SRS §4.2 extension)

### Original SRS §4.2 scope

SRS §4.2 describes YouTube as a Tier-0 read source: channel stats, video stats, search. Persistence was listed as a future unit; normalization detail was not specified.

### As-built (exceeds SRS scope — all shipped)

#### New module: `backend/app/creators/normalization.py`

| Function | Purpose |
|---|---|
| `enrich_youtube_social_profile()` | Maps enrichment output onto `creator_social_profiles`; stamps `is_api_verified`, `api_verified_at`, `api_channel_id`, `data_source = "verified"` |
| `sync_youtube_ingestion_normalization()` | Orchestrates the full sync |
| `YOUTUBE_CATEGORY_MAP` | Deterministic Wikipedia topic-URL → internal niche mapping |
| `build_youtube_portfolio_item_values()` | Maps recent video fields to portfolio item columns |
| `_resolve_youtube_portfolio_niche_id()` | Resolves niche from topic categories |
| `engagement_vs_tier_ratio()` | Compares engagement rate against tier benchmark; ready for N06 trust scoring |

**Language detection:** Bangla/English/Banglish heuristic from video titles + descriptions (Tier-0 scope; full captions require a separate `captions.list` call not in the Tier-0 enrichment endpoint).

**City fallback:** Unrecognised city strings → `unknown_location` bucket; never silently dropped (SRS §4.4 compliance).

**Groq niche classifier (optional):** When `GROQ_API_KEY` is present, classifies niche from channel description + last five video titles/descriptions; falls back to YouTube topic categories then generic `Lifestyle`.

**Tier mapping:** follower count → nano/micro/macro/mega.

#### New endpoint: `POST /creators/{creator_id}/platforms/youtube/enrich`

Receives: `channel_ref` (handle, URL, or channel ID), `recent_video_limit`.
Calls YouTube Tier-0 wrapper → runs normalization → persists to `creator_social_profiles` → imports recent videos to `creator_portfolio_items` (upsert by `content_url`).

The YouTube wrapper (`app/youtube/`) remains **stateless** — persistence belongs to the creators domain (`app/creators/`).

#### Schema additions (migration `0016_add_api_verified_social_profile_fields`)

| Column | Table | Type | Purpose |
|---|---|---|---|
| `is_api_verified` | `creator_social_profiles` | `BOOLEAN DEFAULT false` | YouTube API confirmed this row |
| `api_verified_at` | `creator_social_profiles` | `TIMESTAMPTZ` | When last verified |
| `api_channel_id` | `creator_social_profiles` | `VARCHAR(255)` | YouTube channel ID from API |
| `data_source` | `creator_social_profiles` | `VARCHAR(30) DEFAULT 'self_reported'` | `self_reported` \| `verified` \| `estimated` |

#### Migration `0017_restore_social_creator_platform_unique`

Restored `UNIQUE(creator_id, platform)` on `creator_social_profiles` — accidentally dropped by an earlier migration. Required for safe upserts in enrichment and seeding scripts.

#### Real-channel seeding (`backend/scripts/seed_real_youtube_creators.py`)

- 19 real BD YouTube channels seeded across education, technology, food, travel, entertainment, comedy, and gaming
- Discovery via `GET /youtube/channels?handle=` (1 unit each) — `Search.list` never used (D8)
- 19 Instagram + 19 TikTok estimated companion profiles per creator
- 190 YouTube portfolio items imported from recent videos
- Bios generated from public channel description + last five recent-video descriptions
- `city` left unset — creator location ≠ audience/content location

**Verified live result:**
```
Real YouTube creator seeding complete: 19 succeeded, 0 failed.
platform  | data_source | count
----------+-------------+------
youtube   | verified    | 19
instagram | estimated   | 19
tiktok    | estimated   | 19
creator_portfolio_items: youtube = 190
```

---

## 4. Sub-score Expansion — migration `0014_add_platform_recency_semantic_to_match_scores`

`ai_match_scores` expanded to expose all six scoring dimensions (FR-10 full transparency):

| Column | Migration | Purpose |
|---|---|---|
| `score_platform` | 0014 | Platform match sub-score (0–1) |
| `score_recency` | 0014 | Content recency sub-score (0–1) |
| `score_semantic` | 0014 | Gemini semantic similarity boost (0–1, only when semantic rescue fires) |

All three are now persisted by `run_campaign_matching()` in `backend/app/campaigns/service.py` and surfaced in `MatchesClient.tsx` (Platform Fit, Recency, and Semantic Similarity bars). Semantic bar is only rendered when `score_semantic > 0`.

---

## 5. New Infrastructure — `matching_config.py`

`backend/app/services/matching_config.py` externalises all tunable constants from `matching.py`. This file did not exist in the SRS — it is an engineering practice addition (separation of config from logic).

**Rule:** All future weight or threshold changes go here only. Never duplicate values in `matching.py`, scripts, or docs.

---

## 6. FR Mapping

| FR | SRS expectation | As-built | Change type |
|---|---|---|---|
| FR-10 | Full sub-score breakdown surfaced to UI | All six sub-scores persisted (migration 0014) + rendered in UI | **Completed — exceeds spec** |
| FR-11 | Deterministic weighted score | Weights rebalanced from spec (see §2) | **Divergence — plan.md D13** |
| FR-26 | Normalization at ingestion | Full normalization pipeline in `normalization.py` | **Completed — exceeds spec** |

---

## 7. Deferred from This Batch

| Item | Task | Notes |
|---|---|---|
| Stored `rank` column on `ai_match_scores` | N04 | Rank derivable from sorted response order; only needed if UI requires persisted rank |
| Bounded Gemini rationale | N05 | Currently heuristic; Gemini call path optional |
| Authenticity / Trust Score | N06 | `engagement_vs_tier_ratio()` in `normalization.py` is ready; DB storage and API surface pending |
| Formalized 5-stage funnel documentation | N07 | Stages described in `matching-engine-plan-26-06-07.md`; not yet locked in code comments |
| Relational conflict-of-interest check | N08 | 90-day brand-niche collision via `creator_collaboration_history`; not yet active |
| YouTube matching signal integration | Unit 4 | Recent views, engagement trend, upload consistency — see `youtube-task-26-06-07.md` |
| YouTube OAuth account connection | Unit 5 | Private creator data, YouTube Analytics API — deferred |
