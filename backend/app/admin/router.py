from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import service
from app.admin.schemas import AdminCampaignOut, AdminStats, AdminUserOut
from app.common.dependencies import get_db, require_admin

router = APIRouter()


@router.get("/stats", response_model=AdminStats, dependencies=[Depends(require_admin)])
async def admin_stats(db: Annotated[AsyncSession, Depends(get_db)]):
    return await service.get_platform_stats(db)


@router.get("/users", response_model=List[AdminUserOut], dependencies=[Depends(require_admin)])
async def admin_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 100,
    offset: int = 0,
):
    return await service.list_all_users(db, limit=limit, offset=offset)


@router.get("/campaigns", response_model=List[AdminCampaignOut], dependencies=[Depends(require_admin)])
async def admin_campaigns(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 100,
    offset: int = 0,
):
    return await service.list_all_campaigns(db, limit=limit, offset=offset)
