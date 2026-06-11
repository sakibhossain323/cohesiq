import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


# ------------------------------------------------------------------ #
# Campaign sub-schemas                                                 #
# ------------------------------------------------------------------ #

class KpiTargets(BaseModel):
    reach: Optional[int] = None
    engagement_rate: Optional[float] = None
    conversions: Optional[int] = None
    roi_target: Optional[float] = None
    model_config = {"from_attributes": True}


class NicheTargetRef(BaseModel):
    niche_id: int
    model_config = {"from_attributes": True}


class LanguageTargetRef(BaseModel):
    language_code: str
    is_required: bool = True
    model_config = {"from_attributes": True}


class DeliverableRequirementCreate(BaseModel):
    platform: str
    deliverable_type: Optional[str] = None
    deliverable_code: Optional[str] = None
    quantity: int = 1
    notes: Optional[str] = None


class DeliverableRequirementOut(BaseModel):
    id: uuid.UUID
    platform: str
    deliverable_type: str
    deliverable_code: Optional[str] = None
    quantity: int
    notes: Optional[str] = None
    model_config = {"from_attributes": True}


class ApplicationQuestionCreate(BaseModel):
    question_text: str
    question_type: str = "text"
    options_json: Optional[List[str]] = None
    is_required: bool = True
    sort_order: int = 0


class ApplicationQuestionOut(BaseModel):
    id: uuid.UUID
    question_text: str
    question_type: str
    options_json: Optional[List[str]] = None
    is_required: bool
    sort_order: int
    model_config = {"from_attributes": True}


class CampaignAcknowledgmentCreate(BaseModel):
    statement_text: str
    is_required: bool = True
    sort_order: int = 0


class CampaignAcknowledgmentOut(BaseModel):
    id: uuid.UUID
    statement_text: str
    is_required: bool
    sort_order: int
    model_config = {"from_attributes": True}


# ------------------------------------------------------------------ #
# Campaign schemas                                                     #
# ------------------------------------------------------------------ #

class CampaignCreate(BaseModel):
    title: str
    description: str
    objectives: Optional[str] = None
    primary_niche_id: Optional[int] = None
    brand_category: Optional[str] = None
    required_platforms: List[str] = ["youtube"]
    visibility: str = "public"
    campaign_type: Optional[str] = None
    budget_per_creator_min: Optional[int] = None
    budget_per_creator_max: int
    creator_min_followers: int = 1000
    creator_max_followers: Optional[int] = None
    target_countries: List[str] = ["BD"]
    target_cities: List[str] = []
    target_age_min: Optional[int] = None
    target_age_max: Optional[int] = None
    target_gender: Optional[str] = None
    deliverables_description: Optional[str] = None
    number_of_creators: int = 1
    application_deadline: Optional[date] = None
    content_deadline: Optional[date] = None
    kpi_targets: Optional[KpiTargets] = None
    hashtags: List[str] = []
    tracking_notes: Optional[str] = None
    # Additional targets
    niche_targets: List[int] = []              # additional niche_ids
    language_targets: List[LanguageTargetRef] = []
    deliverable_requirements: List[DeliverableRequirementCreate] = []
    application_questions: List[ApplicationQuestionCreate] = []
    acknowledgments: List[CampaignAcknowledgmentCreate] = []


class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    objectives: Optional[str] = None
    primary_niche_id: Optional[int] = None
    brand_category: Optional[str] = None
    required_platforms: Optional[List[str]] = None
    visibility: Optional[str] = None
    campaign_type: Optional[str] = None
    budget_per_creator_min: Optional[int] = None
    budget_per_creator_max: Optional[int] = None
    creator_min_followers: Optional[int] = None
    creator_max_followers: Optional[int] = None
    target_countries: Optional[List[str]] = None
    target_cities: Optional[List[str]] = None
    target_age_min: Optional[int] = None
    target_age_max: Optional[int] = None
    target_gender: Optional[str] = None
    deliverables_description: Optional[str] = None
    number_of_creators: Optional[int] = None
    application_deadline: Optional[date] = None
    content_deadline: Optional[date] = None
    kpi_targets: Optional[KpiTargets] = None
    hashtags: Optional[List[str]] = None
    tracking_notes: Optional[str] = None
    deliverable_requirements: Optional[List[DeliverableRequirementCreate]] = None
    application_questions: Optional[List[ApplicationQuestionCreate]] = None
    acknowledgments: Optional[List[CampaignAcknowledgmentCreate]] = None


