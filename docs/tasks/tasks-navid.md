# Tasks — Navid (Data · YouTube · Matching Engine · Seeding)

Derived from `docs/plan.md` (the unified plan). Source of truth chain:
`requirements.md` → `srs.md` → `plan.md` → this file. Schema reference: `docs/schema.md`.

**Ownership:** the *intelligence + data* half of Cohesiq — YouTube ingestion, the matching
engine, semantic/LLM services, seeding, normalization, authenticity scoring, and the optional
graph/vector layers. Sakib owns the brand/creator marketplace UI & campaign workflow (`tasks-sakib.md`).

## Legend
- `[x]` Done & verified · `[~]` Partial / needs work · `[ ]` Not started · `[!]` Broken · `[P]` Parallelizable

---

## Done — current baseline

| Item | Status | Evidence |
|---|---|---|
| YouTube Tier-0 public read wrapper | `[x]` | `app/youtube/{router,service,schemas}.py`, mounted `/youtube` |
| Channel enrichment (creator-ready metrics) | `[x]` | `GET /youtube/channels/enrichment` → subs, avg views/likes/comments, est. engagement, uploads/month |
| YouTube unit + smoke tests | `[x]` | `tests/test_youtube_service.py`, `scripts/test_youtube_api.py` |
| Pure deterministic scorer | `[x]` | `services/matching.py` — 6 weights per SRS §5.2: niche .30 / engagement .20 / budget .20 / platform .15 / language .10 / recency .05 |
| `run-matching` + `matches` endpoints | `[~]` | `app/campaigns/` — relational, heuristic rationale, partial score persistence (platform/recency/semantic/rank missing — N04) |
| Semantic similarity (Gemini + token fallback) | `[~]` | `services/semantic_match.py` — computed on the fly, not persisted |
| Seed pipeline (synthetic) | `[~]` | `scripts/generate_seed_data.py` (Tavily+Groq), `seed_db.py`, `reset_db.py`, `sync_clerk_users.py` — real BD channels not yet seeded (N02) |

---

## Phase D — Real data + matching depth (current focus)

**Goal:** turn the stateless YouTube wrapper into persisted, matchable creator data; make the
matching pipeline transparent end-to-end; ship authenticity scoring and ethical-AI data tags.

[ ] N01 [P] Persist YouTube enrichment → `creator_social_profiles`
  - Add `POST /creators/{creator_id}/platforms/youtube/enrich` (body: `channel_ref`, `recent_video_limit`)
  - Map enrichment output → social profile columns per `youtube_implementation.md` "Recommended mapping", plus two fields the recommended mapping omits:
    - `posts_per_month = enrichment.uploads_per_month` (schema column exists, mapping doc skips it)
    - `api_channel_id = enrichment.platform_user_id` (the YouTube channel ID)
  - Add `is_api_verified`, `api_verified_at`, `api_channel_id` columns via migration `0014` (schema.md extension point)
  - Keep persistence in `app/creators/` — the YouTube wrapper stays stateless
  - Unit-test mapping + update-vs-create before route test (Docker)

[ ] N02 Seed 18–20 **real** BD YouTube channels (SRS US-3)
  - Discover via `GET /youtube/channels?handle=` (1 unit each), **never** `Search.list` (D8 — 100 units)
  - Hardcode researched channel handles by niche; run enrichment → persist as API-verified creators
  - Add proportional synthetic IG/TikTok companion profiles labelled `"Estimated"` (N09, US-19)

[ ] N03 Normalization at ingestion (SRS US-4, FR-26)
  - Niche: YouTube `topicCategories` Wikipedia URL → internal `niches` table via `YOUTUBE_CATEGORY_MAP` dict
  - Language: detect Bangla/English/Banglish from video **titles+descriptions** using `langdetect`/`fasttext`; store on `creator_social_profiles.content_languages`. Note: full captions require a separate `captions.list` API call not in the Tier-0 enrichment endpoint — detection on titles+descriptions is the correct Tier-0 scope.
  - Tier: map follower count → nano/micro/macro/mega; compute engagement vs tier benchmark for N06
  - City: unrecognised city strings → `unknown_location` bucket, never silently dropped (SRS §4.4)

