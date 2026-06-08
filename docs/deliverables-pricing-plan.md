# Deliverables And Pricing Plan

## Canonical deliverable codes

These codes become the source of truth for campaign requirements, creator rate cards,
benchmarks, pricing suggestions, and matching.

### YouTube
- `youtube_live`
- `youtube_short`
- `youtube_video`

### Instagram
- `instagram_live`
- `instagram_feed`
- `instagram_reel`
- `instagram_story`

### TikTok
- `tiktok_live`
- `tiktok_story`
- `tiktok_video`

## Why canonical codes

The current generic `deliverable_type` enum is too ambiguous for pricing and matching.
For example, `short_video` means different things on YouTube and TikTok. Canonical
codes remove that ambiguity while still allowing us to keep the old enum during the
transition.

## Rollout phases

### Phase 1: Compatibility foundation
- Add canonical `deliverable_code` to:
  - `campaign_deliverable_requirements`
  - `creator_rate_cards`
- Add `suggested_price_bdt` to `creator_rate_cards`
- Backfill canonical codes from existing `(platform, deliverable_type)` values
- Keep writing the legacy enum for compatibility
- Add shared frontend and backend deliverable catalogs

### Phase 2: Creator pricing UX
- Replace generic rate cards with platform-aware deliverable pricing
- Show suggested price next to the creator-editable price
- Track whether the creator accepted or changed the suggestion

### Phase 3: Campaign deliverables UX
- Replace generic deliverable selection with platform-specific requirements
- Let brands add quantity and notes per canonical deliverable
- Keep free-text deliverable notes as secondary context only

### Phase 4: Pricing suggestions
- Deterministic v1 using:
  - follower tier
  - average views
  - engagement rate
  - platform
  - deliverable code
  - live benchmark medians

### Phase 5: Matching upgrades
- Exact deliverable support match
- Budget fit using creator-set pricing
- Deliverable usage/history fit
- Recency and platform familiarity scoring

## Migration rules

Canonical codes are backfilled from existing values using platform-aware rules:

- `youtube + live_stream -> youtube_live`
- `youtube + short_video -> youtube_short`
- `youtube + dedicated_video -> youtube_video`
- `instagram + live_stream -> instagram_live`
- `instagram + photo_post -> instagram_feed`
- `instagram + short_video -> instagram_reel`
- `instagram + story -> instagram_story`
- `tiktok + live_stream -> tiktok_live`
- `tiktok + story -> tiktok_story`
- `tiktok + short_video -> tiktok_video`

Legacy rows that do not map cleanly remain valid but should be treated as migration
cleanup candidates before the UI relies on them.
