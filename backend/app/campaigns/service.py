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
    AIMatchScore,
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


def generate_rationale(creator_name: str, niche_match: float, budget_match: float, engagement_match: float, campaign_title: str) -> str:
    parts = []
    if niche_match >= 0.8:
        parts.append(f"{creator_name} is a perfect match for {campaign_title} due to their strong alignment in content niche.")
    else:
        parts.append(f"{creator_name} has content overlapping with the theme of {campaign_title}.")
    
    if engagement_match >= 0.7:
        parts.append("They exhibit exceptional audience engagement rates that outpace industry benchmarks.")
    else:
        parts.append("Their audience is highly receptive with steady engagement patterns.")
        
    if budget_match >= 1.0:
        parts.append("Their content delivery costs fit seamlessly within your campaign budget limits.")
    elif budget_match >= 0.5:
        parts.append("Their standard rates are negotiable and match well with your target pricing.")
    else:
        parts.append("Pricing is slightly higher but negotiable for premium quality delivery.")
        
    return " ".join(parts)


async def run_campaign_matching(db: AsyncSession, campaign_id: uuid.UUID) -> List[AIMatchScore]:
    from app.common.models import Niche, Language
    from app.creators.models import CreatorProfile
    from app.services.matching import compute_match_score
    from sqlalchemy import text

    # 1. Fetch Campaign
    campaign = await get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Clear previous matches for this campaign to avoid unique constraint conflict
    await db.execute(
        text("DELETE FROM ai_match_scores WHERE campaign_id = :campaign_id"),
        {"campaign_id": campaign_id}
    )
    await db.commit()

    # 2. Fetch all niches to map IDs
    niches_result = await db.execute(select(Niche))
    niche_map = {n.id: n.name for n in niches_result.scalars().all()}

    # Get campaign niche name
    campaign_niche_name = niche_map.get(campaign.primary_niche_id, "general")

    # Get campaign target language (default to "bn")
    target_lang = "bn"
    if campaign.language_targets:
        target_lang = campaign.language_targets[0].language_code

    # 3. Fetch all creators
    creators_result = await db.execute(
        select(CreatorProfile)
        .options(
            selectinload(CreatorProfile.niches),
            selectinload(CreatorProfile.languages),
            selectinload(CreatorProfile.social_profiles),
            selectinload(CreatorProfile.rate_cards)
        )
    )
    creators = creators_result.scalars().all()

    # Compute matches
    matches = []
    for creator in creators:
        # Determine niche names
        creator_primary = "general"
        creator_subs = []
        for cn in creator.niches:
            n_name = niche_map.get(cn.niche_id, "general")
            if cn.is_primary:
                creator_primary = n_name
            else:
                creator_subs.append(n_name)

        # Get social profiles info
        primary_profile = None
        for sp in creator.social_profiles:
            if sp.is_primary_platform:
                primary_profile = sp
                break
        if not primary_profile and creator.social_profiles:
            primary_profile = max(creator.social_profiles, key=lambda x: x.follower_count or 0)

        follower_count = primary_profile.follower_count if primary_profile else 0
        engagement_rate = float(primary_profile.engagement_rate) if (primary_profile and primary_profile.engagement_rate is not None) else 0.0
        creator_platforms = [sp.platform for sp in creator.social_profiles]

        # Determine creator rate for campaign platforms
        creator_rate = None
        campaign_plats = campaign.required_platforms or []
        for rc in creator.rate_cards:
            if rc.platform in campaign_plats:
                creator_rate = rc.price_bdt
                break
        if creator_rate is None:
            creator_rate = creator.min_budget

        # Language profile mapping
        creator_lang_profile = {}
        for cl in creator.languages:
            creator_lang_profile[cl.language_code] = 1.0

        # Compute match score using matching engine
        scores = compute_match_score(
            campaign_niche=campaign_niche_name,
            campaign_budget=campaign.budget_per_creator_max,
            campaign_platforms=campaign_plats,
            campaign_target_language=target_lang,
            creator_primary_niche=creator_primary,
            creator_sub_niches=creator_subs,
            creator_engagement_rate=engagement_rate,
            creator_follower_count=follower_count,
            creator_rate=creator_rate,
            creator_platforms=creator_platforms,
            creator_language_profile=creator_lang_profile,
            creator_days_since_post=None,
        )

        # Generate rationale
        rational_text = generate_rationale(
            creator_name=creator.display_name,
            niche_match=scores.niche,
            budget_match=scores.budget,
            engagement_match=scores.engagement,
            campaign_title=campaign.title
        )

        match_score_obj = AIMatchScore(
            campaign_id=campaign.id,
            creator_id=creator.id,
            score_niche=scores.niche,
            score_engagement=scores.engagement,
            score_budget=scores.budget,
            score_language=scores.language,
            score_total=scores.total,
            rationale=rational_text
        )
        matches.append(match_score_obj)

    # Sort matches by total score DESC and take top 10
    matches.sort(key=lambda x: x.score_total, reverse=True)
    top_matches = matches[:10]

    # Save to db
    for match in top_matches:
        db.add(match)
    await db.commit()

    # Refresh objects to load relationships
    for match in top_matches:
        await db.refresh(match, ["creator"])

    return top_matches


async def get_campaign_matches(db: AsyncSession, campaign_id: uuid.UUID) -> List[AIMatchScore]:
    from app.campaigns.models import AIMatchScore
    result = await db.execute(
        select(AIMatchScore)
        .where(AIMatchScore.campaign_id == campaign_id)
        .order_by(AIMatchScore.score_total.desc())
        .options(selectinload(AIMatchScore.creator))
    )
    return list(result.scalars().all())
