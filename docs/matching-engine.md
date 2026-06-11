# Cohesiq Matching Engine Plan

> Authoritative, code-true matching reference. Validated against backend/app/services/matching_config.py + matching.py on 2026-06-10.

## Purpose

This document is the working plan for touching the matching engine. The matching path is demo-critical:
brands will judge the product by whether recommended creators feel explainable, locally relevant, and
commercially plausible. We should not change scoring casually.

N11 is now complete: `backend/scripts/test_matching.py` exercises the live service path used by
`POST /campaigns/{id}/run-matching`. This plan records what data we have, how matching currently
works, and what strategy we should use for safe iteration.

## Current Data Available

### Real creator supply

The YouTube pipeline has now seeded:

- 67 real Bangladesh-oriented YouTube channels from the 100-name inventory
- 67 verified YouTube social profiles
- deterministic YouTube rate cards generated from subscriber count:
  - `youtube_short`: BDT 1,000 to 10,000
  - `youtube_video`: BDT 5,000 to 20,000
  - `youtube_live`: BDT 10,000 to 50,000
- 67 estimated Instagram companion profiles
- 67 estimated TikTok companion profiles
- YouTube portfolio items from recent uploads for resolved creators

The social pipeline now also seeds deterministic per-unit pricing for:

- Instagram: `instagram_story`, `instagram_feed`, `instagram_reel`, `instagram_live`
- TikTok: `tiktok_story`, `tiktok_video`, `tiktok_live`

The unresolved handles from the 100-name inventory are not needed for the current demo supply pool.

Important source labels:

```text
youtube   -> data_source = "verified"
instagram -> data_source = "estimated"
tiktok    -> data_source = "estimated"
```

### Creator profile fields now useful for matching

`creator_profiles`:

- `display_name`
- generated `bio` from public channel and recent-video descriptions
- `city` intentionally unset for real YouTube seeds, because creator location and content audience are not the same thing
- `is_available`
- optional `min_budget`

`creator_social_profiles`:

- platform coverage
- follower/subscriber count
- average recent views, likes, comments
- engagement rate
- posts per month
- content languages
- API verification metadata
- data source labels

`creator_rate_cards`:

- canonical `deliverable_code` values such as `youtube_short`, `youtube_video`, and `youtube_live`
- deterministic seeded `price_bdt` and `suggested_price_bdt`
- platform-level pricing that can now be summed against campaign deliverable requirements
- deterministic Instagram/TikTok per-unit pricing from follower count as well

`creator_niches` and `creator_languages`:

- niche from optional Groq classifier, YouTube topic categories, or generic fallback
- language from deterministic Bangla/English/Banglish detection over recent titles/descriptions

`creator_portfolio_items`:

- recent YouTube content URLs
- titles
- thumbnails
- views, likes, comments
- published dates
- normalized niche when available

### Campaign demand data

The matching endpoint uses:

- `campaigns.primary_niche_id`
- `campaigns.required_platforms`
- `campaigns.budget_per_creator_max`
- `campaigns.creator_min_followers`
- `campaigns.creator_max_followers`
- `campaign_language_targets`
- campaign title/description for semantic fallback

## Current Matching Code Path

The live endpoint is:

```text
POST /campaigns/{campaign_id}/run-matching
```

Router path:

```text
backend/app/campaigns/router.py
```

Service path:

```text
backend/app/campaigns/service.py::run_campaign_matching
```

Pure scoring functions:

```text
backend/app/services/matching.py
backend/app/services/matching_config.py
```

Semantic fallback:

```text
backend/app/services/semantic_match.py
```

Old experimental script path:

```text
backend/scripts/test_matching.py
```

That script used to import `app.services.llm_matching.get_and_generate_matches`, which was not the live path.
It now exercises `run_campaign_matching`, the same service function used by the live endpoint.

## Current Matching Stages

The current backend is already close to a gated funnel.

### Stage 1: Hard SQL / relational filter

Active today:

- campaign must exist
- creators loaded with niches, languages, social profiles, and rate cards
- required platform filter
- follower min/max filter
- budget gate via `_passes_budget_gate`
- unavailable/deleted creator gate
- recent direct-competitor conflict gate when `campaign.brand_category` is present

Budget logic now prefers exact creator pricing when we have it:

- if a campaign has `deliverable_requirements`, matching sums the creator's relevant rate cards by
  `deliverable_code` and `quantity`
- if an exact deliverable code is missing, matching falls back to the cheapest active rate card on
  that platform
