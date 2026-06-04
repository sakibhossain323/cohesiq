# Tasks — Navid (Data · YouTube · Matching Engine · Seeding)

Derived from `docs/plan.md` (the unified plan). Source of truth chain:
`requirements.md` → `srs.md` → `plan.md` → this file. Schema reference: `docs/schema.md`.

**Ownership:** the *intelligence + data* half of Cohesiq — YouTube ingestion, the matching
engine, semantic/LLM services, seeding, and the optional graph/vector layers. Sakib owns the
brand/creator marketplace UI & campaign workflow (`tasks-sakib.md`).

## Legend
- `[x]` Done & verified · `[~]` Partial / needs work · `[ ]` Not started · `[!]` Broken · `[P]` Parallelizable

---

## Done — current baseline

| Item | Status | Evidence |
|---|---|---|
| YouTube Tier-0 public read wrapper | `[x]` | `app/youtube/{router,service,schemas}.py`, mounted `/youtube` |
| Channel enrichment (creator-ready metrics) | `[x]` | `GET /youtube/channels/enrichment` → subs, avg views/likes/comments, est. engagement, uploads/month |
| YouTube unit + smoke tests | `[x]` | `tests/test_youtube_service.py`, `scripts/test_youtube_api.py` |
| Pure deterministic scorer | `[x]` | `services/matching.py` (6 weights per SRS §5.2) |
| `run-matching` + `matches` endpoints | `[~]` | `app/campaigns/` — relational, heuristic rationale, partial score persistence |
| Semantic similarity (Gemini + token fallback) | `[~]` | `services/semantic_match.py` — not persisted |
| Seed pipeline (synthetic) | `[~]` | `scripts/generate_seed_data.py` (Tavily+Groq), `seed_db.py`, `reset_db.py`, `sync_clerk_users.py` |

---

## Phase D — Real data + matching depth (current focus)

**Goal:** turn the stateless YouTube wrapper into persisted, matchable creator data, and make the
matching pipeline transparent end-to-end.

[ ] N01 [P] Persist YouTube enrichment → `creator_social_profiles`
  - Add `POST /creators/{creator_id}/platforms/youtube/enrich` (body: `channel_ref`, `recent_video_limit`)
  - Map enrichment → social profile per `youtube_implementation.md` "Recommended mapping"
  - Add `is_api_verified`, `api_verified_at`, `api_channel_id` columns (schema.md extension point) via migration `0014`
  - Unit-test mapping + update-vs-create before route test (Docker)

[ ] N02 Seed 18–20 **real** BD YouTube channels (SRS US-3)
  - Discover via `GET /youtube/channels?handle=` (1 unit), **not** `Search.list` (D8)
  - Hardcode researched channel handles by niche; run enrichment → persist as verified creators
  - Label synthetic IG/TikTok companion profiles "Estimated" (US-19 honesty)

[ ] N03 Normalization at ingestion (SRS US-4, FR-26)
  - Niche: YouTube `topicCategories` Wikipedia URL → internal `niches` (YOUTUBE_CATEGORY_MAP)
  - Language: detect Bangla/English/Banglish from titles+captions (`langdetect`/`fasttext`)
  - Tier: follower count → nano/micro/macro/mega; compute engagement vs tier benchmark

[ ] N04 Persist full score breakdown (SRS FR-10, plan Phase C)
  - Add `score_platform`, `score_recency`, `semantic_similarity`, `rank` to `ai_match_scores` (migration `0015`) + `AIMatchScoreOut`
  - Update `services/...run_campaign_matching` to write all six sub-scores + rank
  - Coordinate with Sakib: UI renders six bars (`MatchesClient.tsx`)

[ ] N05 [P] Bounded LLM rationale service (SRS FR-9)
  - Formalize Gemini rationale (2–3 sentences, Bangla/English) on top-N only; heuristic fallback when no key
  - Decide fate of `services/llm_matching.py`: integrate or delete (no dead experimental path)

[ ] N06 Authenticity / Trust Score MVP (SRS US-11, FR-12)
  - Engagement-vs-tier proxy → 0–100 score + flag labels + plain-language reason
  - Surface on creator cards (coordinate with Sakib)
  - Note: growth-spike Z-score needs time-series (Phase E, N10)

[ ] N07 Formalize the 5-stage gated funnel (SRS US-12)
  - Label stages in code: 1 hard filter → 2 (relational conflict, see N08) → 3 semantic → 4 weighted → 5 LLM top-N
  - Document which stages are active vs deferred in `plan.md` §4 Phase D

[ ] N08 [P] Relational conflict-of-interest check (SRS FR-13, lighter-than-Neo4j first cut)
  - 90-day brand-niche collaboration check via `creator_collaboration_history`
  - Apply as a Stage-2 penalty/skip without introducing Neo4j yet (D2)

---

## Phase D — Hardening (foundational, from prior audit)

[ ] N09 [P] Align `backend/requirements.txt` with actual imports (`httpx`, `python-dotenv` for scripts)
[ ] N10 [P] Align env examples: `backend/.env.example`, `frontend/.env.example`, `docker-compose.yml` for `YOUTUBE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `TAVILY_API_KEY`, Clerk vars
[ ] N11 Verify local-login token bug in `app/auth/` (create token before returning `TokenResponse`)
[ ] N12 Update `scripts/test_matching.py` to call the same path as `POST /campaigns/{id}/run-matching`
[ ] N13 After any backend/migration/Docker change: `docker compose ps` + `docker compose logs --tail 50 backend`

---

## Phase E — Optional heavy layers (deferred by design, plan §3 D1–D5)

Do **not** start these until Phases A–D are demo-solid. Each is additive (NFR-3/4).

[ ] N14 [P] YouTube quota guard + `Search.list` circuit-breaker (plan D8) — needed before any looped search
[ ] N15 Redis: match-score cache (6 h TTL) + quota counter (plan D4, NFR-8)
[ ] N16 TimescaleDB / snapshot table → follower history → authenticity growth Z-score (plan D3, completes N06)
[ ] N17 pgvector: persist content + brief embeddings; replace on-the-fly cosine (plan D1)
[ ] N18 Neo4j: graph sync + multi-hop matching + graph conflict-of-interest (plan D2; supersedes N08 if built)
[ ] N19 Polymorphic talent + event-host availability matching (plan D5, SRS US-15, FR-17)

---

## Notes
- The YouTube wrapper is **stateless by design**; N01 is the first DB-touching unit. Keep the wrapper pure — persistence belongs in `app/creators/`, not `app/youtube/`.
- `Search.list` costs 100 units of 10,000/day — treat as scarce (D8). Prefer `channels?handle=`.
- Conflict-of-interest can ship relationally (N08) long before Neo4j (N18); don't block FR-13 on a new datastore.
