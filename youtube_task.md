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
Status: Pending

## Unit 3: Portfolio Import From Recent Videos
Status: Pending

## Unit 4: Matching Signal Integration
Status: Pending

## Unit 5: OAuth Account Connection
Status: Pending
