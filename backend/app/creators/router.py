import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.common.dependencies import get_current_user, get_db
from app.creators import service
from app.creators.schemas import (
    CollabHistoryCreate,
    CollabHistoryOut,
    CreatorFilters,
    CreatorProfileOut,
    CreatorProfileUpdate,
    PortfolioItemCreate,
    PortfolioItemOut,
    PublicSocialEnrichmentRequest,
    RateCardCreate,
    RateCardOut,
    RateCardUpdate,
    SocialProfileCreate,
    SocialProfileOut,
    SocialProfileUpdate,
    YouTubeEnrichmentRequest,
)

router = APIRouter()


def _require_own_profile(creator_id: uuid.UUID, current_user: User) -> None:
    """Raise 403 if the current user does not own the requested profile."""
    from app.creators.models import CreatorProfile  # noqa: PLC0415 — avoid circular import at top
    # Ownership is checked by user_id match; we compare after fetching
    # (creator.user_id == current_user.id is checked in each endpoint)


# ------------------------------------------------------------------ #
# Browse + profile                                                     #
# ------------------------------------------------------------------ #

@router.get("/", response_model=List[CreatorProfileOut])
async def list_creators(
    db: Annotated[AsyncSession, Depends(get_db)],
    search: Optional[str] = Query(None),
    niche: Optional[int] = Query(None),
    platform: Optional[str] = Query(None),
    min_followers: Optional[int] = Query(None),
    max_followers: Optional[int] = Query(None),
    language: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    is_available: Optional[bool] = Query(None),
    max_rate: Optional[int] = Query(None),
    sort_by: str = Query("followers_desc"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
):
    """Browse creators with optional filters."""
    filters = CreatorFilters(
        search=search,
        niche=niche,
        platform=platform,
        min_followers=min_followers,
        max_followers=max_followers,
        language=language,
        city=city,
        is_available=is_available,
        max_rate=max_rate,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
    )
    return await service.list_creators(db, filters)


@router.get("/me", response_model=CreatorProfileOut)
async def get_my_creator_profile(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve the creator profile for the currently authenticated user."""
    creator = await service.get_creator_by_user_id(db, current_user.id)
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator profile not found for this user",
        )
    return creator


@router.get("/{creator_id}", response_model=CreatorProfileOut)
async def get_creator(
    creator_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Public creator profile."""
    creator = await service.get_creator(db, creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    return creator


@router.put("/{creator_id}", response_model=CreatorProfileOut)
async def update_creator(
    creator_id: uuid.UUID,
    data: CreatorProfileUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Update own profile (auth required)."""
    creator = await service.get_creator(db, creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    if creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.update_creator_profile(db, creator, data)


# ------------------------------------------------------------------ #
# Social profiles                                                      #
# ------------------------------------------------------------------ #

@router.post("/{creator_id}/platforms", response_model=SocialProfileOut, status_code=201)
async def add_platform(
    creator_id: uuid.UUID,
    data: SocialProfileCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.add_social_profile(db, creator_id, data)


@router.post("/{creator_id}/platforms/youtube/enrich", response_model=SocialProfileOut)
async def enrich_youtube_platform(
    creator_id: uuid.UUID,
    data: YouTubeEnrichmentRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.enrich_youtube_social_profile(
        db,
        creator_id,
        channel_ref=data.channel_ref,
        recent_video_limit=data.recent_video_limit,
    )


@router.post("/{creator_id}/platforms/instagram/enrich", response_model=SocialProfileOut)
async def enrich_instagram_platform(
    creator_id: uuid.UUID,
    data: PublicSocialEnrichmentRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.enrich_public_social_profile(
        db,
        creator_id,
        platform="instagram",
        profile_ref=data.profile_ref,
        recent_post_limit=data.recent_post_limit,
    )


@router.post("/{creator_id}/platforms/tiktok/enrich", response_model=SocialProfileOut)
async def enrich_tiktok_platform(
    creator_id: uuid.UUID,
    data: PublicSocialEnrichmentRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.enrich_public_social_profile(
        db,
        creator_id,
        platform="tiktok",
        profile_ref=data.profile_ref,
        recent_post_limit=data.recent_post_limit,
    )


@router.put("/{creator_id}/platforms/{platform_id}", response_model=SocialProfileOut)
async def update_platform(
    creator_id: uuid.UUID,
    platform_id: uuid.UUID,
    data: SocialProfileUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.update_social_profile(db, creator_id, platform_id, data)


@router.delete("/{creator_id}/platforms/{platform_id}", status_code=204)
async def delete_platform(
    creator_id: uuid.UUID,
    platform_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    await service.delete_social_profile(db, creator_id, platform_id)


# ------------------------------------------------------------------ #
# Rate cards                                                           #
# ------------------------------------------------------------------ #

@router.post("/{creator_id}/rate-cards", response_model=RateCardOut, status_code=201)
async def add_rate_card(
    creator_id: uuid.UUID,
    data: RateCardCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.add_rate_card(db, creator_id, data)


@router.put("/{creator_id}/rate-cards/{rate_card_id}", response_model=RateCardOut)
async def update_rate_card(
    creator_id: uuid.UUID,
    rate_card_id: uuid.UUID,
    data: RateCardUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.update_rate_card(db, creator_id, rate_card_id, data)


@router.delete("/{creator_id}/rate-cards/{rate_card_id}", status_code=204)
async def delete_rate_card(
    creator_id: uuid.UUID,
    rate_card_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    await service.delete_rate_card(db, creator_id, rate_card_id)


# ------------------------------------------------------------------ #
# Portfolio                                                            #
# ------------------------------------------------------------------ #

@router.post("/{creator_id}/portfolio", response_model=PortfolioItemOut, status_code=201)
async def add_portfolio_item(
    creator_id: uuid.UUID,
    data: PortfolioItemCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.add_portfolio_item(db, creator_id, data)


@router.delete("/{creator_id}/portfolio/{item_id}", status_code=204)
async def delete_portfolio_item(
    creator_id: uuid.UUID,
    item_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    await service.delete_portfolio_item(db, creator_id, item_id)


# ------------------------------------------------------------------ #
# Collaboration history                                                #
# ------------------------------------------------------------------ #

@router.post("/{creator_id}/history", response_model=CollabHistoryOut, status_code=201)
async def add_collab_history(
    creator_id: uuid.UUID,
    data: CollabHistoryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    return await service.add_collab_history(db, creator_id, data)


@router.delete("/{creator_id}/history/{history_id}", status_code=204)
async def delete_collab_history(
    creator_id: uuid.UUID,
    history_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    creator = await service.get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your profile")
    await service.delete_collab_history(db, creator_id, history_id)
