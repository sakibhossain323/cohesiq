import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    ARRAY,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.models import Base

if TYPE_CHECKING:
    from app.auth.models import User
    from app.campaigns.models import CampaignApplication
    from app.brands.models import BrandProfile


class CreatorProfile(Base):
    __tablename__ = "creator_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # Identity
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    profile_photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tagline: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)

    # Location
    country_code: Mapped[str] = mapped_column(String(2), server_default="BD")
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    timezone: Mapped[str] = mapped_column(String(60), server_default="Asia/Dhaka")

    # Demographics
    gender: Mapped[Optional[str]] = mapped_column(
        ENUM(
            "male", "female", "non_binary", "prefer_not_to_say",
            name="gender_type",
            create_type=False,
        ),
        nullable=True,
    )
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Collaboration settings
    is_available: Mapped[bool] = mapped_column(Boolean, server_default="true")
    min_budget: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_time_hours: Mapped[int] = mapped_column(Integer, server_default="48")
    preferred_collaboration_types: Mapped[List[str]] = mapped_column(
        ARRAY(
            ENUM(
                "sponsored_post", "product_review", "brand_ambassador",
                "affiliate", "gifted_product", "event_coverage", "other",
                name="collaboration_type",
                create_type=False,
            )
        ),
        server_default="{}",
    )

    # Contact
    contact_whatsapp: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Verification
    is_identity_verified: Mapped[bool] = mapped_column(Boolean, server_default="false")
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    total_collaborations: Mapped[int] = mapped_column(Integer, server_default="0")
    average_rating: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="creator_profile")
    social_profiles: Mapped[List["CreatorSocialProfile"]] = relationship(
        "CreatorSocialProfile", back_populates="creator", cascade="all, delete-orphan"
    )
    niches: Mapped[List["CreatorNiche"]] = relationship(
        "CreatorNiche", back_populates="creator", cascade="all, delete-orphan"
    )
    languages: Mapped[List["CreatorLanguage"]] = relationship(
        "CreatorLanguage", back_populates="creator", cascade="all, delete-orphan"
    )
    rate_cards: Mapped[List["CreatorRateCard"]] = relationship(
        "CreatorRateCard", back_populates="creator", cascade="all, delete-orphan"
    )
    portfolio_items: Mapped[List["CreatorPortfolioItem"]] = relationship(
        "CreatorPortfolioItem", back_populates="creator", cascade="all, delete-orphan"
    )
    collaboration_history: Mapped[List["CreatorCollaborationHistory"]] = relationship(
        "CreatorCollaborationHistory", back_populates="creator", cascade="all, delete-orphan"
    )
    applications: Mapped[List["CampaignApplication"]] = relationship(
        "CampaignApplication", back_populates="creator"
    )


