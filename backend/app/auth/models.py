import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.models import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        ENUM("creator", "brand", "admin", name="user_role", create_type=False),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean, server_default="false", nullable=False
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships populated as domains are built
    creator_profile: Mapped["CreatorProfile | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "CreatorProfile", back_populates="user", uselist=False
    )
    brand_profile: Mapped["BrandProfile | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "BrandProfile", back_populates="user", uselist=False
    )
