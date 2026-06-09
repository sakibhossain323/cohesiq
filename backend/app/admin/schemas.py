import uuid
from datetime import datetime

from pydantic import BaseModel


class AdminStats(BaseModel):
    total_users: int
    total_creators: int
    total_brands: int
    total_admins: int
    total_campaigns: int
    total_applications: int


class AdminUserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool
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