- only when creator pricing is unavailable do we fall back to follower-tier estimates

Needed improvements:

- prefer verified profile data over estimated/self-reported data when choosing primary matching metrics
- avoid using city as a hard gate for real YouTube seeds unless campaign explicitly asks for city and the creator has reliable city data
- keep hard failures hard: missing required platform, unavailable creator, follower range failure, and future direct-competitor conflict should never be rescued by semantic scoring
- replace exact-budget binary filtering with a hard ceiling plus soft scoring buffer, described below

### Stage 2: Conflict check

Detailed concept doc:

```text
docs/concepts/conflict-of-interest.md
```

Active first cut:

- check `creator_collaboration_history`
- join registered past brands through `brand_profiles`
- compare `brand_profiles.brand_category` to `campaigns.brand_category`
- if same creator + different brand + same brand category + collaboration within 90 days, hard-exclude before scoring

Still planned:

- support unregistered past brands by storing category directly on collaboration history if needed
- persist conflict reason/audit metadata for API/admin debug views

Current debug visibility:

- `scripts.test_conflict_matching` prints same-category recent collaboration rows that explain baseline creators excluded by the gate

This should be relational first, not Neo4j.

Threat model:

- `same niche` is not enough to define a competitor. A food creator who worked with Domino's is not automatically conflicted for every restaurant campaign.
- competitor logic compares product category (`brand_category`), not creator niche.
- the 90-day window is a demo default, not a verified Bangladesh market standard. Keep it configurable and document it as a product assumption.
- for demo trust, direct competitor conflict should be a hard exclude, not a penalty. A brand should not see a creator who is actively tied to a direct competitor.
- examples: pen brand vs edtech platform is not a conflict; two pen brands are a conflict; two edtech platforms are a conflict.

### Stage 3: Niche and semantic relevance

Active today:

- deterministic niche score
- if deterministic niche score is zero, semantic similarity can rescue the creator
- semantic similarity uses Gemini embeddings when available, token fallback otherwise

Strategy:

- keep deterministic niche score primary
- use semantic fallback only when campaign niche is specific and exact niche match fails
- do not let semantic similarity override budget/platform gates
- cap semantic rescue: if deterministic niche score is `0.0`, the rescued niche contribution can never exceed `0.4`
- log or persist when semantic rescue fires so we can audit why a creator survived exact-niche failure
- semantic rescue may keep a creator in the lower candidate pool, but should not be able to push them into the top 5 by itself

### Stage 4: Weighted score

Current code weights in `backend/app/services/matching_config.py`:

```text
niche      0.45
budget     0.20
platform   0.15
engagement 0.10
language   0.08
recency    0.02
```

Previous mismatch now fixed in the Navid task file:

`docs/tasks/tasks-navid.md` used to say older weights:

```text
niche 0.30 / engagement 0.20 / budget 0.20 / platform 0.15 / language 0.10 / recency 0.05
```

The source of truth is now `SCORE_WEIGHTS` in `backend/app/services/matching_config.py`. The current weights emphasize commercial fit:

- niche relevance
- budget realism
- platform availability

This prevents a massive creator with good engagement from ranking above a correctly-priced niche creator.

Current config:

```python
SCORE_WEIGHTS = {
    "niche": 0.45,
    "budget": 0.20,
    "platform": 0.15,
    "engagement": 0.10,
    "language": 0.08,
    "recency": 0.02,
}
```

Both the service and scripts should import this constant. Docs should reference that file instead of repeating weights in multiple places.

Budget scoring assumption update:

- seeded YouTube rate cards are deterministic, not manually entered or randomly generated
- subscriber count is converted to a monotonic bounded price curve so reseeding the same creator
  yields the same short/video/live suggestions
- exact rate-card totals should now drive budget realism for YouTube campaigns more often than tier
  midpoint estimates

### Stage 5: Rationale

Active today:

- heuristic rationale generated in campaign service
- Groq-personalized rationale for the top 5 sorted matches when `GROQ_API_KEY` is configured
- deterministic heuristic fallback when Groq is not configured or fails

N05 current status:

- bounded LLM rationale for top-N only
- 2 English sentences for the demo path
- English-only evidence brief to avoid copying raw Bangla/non-ASCII titles into output
- deterministic fallback when no API key exists
- remaining cleanup: resolve or remove the old experimental `services/llm_matching.py` path

Strategy:

