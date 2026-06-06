# YouTube Integration Task Plan

> **Moved from repo root `youtube_task.md` on 2026-06-07.**
> Unit completion status is also tracked in `docs/tasks/tasks-navid.md` (N01, N02, N03, N12). See [`youtube-implementation-26-06-07.md`](youtube-implementation-26-06-07.md) for implementation detail on each unit.

## Goal
Use YouTube Data API public data first to enrich creator profiles and improve campaign recommendations. Add OAuth only after the public-data workflow is reliable.

## Unit 1: Public Channel Enrichment
Status: **Complete**

Scope:
- Accept a channel ID, handle, username, or YouTube channel URL.
- Fetch channel identity and public statistics.
- Fetch recent uploads through the channel uploads playlist.
- Fetch video statistics for those recent uploads.
- Return normalized creator-ready metrics.

Testing:
- Unit-test URL/identifier parsing.
- Unit-test recent-video aggregate calculations.
- Unit-test parser behavior from mocked YouTube API payloads.

Verification completed:
- `docker compose exec backend python -m unittest tests.test_youtube_service -v`
- `docker compose exec backend python -m scripts.test_youtube_api`
- Live route smoke test for `/youtube/channels/enrichment`

## Unit 2: Persist Enrichment To Creator Social Profile
Status: **Complete**

Scope:
- Add `POST /creators/{creator_id}/platforms/youtube/enrich`.
- Upsert the creator's YouTube `creator_social_profiles` row from public enrichment.
- Store API verification metadata on the social profile row.

Verification completed:
- `docker compose exec backend python -m unittest tests.test_creator_youtube_enrichment tests.test_youtube_service -v`

## Unit 3: Portfolio Import From Recent Videos
Status: **Complete**

Unblocked by:
- Unit 2 persistence verified.
- N02 real-channel seeding verified: 19 YouTube `verified` rows plus 38 companion `estimated` rows.

Scope:
- Import `enrichment.recent_videos` into `creator_portfolio_items`.
- Skip videos whose `content_url` already exists for the creator's YouTube portfolio.
- Map title, thumbnail, views, likes, comments, published date, platform, and niche.
- Mark the newest imported video as featured.

Verification completed:
- `docker compose exec backend python -m scripts.seed_real_youtube_creators`
- Result: 19 creators succeeded, 0 failed, 190 YouTube portfolio rows imported.

## Unit 4: Matching Signal Integration
Status: **Pending**

Planned scope:
- Integrate recent views, engagement trend, upload consistency, and content relevance as matching signals.
- See `matching-engine-plan-26-06-07.md` for stage strategy.

## Unit 5: OAuth Account Connection
Status: **Pending** (deferred — not required for Tier-0 matching)

Planned scope:
- OAuth account connection for creator verification.
- Private creator data and YouTube Analytics API access.
