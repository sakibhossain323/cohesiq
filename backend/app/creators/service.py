import uuid
from typing import List

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.creators.models import (
    CreatorCollaborationHistory,
    CreatorLanguage,
    CreatorNiche,
    CreatorPortfolioItem,
    CreatorProfile,
    CreatorRateCard,
    CreatorSocialProfile,
)
from app.creators.schemas import (
    CollabHistoryCreate,
    CreatorFilters,
    CreatorProfileUpdate,
    LanguageRef,
    NicheRef,
    PortfolioItemCreate,
    RateCardCreate,
    RateCardUpdate,
    SocialProfileCreate,
    SocialProfileUpdate,
)


# ------------------------------------------------------------------ #
# Eager-load helper                                                    #
# ------------------------------------------------------------------ #

def _with_all_relations():
    return [
        selectinload(CreatorProfile.social_profiles),
        selectinload(CreatorProfile.niches),
        selectinload(CreatorProfile.languages),
        selectinload(CreatorProfile.rate_cards),
        selectinload(CreatorProfile.portfolio_items),
    ]


# ------------------------------------------------------------------ #
# Core profile                                                         #
# ------------------------------------------------------------------ #

async def get_creator(db: AsyncSession, creator_id: uuid.UUID) -> CreatorProfile | None:
    result = await db.execute(
        select(CreatorProfile)
        .where(CreatorProfile.id == creator_id, CreatorProfile.deleted_at.is_(None))
        .options(*_with_all_relations())
    )
    return result.scalar_one_or_none()


async def get_creator_by_user_id(db: AsyncSession, user_id: uuid.UUID) -> CreatorProfile | None:
    result = await db.execute(
        select(CreatorProfile)
        .where(CreatorProfile.user_id == user_id, CreatorProfile.deleted_at.is_(None))
        .options(*_with_all_relations())
    )
    return result.scalar_one_or_none()


async def create_creator_profile(
    db: AsyncSession, user_id: uuid.UUID, display_name: str
) -> CreatorProfile:
    """Called by auth service on creator registration. Creates a minimal profile."""
    profile = CreatorProfile(user_id=user_id, display_name=display_name)
    db.add(profile)
    await db.flush()
    return profile


async def update_creator_profile(
    db: AsyncSession, creator: CreatorProfile, data: CreatorProfileUpdate
) -> CreatorProfile:
    update_data = data.model_dump(exclude={"niches", "languages"}, exclude_none=True)
    for field, value in update_data.items():
        setattr(creator, field, value)

    # Sync niches (delete-all + re-insert)
    if data.niches is not None:
        await db.execute(
            select(CreatorNiche).where(CreatorNiche.creator_id == creator.id)
        )
        for n in creator.niches:
            await db.delete(n)
        for ref in data.niches:
            db.add(CreatorNiche(creator_id=creator.id, niche_id=ref.niche_id, is_primary=ref.is_primary))

    # Sync languages
    if data.languages is not None:
        for lang in creator.languages:
            await db.delete(lang)
        for ref in data.languages:
            db.add(CreatorLanguage(creator_id=creator.id, language_code=ref.language_code, is_primary=ref.is_primary))

    await db.commit()
    await db.refresh(creator)
    return creator


async def list_creators(db: AsyncSession, filters: CreatorFilters) -> List[CreatorProfile]:
    query = (
        select(CreatorProfile)
        .where(CreatorProfile.deleted_at.is_(None))
        .options(*_with_all_relations())
    )

    if filters.is_available is not None:
        query = query.where(CreatorProfile.is_available == filters.is_available)

    if filters.city:
        query = query.where(CreatorProfile.city.ilike(f"%{filters.city}%"))

    if filters.max_rate is not None:
        rate_subq = select(CreatorRateCard.creator_id).where(
            CreatorRateCard.price_bdt <= filters.max_rate, CreatorRateCard.is_active == True
        )
        query = query.where(CreatorProfile.id.in_(rate_subq))

    if filters.niche is not None:
        niche_subq = select(CreatorNiche.creator_id).where(
            CreatorNiche.niche_id == filters.niche
        )
        query = query.where(CreatorProfile.id.in_(niche_subq))

    if filters.language:
        lang_subq = select(CreatorLanguage.creator_id).where(
            CreatorLanguage.language_code == filters.language
        )
        query = query.where(CreatorProfile.id.in_(lang_subq))

    if filters.platform or filters.min_followers or filters.max_followers:
        social_subq = select(CreatorSocialProfile.creator_id)
        if filters.platform:
            social_subq = social_subq.where(CreatorSocialProfile.platform == filters.platform)
        if filters.min_followers is not None:
            social_subq = social_subq.where(
                CreatorSocialProfile.follower_count >= filters.min_followers
            )
        if filters.max_followers is not None:
            social_subq = social_subq.where(
                CreatorSocialProfile.follower_count <= filters.max_followers
            )
        query = query.where(CreatorProfile.id.in_(social_subq))

    query = query.offset(filters.offset).limit(filters.limit)
    result = await db.execute(query)
    return list(result.scalars().all())


