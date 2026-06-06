# YouTube Integration Implementation

## Current Status

The project currently uses the YouTube Data API v3 with an API key. OAuth is intentionally deferred because the first useful Cohesiq matching signals can be gathered from public channel and video data.

Current flow:

```text
Frontend or API client -> Cohesiq backend -> YouTube Data API v3
```

The YouTube API key stays server-side in `backend/.env`:

```env
YOUTUBE_API_KEY=your_youtube_data_api_key
```

Do not expose this key through the frontend environment.

## Authentication Choice

Implemented now:

- API key authentication
- Public YouTube data only
- No OAuth client ID
- No Authorized JavaScript Origins required
- No Authorized Redirect URIs required yet

Deferred:

- OAuth account connection
- Private creator data
- Creator-owned subscriptions/playlists/ratings
- YouTube Analytics API data

## Backend Files

YouTube integration lives in:

- `backend/app/youtube/router.py`
- `backend/app/youtube/service.py`
- `backend/app/youtube/schemas.py`
- `backend/app/creators/router.py` for the authenticated persistence endpoint
- `backend/app/creators/service.py` for enrichment-to-social-profile persistence
- `backend/alembic/versions/0016_add_api_verified_social_profile_fields.py`
- `backend/tests/test_youtube_service.py`
- `backend/tests/test_creator_youtube_enrichment.py`
- `backend/scripts/test_youtube_api.py`
- `backend/scripts/seed_real_youtube_creators.py`

The router is included from `backend/app/main.py` with:

```python
app.include_router(youtube_router, prefix="/youtube", tags=["youtube"])
```

## Existing Endpoints

### Search Public YouTube Results

```text
GET /youtube/search?q=python%20tutorial&max_results=5
```

Useful query params:

- `q`
- `max_results`
- `type`, accepted values: `video`, `channel`, `playlist`
- `order`, accepted values include `relevance`, `date`, `viewCount`
- `page_token`
- `region_code`
- `relevance_language`

Returns public search results with title, description, channel, thumbnails, resource IDs, and URL.

### Get Video Details

```text
GET /youtube/videos/{video_id}
```

Returns:

- title
- description
- channel ID/title
- published date
- thumbnails
- view count
- like count
- comment count
- duration
- canonical YouTube URL

### Get Channel Details

```text
GET /youtube/channels?id={channel_id}
GET /youtube/channels?handle=@somehandle
GET /youtube/channels?username=legacyUsername
```

Returns:

- channel ID
- title
- description
- custom URL
- published date
- thumbnails
- subscriber count
- hidden subscriber count flag
- video count
- total view count
- uploads playlist ID
- canonical channel URL

### Get Channel Enrichment

```text
GET /youtube/channels/enrichment?channel_ref=UCWv7vMbMWH4-V0ZXdmDpPBA&recent_video_limit=2
GET /youtube/channels/enrichment?channel_ref=@programmingwithmosh&recent_video_limit=5
```

This is the main creator-ready endpoint implemented in Unit 1.

It accepts:

- channel ID
- handle
- legacy username
- YouTube channel URL

It fetches:

1. Channel identity and public statistics through `channels.list`.
2. The channel uploads playlist through `contentDetails.relatedPlaylists.uploads`.
3. Recent uploaded video IDs through `playlistItems.list`.
4. Recent video stats through `videos.list`.

Returns normalized data:

- `platform`
- `platform_user_id`
- `handle`
- `profile_url`
- `title`
- `thumbnail_url`
- `subscriber_count`
- `total_views`
- `video_count`
- `uploads_playlist_id`
- `recent_videos`
- `avg_views_recent`
- `avg_likes_recent`
- `avg_comments_recent`
- `estimated_engagement_rate`
- `uploads_per_month`

## Unit 1 Completed: Public Channel Enrichment

Implemented:

- `YouTubeRecentVideo`
- `YouTubeChannelEnrichment`
- `get_channel_enrichment`
- `parse_channel_ref`
- `parse_videos_response`
- `extract_playlist_video_ids`
- `build_channel_enrichment`
- average recent views/likes/comments
- estimated engagement rate
- estimated uploads per month
- `/youtube/channels/enrichment` endpoint

The engagement estimate is:

```text
(total recent likes + total recent comments) / total recent views
```

The upload frequency estimate is based on the spread between recent video publish dates:

```text
number_of_recent_videos / days_between_oldest_and_newest * 30
```

## Verification Done

Focused unit tests:

```bash
docker compose exec backend python -m unittest tests.test_youtube_service -v
```

Result:

```text
Ran 3 tests
OK
```

Existing YouTube smoke test:

```bash
docker compose exec backend python -m scripts.test_youtube_api
```

Result:

```text
YouTube parser tests passed
Live YouTube API smoke test passed: Python Full Course for Beginners
```

Live enrichment route smoke test:

```bash
docker compose exec backend python -c "import httpx; r=httpx.get('http://127.0.0.1:8000/youtube/channels/enrichment', params={'channel_ref':'UCWv7vMbMWH4-V0ZXdmDpPBA','recent_video_limit':2}, timeout=30); print(r.status_code); print(r.json()['title'])"
```

Expected:

```text
200
Programming with Mosh
```

## Current Useful Browser URLs

Programming with Mosh by channel ID:

```text
http://localhost:8000/youtube/channels/enrichment?channel_ref=UCWv7vMbMWH4-V0ZXdmDpPBA&recent_video_limit=2
```

Programming with Mosh by handle:

```text
http://localhost:8000/youtube/channels/enrichment?channel_ref=@programmingwithmosh&recent_video_limit=5
```

Search example:

```text
http://localhost:8000/youtube/search?q=python%20tutorial&max_results=5
```

## Unit 2 Completed: Persist Enrichment To Creator Social Profile

The YouTube wrapper remains stateless. Persistence belongs to the creators domain.

Authenticated endpoint:

```text
POST /creators/{creator_id}/platforms/youtube/enrich
```

Request body:

```json
{
  "channel_ref": "@programmingwithmosh",
  "recent_video_limit": 10
}
```

Implemented mapping:

```text
platform = "youtube"
platform_user_id = enrichment.platform_user_id
api_channel_id = enrichment.platform_user_id
handle = enrichment.handle or enrichment.title
profile_url = enrichment.profile_url
display_name_on_platform = enrichment.title
follower_count = enrichment.subscriber_count
avg_views_per_post = enrichment.avg_views_recent
avg_likes_per_post = enrichment.avg_likes_recent
avg_comments_per_post = enrichment.avg_comments_recent
engagement_rate = enrichment.estimated_engagement_rate
posts_per_month = enrichment.uploads_per_month
is_api_verified = true
api_verified_at = now()
data_source = "verified"
stats_reported_at = now()
stats_reported_for_period = "recent {n} uploads"
```

Schema changes:

```text
creator_social_profiles.is_api_verified
creator_social_profiles.api_verified_at
creator_social_profiles.api_channel_id
creator_social_profiles.data_source
```

These are added by migration `0016`.

Migration `0017` restores `UNIQUE(creator_id, platform)` on `creator_social_profiles`, which is required by the enrichment and seeding upserts.

Verification:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m unittest tests.test_creator_youtube_enrichment tests.test_youtube_service -v
```

Expected unit-test result:

```text
Ran 6 tests
OK
```

Live authenticated route testing requires a valid Clerk-authenticated creator token. Use the frontend flow or an API client with an `Authorization: Bearer <token>` header.

Example request shape:

```bash
curl -X POST "http://localhost:8000/creators/<creator_id>/platforms/youtube/enrich" \
  -H "Authorization: Bearer <creator_token>" \
  -H "Content-Type: application/json" \
  -d '{"channel_ref":"@programmingwithmosh","recent_video_limit":10}'