[ ] N04 Persist full score breakdown to `ai_match_scores` (SRS FR-10, plan Phase C)
  - Add `score_platform`, `score_recency`, `semantic_similarity`, `rank` columns via migration `0015`
  - Update `AIMatchScoreOut` Pydantic schema to include all six sub-scores + rank
  - Update `services/matching.py` / `run_campaign_matching` to write all six values + rank on every run
  - Coordinate with Sakib: these columns unlock the six-bar breakdown in `MatchesClient.tsx`

[ ] N05 [P] Bounded LLM rationale service (SRS FR-9)
  - Formalize Gemini rationale call: 2–3 sentences, Bangla/English, runs on top-N results only
  - Heuristic fallback when `GEMINI_API_KEY` absent (keeps matching testable without a key)
  - Resolve `services/llm_matching.py` — integrate into the pipeline or delete; no dead experimental paths
  - Coordinate with Sakib D02: the Gemini call structure here will be reused by the AI Brief Analyzer

[ ] N06 Authenticity / Trust Score MVP (SRS US-11, FR-12)
  - Engagement-vs-tier proxy: how far creator's engagement falls below tier benchmark → 0–100 score
  - Flag labels + plain-language reason (e.g. "engagement 2× above micro average — low fraud signal")
  - Store score on `creator_social_profiles` or a new `creator_trust_scores` table (decide before migration)
  - Surface result to Sakib: D01 Authenticity Auditor UI card reads this score
  - Note: follower growth-spike Z-score needs TimescaleDB history (Phase E, N14) — not a blocker for MVP proxy

[ ] N07 Formalize the 5-stage gated funnel (SRS US-12)
  - Label stages explicitly in `services/matching.py`:
    1. Hard filter (SQL — platform, budget, follower range, availability)
    2. Relational conflict check (N08)
    3. Semantic ranking (on-the-fly cosine, `semantic_match.py`)
    4. Deterministic weighted score
    5. LLM rationale on top-N only
  - Document which stages are active vs deferred in `plan.md` §4 Phase D after implementation

[ ] N08 [P] Relational conflict-of-interest check (SRS FR-13, lighter-than-Neo4j first cut)
  - 90-day brand-niche collision check via `creator_collaboration_history`
  - Apply as Stage-2 gate: creators who collaborated with a same-niche competitor within 90 days are
    excluded or penalised before the weighted score runs
  - No Neo4j needed for this cut (D2); superseded by N16 if Neo4j is built later

[ ] N09 [P] Ethical-AI data tags at ingestion (SRS US-19, NFR-14/15/16)
  - Mark all synthetic/estimated fields explicitly: `data_source = "estimated"` on `creator_social_profiles`
  - Mark API-verified fields: `data_source = "verified"`, `api_verified_at` timestamp
  - Under-18 audience flag: if `audience_age_range_max < 18` or demographic data shows >20% under-18, set a flag on the profile
  - Staleness: `stats_reported_at` must be populated at ingestion; surface in API response for Sakib to render in UI
  - "Uncategorized %" — for incomplete demographic data never redistribute; pass the remainder explicitly as uncategorized

[ ] N10 [P] Per-campaign engagement snapshots (SRS US-20, plan Phase D)
  - After a collaboration reaches `completed` status, pull creator's public metrics at Day 7, Day 14, Day 30
  - Store snapshots as a simple table (`campaign_engagement_snapshots`) referencing `campaign_applications.id`
  - Expose via a new endpoint (shape to confirm with Sakib for C02 analytics panel)
  - Use cached enrichment data (N01) — no extra API calls if stats were recently fetched

