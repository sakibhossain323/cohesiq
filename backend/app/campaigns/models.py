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
    Float,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, ENUM, JSONB
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
    brand_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
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
    visibility: Mapped[str] = mapped_column(
        ENUM(
            "public", "private",
            name="campaign_visibility",
            create_type=False,
        ),
        server_default="public",
        nullable=False,
    )
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
    campaign_type: Mapped[Optional[str]] = mapped_column(
        ENUM(
            "paid_content", "product_gifting", "affiliate",
            "brand_ambassador", "talent_booking", "ugc_only",
            name="campaign_type",
            create_type=False,
        ),
        nullable=True,
        server_default="paid_content",
    )
    kpi_targets: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    hashtags: Mapped[List[str]] = mapped_column(ARRAY(Text), server_default="{}")
    tracking_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deliverables_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    number_of_creators: Mapped[int] = mapped_column(Integer, server_default="1")
    application_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    content_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        ENUM(
            "draft", "active", "in_progress", "completed", "cancelled", "archived",
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
    application_questions: Mapped[List["CampaignApplicationQuestion"]] = relationship(
        "CampaignApplicationQuestion", back_populates="campaign", cascade="all, delete-orphan"
    )
    acknowledgments: Mapped[List["CampaignAcknowledgment"]] = relationship(
        "CampaignAcknowledgment", back_populates="campaign", cascade="all, delete-orphan"
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
    deliverable_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    quantity: Mapped[int] = mapped_column(SmallInteger, server_default="1")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    campaign: Mapped["Campaign"] = relationship(
        "Campaign", back_populates="deliverable_requirements"
    )


class CampaignApplicationQuestion(Base):
    __tablename__ = "campaign_application_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(20), nullable=False, server_default="text")
    options_json: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, server_default="true")
    sort_order: Mapped[int] = mapped_column(SmallInteger, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="application_questions")
    answers: Mapped[List["CampaignApplicationAnswer"]] = relationship(
        "CampaignApplicationAnswer", back_populates="question", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("question_type IN ('text', 'single_choice', 'multi_choice')", name="ck_campaign_question_type"),
    )


class CampaignAcknowledgment(Base):
    __tablename__ = "campaign_acknowledgments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
    )
    statement_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, server_default="true")
    sort_order: Mapped[int] = mapped_column(SmallInteger, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="acknowledgments")
    accepted_applications: Mapped[List["CampaignApplicationAcknowledgment"]] = relationship(
        "CampaignApplicationAcknowledgment", back_populates="acknowledgment", cascade="all, delete-orphan"
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
            "invited", "pending", "shortlisted", "accepted", "rejected",
            "pending_agreement", "declined", "withdrawn", "completed",
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
    contract: Mapped[Optional["Contract"]] = relationship(
        "Contract", back_populates="application", uselist=False
    )
    answers: Mapped[List["CampaignApplicationAnswer"]] = relationship(
        "CampaignApplicationAnswer", back_populates="application", cascade="all, delete-orphan"
    )
    acknowledgments: Mapped[List["CampaignApplicationAcknowledgment"]] = relationship(
        "CampaignApplicationAcknowledgment", back_populates="application", cascade="all, delete-orphan"
    )


class CampaignApplicationAnswer(Base):
    __tablename__ = "campaign_application_answers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaign_applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaign_application_questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    answer_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    answer_options_json: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    application: Mapped["CampaignApplication"] = relationship("CampaignApplication", back_populates="answers")
    question: Mapped["CampaignApplicationQuestion"] = relationship("CampaignApplicationQuestion", back_populates="answers")

    __table_args__ = (
        UniqueConstraint("application_id", "question_id", name="uq_application_answer_question"),
    )


class CampaignApplicationAcknowledgment(Base):
    __tablename__ = "campaign_application_acknowledgments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaign_applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    acknowledgment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaign_acknowledgments.id", ondelete="CASCADE"),
        nullable=False,
    )
    accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    application: Mapped["CampaignApplication"] = relationship("CampaignApplication", back_populates="acknowledgments")
    acknowledgment: Mapped["CampaignAcknowledgment"] = relationship("CampaignAcknowledgment", back_populates="accepted_applications")

    __table_args__ = (
        UniqueConstraint("application_id", "acknowledgment_id", name="uq_application_acknowledgment"),
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


# Fee locked at contract creation — do not recalculate after active.
CONTRACT_FEE_MAP = {
    "content_collaboration": 15,
    "product_seeding": 10,
    "talent_engagement": 18,
}


class Contract(Base):
    """
    Bilateral agreement created when a brand accepts a creator's application.
    Owns engagement type, all clause data, and the full execution state machine.

    REPLACES: campaigns.campaign_type (deprecated — see docs/srs-revisions.md §8)
    """
    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaign_applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    brand_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brand_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("creator_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    contract_type: Mapped[str] = mapped_column(
        ENUM("content_collaboration", "product_seeding", "talent_engagement",
             name="contract_type", create_type=False),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        ENUM("drafted", "active", "in_production", "content_submitted",
             "content_approved", "published", "closed", "disputed",
             name="contract_status", create_type=False),
        nullable=False,
        server_default="active",
    )
    # Payment clause
    payment_structure: Mapped[str] = mapped_column(String(20), nullable=False, server_default="none")
    payment_amount_bdt: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    payment_schedule: Mapped[Optional[str]] = mapped_column(
        ENUM("upfront", "on_delivery", "milestone", name="payment_schedule_type", create_type=False),
        nullable=True,
    )
    # Product transfer clause
    has_product_transfer: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    product_disposition: Mapped[Optional[str]] = mapped_column(
        ENUM("keep", "return", name="product_disposition_type", create_type=False),
        nullable=True,
    )
    # Deliverable clause
    deliverable_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Exclusivity clause
    exclusivity_days: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    usage_rights_days: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    # Revision clause
    max_revision_rounds: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="2")
    revisions_used: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="0")
    # Kill fee clause
    kill_fee_percentage: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    # Content submission
    draft_content_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    live_post_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Platform fee locked at creation
    platform_fee_percentage: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    # Audit trail
    contracted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    in_production_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    application: Mapped["CampaignApplication"] = relationship(
        "CampaignApplication", back_populates="contract"
    )
    metric_snapshots: Mapped[List["LiveContentMetricSnapshot"]] = relationship(
        "LiveContentMetricSnapshot", back_populates="contract", cascade="all, delete-orphan"
    )