class CreatorSocialProfile(Base):
    __tablename__ = "creator_social_profiles"
    __table_args__ = (
        UniqueConstraint("creator_id", "platform", name="uq_social_creator_platform"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("creator_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform: Mapped[str] = mapped_column(
        ENUM(
            "youtube", "instagram", "facebook", "tiktok",
            "twitter_x", "linkedin", "snapchat", "other",
            name="platform_type",
            create_type=False,
        ),
        nullable=False,
    )
    handle: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_url: Mapped[str] = mapped_column(Text, nullable=False)
    platform_user_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    api_channel_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    display_name_on_platform: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)

    follower_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    following_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    avg_views_per_post: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    avg_likes_per_post: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    avg_comments_per_post: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    avg_shares_per_post: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    engagement_rate: Mapped[Optional[float]] = mapped_column(Numeric(5, 4), nullable=True)

    posts_per_month: Mapped[Optional[float]] = mapped_column(Numeric(5, 1), nullable=True)
    is_primary_platform: Mapped[bool] = mapped_column(Boolean, server_default="false")
    account_created_year: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    is_monetized: Mapped[bool] = mapped_column(Boolean, server_default="false")
    has_verified_badge: Mapped[bool] = mapped_column(Boolean, server_default="false")
    is_api_verified: Mapped[bool] = mapped_column(Boolean, server_default="false")
    api_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    data_source: Mapped[str] = mapped_column(String(30), server_default="self_reported")

    audience_country_primary: Mapped[Optional[str]] = mapped_column(String(2), server_default="BD")
    audience_city_primary: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    audience_age_range_min: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    audience_age_range_max: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    audience_gender_majority: Mapped[Optional[str]] = mapped_column(
        ENUM(
            "male", "female", "non_binary", "prefer_not_to_say",
            name="gender_type",
            create_type=False,
        ),
        nullable=True,
    )
    audience_gender_pct: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    content_languages: Mapped[List[str]] = mapped_column(ARRAY(String(2)), server_default="{bn}")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stats_reported_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    stats_reported_for_period: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    creator: Mapped["CreatorProfile"] = relationship(
        "CreatorProfile", back_populates="social_profiles"
    )


class CreatorNiche(Base):
    __tablename__ = "creator_niches"

    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("creator_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    niche_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("niches.id", ondelete="CASCADE"), primary_key=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, server_default="false")

    creator: Mapped["CreatorProfile"] = relationship("CreatorProfile", back_populates="niches")


class CreatorLanguage(Base):
    __tablename__ = "creator_languages"

    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("creator_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    language_code: Mapped[str] = mapped_column(
        String(2), ForeignKey("languages.code", ondelete="CASCADE"), primary_key=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, server_default="false")

    creator: Mapped["CreatorProfile"] = relationship(
        "CreatorProfile", back_populates="languages"
    )


class CreatorRateCard(Base):
    __tablename__ = "creator_rate_cards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("creator_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform: Mapped[str] = mapped_column(
        ENUM(
            "youtube", "instagram", "facebook", "tiktok",
            "twitter_x", "linkedin", "snapchat", "other",
            name="platform_type",
            create_type=False,
        ),
        nullable=False,
    )
    deliverable_type: Mapped[str] = mapped_column(
        ENUM(
            "dedicated_video", "integrated_mention", "short_video",
            "photo_post", "story", "live_stream", "blog_post", "other",
            name="deliverable_type",
            create_type=False,
        ),
        nullable=False,
    )
    price_bdt: Mapped[int] = mapped_column(Integer, nullable=False)
    price_usd: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    includes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    excludes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    turnaround_days: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    is_negotiable: Mapped[bool] = mapped_column(Boolean, server_default="true")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    creator: Mapped["CreatorProfile"] = relationship(
        "CreatorProfile", back_populates="rate_cards"
    )


class CreatorPortfolioItem(Base):
    __tablename__ = "creator_portfolio_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("creator_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform: Mapped[str] = mapped_column(
        ENUM(
            "youtube", "instagram", "facebook", "tiktok",
            "twitter_x", "linkedin", "snapchat", "other",
            name="platform_type",
            create_type=False,
        ),
        nullable=False,
    )
    content_url: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    niche_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("niches.id", ondelete="SET NULL"), nullable=True
    )
    views: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    likes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    comments: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    published_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, server_default="false")
    sort_order: Mapped[int] = mapped_column(Integer, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    creator: Mapped["CreatorProfile"] = relationship(
        "CreatorProfile", back_populates="portfolio_items"
    )


class CreatorCollaborationHistory(Base):
    __tablename__ = "creator_collaboration_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("creator_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    brand_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brand_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    brand_name: Mapped[str] = mapped_column(String(120), nullable=False)
    brand_website: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    niche_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("niches.id", ondelete="SET NULL"), nullable=True
    )
    platform: Mapped[Optional[str]] = mapped_column(
        ENUM(
            "youtube", "instagram", "facebook", "tiktok",
            "twitter_x", "linkedin", "snapchat", "other",
            name="platform_type",
            create_type=False,
        ),
        nullable=True,
    )
    collaboration_type: Mapped[Optional[str]] = mapped_column(
        ENUM(
            "sponsored_post", "product_review", "brand_ambassador",
            "affiliate", "gifted_product", "event_coverage", "other",
            name="collaboration_type",
            create_type=False,
        ),
        nullable=True,
    )
    collaborated_on: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    deliverable_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    creator: Mapped["CreatorProfile"] = relationship(
        "CreatorProfile", back_populates="collaboration_history"
    )
    brand: Mapped[Optional["BrandProfile"]] = relationship("BrandProfile")