[ ] N11 Align `scripts/test_matching.py` to call `POST /campaigns/{id}/run-matching` correctly
  - Verify the script exercises the same code path as the live endpoint (same service layer call)
  - Ensure it works end-to-end with seeded data after N01/N02 are done

[ ] N12 [P] Portfolio import from recent YouTube videos (youtube_task.md Unit 3)
  - After N01 persists the social profile, import `enrichment.recent_videos` → `creator_portfolio_items`
  - Each `YouTubeRecentVideo` maps to one portfolio row: `content_url`, `title`, `thumbnail_url`, `views`, `likes`, `comments`, `published_at`, `platform = "youtube"`, `niche_id` from normalization (N03)
  - Upsert by `content_url` so re-running enrichment doesn't duplicate rows
  - Only import videos missing from the portfolio (compare against existing `creator_portfolio_items`)

---

## Phase E — Optional heavy layers (deferred by design, plan §3 D1–D5)

Do **not** start these until Phases A–D are demo-solid. Each is purely additive (NFR-3/4).

[ ] N13 YouTube quota guard + `Search.list` circuit-breaker (plan D8, NFR-8)
  - Required before any looped or automated channel discovery
  - Add a circuit-breaker guard on `GET /youtube/search` — the endpoint stays for demo use but must not be called in any loop or seeding script (plan.md D8: "allowed for demo, flagged")
  - Quota counter tracks daily unit spend; circuit-breaker disables Search.list automatically at a threshold

[ ] N14 Redis: match-score cache (6 h TTL) + YouTube quota counter (plan D4, NFR-8)
  - Cache `ai_match_scores` keyed by `(campaign_id, hash(creator_pool))`; invalidate on re-run
  - Quota counter guards daily YouTube unit budget; feeds into N13 circuit-breaker

[ ] N15 TimescaleDB / snapshot table → follower history → authenticity growth Z-score (plan D3)
  - Prerequisite for the Z-score signal in N06 (growth-spike detection)
  - Start collecting snapshots as early as possible even before the scoring is ready

[ ] N16 pgvector: persist content + brief embeddings; replace on-the-fly cosine (plan D1)
  - Store Gemini embeddings on `creator_social_profiles` or `creator_profiles`
  - Query via `<->` cosine distance at Stage 3 instead of recomputing each match run

[ ] N17 Neo4j: graph sync + multi-hop matching + graph conflict-of-interest (plan D2)
  - Sync `creator_profiles`, `brand_profiles`, `campaign_applications` into Neo4j as nodes/edges
  - Replace relational conflict check (N08) with Cypher 90-day traversal
  - Unlock multi-hop niche alignment and lookalike expansion (SRS §5.1 Stage 2)

[ ] N18 Polymorphic talent + event-host availability matching (plan D5, SRS US-15, FR-17)
  - Availability-first matching (date/calendar) for hosts — distinct from audience-score matching
  - Requires host extension table (`HOST_PROFILE_EXT` in SRS ER) added as an additive migration

---

## Notes

- The YouTube wrapper (`app/youtube/`) is **stateless by design**. N01 is the first DB-touching unit — persistence belongs in `app/creators/`, not `app/youtube/`. Keep the wrapper pure.
- `Search.list` costs 100 units of the 10,000/day quota — treat as scarce (D8). The `/youtube/search` endpoint stays active for demo use but must never be called in a loop or seeding script. All automated discovery must go through `channels?handle=` (1 unit each). Circuit-breaker guard is N13.
- Conflict-of-interest ships relationally (N08) before Neo4j (N17); do not block FR-13 on a new datastore.
- Matching weights are: niche .30 / engagement .20 / budget .20 / platform .15 / language .10 / recency .05 — as implemented in `services/matching.py` and defined in SRS §5.2. Do not alter weights without updating both.
- After any migration or model change: update `docs/schema.md` to stay code-true, then `graphify update .` (AST-only, no API cost).
