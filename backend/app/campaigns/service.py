import uuid
import logging
import re
from datetime import date, datetime, timedelta, timezone
from typing import List
from urllib.parse import parse_qs, urlparse

from fastapi import HTTPException, status
from groq import AsyncGroq
from sqlalchemy import and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.brands.models import BrandProfile
from app.brands.service import normalize_brand_category
from app.creators.models import CreatorPortfolioItem, CreatorSocialProfile
from app.common.deliverables import (
    canonical_deliverable_code,
    deliverable_platform,
    legacy_deliverable_type,
)
from app.campaigns.models import (
    Campaign,
    CampaignAcknowledgment,
    CampaignApplication,
    CampaignApplicationAcknowledgment,
    CampaignApplicationAnswer,
    CampaignApplicationQuestion,
    CampaignDeliverableRequirement,
    CampaignLanguageTarget,
    CampaignNicheTarget,
    Contract,
    ContractDeliverable,
    NegotiationTurn,
    Review,
    AIMatchScore,
    LiveContentMetricSnapshot,
    CONTRACT_FEE_MAP,
)
from app.campaigns.schemas import (
    ApplicationCreate,
    ApplicationAnswerCreate,
    ApplicationStatusUpdate,
    CampaignCreate,
    CampaignFilters,
    CampaignStatusUpdate,
    CampaignUpdate,
    ReviewCreate,
    ApplicationInviteCreate,
    ApplicationRespondInvite,
    ShortlistCreate,
    OfferCreate,
    NegotiationCounter,
    OfferDecision,
    LiveMetricSnapshotCreate,
)
from app.services.matching import (
    TIER_BUDGET_RANGES,
    compute_match_score,
    get_tier,
    score_niche,
)
from app.services.matching_config import (
    CONFLICT_LOOKBACK_DAYS,
    BUDGET_RATE_HARD_CAP,
    SEMANTIC_RESCUE_NICHE_CAP,
    SEMANTIC_SIMILARITY_THRESHOLD,
    TIER_MIN_FLOOR,
    LLM_RATIONALE_TOP_N,
    TOP_MATCH_LIMIT,
)
from app.services.semantic_match import get_gemini_embedding, semantic_similarity
from app.youtube import service as youtube_service

logger = logging.getLogger(__name__)
GROQ_RATIONALE_MODEL = "llama-3.1-8b-instant"


def _campaign_options():
    return [
        selectinload(Campaign.niche_targets),
        selectinload(Campaign.language_targets),
        selectinload(Campaign.deliverable_requirements),
        selectinload(Campaign.application_questions),
        selectinload(Campaign.acknowledgments),
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
    return estimated_rate <= int(campaign_budget_max * BUDGET_RATE_HARD_CAP)


def _matching_rate_for_campaign(campaign: Campaign, creator) -> int | None:
    active_rate_cards = [
        rate_card
        for rate_card in creator.rate_cards
        if getattr(rate_card, "is_active", True) and (rate_card.price_bdt or 0) > 0
    ]
    if not active_rate_cards:
        return creator.min_budget

    if campaign.deliverable_requirements:
        total_price = 0
        matched_all_requirements = True
        for requirement in campaign.deliverable_requirements:
            exact_matches = [
                rate_card
                for rate_card in active_rate_cards
                if rate_card.platform == requirement.platform
                and (
                    (
                        requirement.deliverable_code
                        and rate_card.deliverable_code == requirement.deliverable_code
                    )
                    or rate_card.deliverable_type == requirement.deliverable_type
                )
            ]
            fallback_matches = [
                rate_card
                for rate_card in active_rate_cards
                if rate_card.platform == requirement.platform
            ]
            selected_matches = exact_matches or fallback_matches
            if not selected_matches:
                matched_all_requirements = False
                break
            unit_price = min(rate_card.price_bdt for rate_card in selected_matches)
            total_price += unit_price * max(requirement.quantity or 1, 1)

        if matched_all_requirements:
            return total_price

    required_platforms = set(campaign.required_platforms or [])
    platform_cards = [
        rate_card
        for rate_card in active_rate_cards
        if not required_platforms or rate_card.platform in required_platforms
    ]
    if platform_cards:
        return min(rate_card.price_bdt for rate_card in platform_cards)

    return creator.min_budget


def _select_matching_social_profile(social_profiles, required_platforms: list[str]):
    if not social_profiles:
        return None

    required = set(required_platforms or [])

    def sort_key(profile):
        platform_matches = 1 if required and profile.platform in required else 0
        verified_source = 1 if (profile.data_source or "") == "verified" else 0
        primary_platform = 1 if profile.is_primary_platform else 0
        followers = profile.follower_count or 0
        return (platform_matches, verified_source, primary_platform, followers)

    return max(social_profiles, key=sort_key)


def _days_since_latest_portfolio_item(portfolio_items, required_platforms: list[str]) -> int | None:
    today = date.today()
    required = set(required_platforms or [])
    dated_items = [
        item
        for item in portfolio_items
        if item.published_at is not None and (not required or item.platform in required)
    ]
    if not dated_items and required:
        dated_items = [item for item in portfolio_items if item.published_at is not None]
    if not dated_items:
        return None

    latest = max(item.published_at for item in dated_items)
    return max((today - latest).days, 0)


async def _has_recent_competitor_conflict(
    db: AsyncSession,
    *,
    creator_id: uuid.UUID,
    campaign_brand_id: uuid.UUID,
    brand_category: str | None,
) -> bool:
    # Missing data is not a confirmed conflict. If the current campaign has no
    # product category, skip the gate rather than excluding creators by guesswork.
    if not brand_category:
        return False

    from app.creators.models import CreatorCollaborationHistory  # noqa: PLC0415

    cutoff = date.today() - timedelta(days=CONFLICT_LOOKBACK_DAYS)

    unregistered_result = await db.execute(
        select(
            CreatorCollaborationHistory.brand_name,
            CreatorCollaborationHistory.collaborated_on,
        )
        .where(
            CreatorCollaborationHistory.creator_id == creator_id,
            CreatorCollaborationHistory.brand_id.is_(None),
            CreatorCollaborationHistory.collaborated_on.is_not(None),
            CreatorCollaborationHistory.collaborated_on >= cutoff,
        )
    )
    for brand_name, collaborated_on in unregistered_result.all():
        logger.warning(
            "Skipping conflict check for creator %s with unregistered past brand %r from %s: no brand_category available",
            creator_id,
            brand_name,
            collaborated_on,
        )

    # Only registered past brands with a matching brand_category can create a
    # hard conflict. Unregistered/missing-category rows pass through.
    result = await db.execute(
        select(
            CreatorCollaborationHistory.brand_name,
            CreatorCollaborationHistory.collaborated_on,
            BrandProfile.brand_name,
        )
        .join(BrandProfile, BrandProfile.id == CreatorCollaborationHistory.brand_id)
        .where(
            CreatorCollaborationHistory.creator_id == creator_id,
            CreatorCollaborationHistory.brand_id != campaign_brand_id,
            CreatorCollaborationHistory.collaborated_on.is_not(None),
            CreatorCollaborationHistory.collaborated_on >= cutoff,
            BrandProfile.brand_category == brand_category,
        )
        .limit(1)
    )
    conflict = result.first()
    if not conflict:
        return False

    history_brand_name, collaborated_on, registered_brand_name = conflict
    logger.info(
        "Excluded creator %s for competitor conflict: brand_category=%r, past_brand=%r, collaborated_on=%s",
        creator_id,
        brand_category,
        registered_brand_name or history_brand_name,
        collaborated_on,
    )
    return True


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


def _validate_campaign_screening_payload(data: CampaignCreate | CampaignUpdate) -> None:
    questions = getattr(data, "application_questions", None)
    if questions is not None and len(questions) > 5:
        raise HTTPException(status_code=400, detail="Campaigns can have at most 5 application questions")

    for question in questions or []:
        if question.question_type not in {"text", "single_choice", "multi_choice"}:
            raise HTTPException(status_code=400, detail="Unsupported application question type")
        if question.question_type in {"single_choice", "multi_choice"} and not question.options_json:
            raise HTTPException(status_code=400, detail="Choice questions require options")


def _has_answer(answer: ApplicationAnswerCreate) -> bool:
    return bool((answer.answer_text or "").strip() or answer.answer_options)


def _validate_application_requirement_payload(
    campaign: Campaign,
    answers: list[ApplicationAnswerCreate],
    accepted_acknowledgment_ids: list[uuid.UUID],
) -> None:
    answer_map = {answer.question_id: answer for answer in answers}
    known_question_ids = {question.id for question in campaign.application_questions}
    unknown_question_ids = set(answer_map) - known_question_ids
    if unknown_question_ids:
        raise HTTPException(status_code=400, detail="Application includes answers for unknown questions")

    for question in campaign.application_questions:
        if question.is_required and (question.id not in answer_map or not _has_answer(answer_map[question.id])):
            raise HTTPException(status_code=400, detail="Required application questions must be answered")

    ack_ids = set(accepted_acknowledgment_ids)
    known_ack_ids = {ack.id for ack in campaign.acknowledgments}
    unknown_ack_ids = ack_ids - known_ack_ids
    if unknown_ack_ids:
        raise HTTPException(status_code=400, detail="Application includes unknown acknowledgments")

    missing_required_acks = [
        ack.id for ack in campaign.acknowledgments
        if ack.is_required and ack.id not in ack_ids
    ]
    if missing_required_acks:
        raise HTTPException(status_code=400, detail="Required acknowledgments must be accepted")


async def _persist_application_requirements(
    db: AsyncSession,
    application_id: uuid.UUID,
    answers: list[ApplicationAnswerCreate],
    accepted_acknowledgment_ids: list[uuid.UUID],
) -> None:
    for answer in answers:
        db.add(CampaignApplicationAnswer(
            application_id=application_id,
            question_id=answer.question_id,
            answer_text=answer.answer_text,
            answer_options_json=answer.answer_options,
        ))

    for acknowledgment_id in accepted_acknowledgment_ids:
        db.add(CampaignApplicationAcknowledgment(
            application_id=application_id,
            acknowledgment_id=acknowledgment_id,
        ))


async def _selected_application_count(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    *,
    exclude_application_id: uuid.UUID | None = None,
) -> int:
    query = select(CampaignApplication).where(
        CampaignApplication.campaign_id == campaign_id,
        CampaignApplication.status.in_(("pending_agreement", "accepted")),
    )
    if exclude_application_id is not None:
        query = query.where(CampaignApplication.id != exclude_application_id)
    result = await db.execute(query)
    return len(result.scalars().all())


async def _release_extra_shortlisted_if_capacity_filled(
    db: AsyncSession,
    campaign: Campaign,
) -> None:
    accepted_result = await db.execute(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign.id,
            CampaignApplication.status == "accepted",
        )
    )
    accepted_count = len(accepted_result.scalars().all())
    if accepted_count < campaign.number_of_creators:
        return

    shortlisted_result = await db.execute(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign.id,
            CampaignApplication.status == "shortlisted",
        )
    )
    now = datetime.now(timezone.utc)
    for application in shortlisted_result.scalars().all():
        application.status = "rejected"
        application.rejection_reason = "Campaign capacity has been filled"
        application.responded_at = now


