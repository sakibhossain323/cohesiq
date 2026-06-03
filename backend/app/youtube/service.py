from typing import Any, Literal

import httpx

from app.config import settings
from app.youtube.schemas import (
    YouTubeChannel,
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

    item = items[0]
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
