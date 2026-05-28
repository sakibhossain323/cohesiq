import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.campaigns.models import (
    Campaign,
    CampaignApplication,
    CampaignDeliverableRequirement,
    CampaignLanguageTarget,
    CampaignNicheTarget,
    Review,
)
from app.campaigns.schemas import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    CampaignCreate,
    CampaignFilters,
    CampaignStatusUpdate,
    CampaignUpdate,
    ReviewCreate,
)


def _campaign_options():
    return [
        selectinload(Campaign.niche_targets),
        selectinload(Campaign.language_targets),
        selectinload(Campaign.deliverable_requirements),
    ]


# ------------------------------------------------------------------ #
# Campaign CRUD                                                        #
# ------------------------------------------------------------------ #

async def get_campaign(db: AsyncSession, campaign_id: uuid.UUID) -> Campaign | None:
    result = await db.execute(
        select(Campaign)
        .where(Campaign.id == campaign_id)
        .options(*_campaign_options())
    )
    return result.scalar_one_or_none()


async def list_campaigns(db: AsyncSession, filters: CampaignFilters) -> List[Campaign]:
    query = select(Campaign).options(*_campaign_options())

    if filters.status:
        query = query.where(Campaign.status == filters.status)

    if filters.niche is not None:
        niche_subq = select(CampaignNicheTarget.campaign_id).where(
            CampaignNicheTarget.niche_id == filters.niche
        )
        query = query.where(
            (Campaign.primary_niche_id == filters.niche) | (Campaign.id.in_(niche_subq))
        )

    if filters.platform:
        # PostgreSQL array contains operator: @>
        from sqlalchemy import cast, ARRAY, String as SAString  # noqa: PLC0415
        query = query.where(
            Campaign.required_platforms.contains([filters.platform])
        )

    if filters.min_budget is not None:
        query = query.where(Campaign.budget_per_creator_max >= filters.min_budget)

    if filters.max_budget is not None:
        query = query.where(
            (Campaign.budget_per_creator_min == None) |  # noqa: E711
            (Campaign.budget_per_creator_min <= filters.max_budget)
        )

    if filters.language:
        lang_subq = select(CampaignLanguageTarget.campaign_id).where(
            CampaignLanguageTarget.language_code == filters.language
        )
        query = query.where(Campaign.id.in_(lang_subq))

    result = await db.execute(query.offset(filters.offset).limit(filters.limit))
    return list(result.scalars().all())


async def list_brand_campaigns(db: AsyncSession, brand_id: uuid.UUID) -> List[Campaign]:
    result = await db.execute(
        select(Campaign)
        .where(Campaign.brand_id == brand_id)
        .options(*_campaign_options())
    )
    return list(result.scalars().all())


async def create_campaign(
    db: AsyncSession, brand_id: uuid.UUID, data: CampaignCreate
) -> Campaign:
    campaign = Campaign(
        brand_id=brand_id,
        title=data.title,
        description=data.description,
        objectives=data.objectives,
        primary_niche_id=data.primary_niche_id,
        required_platforms=data.required_platforms,
        budget_per_creator_min=data.budget_per_creator_min,
        budget_per_creator_max=data.budget_per_creator_max,
        creator_min_followers=data.creator_min_followers,
        creator_max_followers=data.creator_max_followers,
        target_countries=data.target_countries,
        target_cities=data.target_cities,
        target_age_min=data.target_age_min,
        target_age_max=data.target_age_max,
        target_gender=data.target_gender,
        deliverables_description=data.deliverables_description,
        number_of_creators=data.number_of_creators,
        application_deadline=data.application_deadline,
        content_deadline=data.content_deadline,
    )
    db.add(campaign)
    await db.flush()

    for niche_id in data.niche_targets:
        db.add(CampaignNicheTarget(campaign_id=campaign.id, niche_id=niche_id))

    for lang in data.language_targets:
        db.add(CampaignLanguageTarget(
            campaign_id=campaign.id,
            language_code=lang.language_code,
            is_required=lang.is_required,
        ))

    for req in data.deliverable_requirements:
        db.add(CampaignDeliverableRequirement(
            campaign_id=campaign.id,
            platform=req.platform,
            deliverable_type=req.deliverable_type,
            quantity=req.quantity,
            notes=req.notes,
        ))

    await db.commit()
    await db.refresh(campaign)
    return campaign


async def update_campaign(
    db: AsyncSession, campaign: Campaign, data: CampaignUpdate
) -> Campaign:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(campaign, field, value)
    await db.commit()
    await db.refresh(campaign)
    return campaign


async def update_campaign_status(
    db: AsyncSession, campaign: Campaign, data: CampaignStatusUpdate
) -> Campaign:
    allowed = {"active", "cancelled", "in_progress", "completed"}
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {allowed}")
    campaign.status = data.status
    await db.commit()
    await db.refresh(campaign)
    return campaign


# ------------------------------------------------------------------ #
# Applications                                                         #
# ------------------------------------------------------------------ #