def _validate_application_status_transition(current_status: str, next_status: str) -> None:
    if current_status == "invited" and next_status in {"shortlisted", "pending_agreement", "accepted"}:
        raise HTTPException(
            status_code=400,
            detail="Creator must accept the invitation before they can be shortlisted or selected",
        )
    if next_status == "pending_agreement" and current_status not in {"pending", "shortlisted"}:
        raise HTTPException(status_code=400, detail="Only pending or shortlisted applications can receive final agreement terms")
    if next_status == "accepted" and current_status not in {"pending", "shortlisted", "pending_agreement"}:
        raise HTTPException(status_code=400, detail="Only engaged applications can be accepted")


async def create_campaign(
    db: AsyncSession, brand_id: uuid.UUID, data: CampaignCreate
) -> Campaign:
    _validate_campaign_screening_payload(data)
    brand_category = normalize_brand_category(data.brand_category)
    if brand_category is None:
        brand_result = await db.execute(select(BrandProfile).where(BrandProfile.id == brand_id))
        brand = brand_result.scalar_one_or_none()
        brand_category = brand.brand_category if brand else None

    campaign = Campaign(
        brand_id=brand_id,
        title=data.title,
        description=data.description,
        objectives=data.objectives,
        primary_niche_id=data.primary_niche_id,
        brand_category=brand_category,
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
        deliverable_code = canonical_deliverable_code(
            platform=req.platform,
            deliverable_code=req.deliverable_code,
            legacy_type=req.deliverable_type,
        )
        platform = deliverable_platform(
            deliverable_code=deliverable_code,
            platform=req.platform,
        )
        legacy_type = legacy_deliverable_type(
            deliverable_code=deliverable_code,
            platform=platform,
            legacy_type=req.deliverable_type,
        )
        if not platform or not legacy_type:
            raise HTTPException(status_code=400, detail="Unsupported deliverable requirement")
        db.add(CampaignDeliverableRequirement(
            campaign_id=campaign.id,
            platform=platform,
            deliverable_type=legacy_type,
            deliverable_code=deliverable_code,
            quantity=req.quantity,
            notes=req.notes,
        ))

    for index, question in enumerate(data.application_questions):
        db.add(CampaignApplicationQuestion(
            campaign_id=campaign.id,
            question_text=question.question_text,
            question_type=question.question_type,
            options_json=question.options_json,
            is_required=question.is_required,
            sort_order=question.sort_order if question.sort_order is not None else index,
        ))

    for index, acknowledgment in enumerate(data.acknowledgments):
        db.add(CampaignAcknowledgment(
            campaign_id=campaign.id,
            statement_text=acknowledgment.statement_text,
            is_required=acknowledgment.is_required,
            sort_order=acknowledgment.sort_order if acknowledgment.sort_order is not None else index,
        ))

    await db.commit()
    refreshed_campaign = await get_campaign(db, campaign.id)
    if not refreshed_campaign:
        return campaign
    return refreshed_campaign


async def update_campaign(
    db: AsyncSession, campaign: Campaign, data: CampaignUpdate
) -> Campaign:
    _validate_campaign_screening_payload(data)
    update_data = data.model_dump(exclude_none=True)
    deliverable_requirements = update_data.pop("deliverable_requirements", None)
    application_questions = update_data.pop("application_questions", None)
    acknowledgments = update_data.pop("acknowledgments", None)

    for field, value in update_data.items():
        if field == "brand_category":
            value = normalize_brand_category(value)
        setattr(campaign, field, value)

    if deliverable_requirements is not None:
        await db.execute(
            select(CampaignDeliverableRequirement).where(
                CampaignDeliverableRequirement.campaign_id == campaign.id
            )
        )
        campaign.deliverable_requirements.clear()
        await db.flush()
        for req in deliverable_requirements:
            deliverable_code = canonical_deliverable_code(
                platform=req.get("platform"),
                deliverable_code=req.get("deliverable_code"),
                legacy_type=req.get("deliverable_type"),
            )
            platform = deliverable_platform(
                deliverable_code=deliverable_code,
                platform=req.get("platform"),
            )
            legacy_type = legacy_deliverable_type(
                deliverable_code=deliverable_code,
                platform=platform,
                legacy_type=req.get("deliverable_type"),
            )
            if not platform or not legacy_type:
                raise HTTPException(status_code=400, detail="Unsupported deliverable requirement")
            campaign.deliverable_requirements.append(
                CampaignDeliverableRequirement(
                    campaign_id=campaign.id,
                    platform=platform,
                    deliverable_type=legacy_type,
                    deliverable_code=deliverable_code,
                    quantity=req.get("quantity", 1),
                    notes=req.get("notes"),
                )
            )

    if application_questions is not None:
        campaign.application_questions.clear()
        await db.flush()
        for index, question in enumerate(application_questions):
            campaign.application_questions.append(
                CampaignApplicationQuestion(
                    campaign_id=campaign.id,
                    question_text=question.get("question_text"),
                    question_type=question.get("question_type", "text"),
                    options_json=question.get("options_json"),
                    is_required=question.get("is_required", True),
                    sort_order=question.get("sort_order", index),
                )
            )

    if acknowledgments is not None:
        campaign.acknowledgments.clear()
        await db.flush()
        for index, acknowledgment in enumerate(acknowledgments):
            campaign.acknowledgments.append(
                CampaignAcknowledgment(
                    campaign_id=campaign.id,
                    statement_text=acknowledgment.get("statement_text"),
                    is_required=acknowledgment.get("is_required", True),
                    sort_order=acknowledgment.get("sort_order", index),
                )
            )
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
    _validate_application_requirement_payload(
        campaign,
        data.answers,
        data.accepted_acknowledgment_ids,
    )

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
    await db.flush()
    await _persist_application_requirements(
        db,
        app.id,
        data.answers,
        data.accepted_acknowledgment_ids,
    )
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

    allowed = {"shortlisted", "pending_agreement", "accepted", "rejected", "withdrawn", "completed"}
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {allowed}")
    _validate_application_status_transition(app.status, data.status)

    now = datetime.now(timezone.utc)
    if data.status in {"pending_agreement", "accepted"}:
        selected_count = await _selected_application_count(
            db,
            campaign_id,
            exclude_application_id=application_id,
        )
        if selected_count >= campaign.number_of_creators:
            raise HTTPException(status_code=409, detail="Campaign creator capacity is already filled")

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
    if data.status == "accepted":
        await _release_extra_shortlisted_if_capacity_filled(db, campaign)

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
        campaign = await get_campaign(db, campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        _validate_application_requirement_payload(
            campaign,
            data.answers,
            data.accepted_acknowledgment_ids,
        )
        app.status = "pending"
        app.proposal_text = data.proposal_text
        app.proposed_rate = data.proposed_rate
        await db.flush()
        await _persist_application_requirements(
            db,
            app.id,
            data.answers,
            data.accepted_acknowledgment_ids,
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    app.responded_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(app)
    return app


# ------------------------------------------------------------------ #
# Shortlist + Offer + Negotiation                                     #
# ------------------------------------------------------------------ #

# A creator can be re-engaged (re-shortlisted / re-offered) only after a
# terminal outcome — never while they are already live in the pipeline.
TERMINAL_APPLICATION_STATUSES = {"rejected", "declined", "withdrawn"}

# Keys the brand controls in a contract; used to snapshot/apply negotiation terms.
_OFFER_TERM_KEYS = (
    "contract_type", "payment_structure", "payment_amount_bdt", "payment_schedule",
    "non_cash_compensation", "has_product_transfer", "product_disposition",
    "deliverable_notes", "exclusivity_days", "usage_rights_days",
    "max_revision_rounds", "kill_fee_percentage",
)


def _offer_terms_snapshot(data: OfferCreate) -> dict:
    snapshot = {key: getattr(data, key, None) for key in _OFFER_TERM_KEYS}
    snapshot["deliverables"] = [
        {"requirement_id": str(d.requirement_id), "quantity": d.quantity, "notes": d.notes}
        for d in data.deliverables
    ]
    return snapshot


async def _get_full_contract(db: AsyncSession, contract_id: uuid.UUID) -> Contract | None:
    """Reload a contract with deliverables (+ requirement) eagerly loaded for ContractOut."""
    result = await db.execute(
        select(Contract)
        .where(Contract.id == contract_id)
        .options(_contract_deliverable_load())
    )
    return result.scalar_one_or_none()


async def _replace_contract_deliverables(
    db: AsyncSession,
    contract: Contract,
    items: list,
    valid_requirement_ids: set[uuid.UUID],
) -> None:
    # Drop any prior selection, then add the new subset.
    await db.execute(
        delete(ContractDeliverable).where(ContractDeliverable.contract_id == contract.id)
    )
    for item in items:
        if item.requirement_id not in valid_requirement_ids:
            raise HTTPException(
                status_code=400,
                detail="Deliverable does not belong to this campaign",
            )
        db.add(ContractDeliverable(
            contract_id=contract.id,
            requirement_id=item.requirement_id,
            quantity=item.quantity,
            notes=item.notes,
        ))


def _apply_offer_terms_to_contract(contract: Contract, data: OfferCreate, fee: int) -> None:
    contract.contract_type = data.contract_type
    contract.payment_structure = data.payment_structure
    contract.payment_amount_bdt = (
        data.payment_amount_bdt if data.payment_structure == "flat_fee" else None
    )
    contract.payment_schedule = (
        data.payment_schedule if data.payment_structure == "flat_fee" else None
    )
    contract.non_cash_compensation = data.non_cash_compensation
    contract.has_product_transfer = data.has_product_transfer
    contract.product_disposition = data.product_disposition
    contract.deliverable_notes = data.deliverable_notes
    contract.exclusivity_days = data.exclusivity_days
    contract.usage_rights_days = data.usage_rights_days
    contract.max_revision_rounds = data.max_revision_rounds
    contract.kill_fee_percentage = data.kill_fee_percentage
    contract.platform_fee_percentage = fee


async def _load_application(
    db: AsyncSession, campaign_id: uuid.UUID, application_id: uuid.UUID
) -> CampaignApplication:
    result = await db.execute(
        select(CampaignApplication)
        .where(
            CampaignApplication.id == application_id,
            CampaignApplication.campaign_id == campaign_id,
        )
        .options(
            selectinload(CampaignApplication.contract),
            selectinload(CampaignApplication.negotiation_turns),
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


async def _authorize_party(
    db: AsyncSession,
    app: CampaignApplication,
    campaign_id: uuid.UUID,
    actor_role: str,
    actor_profile_id: uuid.UUID,
) -> Campaign:
    campaign = await get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if actor_role == "brand":
        if campaign.brand_id != actor_profile_id:
            raise HTTPException(status_code=403, detail="Not your campaign")
    else:  # creator
        if app.creator_id != actor_profile_id:
            raise HTTPException(status_code=403, detail="Not your application")
    return campaign


async def add_to_shortlist(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    brand_id: uuid.UUID,
    data: ShortlistCreate,
) -> CampaignApplication:
    """Shortlist a creator for a campaign. Allowed in any campaign status
    (including draft) and does not create a contract. Reuses a prior terminal
    application so a previously rejected creator can be re-shortlisted."""
    campaign = await get_campaign(db, campaign_id)
    if not campaign or campaign.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Not your campaign")

    existing = await db.execute(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign_id,
            CampaignApplication.creator_id == data.creator_id,
        )
    )
    app = existing.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if app is not None:
        if app.status == "pending":
            # Upgrade a creator-initiated application to brand-curated shortlist.
            app.status = "shortlisted"
            app.brand_notes = data.note
            app.responded_at = now
        elif app.status not in TERMINAL_APPLICATION_STATUSES:
            raise HTTPException(
                status_code=409,
                detail="This creator is already in this campaign's pipeline",
            )
        else:
            # Revive a previously rejected/declined/withdrawn application.
            app.status = "shortlisted"
            app.initiated_by = "brand"
            app.rejection_reason = None
            app.brand_notes = data.note
            app.responded_at = now
    else:
        app = CampaignApplication(
            campaign_id=campaign_id,
            creator_id=data.creator_id,
            initiated_by="brand",
            status="shortlisted",
            brand_notes=data.note,
            responded_at=now,
        )
        db.add(app)

    await db.commit()
    await db.refresh(app)
    return app


async def send_offer(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    brand_id: uuid.UUID,
    data: OfferCreate,
) -> CampaignApplication:
    """Brand sends a contract offer to a shortlisted creator or a public
    applicant. Requires an active campaign. Creates/refreshes a drafted
    contract and opens the negotiation thread with the brand's first turn."""
    app = await _load_application(db, campaign_id, application_id)
    campaign = await _authorize_party(db, app, campaign_id, "brand", brand_id)

    if campaign.status != "active":
        raise HTTPException(status_code=400, detail="Launch the campaign before sending offers")
    if app.status not in {"shortlisted", "pending"}:
        raise HTTPException(
            status_code=400,
            detail="Offers can only be sent to shortlisted creators or applicants",
        )

    valid_requirement_ids = {req.id for req in campaign.deliverable_requirements}
    fee = CONTRACT_FEE_MAP.get(data.contract_type, 15)

    contract = app.contract
    if contract is None:
        contract = Contract(
            application_id=app.id,
            brand_id=brand_id,
            creator_id=app.creator_id,
            contract_type=data.contract_type,
            status="drafted",
        )
        db.add(contract)
        await db.flush()
    else:
        contract.status = "drafted"
    _apply_offer_terms_to_contract(contract, data, fee)
    await _replace_contract_deliverables(db, contract, data.deliverables, valid_requirement_ids)

    # Open the negotiation thread with the brand's opening offer.
    db.add(NegotiationTurn(
        application_id=app.id,
        author_role="brand",
        status="proposed",
        message=data.message,
        proposed_rate=data.payment_amount_bdt if data.payment_structure == "flat_fee" else None,
        proposed_terms=_offer_terms_snapshot(data),
    ))

    app.status = "invited"
    app.initiated_by = "brand"
    app.agreed_rate = data.payment_amount_bdt if data.payment_structure == "flat_fee" else None
    app.agreed_deliverables = data.deliverable_notes
    app.rejection_reason = None
    app.responded_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(app)
    return app


def _latest_proposed_turn(turns: list[NegotiationTurn]) -> NegotiationTurn | None:
    proposed = [t for t in turns if t.status == "proposed"]
    if not proposed:
        return None
    return max(proposed, key=lambda t: t.created_at)


async def counter_offer(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    actor_role: str,
    actor_profile_id: uuid.UUID,
    data: NegotiationCounter,
) -> CampaignApplication:
    """Either party counters the other party's latest proposed terms."""
    app = await _load_application(db, campaign_id, application_id)
    await _authorize_party(db, app, campaign_id, actor_role, actor_profile_id)

    if app.status not in {"invited", "pending_agreement"}:
        raise HTTPException(status_code=400, detail="No open offer to counter")

    latest = _latest_proposed_turn(app.negotiation_turns)
    if latest is None or latest.author_role == actor_role:
        raise HTTPException(status_code=400, detail="It is not your turn to counter")

    latest.status = "superseded"
    db.add(NegotiationTurn(
        application_id=app.id,
        author_role=actor_role,
        status="proposed",
        message=data.message,
        proposed_rate=data.proposed_rate,
        proposed_terms=data.proposed_terms,
    ))

    # Keep the drafted contract roughly in sync with the latest money terms.
    if app.contract is not None and data.proposed_rate is not None:
        app.contract.payment_structure = "flat_fee"
        app.contract.payment_amount_bdt = data.proposed_rate

    app.status = "pending_agreement"
    app.responded_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(app)
    return app


async def accept_offer(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    actor_role: str,
    actor_profile_id: uuid.UUID,
    data: OfferDecision,
) -> CampaignApplication:
    """Accept the other party's latest proposed terms — activates the contract."""
    app = await _load_application(db, campaign_id, application_id)
    campaign = await _authorize_party(db, app, campaign_id, actor_role, actor_profile_id)

    if app.status not in {"invited", "pending_agreement"}:
        raise HTTPException(status_code=400, detail="No open offer to accept")
    latest = _latest_proposed_turn(app.negotiation_turns)
    if latest is None or latest.author_role == actor_role:
        raise HTTPException(status_code=400, detail="There is no offer from the other party to accept")

    # Capacity guard at the moment of commitment.
    selected_count = await _selected_application_count(
        db, campaign_id, exclude_application_id=application_id,
    )
    if selected_count >= campaign.number_of_creators:
        raise HTTPException(status_code=409, detail="Campaign creator capacity is already filled")

    now = datetime.now(timezone.utc)
    latest.status = "accepted"
    for turn in app.negotiation_turns:
        if turn.id != latest.id and turn.status == "proposed":
            turn.status = "superseded"

    if app.contract is not None:
        app.contract.status = "active"
        if latest.proposed_rate is not None:
            app.contract.payment_structure = "flat_fee"
            app.contract.payment_amount_bdt = latest.proposed_rate

    app.status = "accepted"
    app.accepted_at = now
    app.responded_at = now
    if latest.proposed_rate is not None:
        app.agreed_rate = latest.proposed_rate

    await _release_extra_shortlisted_if_capacity_filled(db, campaign)
    await db.commit()
    await db.refresh(app)
    return app


async def decline_offer(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    actor_role: str,
    actor_profile_id: uuid.UUID,
    data: OfferDecision,
) -> CampaignApplication:
    """Either party walks away from an open offer."""
    app = await _load_application(db, campaign_id, application_id)
    await _authorize_party(db, app, campaign_id, actor_role, actor_profile_id)

    if app.status not in {"invited", "pending_agreement"}:
        raise HTTPException(status_code=400, detail="No open offer to decline")

    for turn in app.negotiation_turns:
        if turn.status == "proposed":
            turn.status = "superseded"

    # Brand declining = reject; creator declining = decline. Either way the
    # drafted contract is retained so a future re-offer can reuse it.
    app.status = "rejected" if actor_role == "brand" else "declined"
    if actor_role == "brand" and data.reason:
        app.rejection_reason = data.reason
    app.responded_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(app)
    return app


async def list_negotiation_turns(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    actor_role: str,
    actor_profile_id: uuid.UUID,
) -> list[NegotiationTurn]:
    app = await _load_application(db, campaign_id, application_id)
    await _authorize_party(db, app, campaign_id, actor_role, actor_profile_id)
    return sorted(app.negotiation_turns, key=lambda t: t.created_at)


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


def _portfolio_context(portfolio_items, *, limit: int = 5) -> str:
    items = sorted(
        [item for item in portfolio_items if item.title or item.content_url],
        key=lambda item: item.published_at or date.min,
        reverse=True,
    )[:limit]
    parts: list[str] = []
    for item in items:
        title = (item.title or "Untitled video").strip()
        metrics = []
        if item.views is not None:
            metrics.append(f"{item.views} views")
        if item.likes is not None:
            metrics.append(f"{item.likes} likes")
        metric_text = f" ({', '.join(metrics)})" if metrics else ""
        parts.append(f"- {title}{metric_text}")
    return "\n".join(parts) or "No recent portfolio videos available."


def _english_only_text(text: str) -> str:
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([.,;:!?])", r"\1", text)
    return text.strip()


def _safe_english_snippet(text: str | None, *, max_chars: int = 140) -> str | None:
    if not text:
        return None
    cleaned = _english_only_text(text)
    if not cleaned:
        return None
    alpha_count = sum(1 for char in cleaned if char.isalpha())
    if alpha_count < 8:
        return None
    if len(cleaned) > max_chars:
        cleaned = cleaned[:max_chars].rsplit(" ", 1)[0].strip()
    return cleaned


def _fit_label(score: float, *, strong: str, partial: str, weak: str) -> str:
    if score >= 0.8:
        return strong
    if score >= 0.4:
        return partial
    return weak


def _creator_evidence_brief(creator, scores, *, limit: int = 5) -> str:
    profile_text = _safe_english_snippet(creator.bio or creator.tagline, max_chars=500)
    items = sorted(
        [item for item in creator.portfolio_items if item.title or item.content_url],
        key=lambda item: item.published_at or date.min,
        reverse=True,
    )[:limit]

    english_titles = []
    non_english_count = 0
    latest_date = None
    top_view_count = None
    for item in items:
        if item.published_at and (latest_date is None or item.published_at > latest_date):
            latest_date = item.published_at
        if item.views is not None:
            top_view_count = max(top_view_count or 0, item.views)
        title = _safe_english_snippet(item.title, max_chars=90)
        if title:
            english_titles.append(title)
        elif item.title:
            non_english_count += 1

    content_signal = "recent uploads are available"
    if items and non_english_count == len(items):
        content_signal = "recent uploads are mostly local-language or non-English, so describe their topic pattern without quoting titles"
    elif english_titles:
        content_signal = "sampled recent upload topics include " + "; ".join(english_titles[:3])

    recency_signal = "latest upload date is unknown"
    if latest_date:
        days_since = max((date.today() - latest_date).days, 0)
        recency_signal = f"latest sampled upload was {days_since} days ago"

    performance_signal = "recent video performance is not available"
    if top_view_count is not None:
        performance_signal = f"top sampled recent video has about {top_view_count:,} views"

    score_signals = [
        _fit_label(scores.niche, strong="strong niche fit", partial="partial niche fit", weak="weak niche fit"),
        _fit_label(scores.budget, strong="strong budget fit", partial="negotiable budget fit", weak="weak budget fit"),
        _fit_label(scores.engagement, strong="strong engagement", partial="moderate engagement", weak="limited engagement"),
        _fit_label(scores.language, strong="strong language fit", partial="partial language fit", weak="weak language fit"),
        _fit_label(scores.recency, strong="fresh recent activity", partial="moderate recent activity", weak="older or unknown recent activity"),
    ]

    return "\n".join([
        f"- Profile summary: {profile_text or 'No English profile summary available.'}",
        f"- Recent content signal: {content_signal}.",
        f"- Recency signal: {recency_signal}.",
        f"- Performance signal: {performance_signal}.",
        f"- Match signals: {', '.join(score_signals)}.",
    ])


def _first_sentences(text: str, *, limit: int = 2) -> str:
    pieces = re.split(r"(?<=[.!?])\s+", text.strip())
    selected = [piece.strip() for piece in pieces if piece.strip()][:limit]
    return " ".join(selected).strip()


def _polish_rationale_text(text: str) -> str:
    replacements = {
        "Based on the creator's profile and recent content pattern, ": "",
        "Based on this creator's profile and recent content pattern, ": "",
        "Based on their profile and recent content pattern, ": "",
        "recent English-readable upload topics": "recent upload topics",
        "English-readable upload topics": "recent upload topics",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.strip()


def _build_personalized_rationale_prompt(
    *,
    campaign: Campaign,
    campaign_niche_name: str,
    creator,
    scores,
    creator_tier: str,
) -> str:
    evidence_brief = _creator_evidence_brief(creator, scores)

    return f"""
Write a personalized creator recommendation rationale for a brand marketer.

Rules:
- Use exactly 2 short sentences.
- Write in English only.
- Do not include non-ASCII script or non-English words.
- Do not say "provided evidence brief" or mention that an evidence brief exists.
- Do not start with "Based on"; start directly with the recommendation.
- Use the evidence brief; do not quote raw video titles.
- Be specific to this creator's profile, recent content pattern, and match signals.
- Mention why they fit the campaign audience/content, not just that they have good scores.
- If there is a clear weakness such as older activity, weak language fit, or limited engagement, mention it briefly as a consideration.
- Do not invent facts beyond the context.
- Do not mention raw internal score numbers.
- Keep it professional and pitch-ready.

Campaign:
Title: {campaign.title}
Description: {campaign.description}
Objectives: {campaign.objectives or "Not specified"}
Niche: {campaign_niche_name}
Required platforms: {", ".join(campaign.required_platforms or []) or "Any"}

Creator:
Name: {creator.display_name}
Tier: {creator_tier}
Evidence brief:
{evidence_brief}
""".strip()


async def _generate_personalized_rationale(
    *,
    campaign: Campaign,
    campaign_niche_name: str,
    creator,
    scores,
    creator_tier: str,
    fallback: str,
) -> str:
    if not settings.groq_api_key:
        return fallback

    prompt = _build_personalized_rationale_prompt(
        campaign=campaign,
        campaign_niche_name=campaign_niche_name,
        creator=creator,
        scores=scores,
        creator_tier=creator_tier,
    )

    try:
        client = AsyncGroq(api_key=settings.groq_api_key)
        completion = await client.chat.completions.create(
            model=GROQ_RATIONALE_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You write concise, evidence-grounded influencer matching rationales.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=130,
        )
        content = completion.choices[0].message.content if completion.choices else None
        if not content:
            return fallback
        cleaned = _english_only_text(" ".join(content.strip().split()))
        cleaned = _polish_rationale_text(cleaned)
        cleaned = _first_sentences(cleaned, limit=2)
        return cleaned or fallback
    except Exception as exc:
        logger.warning("Groq rationale generation failed: %s", exc)
        return fallback


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
            selectinload(CreatorProfile.rate_cards),
            selectinload(CreatorProfile.portfolio_items),
        )
    )
    creators = creators_result.scalars().all()

    campaign_text = _build_campaign_text(campaign, campaign_niche_name)
    campaign_embedding = get_gemini_embedding(campaign_text)

    # Compute matches
    matches = []
    match_sort_followers = {}
    match_contexts = {}
    for creator in creators:
        if not creator.is_available or creator.deleted_at is not None:
            continue

        # Determine niche names
        creator_primary = "general"
        creator_subs = []
        for cn in creator.niches:
            n_name = niche_map.get(cn.niche_id, "general")
            if cn.is_primary:
                creator_primary = n_name
            else:
                creator_subs.append(n_name)

        campaign_plats = campaign.required_platforms or []
        primary_profile = _select_matching_social_profile(creator.social_profiles, campaign_plats)

        follower_count = primary_profile.follower_count if primary_profile else 0
        follower_count = follower_count or 0
        engagement_rate = float(primary_profile.engagement_rate) if (primary_profile and primary_profile.engagement_rate is not None) else None
        creator_platforms = [sp.platform for sp in creator.social_profiles]

        # Determine creator rate for campaign platforms
        creator_rate = _matching_rate_for_campaign(campaign, creator)

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

        if await _has_recent_competitor_conflict(
            db,
            creator_id=creator.id,
            campaign_brand_id=campaign.brand_id,
            brand_category=campaign.brand_category,
        ):
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
        semantic_niche_score = None
        if niche_score <= 0.0 and campaign_niche_name.lower() not in ("general", "unknown", "other"):
            semantic_score = semantic_similarity(
                campaign_text,
                creator_text,
                campaign_embedding=campaign_embedding,
            )
            semantic_used = semantic_score >= SEMANTIC_SIMILARITY_THRESHOLD
            if not semantic_used:
                continue
            semantic_niche_score = min(semantic_score, SEMANTIC_RESCUE_NICHE_CAP)
            logger.info(
                "Semantic niche rescue used for creator %s on campaign %s: similarity=%.4f capped_niche=%.4f",
                creator.id,
                campaign.id,
                semantic_score,
                semantic_niche_score,
            )

        # Compute match score using matching engine
        from app.services.matching import get_tier  # noqa: PLC0415
        days_since_post = _days_since_latest_portfolio_item(
            creator.portfolio_items,
            campaign_plats,
        )
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
            creator_days_since_post=days_since_post,
            niche_score_override=semantic_niche_score,
        )

        creator_tier = get_tier(follower_count)
        total_score = scores.total

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
        match_sort_followers[creator.id] = follower_count
        match_contexts[creator.id] = {
            "creator": creator,
            "scores": scores,
            "creator_tier": creator_tier,
            "fallback_rationale": rational_text,
        }

    # Sort by score, then selected audience size, then creator id for stable rankings.
    matches.sort(
        key=lambda x: (
            x.score_total or 0.0,
            match_sort_followers.get(x.creator_id, 0),
            str(x.creator_id),
        ),
        reverse=True,
    )
    top_matches = matches[:TOP_MATCH_LIMIT]

    # Personalize only the top few rationales after deterministic ranking.
    for match in top_matches[:LLM_RATIONALE_TOP_N]:
        context = match_contexts.get(match.creator_id)
        if not context:
            continue
        match.rationale = await _generate_personalized_rationale(
            campaign=campaign,
            campaign_niche_name=campaign_niche_name,
            creator=context["creator"],
            scores=context["scores"],
            creator_tier=context["creator_tier"],
            fallback=context["fallback_rationale"],
        )

    # Save to db
    for match in top_matches:
        db.add(match)
    await db.commit()

    return await get_campaign_matches(db, campaign_id)


async def get_campaign_matches(db: AsyncSession, campaign_id: uuid.UUID) -> List[AIMatchScore]:
    from app.campaigns.models import AIMatchScore
    from app.creators.models import CreatorProfile

    campaign = await get_campaign(db, campaign_id)
    campaign_plats = campaign.required_platforms if campaign else []

    result = await db.execute(
        select(AIMatchScore)
        .where(AIMatchScore.campaign_id == campaign_id)
        .options(
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.social_profiles),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.niches),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.languages),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.rate_cards),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.portfolio_items)
        )
    )
    matches = list(result.scalars().all())

    def sort_key(match: AIMatchScore):
        social_profiles = match.creator.social_profiles if match.creator else []
        selected_profile = _select_matching_social_profile(social_profiles, campaign_plats)
        follower_count = selected_profile.follower_count if selected_profile else 0
        return (match.score_total or 0.0, follower_count or 0, str(match.creator_id))

    return sorted(matches, key=sort_key, reverse=True)


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
        non_cash_compensation=data.non_cash_compensation,
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
    await db.flush()

    campaign = await get_campaign(db, app.campaign_id)
    valid_requirement_ids = {req.id for req in campaign.deliverable_requirements} if campaign else set()
    await _replace_contract_deliverables(db, contract, data.deliverables, valid_requirement_ids)

    await db.commit()
    return await _get_full_contract(db, contract.id)


