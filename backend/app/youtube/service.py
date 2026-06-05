from datetime import timezone
from typing import Any, Literal
from urllib.parse import parse_qs, urlparse

import httpx

from app.config import settings
from app.youtube.schemas import (
    YouTubeChannel,
    YouTubeChannelEnrichment,
    YouTubeRecentVideo,
    YouTubeSearchResponse,
    YouTubeSearchResult,
    YouTubeThumbnail,
    YouTubeVideo,
)

YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3"


class YouTubeConfigError(Exception):
    """Raised when YouTube API configuration is missing."""


class YouTubeAPIError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def _require_api_key() -> str:
    if not settings.youtube_api_key:
        raise YouTubeConfigError("YOUTUBE_API_KEY is not configured")
    return settings.youtube_api_key


async def _get(endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
    request_params = {**params, "key": _require_api_key()}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{YOUTUBE_API_BASE_URL}/{endpoint}",
                params=request_params,
            )
    except httpx.TimeoutException as exc:
        raise YouTubeAPIError(504, "YouTube API request timed out") from exc
    except httpx.RequestError as exc:
        raise YouTubeAPIError(502, "Could not reach YouTube API") from exc

    if response.is_error:
        raise YouTubeAPIError(response.status_code, _extract_error_detail(response))

    return response.json()


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text or "YouTube API request failed"

    error = payload.get("error")
    if isinstance(error, dict):
        message = error.get("message")
        if isinstance(message, str) and message:
            return message

    return "YouTube API request failed"


async def search_public(
    *,
    q: str,
    max_results: int = 5,
    resource_type: Literal["video", "channel", "playlist"] = "video",
    order: Literal["date", "rating", "relevance", "title", "videoCount", "viewCount"] = "relevance",
    page_token: str | None = None,
    region_code: str | None = None,
    relevance_language: str | None = None,
) -> YouTubeSearchResponse:
    params: dict[str, Any] = {
        "part": "snippet",
        "q": q,
        "maxResults": max_results,
        "type": resource_type,
        "order": order,
    }
    if page_token:
        params["pageToken"] = page_token
    if region_code:
        params["regionCode"] = region_code
    if relevance_language:
        params["relevanceLanguage"] = relevance_language

    payload = await _get("search", params)
    return parse_search_response(q, payload)


async def get_video(video_id: str) -> YouTubeVideo:
    payload = await _get(
        "videos",
        {
            "part": "snippet,statistics,contentDetails",
            "id": video_id,
        },
    )
    return parse_video_response(payload)


async def get_channel(
    *,
    channel_id: str | None = None,
    handle: str | None = None,
    username: str | None = None,
) -> YouTubeChannel:
    params: dict[str, Any] = {"part": "snippet,statistics,contentDetails"}
    if channel_id:
        params["id"] = channel_id
    elif handle:
        params["forHandle"] = handle
    elif username:
        params["forUsername"] = username
    else:
        raise ValueError("channel_id, handle, or username is required")

    payload = await _get("channels", params)
    return parse_channel_response(payload)


async def get_channel_enrichment(
    *,
    channel_ref: str,
    recent_video_limit: int = 10,
) -> YouTubeChannelEnrichment:
    channel = await get_channel(**parse_channel_ref(channel_ref))
    if not channel.uploads_playlist_id:
        return build_channel_enrichment(channel=channel, recent_videos=[])

    playlist_payload = await _get(
        "playlistItems",
        {
            "part": "snippet,contentDetails",
            "playlistId": channel.uploads_playlist_id,
            "maxResults": recent_video_limit,
        },
    )
    video_ids = extract_playlist_video_ids(playlist_payload)
    if not video_ids:
        return build_channel_enrichment(channel=channel, recent_videos=[])

    videos_payload = await _get(
        "videos",
        {
            "part": "snippet,statistics,contentDetails",
            "id": ",".join(video_ids),
            "maxResults": len(video_ids),
        },
    )
    recent_videos = parse_videos_response(videos_payload)
    return build_channel_enrichment(channel=channel, recent_videos=recent_videos)


