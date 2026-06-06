# YouTube Integration Task Plan

## Goal
Use YouTube Data API public data first to enrich creator profiles and improve campaign recommendations. Add OAuth only after the public-data workflow is reliable.

## Unit 1: Public Channel Enrichment
Status: Complete

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
Status: Complete

Scope:
- Add `POST /creators/{creator_id}/platforms/youtube/enrich`.
- Upsert the creator's YouTube `creator_social_profiles` row from public enrichment.
- Store API verification metadata on the social profile row.

Verification completed:
- `docker compose exec backend python -m unittest tests.test_creator_youtube_enrichment tests.test_youtube_service -v`

## Unit 3: Portfolio Import From Recent Videos
Status: Complete

Unblocked by:
- Unit 2 persistence verified.
- N02 real-channel seeding verified: current demo DB has 67 YouTube `verified` rows plus 134 companion `estimated` rows.

Scope:
- Import `enrichment.recent_videos` into `creator_portfolio_items`.
- Skip videos whose `content_url` already exists for the creator's YouTube portfolio.
- Map title, thumbnail, views, likes, comments, published date, platform, and niche.
- Mark the newest imported video as featured.

Verification completed:
- `docker compose exec backend python -m scripts.seed_real_youtube_creators`
- Result: resolved creators import recent YouTube videos into `creator_portfolio_items`; unresolved handles from the 100-name inventory are not needed for the current demo.

## Unit 4: Matching Signal Integration
Status: Pending

## Unit 5: OAuth Account Connection
Status: Pending