class CampaignStatusUpdate(BaseModel):
    status: str  # 'active' | 'cancelled' | 'in_progress' | 'completed'


class CampaignOut(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    title: str
    description: str
    visibility: str
    objectives: Optional[str] = None
    primary_niche_id: Optional[int] = None
    brand_category: Optional[str] = None
    required_platforms: List[str]
    campaign_type: Optional[str] = None
    budget_per_creator_min: Optional[int] = None
    budget_per_creator_max: int
    creator_min_followers: int
    creator_max_followers: Optional[int] = None
    target_countries: List[str]
    target_cities: List[str]
    target_age_min: Optional[int] = None
    target_age_max: Optional[int] = None
    target_gender: Optional[str] = None
    deliverables_description: Optional[str] = None
    number_of_creators: int
    application_deadline: Optional[date] = None
    content_deadline: Optional[date] = None
    kpi_targets: Optional[KpiTargets] = None
    hashtags: List[str] = []
    tracking_notes: Optional[str] = None
    status: str
    niche_targets: List[NicheTargetRef] = []
    language_targets: List[LanguageTargetRef] = []
    deliverable_requirements: List[DeliverableRequirementOut] = []
    application_questions: List[ApplicationQuestionOut] = []
    acknowledgments: List[CampaignAcknowledgmentOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CampaignFilters(BaseModel):
    niche: Optional[int] = None
    platform: Optional[str] = None
    min_budget: Optional[int] = None
    max_budget: Optional[int] = None
    language: Optional[str] = None
    status: str = "active"
    limit: int = 20
    offset: int = 0


# ------------------------------------------------------------------ #
# Application schemas                                                  #
# ------------------------------------------------------------------ #

class ApplicationAnswerCreate(BaseModel):
    question_id: uuid.UUID
    answer_text: Optional[str] = None
    answer_options: Optional[List[str]] = None


class ApplicationCreate(BaseModel):
    proposal_text: Optional[str] = None
    proposed_rate: Optional[int] = None
    answers: List[ApplicationAnswerCreate] = []
    accepted_acknowledgment_ids: List[uuid.UUID] = []


class ApplicationInviteCreate(BaseModel):
    creator_id: uuid.UUID
    brand_notes: Optional[str] = None


class ShortlistCreate(BaseModel):
    """Brand adds a creator to a campaign's shortlist (no offer, no active campaign required)."""
    creator_id: uuid.UUID
    note: Optional[str] = None


class ApplicationRespondInvite(BaseModel):
    action: str  # accept | decline
    proposal_text: Optional[str] = None
    proposed_rate: Optional[int] = None
    answers: List[ApplicationAnswerCreate] = []
    accepted_acknowledgment_ids: List[uuid.UUID] = []


class ApplicationStatusUpdate(BaseModel):
    status: str  # shortlisted | pending_agreement | accepted | rejected | withdrawn | completed
    brand_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    agreed_rate: Optional[int] = None
    agreed_deliverables: Optional[str] = None


class ApplicationOut(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    creator_id: uuid.UUID
    initiated_by: str
    proposal_text: Optional[str] = None
    proposed_rate: Optional[int] = None
    status: str
    rejection_reason: Optional[str] = None  # shown to creator
    agreed_rate: Optional[int] = None
    agreed_deliverables: Optional[str] = None
    applied_at: datetime
    responded_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------ #
# Review schemas                                                       #
# ------------------------------------------------------------------ #

class ReviewCreate(BaseModel):
    application_id: uuid.UUID
    rating: int  # 1-5
    review_text: Optional[str] = None
    is_public: bool = True


class ReviewOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    reviewer_brand_id: Optional[uuid.UUID] = None
    reviewer_creator_id: Optional[uuid.UUID] = None
    reviewee_brand_id: Optional[uuid.UUID] = None
    reviewee_creator_id: Optional[uuid.UUID] = None
    rating: int
    review_text: Optional[str] = None
    is_public: bool
    created_at: datetime

    model_config = {"from_attributes": True}


from app.creators.schemas import CreatorProfileOut


# ------------------------------------------------------------------ #
# Contract schemas                                                     #
# ------------------------------------------------------------------ #

class OfferDeliverableItem(BaseModel):
    """A single campaign deliverable requirement assigned to this creator's contract."""
    requirement_id: uuid.UUID
    quantity: int = 1
    notes: Optional[str] = None


class ContractDeliverableOut(BaseModel):
    id: uuid.UUID
    requirement_id: uuid.UUID
    quantity: int
    notes: Optional[str] = None
    requirement: Optional[DeliverableRequirementOut] = None
    model_config = {"from_attributes": True}


class ContractCreate(BaseModel):
    contract_type: str  # content_collaboration | product_seeding | talent_engagement
    # Payment clause
    payment_structure: str = "none"       # flat_fee | non_cash | none
    payment_amount_bdt: Optional[int] = None
    payment_schedule: Optional[str] = None  # upfront | on_delivery | milestone
    # Non-cash compensation (free product, SaaS access, affiliate revenue, …)
    non_cash_compensation: Optional[str] = None
    # Product transfer clause
    has_product_transfer: bool = False
    product_disposition: Optional[str] = None  # keep | return
    # Deliverable clause
    deliverable_notes: Optional[str] = None
    deliverables: List[OfferDeliverableItem] = []
    # Exclusivity clause
    exclusivity_days: Optional[int] = None
    usage_rights_days: Optional[int] = None
    # Revision clause
    max_revision_rounds: int = 2
    # Kill fee clause
    kill_fee_percentage: Optional[int] = None


class OfferCreate(ContractCreate):
    """Sending an offer = contract terms + an opening message to the creator."""
    message: Optional[str] = None


class NegotiationCounter(BaseModel):
    """A counter-offer turn from either side."""
    message: Optional[str] = None
    proposed_rate: Optional[int] = None
    proposed_terms: Optional[dict] = None


class OfferDecision(BaseModel):
    """Accept or decline the other party's latest offer turn."""
    message: Optional[str] = None
    reason: Optional[str] = None


class NegotiationTurnOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    author_role: str
    status: str
    message: Optional[str] = None
    proposed_rate: Optional[int] = None
    proposed_terms: Optional[dict] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class ContentDraftSubmit(BaseModel):
    draft_content_url: str


class ContentPublishSubmit(BaseModel):
    live_post_url: str


class ContractOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    brand_id: uuid.UUID
    creator_id: uuid.UUID
    contract_type: str
    status: str
    payment_structure: str
    payment_amount_bdt: Optional[int] = None
    payment_schedule: Optional[str] = None
    non_cash_compensation: Optional[str] = None
    has_product_transfer: bool
    product_disposition: Optional[str] = None
    deliverable_notes: Optional[str] = None
    deliverables: List[ContractDeliverableOut] = []
    exclusivity_days: Optional[int] = None
    usage_rights_days: Optional[int] = None
    max_revision_rounds: int
    revisions_used: int
    kill_fee_percentage: Optional[int] = None
    draft_content_url: Optional[str] = None
    live_post_url: Optional[str] = None
    platform_fee_percentage: Optional[int] = None
    contracted_at: datetime
    in_production_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class LiveMetricSnapshotCreate(BaseModel):
    captured_at: Optional[datetime] = None
    platform: Optional[str] = None
    views: int = 0
    impressions: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    source: str = "manual"


class LiveMetricSnapshotOut(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    platform: Optional[str] = None
    captured_at: datetime
    views: int
    impressions: int
    likes: int
    comments: int
    shares: int
    saves: int
    engagement_rate: float
    estimated_revenue_bdt: int
    revenue_basis: Optional[str] = None
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LiveContractAnalyticsOut(BaseModel):
    contract_id: uuid.UUID
    creator_id: uuid.UUID
    live_post_url: Optional[str] = None
    status: str
    latest: Optional[LiveMetricSnapshotOut] = None
    snapshots: List[LiveMetricSnapshotOut] = []
    total_views_delta: int = 0
    total_engagement_delta: int = 0
    revenue_delta_bdt: int = 0


class CampaignLiveAnalyticsOut(BaseModel):
    campaign_id: uuid.UUID
    totals: dict
    contracts: List[LiveContractAnalyticsOut] = []
    timeline: List[dict] = []


class AIMatchScoreOut(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    creator_id: uuid.UUID
    score_niche: Optional[float] = None
    score_engagement: Optional[float] = None
    score_budget: Optional[float] = None
    score_language: Optional[float] = None
    score_platform: Optional[float] = None
    score_recency: Optional[float] = None
    score_semantic: Optional[float] = None
    score_total: Optional[float] = None
    rationale: Optional[str] = None
    generated_at: datetime
    creator: Optional[CreatorProfileOut] = None

    model_config = {"from_attributes": True}