def parse_channel_ref(channel_ref: str) -> dict[str, str]:
    ref = channel_ref.strip()
    if not ref:
        raise ValueError("channel_ref is required")

    parsed = urlparse(ref if "://" in ref else f"https://{ref}")
    if parsed.netloc and "youtube.com" in parsed.netloc:
        path_parts = [part for part in parsed.path.split("/") if part]
        if not path_parts:
            raise ValueError("Could not parse YouTube channel reference")

        if path_parts[0].startswith("@"):
            return {"handle": path_parts[0]}
        if path_parts[0] == "channel" and len(path_parts) > 1:
            return {"channel_id": path_parts[1]}
        if path_parts[0] == "user" and len(path_parts) > 1:
            return {"username": path_parts[1]}
        if path_parts[0] == "c" and len(path_parts) > 1:
            return {"handle": path_parts[1]}

    if parsed.netloc and "youtu.be" in parsed.netloc:
        query = parse_qs(parsed.query)
        channel_id = query.get("channel_id", [None])[0]
        if channel_id:
            return {"channel_id": channel_id}

    if ref.startswith("@"):
        return {"handle": ref}
    if ref.startswith("UC"):
        return {"channel_id": ref}
    return {"handle": ref}


def parse_search_response(query: str, payload: dict[str, Any]) -> YouTubeSearchResponse:
    page_info = payload.get("pageInfo") or {}
    return YouTubeSearchResponse(
        query=query,
        total_results=_to_int(page_info.get("totalResults")),
        results_per_page=_to_int(page_info.get("resultsPerPage")),
        next_page_token=payload.get("nextPageToken"),
        prev_page_token=payload.get("prevPageToken"),
        results=[_parse_search_item(item) for item in payload.get("items", [])],
    )


def parse_video_response(payload: dict[str, Any]) -> YouTubeVideo:
    items = payload.get("items") or []
    if not items:
        raise YouTubeAPIError(404, "YouTube video not found")

    return _parse_video_item(items[0])


def parse_videos_response(payload: dict[str, Any]) -> list[YouTubeRecentVideo]:
    return [
        YouTubeRecentVideo(**_parse_video_item(item).model_dump())
        for item in payload.get("items", [])
    ]


def _parse_video_item(item: dict[str, Any]) -> YouTubeVideo:
    snippet = item.get("snippet") or {}
    statistics = item.get("statistics") or {}
    content_details = item.get("contentDetails") or {}
    video_id = item["id"]
    return YouTubeVideo(
        id=video_id,
        title=snippet.get("title", ""),
        description=snippet.get("description"),
        channel_id=snippet.get("channelId", ""),
        channel_title=snippet.get("channelTitle"),
        published_at=snippet.get("publishedAt"),
        thumbnails=_parse_thumbnails(snippet.get("thumbnails")),
        view_count=_to_int(statistics.get("viewCount")),
        like_count=_to_int(statistics.get("likeCount")),
        comment_count=_to_int(statistics.get("commentCount")),
        duration=content_details.get("duration"),
        url=f"https://www.youtube.com/watch?v={video_id}",
    )


def parse_channel_response(payload: dict[str, Any]) -> YouTubeChannel:
    items = payload.get("items") or []
    if not items:
        raise YouTubeAPIError(404, "YouTube channel not found")

    item = items[0]
    snippet = item.get("snippet") or {}
    statistics = item.get("statistics") or {}
    related_playlists = (
        (item.get("contentDetails") or {})
        .get("relatedPlaylists")
        or {}
    )
    channel_id = item["id"]
    return YouTubeChannel(
        id=channel_id,
        title=snippet.get("title", ""),
        description=snippet.get("description"),
        custom_url=snippet.get("customUrl"),
        published_at=snippet.get("publishedAt"),
        thumbnails=_parse_thumbnails(snippet.get("thumbnails")),
        subscriber_count=_to_int(statistics.get("subscriberCount")),
        hidden_subscriber_count=statistics.get("hiddenSubscriberCount"),
        video_count=_to_int(statistics.get("videoCount")),
        view_count=_to_int(statistics.get("viewCount")),
        uploads_playlist_id=related_playlists.get("uploads"),
        url=f"https://www.youtube.com/channel/{channel_id}",
    )


