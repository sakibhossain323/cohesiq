import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.brands import service
from app.brands.schemas import BrandProfileOut, BrandProfileUpdate
from app.common.dependencies import get_current_user, get_db

router = APIRouter()


@router.get("/", response_model=List[BrandProfileOut])
async def list_brands(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(20, le=100),
    offset: int = Query(0),
):
    return await service.list_brands(db, limit=limit, offset=offset)


@router.get("/me", response_model=BrandProfileOut)
async def get_my_brand_profile(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve the brand profile for the currently authenticated user."""
    brand = await service.get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(
            status_code=404,
            detail="Brand profile not found for this user",
        )
    return brand


@router.get("/{brand_id}", response_model=BrandProfileOut)
async def get_brand(
    brand_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    brand = await service.get_brand(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.put("/{brand_id}", response_model=BrandProfileOut)
async def update_brand(
    brand_id: uuid.UUID,
    data: BrandProfileUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    brand = await service.get_brand(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if brand.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.update_brand(db, brand, data)


@router.get("/{brand_id}/campaigns")
async def get_brand_campaigns(
    brand_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Return campaigns for this brand. Delegates to campaigns service."""
    from app.campaigns.service import list_brand_campaigns  # noqa: PLC0415
    from app.campaigns.schemas import CampaignOut  # noqa: PLC0415
    return await list_brand_campaigns(db, brand_id)


@router.get("/{brand_id}/applications")
async def get_brand_applications(
    brand_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """All applications across the brand's campaigns."""
    brand = await service.get_brand(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if brand.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    from app.campaigns.service import list_brand_applications  # noqa: PLC0415
    return await list_brand_applications(db, brand_id)
