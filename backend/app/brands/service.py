import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.brands.models import BrandProfile
from app.brands.schemas import BrandProfileUpdate
from app.services.matching_config import BRAND_CATEGORIES


def normalize_brand_category(category: str | None) -> str | None:
    if category is None:
        return None
    normalized = category.strip().lower().replace("-", "_").replace(" ", "_")
    if not normalized:
        return None
    if normalized not in BRAND_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid brand_category. Must be one of: "
                f"{', '.join(sorted(BRAND_CATEGORIES))}"
            ),
        )
    return normalized


async def get_brand(db: AsyncSession, brand_id: uuid.UUID) -> BrandProfile | None:
    result = await db.execute(
        select(BrandProfile).where(
            BrandProfile.id == brand_id, BrandProfile.deleted_at.is_(None)
        )
    )
    return result.scalar_one_or_none()


async def get_brand_by_user_id(db: AsyncSession, user_id: uuid.UUID) -> BrandProfile | None:
    result = await db.execute(
        select(BrandProfile).where(
            BrandProfile.user_id == user_id, BrandProfile.deleted_at.is_(None)
        )
    )
    return result.scalar_one_or_none()


async def create_brand_profile(
    db: AsyncSession, user_id: uuid.UUID, brand_name: str
) -> BrandProfile:
    """Called by auth service on brand registration."""
    brand = BrandProfile(user_id=user_id, brand_name=brand_name)
    db.add(brand)
    await db.flush()
    return brand


async def update_brand(
    db: AsyncSession, brand: BrandProfile, data: BrandProfileUpdate
) -> BrandProfile:
    for field, value in data.model_dump(exclude_none=True).items():
        if field == "brand_category":
            value = normalize_brand_category(value)
        setattr(brand, field, value)
    await db.commit()
    await db.refresh(brand)
    return brand


async def list_brands(db: AsyncSession, limit: int = 20, offset: int = 0) -> list[BrandProfile]:
    result = await db.execute(
        select(BrandProfile)
        .where(BrandProfile.deleted_at.is_(None))
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())
