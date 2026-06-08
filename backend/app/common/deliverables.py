from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DeliverableDefinition:
    code: str
    platform: str
    legacy_type: str
    label: str


DELIVERABLE_DEFINITIONS: dict[str, DeliverableDefinition] = {
    "youtube_live": DeliverableDefinition("youtube_live", "youtube", "live_stream", "YouTube Live"),
    "youtube_short": DeliverableDefinition("youtube_short", "youtube", "short_video", "YouTube Shorts"),
    "youtube_video": DeliverableDefinition("youtube_video", "youtube", "dedicated_video", "YouTube Video"),
    "instagram_live": DeliverableDefinition("instagram_live", "instagram", "live_stream", "Instagram Live"),
    "instagram_feed": DeliverableDefinition("instagram_feed", "instagram", "photo_post", "Instagram Feed"),
    "instagram_reel": DeliverableDefinition("instagram_reel", "instagram", "short_video", "Instagram Reel"),
    "instagram_story": DeliverableDefinition("instagram_story", "instagram", "story", "Instagram Story"),
    "tiktok_live": DeliverableDefinition("tiktok_live", "tiktok", "live_stream", "TikTok Live"),
    "tiktok_story": DeliverableDefinition("tiktok_story", "tiktok", "story", "TikTok Story"),
    "tiktok_video": DeliverableDefinition("tiktok_video", "tiktok", "short_video", "TikTok Video"),
}

LEGACY_TO_CANONICAL: dict[tuple[str, str], str] = {
    ("youtube", "live_stream"): "youtube_live",
    ("youtube", "short_video"): "youtube_short",
    ("youtube", "dedicated_video"): "youtube_video",
    ("youtube", "integrated_mention"): "youtube_video",
    ("instagram", "live_stream"): "instagram_live",
    ("instagram", "photo_post"): "instagram_feed",
    ("instagram", "short_video"): "instagram_reel",
    ("instagram", "story"): "instagram_story",
    ("tiktok", "live_stream"): "tiktok_live",
    ("tiktok", "story"): "tiktok_story",
    ("tiktok", "short_video"): "tiktok_video",
}


def canonical_deliverable_code(
    *,
    platform: str | None,
    deliverable_code: str | None = None,
    legacy_type: str | None = None,
) -> str | None:
    if deliverable_code:
        return deliverable_code
    if platform and legacy_type:
        return LEGACY_TO_CANONICAL.get((platform, legacy_type))
    return None


def legacy_deliverable_type(
    *,
    deliverable_code: str | None = None,
    platform: str | None = None,
    legacy_type: str | None = None,
) -> str | None:
    if deliverable_code:
        definition = DELIVERABLE_DEFINITIONS.get(deliverable_code)
        if definition:
            return definition.legacy_type
    return legacy_type


def deliverable_platform(
    *,
    deliverable_code: str | None = None,
    platform: str | None = None,
) -> str | None:
    if deliverable_code:
        definition = DELIVERABLE_DEFINITIONS.get(deliverable_code)
        if definition:
            return definition.platform
    return platform
