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
    ApplicationInviteCreate,
    ApplicationRespondInvite,
)
from app.services.matching import (
    TIER_BUDGET_RANGES,
    compute_match_score,
    get_tier,
    score_niche,
)
from app.services.semantic_match import get_gemini_embedding, semantic_similarity

SEMANTIC_SIMILARITY_THRESHOLD = 0.28
SEMANTIC_BOOST_WEIGHT = 0.12
TIER_MIN_FLOOR = 0.5
BUDGET_RATE_HARD_CAP = 1.10
BUDGET_ESTIMATE_CAP = 1.25


def _campaign_options():
    return [
        selectinload(Campaign.niche_targets),
        selectinload(Campaign.language_targets),
        selectinload(Campaign.deliverable_requirements),
    ]


def _build_campaign_text(campaign: Campaign, campaign_niche_name: str) -> str:
    parts = [
        campaign.title,
        campaign.description,
        campaign.objectives,
        campaign_niche_name,
    ]
    return " ".join([p for p in parts if p])


def _build_creator_text(
    creator_display_name: str,
    creator_bio: str | None,
    creator_tagline: str | None,
    creator_city: str | None,
    creator_primary: str,
    creator_subs: list[str],
) -> str:
    parts = [
        creator_display_name,
        creator_bio,
        creator_tagline,
        creator_city,
        creator_primary,
        " ".join(creator_subs or []),
    ]
    return " ".join([p for p in parts if p])


def _passes_budget_gate(
    campaign_budget_max: int | None,
    creator_rate: int | None,
    follower_count: int,
) -> bool:
    if not campaign_budget_max or campaign_budget_max <= 0:
        return True

    tier = get_tier(follower_count)
    tier_range = TIER_BUDGET_RANGES[tier]
    tier_min = tier_range["min"]
    tier_max = tier_range["max"]

    if campaign_budget_max < int(tier_min * TIER_MIN_FLOOR):
        return False

    if creator_rate and creator_rate > 0:
        return creator_rate <= int(campaign_budget_max * BUDGET_RATE_HARD_CAP)

    estimated_rate = (tier_min + tier_max) // 2
    return estimated_rate <= int(campaign_budget_max * BUDGET_ESTIMATE_CAP)


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
        campaign_type=data.campaign_type,
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
        kpi_targets=data.kpi_targets.model_dump() if data.kpi_targets else None,
        hashtags=data.hashtags,
        tracking_notes=data.tracking_notes,
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
    refreshed_campaign = await get_campaign(db, campaign.id)
    if not refreshed_campaign:
        return campaign
    return refreshed_campaign


async def update_campaign(
    db: AsyncSession, campaign: Campaign, data: CampaignUpdate
) -> Campaign:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(campaign, field, value)
    await db.commit()
    refreshed_campaign = await get_campaign(db, campaign.id)
    if not refreshed_campaign:
        return campaign
    return refreshed_campaign


async def update_campaign_status(
    db: AsyncSession, campaign: Campaign, data: CampaignStatusUpdate
) -> Campaign:
    allowed = {"active", "cancelled", "in_progress", "completed", "archived"}
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {allowed}")
    campaign.status = data.status
    await db.commit()
    refreshed_campaign = await get_campaign(db, campaign.id)
    if not refreshed_campaign:
        return campaign
    return refreshed_campaign


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


