import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.brands.models import BrandProfile
from app.campaigns.models import Campaign, CampaignApplication, Review
from app.creators.models import CreatorProfile


async def _count(db: AsyncSession, stmt) -> int:
    return (await db.execute(stmt)).scalar_one()


async def get_platform_stats(db: AsyncSession) -> dict:
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    return {
        "total_users": await _count(db, select(func.count()).select_from(User)),
        "total_creators": await _count(db, select(func.count()).select_from(User).where(User.role == "creator")),
        "total_brands": await _count(db, select(func.count()).select_from(User).where(User.role == "brand")),
        "total_admins": await _count(db, select(func.count()).select_from(User).where(User.role == "admin")),
        "total_campaigns": await _count(db, select(func.count()).select_from(Campaign)),
        "active_campaigns": await _count(db, select(func.count()).select_from(Campaign).where(Campaign.status == "active")),
        "total_applications": await _count(db, select(func.count()).select_from(CampaignApplication)),
        "recent_signups_7d": await _count(db, select(func.count()).select_from(User).where(User.created_at >= cutoff)),
        "recent_applications_7d": await _count(db, select(func.count()).select_from(CampaignApplication).where(CampaignApplication.applied_at >= cutoff)),
    }


async def list_all_users(
    db: AsyncSession,
    limit: int = 20,
    offset: int = 0,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
) -> tuple[list[dict], int]:
    stmt = select(User)
    if role:
        stmt = stmt.where(User.role == role)
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)
    if search:
        stmt = stmt.where(User.email.ilike(f"%{search}%"))
    total = await _count(db, select(func.count()).select_from(stmt.subquery()))
    result = await db.execute(stmt.order_by(User.created_at.desc()).limit(limit).offset(offset))
    users = list(result.scalars().all())

    creator_ids = {u.id for u in users if u.role == "creator"}
    brand_ids = {u.id for u in users if u.role == "brand"}

    creator_user_ids: set = set()
    brand_user_ids: set = set()
    if creator_ids:
        rows = await db.execute(select(CreatorProfile.user_id).where(CreatorProfile.user_id.in_(creator_ids)))
        creator_user_ids = {r[0] for r in rows}
    if brand_ids:
        rows = await db.execute(select(BrandProfile.user_id).where(BrandProfile.user_id.in_(brand_ids)))
        brand_user_ids = {r[0] for r in rows}

    out = []
    for u in users:
        has_profile = u.id in creator_user_ids or u.id in brand_user_ids
        d = {
            "id": u.id,
            "email": u.email,
            "clerk_id": u.clerk_id,
            "role": u.role,
            "is_active": u.is_active,
            "has_profile": has_profile,
            "created_at": u.created_at,
        }
        out.append(d)
    return out, total


async def list_all_campaigns(
    db: AsyncSession,
    limit: int = 20,
    offset: int = 0,
    status: Optional[str] = None,
    visibility: Optional[str] = None,
) -> tuple[list[Campaign], int]:
    stmt = select(Campaign)
    if status:
        stmt = stmt.where(Campaign.status == status)
    if visibility:
        stmt = stmt.where(Campaign.visibility == visibility)
    total = await _count(db, select(func.count()).select_from(stmt.subquery()))
    result = await db.execute(stmt.order_by(Campaign.created_at.desc()).limit(limit).offset(offset))
    return list(result.scalars().all()), total


async def list_all_reviews(db: AsyncSession, limit: int = 20, offset: int = 0) -> tuple[list[Review], int]:
    total = await _count(db, select(func.count()).select_from(Review))
    result = await db.execute(
        select(Review).order_by(Review.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all()), total


async def delete_review(db: AsyncSession, review_id: uuid.UUID) -> None:
    from fastapi import HTTPException
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    await db.execute(delete(Review).where(Review.id == review_id))
    await db.commit()


VALID_CAMPAIGN_STATUSES = {"draft", "active", "in_progress", "completed", "cancelled", "archived"}


async def delete_user(db: AsyncSession, user_id: uuid.UUID) -> None:
    from fastapi import HTTPException
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()


async def toggle_user_active(db: AsyncSession, user_id: uuid.UUID) -> User:
    from fastapi import HTTPException
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return user


async def update_campaign_status(db: AsyncSession, campaign_id: uuid.UUID, status: str) -> Campaign:
    from fastapi import HTTPException
    if status not in VALID_CAMPAIGN_STATUSES:
        raise HTTPException(status_code=422, detail=f"Invalid status. Must be one of: {', '.join(VALID_CAMPAIGN_STATUSES)}")
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.status = status
    await db.commit()
    await db.refresh(campaign)
    return campaign
