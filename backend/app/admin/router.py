import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import service
from app.admin.schemas import (
    AdminActionResponse,
    AdminCampaignOut,
    AdminReviewOut,
    AdminStats,
    AdminUserOut,
    Paginated,
    UpdateCampaignStatusRequest,
)
from app.auth.models import User
from app.common.dependencies import get_current_user, get_db, require_admin

router = APIRouter()


@router.get("/stats", response_model=AdminStats, dependencies=[Depends(require_admin)])
async def admin_stats(db: Annotated[AsyncSession, Depends(get_db)]):
    return await service.get_platform_stats(db)


@router.get("/users", response_model=Paginated[AdminUserOut], dependencies=[Depends(require_admin)])
async def admin_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    limit: int = 20,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
):
    offset = (page - 1) * limit
    items, total = await service.list_all_users(db, limit=limit, offset=offset, role=role, is_active=is_active, search=search)
    return Paginated(items=items, total=total, limit=limit, offset=offset)


@router.get("/campaigns", response_model=Paginated[AdminCampaignOut], dependencies=[Depends(require_admin)])
async def admin_campaigns(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    visibility: Optional[str] = None,
):
    offset = (page - 1) * limit
    items, total = await service.list_all_campaigns(db, limit=limit, offset=offset, status=status, visibility=visibility)
    return Paginated(items=items, total=total, limit=limit, offset=offset)


@router.get("/reviews", response_model=Paginated[AdminReviewOut], dependencies=[Depends(require_admin)])
async def admin_reviews(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    limit: int = 20,
):
    offset = (page - 1) * limit
    items, total = await service.list_all_reviews(db, limit=limit, offset=offset)
    return Paginated(items=items, total=total, limit=limit, offset=offset)


@router.delete("/reviews/{review_id}", response_model=AdminActionResponse, dependencies=[Depends(require_admin)])
async def admin_delete_review(
    review_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.delete_review(db, review_id)
    return {"ok": True}


@router.delete("/users/{user_id}", response_model=AdminActionResponse, dependencies=[Depends(require_admin)])
async def admin_delete_user(
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from fastapi import HTTPException
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    await service.delete_user(db, user_id)
    return {"ok": True}


@router.patch("/users/{user_id}/toggle-active", response_model=AdminUserOut, dependencies=[Depends(require_admin)])
async def admin_toggle_user_active(
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.toggle_user_active(db, user_id)


@router.patch("/campaigns/{campaign_id}/status", response_model=AdminCampaignOut, dependencies=[Depends(require_admin)])
async def admin_update_campaign_status(
    campaign_id: uuid.UUID,
    body: UpdateCampaignStatusRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.update_campaign_status(db, campaign_id, body.status)