# ------------------------------------------------------------------ #
# Social profiles                                                      #
# ------------------------------------------------------------------ #

async def add_social_profile(
    db: AsyncSession, creator_id: uuid.UUID, data: SocialProfileCreate
) -> CreatorSocialProfile:
    sp = CreatorSocialProfile(creator_id=creator_id, **data.model_dump())
    db.add(sp)
    await db.commit()
    await db.refresh(sp)
    return sp


async def get_social_profile(
    db: AsyncSession, creator_id: uuid.UUID, platform_id: uuid.UUID
) -> CreatorSocialProfile:
    result = await db.execute(
        select(CreatorSocialProfile).where(
            CreatorSocialProfile.id == platform_id,
            CreatorSocialProfile.creator_id == creator_id,
        )
    )
    sp = result.scalar_one_or_none()
    if not sp:
        raise HTTPException(status_code=404, detail="Social profile not found")
    return sp


async def update_social_profile(
    db: AsyncSession, creator_id: uuid.UUID, platform_id: uuid.UUID, data: SocialProfileUpdate
) -> CreatorSocialProfile:
    sp = await get_social_profile(db, creator_id, platform_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(sp, field, value)
    await db.commit()
    await db.refresh(sp)
    return sp


async def delete_social_profile(
    db: AsyncSession, creator_id: uuid.UUID, platform_id: uuid.UUID
) -> None:
    sp = await get_social_profile(db, creator_id, platform_id)
    await db.delete(sp)
    await db.commit()


# ------------------------------------------------------------------ #
# Rate cards                                                           #
# ------------------------------------------------------------------ #

async def add_rate_card(
    db: AsyncSession, creator_id: uuid.UUID, data: RateCardCreate
) -> CreatorRateCard:
    rc = CreatorRateCard(creator_id=creator_id, **data.model_dump())
    db.add(rc)
    await db.commit()
    await db.refresh(rc)
    return rc


async def _get_rate_card(
    db: AsyncSession, creator_id: uuid.UUID, rate_card_id: uuid.UUID
) -> CreatorRateCard:
    result = await db.execute(
        select(CreatorRateCard).where(
            CreatorRateCard.id == rate_card_id,
            CreatorRateCard.creator_id == creator_id,
        )
    )
    rc = result.scalar_one_or_none()
    if not rc:
        raise HTTPException(status_code=404, detail="Rate card not found")
    return rc


async def update_rate_card(
    db: AsyncSession, creator_id: uuid.UUID, rate_card_id: uuid.UUID, data: RateCardUpdate
) -> CreatorRateCard:
    rc = await _get_rate_card(db, creator_id, rate_card_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rc, field, value)
    await db.commit()
    await db.refresh(rc)
    return rc


async def delete_rate_card(
    db: AsyncSession, creator_id: uuid.UUID, rate_card_id: uuid.UUID
) -> None:
    rc = await _get_rate_card(db, creator_id, rate_card_id)
    await db.delete(rc)
    await db.commit()


# ------------------------------------------------------------------ #
# Portfolio items                                                      #
# ------------------------------------------------------------------ #

async def add_portfolio_item(
    db: AsyncSession, creator_id: uuid.UUID, data: PortfolioItemCreate
) -> CreatorPortfolioItem:
    item = CreatorPortfolioItem(creator_id=creator_id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def delete_portfolio_item(
    db: AsyncSession, creator_id: uuid.UUID, item_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(CreatorPortfolioItem).where(
            CreatorPortfolioItem.id == item_id,
            CreatorPortfolioItem.creator_id == creator_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    await db.delete(item)
    await db.commit()


# ------------------------------------------------------------------ #
# Collaboration history                                                #
# ------------------------------------------------------------------ #

async def add_collab_history(
    db: AsyncSession, creator_id: uuid.UUID, data: CollabHistoryCreate
) -> CreatorCollaborationHistory:
    entry = CreatorCollaborationHistory(creator_id=creator_id, **data.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_collab_history(
    db: AsyncSession, creator_id: uuid.UUID, history_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(CreatorCollaborationHistory).where(
            CreatorCollaborationHistory.id == history_id,
            CreatorCollaborationHistory.creator_id == creator_id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    await db.delete(entry)
    await db.commit()
