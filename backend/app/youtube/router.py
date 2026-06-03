from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.youtube import service
from app.youtube.schemas import YouTubeChannel, YouTubeSearchResponse, YouTubeVideo

router = APIRouter()


@router.get("/search", response_model=YouTubeSearchResponse)
async def search_youtube(
    q: str = Query(..., min_length=1),
    max_results: int = Query(5, ge=1, le=50),
    resource_type: Literal["video", "channel", "playlist"] = Query("video", alias="type"),
    order: Literal["date", "rating", "relevance", "title", "videoCount", "viewCount"] = "relevance",
    page_token: str | None = None,
    region_code: str | None = Query(None, min_length=2, max_length=2),
    relevance_language: str | None = None,
):
    """Search public YouTube videos, channels, or playlists using an API key."""
    return await _call_youtube(
        service.search_public(
            q=q,
            max_results=max_results,
            resource_type=resource_type,
            order=order,
            page_token=page_token,
            region_code=region_code,
            relevance_language=relevance_language,
        )
    )


@router.get("/videos/{video_id}", response_model=YouTubeVideo)
async def get_youtube_video(video_id: str):
    """Get public snippet, statistics, and content details for one YouTube video."""
    return await _call_youtube(service.get_video(video_id))


@router.get("/channels", response_model=YouTubeChannel)
async def get_youtube_channel(
    channel_id: str | None = Query(None, alias="id"),
    handle: str | None = None,
    username: str | None = None,
):
    """Get public channel snippet and statistics by id, handle, or legacy username."""
    identifiers = [channel_id, handle, username]
    if sum(bool(identifier) for identifier in identifiers) != 1:
        raise HTTPException(
            status_code=400,
            detail="Provide exactly one of id, handle, or username",
        )

    return await _call_youtube(
        service.get_channel(
            channel_id=channel_id,
            handle=handle,
            username=username,
        )
    )


async def _call_youtube(coro):
    try:
        return await coro
    except service.YouTubeConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except service.YouTubeAPIError as exc:
        status_code = exc.status_code if exc.status_code < 500 else 502
        raise HTTPException(status_code=status_code, detail=exc.detail) from exc
