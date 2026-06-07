from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from app.config import settings
from app.social_ingestion import apify
from app.social_ingestion.schemas import (
    PublicSocialProfileEnrichment,
    SocialRecentPost,
)


class SocialIngestionConfigError(Exception):
    """Raised when social ingestion configuration is missing."""


class SocialIngestionAPIError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


async def get_instagram_enrichment(
    *,
    profile_ref: str,
    recent_post_limit: int = 12,
) -> PublicSocialProfileEnrichment:
    username = parse_instagram_ref(profile_ref)
    profile_url = f"https://www.instagram.com/{username}/"
    profile_items = await _run_apify_actor(
        actor_id=settings.resolved_apify_instagram_actor_id,
        run_input=_instagram_actor_input(
            platform="instagram",
            username=username,
            profile_url=profile_url,
            results_type="details",
            results_limit=1,
        ),
        max_items=1,
    )
    post_items = await _run_apify_actor(
        actor_id=settings.resolved_apify_instagram_actor_id,
        run_input=_instagram_actor_input(
            platform="instagram",
            username=username,
            profile_url=profile_url,
            results_type="posts",
            results_limit=recent_post_limit,
        ),
        max_items=recent_post_limit,
    )
    return build_instagram_enrichment(
        username=username,
        profile_url=profile_url,
        items=[*profile_items, *post_items],
    )


async def get_tiktok_enrichment(
    *,
    profile_ref: str,
    recent_post_limit: int = 12,
) -> PublicSocialProfileEnrichment:
    username = parse_tiktok_ref(profile_ref)
    profile_url = f"https://www.tiktok.com/@{username}"
    items = await _run_apify_actor(
        actor_id=settings.resolved_apify_tiktok_actor_id,
        run_input={
            "platform": "tiktok",
            "profiles": [profile_url],
            "profileUrls": [profile_url],
            "username": username,
            "usernames": [username],
            "resultsPerPage": recent_post_limit,
            "resultsLimit": recent_post_limit,
            "shouldDownloadVideos": False,
            "shouldDownloadCovers": False,
            "shouldDownloadSlideshowImages": False,
        },
        max_items=recent_post_limit,
    )
    return build_tiktok_enrichment(
        username=username,
        profile_url=profile_url,
        items=items,
    )


async def _run_apify_actor(
    *,
    actor_id: str,
    run_input: dict[str, Any],
    max_items: int,
) -> list[dict[str, Any]]:
    try:
        return await apify.run_actor_and_get_items(
            actor_id=actor_id,
            run_input=run_input,
            max_items=max_items,
        )
    except apify.ApifyConfigError as exc:
        raise SocialIngestionConfigError(str(exc)) from exc
    except apify.ApifyAPIError as exc:
        raise SocialIngestionAPIError(exc.status_code, exc.detail) from exc


def _instagram_actor_input(
    *,
    platform: str,
    username: str,
    profile_url: str,
    results_type: str,
    results_limit: int,
) -> dict[str, Any]:
    return {
        "platform": platform,
        "directUrls": [profile_url],
        "profileUrls": [profile_url],
        "profiles": [profile_url],
        "username": username,
        "usernames": [username],
        "resultsType": results_type,
        "resultsLimit": results_limit,
        "addParentData": True,
    }


def parse_instagram_ref(profile_ref: str) -> str:
    ref = profile_ref.strip()
    if not ref:
        raise ValueError("profile_ref is required")

    parsed = urlparse(ref if "://" in ref else f"https://{ref}")
    if parsed.netloc and "instagram.com" in parsed.netloc:
        path_parts = [part for part in parsed.path.split("/") if part]
        if not path_parts or path_parts[0] in {"p", "reel", "tv", "explore"}:
            raise ValueError("Could not parse Instagram profile reference")
        return _clean_handle(path_parts[0])

    return _clean_handle(ref)


def parse_tiktok_ref(profile_ref: str) -> str:
    ref = profile_ref.strip()
    if not ref:
        raise ValueError("profile_ref is required")

    parsed = urlparse(ref if "://" in ref else f"https://{ref}")
    if parsed.netloc and "tiktok.com" in parsed.netloc:
        path_parts = [part for part in parsed.path.split("/") if part]
        if not path_parts:
            raise ValueError("Could not parse TikTok profile reference")
        return _clean_handle(path_parts[0])

    return _clean_handle(ref)


