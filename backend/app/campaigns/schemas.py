import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


# ------------------------------------------------------------------ #
# Campaign sub-schemas                                                 #
# ------------------------------------------------------------------ #

class NicheTargetRef(BaseModel):
    niche_id: int
    model_config = {"from_attributes": True}


class LanguageTargetRef(BaseModel):
    language_code: str
    is_required: bool = True
    model_config = {"from_attributes": True}


class DeliverableRequirementCreate(BaseModel):
    platform: str
    deliverable_type: str
    quantity: int = 1
    notes: Optional[str] = None


class DeliverableRequirementOut(BaseModel):
    id: uuid.UUID
    platform: str
    deliverable_type: str
    quantity: int
    notes: Optional[str] = None
    model_config = {"from_attributes": True}


# ------------------------------------------------------------------ #
# Campaign schemas                                                     #
# ------------------------------------------------------------------ #

class CampaignCreate(BaseModel):
    title: str
    description: str
    objectives: Optional[str] = None
    primary_niche_id: Optional[int] = None
    required_platforms: List[str] = ["youtube"]
    visibility: str = "public"
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
    # Additional targets
    niche_targets: List[int] = []              # additional niche_ids
    language_targets: List[LanguageTargetRef] = []
    deliverable_requirements: List[DeliverableRequirementCreate] = []


class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    objectives: Optional[str] = None
    primary_niche_id: Optional[int] = None
    required_platforms: Optional[List[str]] = None
    visibility: Optional[str] = None
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
    required_platforms: List[str]
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
    status: str
    niche_targets: List[NicheTargetRef] = []
    language_targets: List[LanguageTargetRef] = []
    deliverable_requirements: List[DeliverableRequirementOut] = []
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

class ApplicationCreate(BaseModel):
    proposal_text: Optional[str] = None
    proposed_rate: Optional[int] = None


class ApplicationInviteCreate(BaseModel):
    creator_id: uuid.UUID
    brand_notes: Optional[str] = None


class ApplicationRespondInvite(BaseModel):
    action: str  # accept | decline
    proposal_text: Optional[str] = None
    proposed_rate: Optional[int] = None


class ApplicationStatusUpdate(BaseModel):
    status: str  # shortlisted | accepted | rejected | withdrawn | completed
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


class AIMatchScoreOut(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    creator_id: uuid.UUID
    score_niche: Optional[float] = None
    score_engagement: Optional[float] = None
    score_budget: Optional[float] = None
    score_language: Optional[float] = None
    score_total: Optional[float] = None
    rationale: Optional[str] = None
    generated_at: datetime
    creator: Optional[CreatorProfileOut] = None

    model_config = {"from_attributes": True}