def _contract_deliverable_load():
    """Eager-load options for ContractOut.deliverables (avoids async lazy-load).
    Defined as a function so it does not force mapper configuration at import time."""
    return selectinload(Contract.deliverables).selectinload(ContractDeliverable.requirement)


async def get_contract_by_application(
    db: AsyncSession, application_id: uuid.UUID
) -> "Contract | None":
    result = await db.execute(
        select(Contract)
        .where(Contract.application_id == application_id)
        .options(_contract_deliverable_load())
    )
    return result.scalar_one_or_none()


async def get_contract(db: AsyncSession, contract_id: uuid.UUID) -> "Contract | None":
    result = await db.execute(
        select(Contract)
        .where(Contract.id == contract_id)
        .options(_contract_deliverable_load())
    )
    return result.scalar_one_or_none()


async def list_contracts_for_brand(
    db: AsyncSession, brand_id: uuid.UUID, campaign_id: uuid.UUID | None = None
) -> list:
    query = select(Contract).where(Contract.brand_id == brand_id).options(_contract_deliverable_load())
    if campaign_id:
        query = query.join(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign_id
        )
    result = await db.execute(query.order_by(Contract.contracted_at.desc()))
    return list(result.scalars().all())


async def list_contracts_for_creator(db: AsyncSession, creator_id: uuid.UUID) -> list:
    result = await db.execute(
        select(Contract)
        .where(Contract.creator_id == creator_id)
        .options(_contract_deliverable_load())
        .order_by(Contract.contracted_at.desc())
    )
    return list(result.scalars().all())