async def apply_to_campaign(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    creator_id: uuid.UUID,
    data: ApplicationCreate,
) -> CampaignApplication:
    # Check campaign is active
    campaign = await get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status != "active":
        raise HTTPException(status_code=400, detail="Campaign is not accepting applications")

    # Check for duplicate
    existing = await db.execute(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign_id,
            CampaignApplication.creator_id == creator_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You have already applied to this campaign")

    app = CampaignApplication(
        campaign_id=campaign_id,
        creator_id=creator_id,
        initiated_by="creator",
        proposal_text=data.proposal_text,
        proposed_rate=data.proposed_rate,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


async def list_campaign_applications(
    db: AsyncSession, campaign_id: uuid.UUID
) -> List[CampaignApplication]:
    result = await db.execute(
        select(CampaignApplication).where(CampaignApplication.campaign_id == campaign_id)
    )
    return list(result.scalars().all())


async def list_creator_applications(
    db: AsyncSession, creator_id: uuid.UUID
) -> List[CampaignApplication]:
    result = await db.execute(
        select(CampaignApplication).where(CampaignApplication.creator_id == creator_id)
    )
    return list(result.scalars().all())


async def list_brand_applications(
    db: AsyncSession, brand_id: uuid.UUID
) -> List[CampaignApplication]:
    """All applications across all campaigns owned by this brand."""
    brand_campaigns = select(Campaign.id).where(Campaign.brand_id == brand_id)
    result = await db.execute(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id.in_(brand_campaigns)
        )
    )
    return list(result.scalars().all())


async def update_application_status(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    data: ApplicationStatusUpdate,
    brand_id: uuid.UUID,
) -> CampaignApplication:
    result = await db.execute(
        select(CampaignApplication).where(
            CampaignApplication.id == application_id,
            CampaignApplication.campaign_id == campaign_id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify brand owns the campaign
    campaign = await get_campaign(db, campaign_id)
    if not campaign or campaign.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Not your campaign")

    now = datetime.now(timezone.utc)
    app.status = data.status
    if data.brand_notes is not None:
        app.brand_notes = data.brand_notes
    if data.rejection_reason is not None:
        app.rejection_reason = data.rejection_reason
    if data.agreed_rate is not None:
        app.agreed_rate = data.agreed_rate
    if data.agreed_deliverables is not None:
        app.agreed_deliverables = data.agreed_deliverables

    if data.status == "accepted":
        app.accepted_at = now
    if data.status in ("shortlisted", "accepted", "rejected"):
        app.responded_at = now
    if data.status == "completed":
        app.completed_at = now

    await db.commit()
    await db.refresh(app)
    return app


# ------------------------------------------------------------------ #
# Reviews                                                              #
# ------------------------------------------------------------------ #

async def create_review(
    db: AsyncSession, reviewer_user_id: uuid.UUID, data: ReviewCreate
) -> Review:
    if not (1 <= data.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    # Fetch the application
    result = await db.execute(
        select(CampaignApplication).where(CampaignApplication.id == data.application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != "completed":
        raise HTTPException(status_code=400, detail="Reviews can only be left after completion")

    # Resolve reviewer and reviewee identities from user role
    from app.creators.service import get_creator_by_user_id  # noqa: PLC0415
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415

    creator_profile = await get_creator_by_user_id(db, reviewer_user_id)
    brand_profile = await get_brand_by_user_id(db, reviewer_user_id)

    if creator_profile and creator_profile.id == app.creator_id:
        # Creator reviewing the brand
        # Get the brand of the campaign
        campaign_result = await db.execute(
            select(Campaign).where(Campaign.id == app.campaign_id)
        )
        campaign = campaign_result.scalar_one()
        review = Review(
            application_id=app.id,
            reviewer_creator_id=creator_profile.id,
            reviewee_brand_id=campaign.brand_id,
            rating=data.rating,
            review_text=data.review_text,
            is_public=data.is_public,
        )
    elif brand_profile:
        campaign_result = await db.execute(
            select(Campaign).where(Campaign.id == app.campaign_id)
        )
        campaign = campaign_result.scalar_one()
        if campaign.brand_id != brand_profile.id:
            raise HTTPException(status_code=403, detail="Not your campaign")
        review = Review(
            application_id=app.id,
            reviewer_brand_id=brand_profile.id,
            reviewee_creator_id=app.creator_id,
            rating=data.rating,
            review_text=data.review_text,
            is_public=data.is_public,
        )
    else:
        raise HTTPException(status_code=403, detail="Not a party to this application")

    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def list_creator_reviews(db: AsyncSession, creator_id: uuid.UUID) -> List[Review]:
    result = await db.execute(
        select(Review).where(
            Review.reviewee_creator_id == creator_id, Review.is_public == True  # noqa: E712
        )
    )
    return list(result.scalars().all())


async def list_brand_reviews(db: AsyncSession, brand_id: uuid.UUID) -> List[Review]:
    result = await db.execute(
        select(Review).where(
            Review.reviewee_brand_id == brand_id, Review.is_public == True  # noqa: E712
        )
    )
    return list(result.scalars().all())
