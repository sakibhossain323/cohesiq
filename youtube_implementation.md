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
- `backend/tests/test_youtube_service.py`
- `backend/scripts/test_youtube_api.py`

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

## Next Recommended Unit

Unit 2 should persist enrichment into `creator_social_profiles`.

Recommended endpoint:

```text
POST /creators/{creator_id}/platforms/youtube/enrich
```

Recommended request body:

```json
{
  "channel_ref": "@programmingwithmosh",
  "recent_video_limit": 10
}
```

Recommended mapping:

```text
platform = "youtube"
platform_user_id = enrichment.platform_user_id
handle = enrichment.handle or enrichment.title
profile_url = enrichment.profile_url
display_name_on_platform = enrichment.title
follower_count = enrichment.subscriber_count
avg_views_per_post = enrichment.avg_views_recent
avg_likes_per_post = enrichment.avg_likes_recent
avg_comments_per_post = enrichment.avg_comments_recent
engagement_rate = enrichment.estimated_engagement_rate
stats_reported_for_period = "recent_uploads"
```

Testing for Unit 2 should happen before route testing:

1. Unit-test enrichment-to-social-profile mapping.
2. Unit-test update-vs-create behavior.
3. Then test the authenticated endpoint in Docker.

## Later Units

Unit 3: Portfolio import from recent YouTube videos.

Unit 4: Matching signal integration using recent views, engagement, upload consistency, and content relevance.

Unit 5: Optional OAuth account connection for creator verification and private/owned account data.