def _parse_search_item(item: dict[str, Any]) -> YouTubeSearchResult:
    identifier = item.get("id") or {}
    snippet = item.get("snippet") or {}
    resource_type = _resource_type(identifier.get("kind"))
    video_id = identifier.get("videoId")
    channel_id = identifier.get("channelId") or snippet.get("channelId")
    playlist_id = identifier.get("playlistId")

    return YouTubeSearchResult(
        resource_type=resource_type,
        title=snippet.get("title", ""),
        description=snippet.get("description"),
        channel_id=channel_id,
        channel_title=snippet.get("channelTitle"),
        published_at=snippet.get("publishedAt"),
        thumbnails=_parse_thumbnails(snippet.get("thumbnails")),
        video_id=video_id,
        playlist_id=playlist_id,
        url=_resource_url(resource_type, video_id, channel_id, playlist_id),
    )


def extract_playlist_video_ids(payload: dict[str, Any]) -> list[str]:
    video_ids: list[str] = []
    for item in payload.get("items", []):
        content_details = item.get("contentDetails") or {}
        video_id = content_details.get("videoId")
        if video_id:
            video_ids.append(video_id)
    return video_ids


def build_channel_enrichment(
    *,
    channel: YouTubeChannel,
    recent_videos: list[YouTubeRecentVideo],
) -> YouTubeChannelEnrichment:
    return YouTubeChannelEnrichment(
        platform_user_id=channel.id,
        handle=channel.custom_url,
        profile_url=channel.url,
        title=channel.title,
        thumbnail_url=_best_thumbnail_url(channel.thumbnails),
        subscriber_count=channel.subscriber_count,
        total_views=channel.view_count,
        video_count=channel.video_count,
        uploads_playlist_id=channel.uploads_playlist_id,
        recent_videos=recent_videos,
        avg_views_recent=_avg([video.view_count for video in recent_videos]),
        avg_likes_recent=_avg([video.like_count for video in recent_videos]),
        avg_comments_recent=_avg([video.comment_count for video in recent_videos]),
        estimated_engagement_rate=_estimate_engagement_rate(recent_videos),
        uploads_per_month=_estimate_uploads_per_month(recent_videos),
    )


def _avg(values: list[int | None]) -> int | None:
    real_values = [value for value in values if value is not None]
    if not real_values:
        return None
    return round(sum(real_values) / len(real_values))


def _estimate_engagement_rate(videos: list[YouTubeRecentVideo]) -> float | None:
    total_views = sum(video.view_count or 0 for video in videos)
    if total_views <= 0:
        return None

    total_engagements = sum(
        (video.like_count or 0) + (video.comment_count or 0)
        for video in videos
    )
    return round(total_engagements / total_views, 4)


def _estimate_uploads_per_month(videos: list[YouTubeRecentVideo]) -> float | None:
    published_dates = [
        video.published_at
        for video in videos
        if video.published_at is not None
    ]
    if len(published_dates) < 2:
        return None

    newest = max(published_dates)
    oldest = min(published_dates)
    if newest.tzinfo is None:
        newest = newest.replace(tzinfo=timezone.utc)
    if oldest.tzinfo is None:
        oldest = oldest.replace(tzinfo=timezone.utc)

    days = max((newest - oldest).days, 1)
    return round((len(published_dates) / days) * 30, 2)


def _best_thumbnail_url(thumbnails: dict[str, YouTubeThumbnail]) -> str | None:
    for name in ("high", "medium", "default"):
        thumbnail = thumbnails.get(name)
        if thumbnail:
            return thumbnail.url
    for thumbnail in thumbnails.values():
        return thumbnail.url
    return None


def _resource_type(kind: str | None) -> Literal["video", "channel", "playlist"]:
    if kind == "youtube#channel":
        return "channel"
    if kind == "youtube#playlist":
        return "playlist"
    return "video"


def _resource_url(
    resource_type: str,
    video_id: str | None,
    channel_id: str | None,
    playlist_id: str | None,
) -> str | None:
    if resource_type == "video" and video_id:
        return f"https://www.youtube.com/watch?v={video_id}"
    if resource_type == "channel" and channel_id:
        return f"https://www.youtube.com/channel/{channel_id}"
    if resource_type == "playlist" and playlist_id:
        return f"https://www.youtube.com/playlist?list={playlist_id}"
    return None


def _parse_thumbnails(payload: dict[str, Any] | None) -> dict[str, YouTubeThumbnail]:
    if not payload:
        return {}

    return {
        name: YouTubeThumbnail(
            url=thumb["url"],
            width=_to_int(thumb.get("width")),
            height=_to_int(thumb.get("height")),
        )
        for name, thumb in payload.items()
        if isinstance(thumb, dict) and thumb.get("url")
    }


def _to_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