def build_instagram_enrichment(
    *,
    username: str,
    profile_url: str,
    items: list[dict[str, Any]],
) -> PublicSocialProfileEnrichment:
    if not items:
        raise SocialIngestionAPIError(404, "Instagram profile data not found")

    profile = _best_instagram_profile_item(items, username)
    posts = _instagram_posts_from_items(items)
    follower_count = _first_int(
        profile,
        "followersCount",
        "followers",
        "ownerFollowersCount",
        "owner.followersCount",
    )

    return PublicSocialProfileEnrichment(
        platform="instagram",
        platform_user_id=_first_str(profile, "id", "ownerId", "owner.id"),
        handle=_clean_handle(
            _first_str(profile, "username", "ownerUsername", "owner.username")
            or username
        ),
        profile_url=_first_str(profile, "url", "profileUrl") or profile_url,
        display_name=_first_str(profile, "fullName", "ownerFullName", "owner.fullName"),
        bio=_first_str(profile, "biography", "bio"),
        thumbnail_url=_first_str(
            profile,
            "profilePicUrl",
            "profilePicUrlHD",
            "profilePictureUrl",
            "profilePicture",
            "profile_pic_url",
            "profile_pic_url_hd",
            "profilePic",
            "avatar",
            "avatarUrl",
            "image",
            "imageUrl",
            "ownerProfilePicUrl",
            "owner.profilePicUrl",
            "owner.profilePicUrlHD",
            "owner.profile_pic_url",
            "owner.avatar",
        ),
        follower_count=follower_count,
        following_count=_first_int(profile, "followsCount", "followingCount", "following"),
        post_count=_first_int(profile, "postsCount", "posts", "mediaCount"),
        is_verified=_first_bool(profile, "verified", "isVerified", "owner.isVerified"),
        recent_posts=posts,
        avg_views_recent=_avg([post.view_count for post in posts]),
        avg_likes_recent=_avg([post.like_count for post in posts]),
        avg_comments_recent=_avg([post.comment_count for post in posts]),
        avg_shares_recent=_avg([post.share_count for post in posts]),
        estimated_engagement_rate=_estimate_follower_engagement_rate(
            follower_count=follower_count,
            posts=posts,
        ),
        posts_per_month=_estimate_posts_per_month(posts),
        detected_content_languages=_detect_social_content_languages(
            username=username,
            display_name=_first_str(profile, "fullName", "ownerFullName"),
            bio=_first_str(profile, "biography", "bio"),
            posts=posts,
        ),
    )


def build_tiktok_enrichment(
    *,
    username: str,
    profile_url: str,
    items: list[dict[str, Any]],
) -> PublicSocialProfileEnrichment:
    if not items:
        raise SocialIngestionAPIError(404, "TikTok profile data not found")

    profile = _best_tiktok_profile_item(items, username)
    posts = [_parse_tiktok_post(item) for item in items]
    posts = [post for post in posts if post is not None]
    follower_count = _first_int(
        profile,
        "authorMeta.fans",
        "author.followerCount",
        "stats.followerCount",
        "followers",
        "followerCount",
        "fans",
    )

    return PublicSocialProfileEnrichment(
        platform="tiktok",
        platform_user_id=_first_str(profile, "authorMeta.id", "author.id", "id", "userId"),
        handle=_clean_handle(
            _first_str(profile, "authorMeta.name", "author.uniqueId", "username", "name")
            or username
        ),
        profile_url=_first_str(profile, "authorMeta.profileUrl", "webVideoUrl", "url")
        or profile_url,
        display_name=_first_str(
            profile,
            "authorMeta.nickName",
            "author.nickname",
            "nickname",
            "displayName",
        ),
        bio=_first_str(profile, "authorMeta.signature", "author.signature", "bio"),
        thumbnail_url=_first_str(
            profile,
            "authorMeta.avatar",
            "author.avatarThumb",
            "avatar",
        ),
        follower_count=follower_count,
        following_count=_first_int(
            profile,
            "authorMeta.following",
            "stats.followingCount",
            "following",
        ),
        post_count=_first_int(
            profile,
            "authorMeta.video",
            "stats.videoCount",
            "videoCount",
        ),
        is_verified=_first_bool(profile, "authorMeta.verified", "author.verified", "verified"),
        recent_posts=posts,
        avg_views_recent=_avg([post.view_count for post in posts]),
        avg_likes_recent=_avg([post.like_count for post in posts]),
        avg_comments_recent=_avg([post.comment_count for post in posts]),
        avg_shares_recent=_avg([post.share_count for post in posts]),
        estimated_engagement_rate=_estimate_follower_engagement_rate(
            follower_count=follower_count,
            posts=posts,
        ),
        posts_per_month=_estimate_posts_per_month(posts),
        detected_content_languages=_detect_social_content_languages(
            username=username,
            display_name=_first_str(profile, "authorMeta.nickName", "author.nickname"),
            bio=_first_str(profile, "authorMeta.signature", "bio"),
            posts=posts,
        ),
    )


def _parse_instagram_post(item: dict[str, Any]) -> SocialRecentPost | None:
    post_id = _first_str(item, "id", "shortCode", "code")
    title = _first_str(item, "caption", "alt", "title")
    url = _first_str(item, "url", "displayUrl")
    has_post_metrics = any(
        _get_path(item, path) is not None
        for path in (
            "videoViewCount",
            "videoPlayCount",
            "viewsCount",
            "likesCount",
            "likeCount",
            "commentsCount",
            "commentCount",
            "timestamp",
            "takenAtTimestamp",
        )
    )
    if not has_post_metrics:
        return None
    if not post_id and not url and not title:
        return None

    return SocialRecentPost(
        id=post_id,
        title=title,
        url=url,
        published_at=_first_datetime(item, "timestamp", "takenAtTimestamp", "createdAt"),
        view_count=_first_int(item, "videoViewCount", "videoPlayCount", "viewsCount"),
        like_count=_first_int(item, "likesCount", "likeCount", "likes"),
        comment_count=_first_int(item, "commentsCount", "commentCount", "comments"),
        share_count=_first_int(item, "shareCount", "sharesCount", "shares"),
        thumbnail_url=_first_str(item, "displayUrl", "thumbnailUrl", "imageUrl"),
    )


