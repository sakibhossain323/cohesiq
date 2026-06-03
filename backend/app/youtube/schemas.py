from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class YouTubeThumbnail(BaseModel):
    url: str
    width: int | None = None
    height: int | None = None


class YouTubeSearchResult(BaseModel):
    resource_type: Literal["video", "channel", "playlist"]
    title: str
    description: str | None = None
    channel_id: str | None = None
    channel_title: str | None = None
    published_at: datetime | None = None
    thumbnails: dict[str, YouTubeThumbnail] = {}
    video_id: str | None = None
    playlist_id: str | None = None
    url: str | None = None


class YouTubeSearchResponse(BaseModel):
    query: str
    total_results: int | None = None
    results_per_page: int | None = None
    next_page_token: str | None = None
    prev_page_token: str | None = None
    results: list[YouTubeSearchResult]


class YouTubeVideo(BaseModel):
    id: str
    title: str
    description: str | None = None
    channel_id: str
    channel_title: str | None = None
    published_at: datetime | None = None
    thumbnails: dict[str, YouTubeThumbnail] = {}
    view_count: int | None = None
    like_count: int | None = None
    comment_count: int | None = None
    duration: str | None = None
    url: str


class YouTubeChannel(BaseModel):
    id: str
    title: str
    description: str | None = None
    custom_url: str | None = None
    published_at: datetime | None = None
    thumbnails: dict[str, YouTubeThumbnail] = {}
    subscriber_count: int | None = None
    hidden_subscriber_count: bool | None = None
    video_count: int | None = None
    view_count: int | None = None
    uploads_playlist_id: str | None = None
    url: str
