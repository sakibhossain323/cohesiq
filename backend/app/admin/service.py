from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.campaigns.models import Campaign, CampaignApplication


async def _count(db: AsyncSession, stmt) -> int:
    return (await db.execute(stmt)).scalar_one()


async def get_platform_stats(db: AsyncSession) -> dict:
    return {
        "total_users": await _count(db, select(func.count()).select_from(User)),
        "total_creators": await _count(
            db, select(func.count()).select_from(User).where(User.role == "creator")
        ),
        "total_brands": await _count(
            db, select(func.count()).select_from(User).where(User.role == "brand")
        ),
        "total_admins": await _count(
            db, select(func.count()).select_from(User).where(User.role == "admin")
        ),
        "total_campaigns": await _count(db, select(func.count()).select_from(Campaign)),
        "total_applications": await _count(
            db, select(func.count()).select_from(CampaignApplication)
        ),
    }


async def list_all_users(db: AsyncSession, limit: int = 100, offset: int = 0) -> list[User]:
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all())


async def list_all_campaigns(db: AsyncSession, limit: int = 100, offset: int = 0) -> list[Campaign]:
    result = await db.execute(
        select(Campaign).order_by(Campaign.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all())