async def invite_creator(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    brand_id: uuid.UUID,
    data: ApplicationInviteCreate,
) -> CampaignApplication:
    campaign = await get_campaign(db, campaign_id)
    if not campaign or campaign.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Not your campaign")

    existing = await db.execute(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign_id,
            CampaignApplication.creator_id == data.creator_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Application or invite already exists")

    app = CampaignApplication(
        campaign_id=campaign_id,
        creator_id=data.creator_id,
        initiated_by="brand",
        status="invited",
        brand_notes=data.brand_notes,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


async def respond_invite(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    creator_id: uuid.UUID,
    data: ApplicationRespondInvite,
) -> CampaignApplication:
    result = await db.execute(
        select(CampaignApplication).where(
            CampaignApplication.id == application_id,
            CampaignApplication.campaign_id == campaign_id,
        )
    )
    app = result.scalar_one_or_none()
    if not app or app.creator_id != creator_id:
        raise HTTPException(status_code=404, detail="Invite not found")

    if app.status != "invited":
        raise HTTPException(status_code=400, detail="Application is not in invited state")

    if data.action == "decline":
        app.status = "declined"
    elif data.action == "accept":
        app.status = "pending"
        app.proposal_text = data.proposal_text
        app.proposed_rate = data.proposed_rate
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    app.responded_at = datetime.now(timezone.utc)
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


def generate_rationale(
    creator_name: str,
    niche_match: float,
    budget_match: float,
    engagement_match: float,
    campaign_title: str,
    creator_tier: str = "",
    semantic_similarity_score: float = 0.0,
    semantic_used: bool = False,
) -> str:
    parts = []
    if niche_match >= 1.0:
        parts.append(f"{creator_name} is an excellent niche match for {campaign_title}.")
    elif niche_match >= 0.6:
        parts.append(f"{creator_name} has secondary niche overlap with {campaign_title}.")
    else:
        parts.append(f"{creator_name}'s content niche does not align well with {campaign_title}.")

    if semantic_used and niche_match < 0.6 and semantic_similarity_score >= SEMANTIC_SIMILARITY_THRESHOLD:
        parts.append("Semantic similarity suggests content alignment despite limited niche overlap.")
    
    if budget_match >= 0.8:
        parts.append(f"Their {creator_tier} tier profile is a great fit for the campaign budget.")
    elif budget_match >= 0.4:
        parts.append(f"Budget alignment is partial — rates may require negotiation.")
    else:
        parts.append(f"Warning: Creator's typical rates or audience size may be mismatched with the campaign budget.")

    if engagement_match >= 0.7:
        parts.append("Engagement metrics are above the industry benchmark for their tier.")
    elif engagement_match > 0:
        parts.append("Engagement is within acceptable range.")
        
    return " ".join(parts)


async def run_campaign_matching(db: AsyncSession, campaign_id: uuid.UUID) -> List[AIMatchScore]:
    from app.common.models import Niche, Language
    from app.creators.models import CreatorProfile
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

    campaign_text = _build_campaign_text(campaign, campaign_niche_name)
    campaign_embedding = get_gemini_embedding(campaign_text)

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
        follower_count = follower_count or 0
        engagement_rate = float(primary_profile.engagement_rate) if (primary_profile and primary_profile.engagement_rate is not None) else None
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

        campaign_plats = campaign.required_platforms or []
        if campaign_plats and not any(p in creator_platforms for p in campaign_plats):
            continue

        min_followers = campaign.creator_min_followers or 0
        max_followers = campaign.creator_max_followers
        if follower_count < min_followers:
            continue
        if max_followers and follower_count > max_followers:
            continue

        if not _passes_budget_gate(campaign.budget_per_creator_max, creator_rate, follower_count):
            continue

        # Language profile mapping
        creator_lang_profile = {}
        for cl in creator.languages:
            creator_lang_profile[cl.language_code] = 1.0

        creator_text = _build_creator_text(
            creator_display_name=creator.display_name,
            creator_bio=creator.bio,
            creator_tagline=creator.tagline,
            creator_city=creator.city,
            creator_primary=creator_primary,
            creator_subs=creator_subs,
        )

        niche_score = score_niche(campaign_niche_name, creator_primary, creator_subs)
        semantic_score = 0.0
        semantic_used = False
        if niche_score <= 0.0 and campaign_niche_name.lower() not in ("general", "unknown", "other"):
            semantic_score = semantic_similarity(
                campaign_text,
                creator_text,
                campaign_embedding=campaign_embedding,
            )
            semantic_used = semantic_score >= SEMANTIC_SIMILARITY_THRESHOLD
            if not semantic_used:
                continue

        # Compute match score using matching engine
        from app.services.matching import get_tier  # noqa: PLC0415
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

        creator_tier = get_tier(follower_count)
        total_score = min(scores.total + (semantic_score * SEMANTIC_BOOST_WEIGHT), 1.0)

        # Generate rationale
        rational_text = generate_rationale(
            creator_name=creator.display_name,
            niche_match=scores.niche,
            budget_match=scores.budget,
            engagement_match=scores.engagement,
            campaign_title=campaign.title,
            creator_tier=creator_tier,
            semantic_similarity_score=semantic_score,
            semantic_used=semantic_used,
        )

        match_score_obj = AIMatchScore(
            campaign_id=campaign.id,
            creator_id=creator.id,
            score_niche=scores.niche,
            score_engagement=scores.engagement,
            score_budget=scores.budget,
            score_language=scores.language,
            score_platform=scores.platform,
            score_recency=scores.recency,
            score_semantic=round(semantic_score, 4),
            score_total=total_score,
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

    return await get_campaign_matches(db, campaign_id)


async def get_campaign_matches(db: AsyncSession, campaign_id: uuid.UUID) -> List[AIMatchScore]:
    from app.campaigns.models import AIMatchScore
    from app.creators.models import CreatorProfile

    result = await db.execute(
        select(AIMatchScore)
        .where(AIMatchScore.campaign_id == campaign_id)
        .order_by(AIMatchScore.score_total.desc())
        .options(
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.social_profiles),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.niches),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.languages),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.rate_cards),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.portfolio_items)
        )
    )
    return list(result.scalars().all())


# ------------------------------------------------------------------ #
# Contracts                                                            #
# ------------------------------------------------------------------ #

