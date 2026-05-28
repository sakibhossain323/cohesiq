import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


# ------------------------------------------------------------------ #
# Niche / Language sub-schemas                                         #
# ------------------------------------------------------------------ #

class NicheRef(BaseModel):
    niche_id: int
    is_primary: bool = False

    model_config = {"from_attributes": True}


class LanguageRef(BaseModel):
    language_code: str
    is_primary: bool = False

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------ #
# Social Profile schemas                                               #
# ------------------------------------------------------------------ #

class SocialProfileCreate(BaseModel):
    platform: str
    handle: str
    profile_url: str
    platform_user_id: Optional[str] = None
    display_name_on_platform: Optional[str] = None
    follower_count: Optional[int] = None
    following_count: Optional[int] = None
    avg_views_per_post: Optional[int] = None
    avg_likes_per_post: Optional[int] = None
    avg_comments_per_post: Optional[int] = None
    avg_shares_per_post: Optional[int] = None
    engagement_rate: Optional[float] = None
    posts_per_month: Optional[float] = None
    is_primary_platform: bool = False
    account_created_year: Optional[int] = None
    is_monetized: bool = False
    has_verified_badge: bool = False
    audience_country_primary: Optional[str] = None
    audience_city_primary: Optional[str] = None
    audience_age_range_min: Optional[int] = None
    audience_age_range_max: Optional[int] = None
    audience_gender_majority: Optional[str] = None
    audience_gender_pct: Optional[int] = None
    content_languages: List[str] = ["bn"]
    notes: Optional[str] = None
    stats_reported_for_period: Optional[str] = None


class SocialProfileUpdate(BaseModel):
    handle: Optional[str] = None
    profile_url: Optional[str] = None
    follower_count: Optional[int] = None
    following_count: Optional[int] = None
    avg_views_per_post: Optional[int] = None
    avg_likes_per_post: Optional[int] = None
    avg_comments_per_post: Optional[int] = None
    avg_shares_per_post: Optional[int] = None
    engagement_rate: Optional[float] = None
    posts_per_month: Optional[float] = None
    is_primary_platform: Optional[bool] = None
    is_monetized: Optional[bool] = None
    has_verified_badge: Optional[bool] = None
    audience_country_primary: Optional[str] = None
    audience_city_primary: Optional[str] = None
    audience_age_range_min: Optional[int] = None
    audience_age_range_max: Optional[int] = None
    audience_gender_majority: Optional[str] = None
    audience_gender_pct: Optional[int] = None
    content_languages: Optional[List[str]] = None
    notes: Optional[str] = None
    stats_reported_for_period: Optional[str] = None


class SocialProfileOut(BaseModel):
    id: uuid.UUID
    platform: str
    handle: str
    profile_url: str
    follower_count: Optional[int] = None
    following_count: Optional[int] = None
    avg_views_per_post: Optional[int] = None
    avg_likes_per_post: Optional[int] = None
    avg_comments_per_post: Optional[int] = None
    avg_shares_per_post: Optional[int] = None
    engagement_rate: Optional[float] = None
    posts_per_month: Optional[float] = None
    is_primary_platform: bool
    is_monetized: bool
    has_verified_badge: bool
    audience_country_primary: Optional[str] = None
    audience_city_primary: Optional[str] = None
    audience_age_range_min: Optional[int] = None
    audience_age_range_max: Optional[int] = None
    audience_gender_majority: Optional[str] = None
    audience_gender_pct: Optional[int] = None
    content_languages: List[str]
    stats_reported_at: Optional[datetime] = None
    stats_reported_for_period: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------ #
# Rate Card schemas                                                    #
# ------------------------------------------------------------------ #

class RateCardCreate(BaseModel):
    platform: str
    deliverable_type: str
    price_bdt: int
    price_usd: Optional[int] = None
    includes: Optional[str] = None
    excludes: Optional[str] = None
    turnaround_days: Optional[int] = None
    is_negotiable: bool = True