```

Successful response returns the persisted `SocialProfileOut` row, including:

```text
platform_user_id
api_channel_id
follower_count
avg_views_per_post
avg_likes_per_post
avg_comments_per_post
engagement_rate
posts_per_month
is_api_verified
api_verified_at
data_source
stats_reported_at
```

## N02 Implemented: Real Bangladesh YouTube Creator Seeder

The real-channel seeder is:

```text
backend/scripts/seed_real_youtube_creators.py
```

It hardcodes 19 Bangladesh YouTube creator handles across education, technology, food, travel, entertainment, comedy, and gaming. It calls `get_channel_enrichment()` for each handle and never calls `Search.list`.

For each successful channel, it:

- creates or updates a seed `users` row
- creates or updates a `creator_profiles` row
- generates `creator_profiles.bio` from the public channel description plus the last five recent-video descriptions
- leaves `creator_profiles.city` unset, because creator location and target audience location should not be inferred from YouTube content
- links the creator to a primary niche and Bangla language
- persists the YouTube row as `data_source = "verified"`
- adds estimated Instagram and TikTok companion rows as `data_source = "estimated"`

Run after migrations through `0017`:

```bash
docker compose exec backend python -m scripts.seed_real_youtube_creators
```

The script prints one line per channel:

```text
Seeded <channel title> (@handle)
Skipped @handle: <error>
```

It continues if one channel fails, rolls back only that channel, and prints a final success/failure count.

Verified live result:

```text
Real YouTube creator seeding complete: 19 succeeded, 0 failed.
```

Verified DB counts:

```text
platform  | data_source | count
----------+-------------+------
youtube   | verified    | 19
instagram | estimated   | 19
tiktok    | estimated   | 19
```

Suggested database checks:

```bash
docker compose exec postgres psql -U cohesiq -d cohesiq -c "
SELECT platform, data_source, count(*)
FROM creator_social_profiles
GROUP BY platform, data_source
ORDER BY platform, data_source;
"
```

```bash
docker compose exec postgres psql -U cohesiq -d cohesiq -c "
SELECT cp.display_name, sp.platform, sp.data_source, sp.follower_count, sp.is_api_verified
FROM creator_profiles cp
JOIN creator_social_profiles sp ON sp.creator_id = cp.id
WHERE sp.platform = 'youtube'
ORDER BY sp.follower_count DESC NULLS LAST
LIMIT 20;
"
```

Health checks after backend or migration changes:

```bash
docker compose ps
docker compose logs --tail 50 backend
```

## N03 Implemented: Ingestion Normalization

Normalization lives in:

```text
backend/app/creators/normalization.py
```

The current Tier-0 normalization is deterministic and uses only public channel/video payloads:

- YouTube `topicCategories` Wikipedia URLs map to internal niche names through `YOUTUBE_CATEGORY_MAP`.
- If `GROQ_API_KEY` is configured, the real-channel seeder asks Groq to classify the creator into exactly one allowed Cohesiq niche using channel description plus the last five video titles/descriptions.
- If Groq is unavailable or returns an invalid niche, seeding falls back to YouTube topic categories, then a generic `Lifestyle` fallback.
- Recent video titles and descriptions are scanned for Bangla, English, and Banglish signals.
- Detected platform languages are stored on `creator_social_profiles.content_languages`.
- The creator-level `creator_languages` table is synced from the detected languages.
- Known Bangladesh city names are normalized; unknown or blank city strings become `unknown_location`.
- `engagement_vs_tier_ratio()` compares engagement rate against the existing tier benchmark and is ready for N06 trust scoring.

The YouTube wrapper now requests:

```text
part=snippet,statistics,contentDetails,topicDetails
```

New enrichment fields:

```text
topic_categories
detected_content_languages
```

The persistence endpoint uses these fields to enrich the social profile row and creator language/niche junction rows.

Focused test command:

```bash
docker compose exec backend python -m unittest tests.test_creator_youtube_enrichment tests.test_youtube_service -v
```

Expected after generated-bio seeding update:

```text
Ran 9 tests
OK
```

Verified:

```text
Ran 9 tests
OK
```

## Later Units

## Unit 3 Implemented: Portfolio Import From Recent Videos

Recent YouTube uploads are imported into:

```text
creator_portfolio_items
```

Import is wired into:

- `POST /creators/{creator_id}/platforms/youtube/enrich`
- `backend/scripts/seed_real_youtube_creators.py`

Mapping:

```text
platform = "youtube"
content_url = recent_video.url
title = recent_video.title
thumbnail_url = best available thumbnail URL
views = recent_video.view_count
likes = recent_video.like_count
comments = recent_video.comment_count
published_at = recent_video.published_at.date()
niche_id = first normalized YouTube topic niche when available
is_featured = true for the newest imported video
sort_order = recent video index
```

Idempotence:

```text
Existing creator YouTube portfolio URLs are selected first.
Only missing content URLs are inserted.
Re-running enrichment or seeding does not duplicate portfolio rows.
```

Focused test command:

```bash
docker compose exec backend python -m unittest tests.test_creator_youtube_enrichment tests.test_youtube_service -v
```

Expected after Unit 3:

```text
Ran 10 tests
OK
```

Verified live seeder result:

```text
Real YouTube creator seeding complete: 19 succeeded, 0 failed.
creator_portfolio_items: youtube = 190
```

Live seeder check:

```bash
docker compose exec backend python -m scripts.seed_real_youtube_creators
docker compose exec postgres psql -U cohesiq -d cohesiq -c "
SELECT platform, count(*)
FROM creator_portfolio_items
GROUP BY platform
ORDER BY platform;
"
```

Unit 4: Matching signal integration using recent views, engagement, upload consistency, and content relevance.

Unit 5: Optional OAuth account connection for creator verification and private/owned account data.