- never call LLM for every candidate
- call only after hard filters and score sorting
- for the hackathon demo, set `N = 5`
- use creator bio plus recent portfolio videos as grounding context
- keep sub-scores as source of truth; rationale explains, not decides

## Critical Engine Decisions

These are the fixes that matter most for keeping the matching validation harness trustworthy.

### 1. Budget: hard ceiling with soft penalty buffer

A binary drop at exactly `budget_per_creator_max` is too brittle. A creator who is 10% above the brand's target can still be commercially plausible; a creator 2x above it is not.

Use this rule:

```text
if rate <= campaign_max:
    budget_score = 1.0
elif rate <= campaign_max * 1.3:
    budget_score = 1.0 - ((rate - campaign_max) / (campaign_max * 0.3))
else:
    hard_drop
```

Important distinction:

- `campaign_max * 1.3` is the hard ceiling for explicit creator rates.
- the soft penalty is only a score decay inside that ceiling.
- the soft penalty must not rescue creators who fail required platform, availability, follower range, or direct-competitor gates.
- missing creator rate can still use the tier midpoint estimate, but the estimate must go through the same ceiling logic.

### 2. Normalize every sub-score to 0-1

The weighted sum only means something if every component is already normalized to `[0.0, 1.0]`.

Current state:

- niche, platform, language, budget, engagement, and recency functions are intended to return 0-1 scores.
- follower/subscriber count is used for tiering and tie-breaking, not directly as a weighted raw value.
- engagement is tier-normalized today, but we should document the benchmark and clamp explicitly.

Lock this invariant in tests:

```text
0.0 <= score_niche <= 1.0
0.0 <= score_budget <= 1.0
0.0 <= score_platform <= 1.0
0.0 <= score_engagement <= 1.0
0.0 <= score_language <= 1.0
0.0 <= score_recency <= 1.0
0.0 <= score_total <= 1.0
```

For YouTube engagement, use a clear demo benchmark. A simple Bangladesh-oriented starting rule:

```text
1% engagement -> 0.0
7% engagement -> 1.0
linear clamp between them
```

Or keep the current tier benchmark approach, but still clamp the result and explain it in the rationale/debug output. Do not mix raw subscriber counts into the weighted sum.

### 3. Recency should penalize unknown activity slightly

Previous code passed `creator_days_since_post=None`, so recency always used the unknown default. The live service now computes recency from portfolio items when available, and unknown activity scores `0.2`.

Use portfolio items once available:

```python
def compute_recency_score(days_since_post: int | None) -> float:
    if days_since_post is None:
        return 0.2
    if days_since_post <= 7:
        return 1.0
    if days_since_post <= 30:
        return 0.8
    if days_since_post <= 90:
        return 0.5
    return 0.1
```

Unknown activity should be slightly negative, not treated as average. For the real YouTube seeds, calculate this from `creator_portfolio_items.published_at`.

### 4. Deterministic ranking

Ranking must be stable across refreshes. After computing scores, sort with deterministic tie-breakers:

```python
matched_creators.sort(
    key=lambda x: (
        x.score_total,
        x.primary_subscriber_count,
        x.creator_id,
    ),
    reverse=True,
)
```

If using ORM objects directly, use:

```text
score_total desc, selected social follower_count desc, creator_id desc
```

This avoids random-looking swaps when two creators have equal scores.

### 5. Cross-platform deduplication

Creators should appear once per campaign match, not once per social profile.

For campaigns with `required_platforms = ["youtube"]`, match the creator using their verified YouTube profile. For campaigns with multiple or any platforms, choose a primary scoring profile with this order:

1. required platform match
2. `data_source = "verified"`
3. `is_primary_platform = true`
4. highest follower/subscriber count

The displayed match remains the canonical `creator_profile`, with social profiles shown as supporting evidence.

### 6. Language profile should become a distribution

Today language detection stores language presence. For better matching, store or compute a distribution from recent content:

```text
Bangla 60%
English 30%
Banglish 10%
```

The script can still validate current language rows. Later, use title/description counts from recent portfolio items to build a weighted language profile.

### 7. Feedback loop

The matching engine needs audit signal, even without ML.

Minimum future signal:

```text
brand accepted creator
brand rejected creator
brand ignored creator
creator applied
creator declined
```

This can live beside `ai_match_scores` or in application/collaboration events. The goal is not immediate machine learning; it is to check whether our scoring predicts real brand choices.

## Recommended Scoring Strategy

### 1. Keep the hard gates strict

Hard gates should prevent obvious bad matches:

