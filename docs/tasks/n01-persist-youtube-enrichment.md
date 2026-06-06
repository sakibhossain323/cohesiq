# N01 — Persist YouTube Enrichment to Creator Profiles

## Goal
Persist Tier-0 YouTube enrichment into the existing creator data model so matching can run against verified creator social profiles instead of stateless wrapper output.

## Why this matters
- The current YouTube wrapper is stateless and only returns enrichment data on demand.
- Matching and scoring need stable, queryable creator data in `creator_social_profiles`.
- This is the first database-backed step in Phase D and unlocks real-data matching, UI persistence, and later analytics.

## Scope
- Add a dedicated route in the creators domain to persist YouTube enrichment results.
- Map the video platform enrichment response into `creator_social_profiles` columns.
- Ensure API-verified creator channel metadata is stored explicitly.
- Keep the YouTube service wrapper itself stateless.

## Requirements
1. Add endpoint:
   - `POST /creators/{creator_id}/platforms/youtube/enrich`
   - Body:
     - `channel_ref` (YouTube handle or channel identifier)
     - `recent_video_limit` (optional)
2. Fetch enrichment through `app/youtube` service.
3. Upsert into `creator_social_profiles`:
   - If a YouTube social profile already exists for the creator, update it.
   - Otherwise create a new social profile row.

## Required field mapping
Use `youtube_implementation.md` recommended mapping, plus these two columns:
- `posts_per_month = enrichment.uploads_per_month`
- `api_channel_id = enrichment.platform_user_id`

Also persist:
- `is_api_verified`
- `api_verified_at`
- `stats_reported_at` (for data staleness)
- `data_source = "verified"` when data comes from API

## Database changes
- Add columns via migration `0016`:
  - `is_api_verified` (boolean)
  - `api_verified_at` (timestamp)
  - `api_channel_id` (string)
  - `data_source` (string)
- Update `docs/schema.md` after migration.

## Implementation details
- All persistence logic must remain in `app/creators/`.
- `app/youtube/` stays a stateless public read wrapper.
- The route should call creator persistence code in the creators service layer.
- Unit-test mapping logic and update-vs-create behavior before route-level tests.

## Testing
- Add unit tests for:
  - enrichment response -> social profile mapping
  - both create and update flows
- Add route test verifying:
  - `POST /creators/{creator_id}/platforms/youtube/enrich` returns success
  - the profile row is created/updated correctly
- Run existing backend tests and docker-backed route tests after migration.

## Acceptance criteria
- You can call the new endpoint and see a row in `creator_social_profiles`.
- The row contains `api_channel_id`, `is_api_verified`, `api_verified_at`, and `posts_per_month`.
- Existing YouTube wrapper endpoints remain unchanged.
- `docs/schema.md` is updated to reflect the new columns.

## Notes
- Do not add any persistence directly inside `app/youtube/`.
- This task is the gateway for N02–N06 and should be completed before semantic score persistence work.
- Keep the implementation aligned with the current repo conventions: router parses request, service layer handles logic.
