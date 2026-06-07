from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class SocialRecentPost(BaseModel):
    id: str | None = None
    title: str | None = None
    url: str | None = None
    published_at: datetime | None = None
    view_count: int | None = None
    like_count: int | None = None
    comment_count: int | None = None
    share_count: int | None = None
    thumbnail_url: str | None = None


class PublicSocialProfileEnrichment(BaseModel):
    platform: Literal["instagram", "tiktok"]
    platform_user_id: str | None = None
    handle: str
    profile_url: str
    display_name: str | None = None
    bio: str | None = None
    thumbnail_url: str | None = None
    follower_count: int | None = None
    following_count: int | None = None
    post_count: int | None = None
    is_verified: bool = False
    recent_posts: list[SocialRecentPost] = []
    avg_views_recent: int | None = None
    avg_likes_recent: int | None = None
    avg_comments_recent: int | None = None
    avg_shares_recent: int | None = None
    estimated_engagement_rate: float | None = None
    posts_per_month: float | None = None
    detected_content_languages: list[str] = []