REVENUE_PER_VIEW_BDT = 0.25
REVENUE_PER_LIKE_BDT = 1.0
REVENUE_PER_COMMENT_BDT = 3.0
REVENUE_PER_SHARE_BDT = 4.0
REVENUE_PER_SAVE_BDT = 2.0


def calculate_engagement_rate(
    views: int,
    impressions: int,
    likes: int,
    comments: int,
    shares: int,
    saves: int,
) -> float:
    denominator = impressions or views
    if denominator <= 0:
        return 0.0
    engagements = likes + comments + shares + saves
    return round((engagements / denominator) * 100, 2)


def estimate_live_content_revenue_bdt(
    views: int,
    likes: int,
    comments: int,
    shares: int,
    saves: int,
) -> int:
    return round(
        (views * REVENUE_PER_VIEW_BDT)
        + (likes * REVENUE_PER_LIKE_BDT)
        + (comments * REVENUE_PER_COMMENT_BDT)
        + (shares * REVENUE_PER_SHARE_BDT)
        + (saves * REVENUE_PER_SAVE_BDT)
    )


def infer_platform_from_url(url: str | None) -> str | None:
    if not url:
        return None
    host = urlparse(url).netloc.lower()
    if "youtube.com" in host or "youtu.be" in host:
        return "youtube"
    if "instagram.com" in host:
        return "instagram"
    if "tiktok.com" in host:
        return "tiktok"
    if "facebook.com" in host:
        return "facebook"
    return None


