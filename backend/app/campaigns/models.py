import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
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
    from app.brands.models import BrandProfile
    from app.creators.models import CreatorProfile


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    brand_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brand_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    objectives: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    primary_niche_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("niches.id", ondelete="SET NULL"), nullable=True
    )
    required_platforms: Mapped[List[str]] = mapped_column(
        ARRAY(
            ENUM(
                "youtube", "instagram", "facebook", "tiktok",
                "twitter_x", "linkedin", "snapchat", "other",
                name="platform_type",
                create_type=False,
            )
        ),
        server_default="{youtube}",
    )
    budget_per_creator_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    budget_per_creator_max: Mapped[int] = mapped_column(Integer, nullable=False)
    creator_min_followers: Mapped[int] = mapped_column(Integer, server_default="1000")
    creator_max_followers: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    target_countries: Mapped[List[str]] = mapped_column(ARRAY(String(2)), server_default="{BD}")
    target_cities: Mapped[List[str]] = mapped_column(ARRAY(Text), server_default="{}")
    target_age_min: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    target_age_max: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    target_gender: Mapped[Optional[str]] = mapped_column(
        ENUM(
            "male", "female", "non_binary", "prefer_not_to_say",
            name="gender_type",
            create_type=False,
        ),
        nullable=True,
    )
    deliverables_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    number_of_creators: Mapped[int] = mapped_column(Integer, server_default="1")
    application_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    content_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        ENUM(
            "draft", "active", "in_progress", "completed", "cancelled",
            name="campaign_status",
            create_type=False,
        ),
        server_default="draft",
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    brand: Mapped["BrandProfile"] = relationship("BrandProfile", back_populates="campaigns")
    niche_targets: Mapped[List["CampaignNicheTarget"]] = relationship(
        "CampaignNicheTarget", back_populates="campaign", cascade="all, delete-orphan"
    )
    language_targets: Mapped[List["CampaignLanguageTarget"]] = relationship(
        "CampaignLanguageTarget", back_populates="campaign", cascade="all, delete-orphan"
    )
    deliverable_requirements: Mapped[List["CampaignDeliverableRequirement"]] = relationship(
        "CampaignDeliverableRequirement", back_populates="campaign", cascade="all, delete-orphan"
    )
    applications: Mapped[List["CampaignApplication"]] = relationship(
        "CampaignApplication", back_populates="campaign", cascade="all, delete-orphan"
    )


class CampaignNicheTarget(Base):
    __tablename__ = "campaign_niche_targets"

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        primary_key=True,
    )
    niche_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("niches.id", ondelete="CASCADE"), primary_key=True
    )
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="niche_targets")


class CampaignLanguageTarget(Base):
    __tablename__ = "campaign_language_targets"

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        primary_key=True,
    )
    language_code: Mapped[str] = mapped_column(
        String(2), ForeignKey("languages.code", ondelete="CASCADE"), primary_key=True
    )
    is_required: Mapped[bool] = mapped_column(Boolean, server_default="true")
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="language_targets")


class CampaignDeliverableRequirement(Base):
    __tablename__ = "campaign_deliverable_requirements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
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
    quantity: Mapped[int] = mapped_column(SmallInteger, server_default="1")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    campaign: Mapped["Campaign"] = relationship(
        "Campaign", back_populates="deliverable_requirements"
    )


class CampaignApplication(Base):
    __tablename__ = "campaign_applications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("creator_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    initiated_by: Mapped[str] = mapped_column(String(10), nullable=False, server_default="creator")
    proposal_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    proposed_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(
        ENUM(
            "pending", "shortlisted", "accepted", "rejected",
            "withdrawn", "completed",
            name="application_status",
            create_type=False,
        ),
        server_default="pending",
        nullable=False,
    )
    brand_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    agreed_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    agreed_deliverables: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="applications")
    creator: Mapped["CreatorProfile"] = relationship("CreatorProfile", back_populates="applications")
    reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="application", cascade="all, delete-orphan"
    )


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaign_applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    reviewer_brand_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brand_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewer_creator_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("creator_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewee_brand_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brand_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewee_creator_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("creator_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    review_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    application: Mapped["CampaignApplication"] = relationship(
        "CampaignApplication", back_populates="reviews"
    )