def _instagram_posts_from_items(items: list[dict[str, Any]]) -> list[SocialRecentPost]:
    posts: list[SocialRecentPost] = []
    for item in items:
        post = _parse_instagram_post(item)
        if post is not None:
            posts.append(post)

        for collection_name in ("latestPosts", "latestIgtvVideos"):
            nested_items = item.get(collection_name)
            if not isinstance(nested_items, list):
                continue
            for nested_item in nested_items:
                if not isinstance(nested_item, dict):
                    continue
                nested_post = _parse_instagram_post(nested_item)
                if nested_post is not None:
                    posts.append(nested_post)
    return posts


def _parse_tiktok_post(item: dict[str, Any]) -> SocialRecentPost | None:
    post_id = _first_str(item, "id", "video.id", "awemeId")
    title = _first_str(item, "text", "desc", "description")
    url = _first_str(item, "webVideoUrl", "url", "video.url")
    if not post_id and not url and not title:
        return None

    return SocialRecentPost(
        id=post_id,
        title=title,
        url=url,
        published_at=_first_datetime(item, "createTimeISO", "createTime", "createdAt"),
        view_count=_first_int(item, "playCount", "stats.playCount", "video.playCount"),
        like_count=_first_int(item, "diggCount", "stats.diggCount", "likeCount"),
        comment_count=_first_int(item, "commentCount", "stats.commentCount"),
        share_count=_first_int(item, "shareCount", "stats.shareCount"),
        thumbnail_url=_first_str(item, "videoMeta.coverUrl", "covers.default", "cover"),
    )


def _best_instagram_profile_item(
    items: list[dict[str, Any]],
    username: str,
) -> dict[str, Any]:
    for item in items:
        candidate = _first_str(item, "username", "ownerUsername", "owner.username")
        if candidate and _clean_handle(candidate).lower() == username.lower():
            return item
    return items[0]


def _best_tiktok_profile_item(
    items: list[dict[str, Any]],
    username: str,
) -> dict[str, Any]:
    for item in items:
        candidate = _first_str(item, "authorMeta.name", "author.uniqueId", "username", "name")
        if candidate and _clean_handle(candidate).lower() == username.lower():
            return item
    return items[0]


def _estimate_follower_engagement_rate(
    *,
    follower_count: int | None,
    posts: list[SocialRecentPost],
) -> float | None:
    if not follower_count or follower_count <= 0 or not posts:
        return None

    total_engagements = sum(
        (post.like_count or 0) + (post.comment_count or 0) + (post.share_count or 0)
        for post in posts
    )
    return round(total_engagements / (follower_count * len(posts)), 4)


def _estimate_posts_per_month(posts: list[SocialRecentPost]) -> float | None:
    published_dates = [
        post.published_at
        for post in posts
        if post.published_at is not None
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


def _detect_social_content_languages(
    *,
    username: str,
    display_name: str | None,
    bio: str | None,
    posts: list[SocialRecentPost],
) -> list[str]:
    from app.creators.normalization import _BANGLA_RE  # noqa: PLC0415

    text = " ".join(
        value
        for value in [
            username,
            display_name,
            bio,
            *[post.title for post in posts],
        ]
        if value
    )
    return ["bn"] if _BANGLA_RE.search(text) else ["en"]


def _first_str(item: dict[str, Any], *paths: str) -> str | None:
    for path in paths:
        value = _get_path(item, path)
        if value is not None and str(value).strip():
            return str(value).strip()
    return None


def _first_int(item: dict[str, Any], *paths: str) -> int | None:
    for path in paths:
        value = _get_path(item, path)
        if value is None:
            continue
        try:
            return int(value)
        except (TypeError, ValueError):
            continue
    return None


def _first_bool(item: dict[str, Any], *paths: str) -> bool:
    for path in paths:
        value = _get_path(item, path)
        if isinstance(value, bool):
            return value
        if isinstance(value, str) and value.lower() in {"true", "false"}:
            return value.lower() == "true"
    return False


def _first_datetime(item: dict[str, Any], *paths: str):
    for path in paths:
        value = _get_path(item, path)
        parsed = _to_datetime(value)
        if parsed is not None:
            return parsed
    return None


def _to_datetime(value: Any):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(value, tz=timezone.utc)
        except (OverflowError, OSError, ValueError):
            return None
    if isinstance(value, str) and value:
        normalized = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None
    return None


def _get_path(item: dict[str, Any], path: str) -> Any:
    current: Any = item
    for part in path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _avg(values: list[int | None]) -> int | None:
    real_values = [value for value in values if value is not None]
    if not real_values:
        return None
    return round(sum(real_values) / len(real_values))


def _clean_handle(handle: str) -> str:
    return handle.strip().removeprefix("@").strip("/")
