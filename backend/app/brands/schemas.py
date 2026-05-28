import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BrandProfileOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    brand_name: str
    legal_name: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    tagline: Optional[str] = None
    website: Optional[str] = None
    facebook_page_url: Optional[str] = None
    instagram_url: Optional[str] = None
    niche_id: Optional[int] = None
    company_size: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None
    contact_name: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    is_verified: bool
    total_campaigns: int
    average_rating: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BrandProfileUpdate(BaseModel):
    brand_name: Optional[str] = None
    legal_name: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    tagline: Optional[str] = None
    website: Optional[str] = None
    facebook_page_url: Optional[str] = None
    instagram_url: Optional[str] = None
    niche_id: Optional[int] = None
    company_size: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_whatsapp: Optional[str] = None