- creator does not have required platform
- follower count outside campaign bounds
- budget wildly incompatible with creator tier
- unavailable creator
- future: conflict-of-interest violation

Hard gates are better than soft penalties for demo trust. A brand should not see creators they obviously cannot use.

### 2. Choose the best social profile carefully

Current code picks:

```text
primary platform if marked, else highest follower count
```

With seeded data, this should be refined:

1. Prefer a profile on one of the campaign required platforms.
2. Prefer `data_source = "verified"`.
3. If multiple remain, prefer `is_primary_platform`.
4. Then highest follower count.

This matters because every real creator has:

- verified YouTube
- estimated Instagram
- estimated TikTok

For YouTube campaigns, YouTube should clearly drive metrics. For TikTok/Instagram campaigns, estimated rows can participate but should be labelled and possibly scored with lower trust later.

### 3. Treat estimated data as useful but lower confidence

Estimated IG/TikTok rows are demo-enabling but not equivalent to verified YouTube rows.

Current scoring can use them for platform coverage and broad sizing, but future N09/N06 should expose:

```text
verified > self_reported > estimated
```

Possible future penalty:

```text
estimated metric confidence multiplier = 0.85
```

Do not apply this yet unless the UI can explain it.

### 4. Use portfolio freshness for recency

The live service now computes this from `creator_portfolio_items.published_at` and falls back to the explicit 0.2 unknown-activity penalty above.

Now that we have `creator_portfolio_items.published_at`, recency can be computed:

```text
days_since_latest_youtube_portfolio_item
```

This should be added carefully:

- use platform-specific portfolio item when campaign requires one platform
- fallback to latest portfolio item across platforms
- if no portfolio item exists, use the low unknown-activity default, not a neutral score

### 5. Do not overfit to city

For real YouTube creators, `city` is intentionally unset. A creator abroad can still produce content for Bangladesh, and a creator in Dhaka can have a global audience.

City should be:

- a soft brand preference when reliable
- not a hard gate for YouTube creator matching unless campaign explicitly requires local physical presence

## N11 Script Alignment

Status:

Complete and Docker-verified. `backend/scripts/test_matching.py` validates the same service path used by the app.

### Script behavior

The script should:

1. Find or create a demo campaign with:
   - active status
   - public visibility
   - primary niche present
   - required platform `youtube`
   - realistic BDT budget
   - follower bounds compatible with seeded creators
   - Bangla language target
2. Call `run_campaign_matching(session, campaign_id)`.
3. Print:
   - campaign ID/title
   - number of matches
   - each matched creator
   - total score
   - sub-scores
   - rationale
4. Verify:
   - at least one match exists
   - scores are sorted descending
   - each match has persisted platform, recency, semantic, and total scores
5. Avoid calling `app.services.llm_matching.get_and_generate_matches`.

### Why service-layer call over HTTP first

For backend validation, calling `run_campaign_matching` directly is enough to exercise the same service path
as the live endpoint, without needing auth headers.

HTTP route smoke testing can be a second step if needed:

```text
POST /campaigns/{id}/run-matching
```

The script no longer calls the dead experimental LLM matching branch.

## Remaining Risks

1. `N04` may be stale because score platform/recency/semantic already exist, but rank may not.
2. `creator_social_profiles.data_source` influences primary profile selection, but estimated-data confidence penalties are still deferred until the UI can explain them.
3. Conflict-of-interest only works when both the current campaign and past registered brand have `brand_category`.
4. Language profile is still binary presence, not a distribution.
5. The old experimental `services/llm_matching.py` path should be integrated or deleted to avoid future confusion.

## Safe Implementation Order

1. Resolve or delete the old experimental `services/llm_matching.py` path.
2. Add stored rank only if the API/UI needs it.
3. Persist conflict audit metadata only when the API/UI needs to show excluded creators.
4. Upgrade language matching from binary presence to distribution when needed.
5. Add estimated-data confidence penalties only when the UI can explain them.

## Verification Commands

Seed data first:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m scripts.seed_real_youtube_creators
```

Run matching script:

```bash
docker compose exec backend python -m scripts.test_matching
```

Inspect persisted scores:

```bash
docker compose exec postgres psql -U cohesiq -d cohesiq -c "
SELECT score_total, score_niche, score_budget, score_platform, score_engagement, score_language, score_recency, score_semantic
FROM ai_match_scores
ORDER BY score_total DESC
LIMIT 10;
"
```

Health checks:

```bash
docker compose ps
docker compose logs --tail 50 backend
```