class RateCardUpdate(BaseModel):
    price_bdt: Optional[int] = None
    price_usd: Optional[int] = None
    includes: Optional[str] = None
    excludes: Optional[str] = None
    turnaround_days: Optional[int] = None
    is_negotiable: Optional[bool] = None
    is_active: Optional[bool] = None


class RateCardOut(BaseModel):
    id: uuid.UUID
    platform: str
    deliverable_type: str
    price_bdt: int
    price_usd: Optional[int] = None
    includes: Optional[str] = None
    excludes: Optional[str] = None
    turnaround_days: Optional[int] = None
    is_negotiable: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------ #
# Portfolio Item schemas                                               #
# ------------------------------------------------------------------ #

class PortfolioItemCreate(BaseModel):
    platform: str
    content_url: str
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    niche_id: Optional[int] = None
    views: Optional[int] = None
    likes: Optional[int] = None
    comments: Optional[int] = None
    published_at: Optional[date] = None
    is_featured: bool = False
    sort_order: int = 0


class PortfolioItemOut(BaseModel):
    id: uuid.UUID
    platform: str
    content_url: str
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    niche_id: Optional[int] = None
    views: Optional[int] = None
    likes: Optional[int] = None
    comments: Optional[int] = None
    published_at: Optional[date] = None
    is_featured: bool
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------ #
# Collaboration History schemas                                        #
# ------------------------------------------------------------------ #

class CollabHistoryCreate(BaseModel):
    brand_name: str
    brand_website: Optional[str] = None
    niche_id: Optional[int] = None
    platform: Optional[str] = None
    collaboration_type: Optional[str] = None
    collaborated_on: Optional[date] = None
    deliverable_description: Optional[str] = None
    content_url: Optional[str] = None


class CollabHistoryOut(BaseModel):
    id: uuid.UUID
    brand_name: str
    brand_website: Optional[str] = None
    niche_id: Optional[int] = None
    platform: Optional[str] = None
    collaboration_type: Optional[str] = None
    collaborated_on: Optional[date] = None
    deliverable_description: Optional[str] = None
    content_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------ #
# Creator Profile schemas                                              #
# ------------------------------------------------------------------ #

class CreatorProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    full_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    tagline: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None
    timezone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    is_available: Optional[bool] = None
    min_budget: Optional[int] = None
    response_time_hours: Optional[int] = None
    preferred_collaboration_types: Optional[List[str]] = None
    contact_whatsapp: Optional[str] = None
    contact_email: Optional[str] = None
    # Sync niches and languages in one update call
    niches: Optional[List[NicheRef]] = None
    languages: Optional[List[LanguageRef]] = None


class CreatorProfileOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    display_name: str
    full_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    tagline: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None
    timezone: Optional[str] = None
    gender: Optional[str] = None
    is_available: bool
    min_budget: Optional[int] = None
    response_time_hours: int
    preferred_collaboration_types: List[str]
    contact_whatsapp: Optional[str] = None
    contact_email: Optional[str] = None
    is_identity_verified: bool
    total_collaborations: int
    average_rating: Optional[float] = None
    social_profiles: List[SocialProfileOut] = []
    niches: List[NicheRef] = []
    languages: List[LanguageRef] = []
    rate_cards: List[RateCardOut] = []
    portfolio_items: List[PortfolioItemOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------ #
# Filter query params                                                  #
# ------------------------------------------------------------------ #

class CreatorFilters(BaseModel):
    niche: Optional[int] = None          # niche_id
    platform: Optional[str] = None
    min_followers: Optional[int] = None
    max_followers: Optional[int] = None
    language: Optional[str] = None       # language_code
    city: Optional[str] = None
    is_available: Optional[bool] = None
    max_rate: Optional[int] = None       # max price_bdt in rate cards
    limit: int = 20
    offset: int = 0