def extract_youtube_video_id(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower().removeprefix("www.")
    parts = [part for part in parsed.path.split("/") if part]
    if "youtu.be" in host:
        return parts[0] if parts else None
    if "youtube.com" not in host:
        return None
    watch_id = parse_qs(parsed.query).get("v", [None])[0]
    if watch_id:
        return watch_id
    for marker in ("shorts", "embed", "live"):
        if marker in parts:
            index = parts.index(marker)
            return parts[index + 1] if len(parts) > index + 1 else None
    return None


def _snapshot_totals(snapshot: LiveContentMetricSnapshot | None) -> dict:
    if not snapshot:
        return {
            "views": 0,
            "impressions": 0,
            "likes": 0,
            "comments": 0,
            "shares": 0,
            "saves": 0,
            "engagements": 0,
            "estimated_revenue_bdt": 0,
        }
    engagements = snapshot.likes + snapshot.comments + snapshot.shares + snapshot.saves
    return {
        "views": snapshot.views,
        "impressions": snapshot.impressions,
        "likes": snapshot.likes,
        "comments": snapshot.comments,
        "shares": snapshot.shares,
        "saves": snapshot.saves,
        "engagements": engagements,
        "estimated_revenue_bdt": snapshot.estimated_revenue_bdt,
    }


async def create_live_metric_snapshot(
    db: AsyncSession,
    contract_id: uuid.UUID,
    brand_id: uuid.UUID,
    data: LiveMetricSnapshotCreate,
) -> LiveContentMetricSnapshot:
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    if contract.status not in ("published", "closed"):
        raise HTTPException(status_code=400, detail="Metrics can only be tracked after content is published")

    metrics = {
        "views": data.views,
        "impressions": data.impressions,
        "likes": data.likes,
        "comments": data.comments,
        "shares": data.shares,
        "saves": data.saves,
    }
    if any(value < 0 for value in metrics.values()):
        raise HTTPException(status_code=400, detail="Metric values cannot be negative")

    engagement_rate = calculate_engagement_rate(**metrics)
    revenue = estimate_live_content_revenue_bdt(
        data.views,
        data.likes,
        data.comments,
        data.shares,
        data.saves,
    )
    snapshot = LiveContentMetricSnapshot(
        contract_id=contract.id,
        platform=data.platform or infer_platform_from_url(contract.live_post_url),
        captured_at=data.captured_at or datetime.now(timezone.utc),
        engagement_rate=engagement_rate,
        estimated_revenue_bdt=revenue,
        revenue_basis="0.25/view + 1/like + 3/comment + 4/share + 2/save BDT",
        source=data.source,
        **metrics,
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def sync_contract_live_metrics(
    db: AsyncSession,
    contract_id: uuid.UUID,
    brand_id: uuid.UUID,
) -> LiveContentMetricSnapshot:
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    if contract.status not in ("published", "closed"):
        raise HTTPException(status_code=400, detail="Metrics can only be synced after content is published")

    platform = infer_platform_from_url(contract.live_post_url)
    if platform != "youtube":
        raise HTTPException(
            status_code=400,
            detail="Automatic metric sync is currently available for YouTube live post URLs",
        )

    video_id = extract_youtube_video_id(contract.live_post_url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Could not parse YouTube video id from live post URL")

    try:
        video = await youtube_service.get_video(video_id)
    except youtube_service.YouTubeConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except youtube_service.YouTubeAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    views = video.view_count or 0
    likes = video.like_count or 0
    comments = video.comment_count or 0
    engagement_rate = calculate_engagement_rate(
        views=views,
        impressions=views,
        likes=likes,
        comments=comments,
        shares=0,
        saves=0,
    )
    snapshot = LiveContentMetricSnapshot(
        contract_id=contract.id,
        platform="youtube",
        captured_at=datetime.now(timezone.utc),
        views=views,
        impressions=views,
        likes=likes,
        comments=comments,
        shares=0,
        saves=0,
        engagement_rate=engagement_rate,
        estimated_revenue_bdt=estimate_live_content_revenue_bdt(views, likes, comments, 0, 0),
        revenue_basis="YouTube API stats: 0.25/view + 1/like + 3/comment BDT",
        source="youtube_api",
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def get_contract_live_analytics(
    db: AsyncSession,
    contract_id: uuid.UUID,
    brand_id: uuid.UUID,
) -> dict:
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Not your contract")

    result = await db.execute(
        select(LiveContentMetricSnapshot)
        .where(
            LiveContentMetricSnapshot.contract_id == contract_id,
            LiveContentMetricSnapshot.source != "manual",
        )
        .order_by(LiveContentMetricSnapshot.captured_at.asc())
    )
    snapshots = list(result.scalars().all())
    first = snapshots[0] if snapshots else None
    latest = snapshots[-1] if snapshots else None
    first_totals = _snapshot_totals(first)
    latest_totals = _snapshot_totals(latest)

    return {
        "contract_id": contract.id,
        "creator_id": contract.creator_id,
        "live_post_url": contract.live_post_url,
        "status": contract.status,
        "latest": latest,
        "snapshots": snapshots,
        "total_views_delta": max(0, latest_totals["views"] - first_totals["views"]),
        "total_engagement_delta": max(0, latest_totals["engagements"] - first_totals["engagements"]),
        "revenue_delta_bdt": max(0, latest_totals["estimated_revenue_bdt"] - first_totals["estimated_revenue_bdt"]),
    }


async def get_campaign_live_analytics(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    brand_id: uuid.UUID,
) -> dict:
    campaign = await get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Not your campaign")

    contract_result = await db.execute(
        select(Contract)
        .join(CampaignApplication, CampaignApplication.id == Contract.application_id)
        .where(
            CampaignApplication.campaign_id == campaign_id,
            Contract.brand_id == brand_id,
        )
        .options(selectinload(Contract.metric_snapshots))
        .order_by(Contract.contracted_at.desc())
    )
    contracts = list(contract_result.scalars().all())
    contract_payloads = []
    timeline_by_time: dict[datetime, dict] = {}
    totals = {
        "published_contracts": 0,
        "views": 0,
        "impressions": 0,
        "likes": 0,
        "comments": 0,
        "shares": 0,
        "saves": 0,
        "engagements": 0,
        "estimated_revenue_bdt": 0,
        "engagement_rate": 0.0,
    }

    for contract in contracts:
        snapshots = sorted(
            (snap for snap in contract.metric_snapshots if snap.source != "manual"),
            key=lambda snap: snap.captured_at,
        )
        first = snapshots[0] if snapshots else None
        latest = snapshots[-1] if snapshots else None
        latest_totals = _snapshot_totals(latest)
        first_totals = _snapshot_totals(first)

        if contract.status in ("published", "closed"):
            totals["published_contracts"] += 1
        for key in ("views", "impressions", "likes", "comments", "shares", "saves", "engagements", "estimated_revenue_bdt"):
            totals[key] += latest_totals[key]

        for snapshot in snapshots:
            bucket = timeline_by_time.setdefault(
                snapshot.captured_at,
                {
                    "captured_at": snapshot.captured_at,
                    "views": 0,
                    "likes": 0,
                    "comments": 0,
                    "shares": 0,
                    "saves": 0,
                    "engagements": 0,
                    "estimated_revenue_bdt": 0,
                },
            )
            bucket["views"] += snapshot.views
            bucket["likes"] += snapshot.likes
            bucket["comments"] += snapshot.comments
            bucket["shares"] += snapshot.shares
            bucket["saves"] += snapshot.saves
            bucket["engagements"] += snapshot.likes + snapshot.comments + snapshot.shares + snapshot.saves
            bucket["estimated_revenue_bdt"] += snapshot.estimated_revenue_bdt

        contract_payloads.append({
            "contract_id": contract.id,
            "creator_id": contract.creator_id,
            "live_post_url": contract.live_post_url,
            "status": contract.status,
            "latest": latest,
            "snapshots": snapshots,
            "total_views_delta": max(0, latest_totals["views"] - first_totals["views"]),
            "total_engagement_delta": max(0, latest_totals["engagements"] - first_totals["engagements"]),
            "revenue_delta_bdt": max(0, latest_totals["estimated_revenue_bdt"] - first_totals["estimated_revenue_bdt"]),
        })

    denominator = totals["impressions"] or totals["views"]
    totals["engagement_rate"] = round((totals["engagements"] / denominator) * 100, 2) if denominator else 0.0

    return {
        "campaign_id": campaign_id,
        "totals": totals,
        "contracts": contract_payloads,
        "timeline": sorted(timeline_by_time.values(), key=lambda item: item["captured_at"]),
    }


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


def _normalize_url_for_compare(url: str) -> str | None:
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    path = parsed.path.rstrip("/")
    return f"{parsed.netloc.lower()}{path}".rstrip("/")


def _clean_handle(handle: str | None) -> str:
    return (handle or "").strip().lstrip("@").strip("/").lower()


def _url_path_parts(url: str) -> list[str]:
    parsed = urlparse(url.strip())
    return [part for part in parsed.path.strip("/").split("/") if part]


def _profile_path_prefix(profile_url: str | None) -> str | None:
    if not profile_url:
        return None
    normalized = _normalize_url_for_compare(profile_url)
    if not normalized:
        return None
    return normalized


def _matches_creator_platform_url(live_url: str, profile: CreatorSocialProfile) -> bool:
    parsed = urlparse(live_url.strip())
    host = parsed.netloc.lower().removeprefix("www.")
    parts = _url_path_parts(live_url)
    handle = _clean_handle(profile.handle)
    profile_prefix = _profile_path_prefix(profile.profile_url)
    normalized_live = _normalize_url_for_compare(live_url)

    if profile_prefix and normalized_live and normalized_live.startswith(f"{profile_prefix}/"):
        return True

    if profile.platform == "youtube":
        if "youtu.be" in host:
            return False
        if "youtube.com" not in host:
            return False
        if len(parts) >= 2 and parts[0] in {"@", "c", "channel", "user"}:
            return _clean_handle(parts[1]) == handle or parts[1].lower() == (profile.api_channel_id or "").lower()
        if parts and parts[0].startswith("@"):
            return _clean_handle(parts[0]) == handle
        return bool(profile.api_channel_id and profile.api_channel_id in live_url)

    if profile.platform == "instagram":
        if "instagram.com" not in host:
            return False
        if parts and _clean_handle(parts[0]) == handle:
            return True
        return bool(profile_prefix and normalized_live and normalized_live.startswith(f"{profile_prefix}/"))

    if profile.platform == "tiktok":
        if "tiktok.com" not in host:
            return False
        if parts and _clean_handle(parts[0]) == handle:
            return True
        return bool(profile_prefix and normalized_live and normalized_live.startswith(f"{profile_prefix}/"))

    return bool(profile_prefix and normalized_live and normalized_live.startswith(f"{profile_prefix}/"))


async def _verify_creator_live_post_url(
    db: AsyncSession,
    *,
    creator_id: uuid.UUID,
    live_url: str,
) -> None:
    normalized_live = _normalize_url_for_compare(live_url)
    if not normalized_live:
        raise HTTPException(status_code=400, detail="Live post URL must be a valid http(s) URL")

    portfolio_result = await db.execute(
        select(CreatorPortfolioItem.content_url).where(
            CreatorPortfolioItem.creator_id == creator_id,
        )
    )
    for content_url in portfolio_result.scalars().all():
        normalized_content = _normalize_url_for_compare(content_url)
        if normalized_content and normalized_content == normalized_live:
            return

    profile_result = await db.execute(
        select(CreatorSocialProfile).where(CreatorSocialProfile.creator_id == creator_id)
    )
    profiles = list(profile_result.scalars().all())
    if any(_matches_creator_platform_url(live_url, profile) for profile in profiles):
        return

    raise HTTPException(
        status_code=400,
        detail="Live post URL must belong to one of your connected creator platforms or synced content items",
    )


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
    await _verify_creator_live_post_url(db, creator_id=creator_id, live_url=live_url)

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
