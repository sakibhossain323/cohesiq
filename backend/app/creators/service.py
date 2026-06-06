import uuid
from datetime import datetime, timezone
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
from app.common.models import Niche
from app.creators.normalization import (
    detect_content_languages,
    map_youtube_topic_categories,
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
from app.youtube import service as youtube_service
from app.youtube.schemas import YouTubeChannelEnrichment


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


def build_youtube_social_profile_values(
    enrichment: YouTubeChannelEnrichment,
    *,
    reported_at: datetime,
) -> dict:
    handle = enrichment.handle or enrichment.title or enrichment.platform_user_id
    return {
        "platform": "youtube",
        "handle": handle,
        "profile_url": enrichment.profile_url,
        "platform_user_id": enrichment.platform_user_id,
        "api_channel_id": enrichment.platform_user_id,
        "display_name_on_platform": enrichment.title,
        "follower_count": enrichment.subscriber_count,
        "avg_views_per_post": enrichment.avg_views_recent,
        "avg_likes_per_post": enrichment.avg_likes_recent,
        "avg_comments_per_post": enrichment.avg_comments_recent,
        "engagement_rate": enrichment.estimated_engagement_rate,
        "posts_per_month": enrichment.uploads_per_month,
        "is_api_verified": True,
        "api_verified_at": reported_at,
        "data_source": "verified",
        "content_languages": enrichment.detected_content_languages
        or detect_content_languages(enrichment),
        "stats_reported_at": reported_at,
        "stats_reported_for_period": f"recent {len(enrichment.recent_videos)} uploads",
    }


def apply_youtube_enrichment_to_social_profile(
    social_profile: CreatorSocialProfile,
    enrichment: YouTubeChannelEnrichment,
    *,
    reported_at: datetime,
) -> CreatorSocialProfile:
    for field, value in build_youtube_social_profile_values(
        enrichment,
        reported_at=reported_at,
    ).items():
        setattr(social_profile, field, value)
    return social_profile


async def enrich_youtube_social_profile(
    db: AsyncSession,
    creator_id: uuid.UUID,
    *,
    channel_ref: str,
    recent_video_limit: int,
) -> CreatorSocialProfile:
    try:
        enrichment = await youtube_service.get_channel_enrichment(
            channel_ref=channel_ref,
            recent_video_limit=recent_video_limit,
        )
    except youtube_service.YouTubeConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except youtube_service.YouTubeAPIError as exc:
        status_code = exc.status_code if exc.status_code < 500 else 502
        raise HTTPException(status_code=status_code, detail=exc.detail) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    result = await db.execute(
        select(CreatorSocialProfile).where(
            CreatorSocialProfile.creator_id == creator_id,
            CreatorSocialProfile.platform == "youtube",
        )
    )
    social_profile = result.scalar_one_or_none()
    if not social_profile:
        social_profile = CreatorSocialProfile(creator_id=creator_id, platform="youtube")
        db.add(social_profile)

    apply_youtube_enrichment_to_social_profile(
        social_profile,
        enrichment,
        reported_at=datetime.now(timezone.utc),
    )
    await sync_youtube_ingestion_normalization(
        db,
        creator_id=creator_id,
        enrichment=enrichment,
    )
    await db.commit()
    await db.refresh(social_profile)
    return social_profile


async def sync_youtube_ingestion_normalization(
    db: AsyncSession,
    *,
    creator_id: uuid.UUID,
    enrichment: YouTubeChannelEnrichment,
) -> None:
    languages = enrichment.detected_content_languages or detect_content_languages(enrichment)
    for language_code in languages:
        result = await db.execute(
            select(CreatorLanguage).where(
                CreatorLanguage.creator_id == creator_id,
                CreatorLanguage.language_code == language_code,
            )
        )
        creator_language = result.scalar_one_or_none()
        if creator_language:
            creator_language.is_primary = language_code == languages[0]
        else:
            db.add(
                CreatorLanguage(
                    creator_id=creator_id,
                    language_code=language_code,
                    is_primary=language_code == languages[0],
                )
            )

    niche_names = map_youtube_topic_categories(enrichment.topic_categories)
    if not niche_names:
        return

    result = await db.execute(select(Niche).where(Niche.name.in_(niche_names)))
    niche_by_name = {niche.name: niche for niche in result.scalars().all()}
    for index, niche_name in enumerate(niche_names):
        niche = niche_by_name.get(niche_name)
        if niche:
            existing_result = await db.execute(
                select(CreatorNiche).where(
                    CreatorNiche.creator_id == creator_id,
                    CreatorNiche.niche_id == niche.id,
                )
            )
            creator_niche = existing_result.scalar_one_or_none()
            if creator_niche:
                creator_niche.is_primary = index == 0
            else:
                db.add(
                    CreatorNiche(
                        creator_id=creator_id,
                        niche_id=niche.id,
                        is_primary=index == 0,
                    )
                )


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
