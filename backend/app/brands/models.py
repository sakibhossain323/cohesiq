import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.models import Base

if TYPE_CHECKING:
    from app.auth.models import User
    from app.campaigns.models import Campaign


class BrandProfile(Base):
    __tablename__ = "brand_profiles"

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
    brand_name: Mapped[str] = mapped_column(String(120), nullable=False)
    legal_name: Mapped[Optional[str]] = mapped_column(String(180), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tagline: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)

    # Online presence
    website: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    facebook_page_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instagram_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Business details
    niche_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("niches.id", ondelete="SET NULL"), nullable=True
    )
    company_size: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    country_code: Mapped[str] = mapped_column(String(2), server_default="BD")
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Contact
    contact_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    contact_whatsapp: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Trust signals
    is_verified: Mapped[bool] = mapped_column(Boolean, server_default="false")
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_campaigns: Mapped[int] = mapped_column(Integer, server_default="0")
    average_rating: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="brand_profile")
    campaigns: Mapped[List["Campaign"]] = relationship("Campaign", back_populates="brand")
