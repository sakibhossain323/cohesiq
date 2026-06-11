import uuid
from datetime import datetime
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Paginated(BaseModel, Generic[T]):
    items: List[T]
    total: int
    limit: int
    offset: int


class AdminStats(BaseModel):
    total_users: int
    total_creators: int
    total_brands: int
    total_admins: int
    total_campaigns: int
    active_campaigns: int
    total_applications: int
    recent_signups_7d: int
    recent_applications_7d: int


class AdminUserOut(BaseModel):
    id: uuid.UUID
    email: str
    clerk_id: Optional[str]
    role: str
    is_active: bool
    has_profile: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminCampaignOut(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    visibility: str
    brand_id: uuid.UUID
    budget_per_creator_max: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminReviewOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    rating: int
    review_text: Optional[str]
    is_public: bool
    reviewer_brand_id: Optional[uuid.UUID]
    reviewer_creator_id: Optional[uuid.UUID]
    reviewee_brand_id: Optional[uuid.UUID]
    reviewee_creator_id: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateCampaignStatusRequest(BaseModel):
    status: str


class AdminActionResponse(BaseModel):
    ok: bool


class AssistantRequest(BaseModel):
    question: str


class AssistantResponse(BaseModel):
    ok: bool
    answer: str
    tools_used: list[str] = []
    offline_reason: Optional[str] = None