class LiveContentMetricSnapshot(Base):
    __tablename__ = "live_content_metric_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    views: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    impressions: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    likes: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    comments: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    shares: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    saves: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    engagement_rate: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    estimated_revenue_bdt: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    revenue_basis: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    source: Mapped[str] = mapped_column(String(30), nullable=False, server_default="manual")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    contract: Mapped["Contract"] = relationship("Contract", back_populates="metric_snapshots")

    __table_args__ = (
        CheckConstraint("views >= 0", name="ck_live_metric_views_nonnegative"),
        CheckConstraint("impressions >= 0", name="ck_live_metric_impressions_nonnegative"),
        CheckConstraint("likes >= 0", name="ck_live_metric_likes_nonnegative"),
        CheckConstraint("comments >= 0", name="ck_live_metric_comments_nonnegative"),
        CheckConstraint("shares >= 0", name="ck_live_metric_shares_nonnegative"),
        CheckConstraint("saves >= 0", name="ck_live_metric_saves_nonnegative"),
        Index("idx_live_metric_snapshots_contract_time", "contract_id", "captured_at"),
    )


class AIMatchScore(Base):
    __tablename__ = "ai_match_scores"

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
    score_niche: Mapped[Optional[float]] = mapped_column(nullable=True)
    score_engagement: Mapped[Optional[float]] = mapped_column(nullable=True)
    score_budget: Mapped[Optional[float]] = mapped_column(nullable=True)
    score_language: Mapped[Optional[float]] = mapped_column(nullable=True)
    score_platform: Mapped[Optional[float]] = mapped_column(nullable=True)
    score_recency: Mapped[Optional[float]] = mapped_column(nullable=True)
    score_semantic: Mapped[Optional[float]] = mapped_column(nullable=True)
    score_total: Mapped[Optional[float]] = mapped_column(nullable=True)
    rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("campaign_id", "creator_id", name="uq_campaign_creator_match"),
    )

    campaign: Mapped["Campaign"] = relationship("Campaign")
    creator: Mapped["CreatorProfile"] = relationship("CreatorProfile")