async def create_contract(
    db: AsyncSession,
    application_id: uuid.UUID,
    data: "ContractCreate",
    brand_id: uuid.UUID,
) -> "Contract":
    from app.campaigns.models import Contract, CONTRACT_FEE_MAP
    from app.campaigns.schemas import ContractCreate

    result = await db.execute(
        select(CampaignApplication).where(CampaignApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != "accepted":
        raise HTTPException(status_code=400, detail="Contract can only be created for accepted applications")

    existing = await db.execute(
        select(Contract).where(Contract.application_id == application_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A contract already exists for this application")

    fee = CONTRACT_FEE_MAP.get(data.contract_type, 15)
    contract = Contract(
        application_id=application_id,
        brand_id=brand_id,
        creator_id=app.creator_id,
        contract_type=data.contract_type,
        status="active",
        payment_structure=data.payment_structure,
        payment_amount_bdt=data.payment_amount_bdt,
        payment_schedule=data.payment_schedule,
        has_product_transfer=data.has_product_transfer,
        product_disposition=data.product_disposition,
        deliverable_notes=data.deliverable_notes,
        exclusivity_days=data.exclusivity_days,
        usage_rights_days=data.usage_rights_days,
        max_revision_rounds=data.max_revision_rounds,
        kill_fee_percentage=data.kill_fee_percentage,
        platform_fee_percentage=fee,
    )
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    return contract


async def get_contract_by_application(
    db: AsyncSession, application_id: uuid.UUID
) -> "Contract | None":
    from app.campaigns.models import Contract
    result = await db.execute(
        select(Contract).where(Contract.application_id == application_id)
    )
    return result.scalar_one_or_none()


async def get_contract(db: AsyncSession, contract_id: uuid.UUID) -> "Contract | None":
    from app.campaigns.models import Contract
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    return result.scalar_one_or_none()


async def list_contracts_for_brand(
    db: AsyncSession, brand_id: uuid.UUID, campaign_id: uuid.UUID | None = None
) -> list:
    from app.campaigns.models import Contract
    query = select(Contract).where(Contract.brand_id == brand_id)
    if campaign_id:
        query = query.join(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign_id
        )
    result = await db.execute(query.order_by(Contract.contracted_at.desc()))
    return list(result.scalars().all())


async def list_contracts_for_creator(db: AsyncSession, creator_id: uuid.UUID) -> list:
    from app.campaigns.models import Contract
    result = await db.execute(
        select(Contract)
        .where(Contract.creator_id == creator_id)
        .order_by(Contract.contracted_at.desc())
    )
    return list(result.scalars().all())


async def submit_content_draft(
    db: AsyncSession, contract_id: uuid.UUID, draft_url: str, creator_id: uuid.UUID
) -> "Contract":
    from app.campaigns.models import Contract
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.creator_id != creator_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    if contract.status not in ("active", "in_production"):
        raise HTTPException(status_code=400, detail=f"Cannot submit draft in '{contract.status}' state")

    contract.draft_content_url = draft_url
    contract.status = "content_submitted"
    contract.submitted_at = datetime.now(timezone.utc)
    contract.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contract)
    return contract


async def approve_content(
    db: AsyncSession, contract_id: uuid.UUID, brand_id: uuid.UUID
) -> "Contract":
    from app.campaigns.models import Contract
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    if contract.status != "content_submitted":
        raise HTTPException(status_code=400, detail="Content must be submitted before approval")

    contract.status = "content_approved"
    contract.approved_at = datetime.now(timezone.utc)
    contract.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contract)
    return contract


async def request_revision(
    db: AsyncSession, contract_id: uuid.UUID, brand_id: uuid.UUID
) -> "Contract":
    from app.campaigns.models import Contract
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    if contract.status != "content_submitted":
        raise HTTPException(status_code=400, detail="Content must be submitted to request revision")
    if contract.revisions_used >= contract.max_revision_rounds:
        raise HTTPException(
            status_code=409,
            detail=f"Revision limit reached ({contract.max_revision_rounds} rounds). You must approve or raise a dispute."
        )

    contract.revisions_used += 1
    contract.status = "in_production"
    contract.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contract)
    return contract


async def publish_content(
    db: AsyncSession, contract_id: uuid.UUID, live_url: str, creator_id: uuid.UUID
) -> "Contract":
    from app.campaigns.models import Contract
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.creator_id != creator_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    if contract.status != "content_approved":
        raise HTTPException(status_code=400, detail="Content must be approved before publishing")

    contract.live_post_url = live_url
    contract.status = "published"
    contract.published_at = datetime.now(timezone.utc)
    contract.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contract)
    return contract


async def close_contract(
    db: AsyncSession, contract_id: uuid.UUID, brand_id: uuid.UUID
) -> "Contract":
    from app.campaigns.models import Contract
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    if contract.status != "published":
        raise HTTPException(status_code=400, detail="Contract must be published before closing")

    contract.status = "closed"
    contract.closed_at = datetime.now(timezone.utc)
    contract.updated_at = datetime.now(timezone.utc)

    # Mark application completed so reviews become eligible
    result = await db.execute(
        select(CampaignApplication).where(CampaignApplication.id == contract.application_id)
    )
    app = result.scalar_one_or_none()
    if app:
        app.status = "completed"
        app.completed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(contract)
    return contract
