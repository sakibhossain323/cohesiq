import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.campaigns import service
from app.campaigns.schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
    CampaignCreate,
    CampaignFilters,
    CampaignOut,
    CampaignStatusUpdate,
    CampaignUpdate,
    ReviewCreate,
    ReviewOut,
    AIMatchScoreOut,
    ApplicationInviteCreate,
    ApplicationRespondInvite,
    ContractCreate,
    ContractOut,
    CampaignLiveAnalyticsOut,
    ContentDraftSubmit,
    ContentPublishSubmit,
    LiveContractAnalyticsOut,
    LiveMetricSnapshotOut,
    ShortlistCreate,
    OfferCreate,
    NegotiationCounter,
    OfferDecision,
    NegotiationTurnOut,
)
from app.common.dependencies import get_current_user, get_db

router = APIRouter()


# ------------------------------------------------------------------ #
# Campaigns                                                            #
# ------------------------------------------------------------------ #

@router.get("/", response_model=List[CampaignOut])
@router.get("", response_model=List[CampaignOut])  # no-slash variant for proxy compatibility
async def list_campaigns(
    db: Annotated[AsyncSession, Depends(get_db)],
    niche: Optional[int] = Query(None),
    platform: Optional[str] = Query(None),
    min_budget: Optional[int] = Query(None),
    max_budget: Optional[int] = Query(None),
    language: Optional[str] = Query(None),
    status: str = Query("active"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
):
    filters = CampaignFilters(
        niche=niche,
        platform=platform,
        min_budget=min_budget,
        max_budget=max_budget,
        language=language,
        status=status,
        limit=limit,
        offset=offset,
    )
    return await service.list_campaigns(db, filters)


@router.post("/", response_model=CampaignOut, status_code=201)
@router.post("", response_model=CampaignOut, status_code=201)  # no-slash variant for proxy compatibility
async def create_campaign(
    data: CampaignCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.role != "brand":
        raise HTTPException(status_code=403, detail="Only brands can create campaigns")
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    return await service.create_campaign(db, brand.id, data)


@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(
    campaign_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    campaign = await service.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.put("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: uuid.UUID,
    data: CampaignUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    campaign = await service.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand or campaign.brand_id != brand.id:
        raise HTTPException(status_code=403, detail="Not your campaign")
    return await service.update_campaign(db, campaign, data)


@router.patch("/{campaign_id}/status", response_model=CampaignOut)
async def update_campaign_status(
    campaign_id: uuid.UUID,
    data: CampaignStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    campaign = await service.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand or campaign.brand_id != brand.id:
        raise HTTPException(status_code=403, detail="Not your campaign")
    return await service.update_campaign_status(db, campaign, data)


# ------------------------------------------------------------------ #
# Applications                                                         #
# ------------------------------------------------------------------ #

@router.post("/{campaign_id}/apply", response_model=ApplicationOut, status_code=201)
async def apply_to_campaign(
    campaign_id: uuid.UUID,
    data: ApplicationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.role != "creator":
        raise HTTPException(status_code=403, detail="Only creators can apply to campaigns")
    from app.creators.service import get_creator_by_user_id  # noqa: PLC0415
    creator = await get_creator_by_user_id(db, current_user.id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    return await service.apply_to_campaign(db, campaign_id, creator.id, data)


@router.get("/{campaign_id}/applications", response_model=List[ApplicationOut])
async def list_applications(
    campaign_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Brand views all applications for their campaign."""
    campaign = await service.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand or campaign.brand_id != brand.id:
        raise HTTPException(status_code=403, detail="Not your campaign")
    return await service.list_campaign_applications(db, campaign_id)


@router.patch(
    "/{campaign_id}/applications/{application_id}/status",
    response_model=ApplicationOut,
)
async def update_application_status(
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    data: ApplicationStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Only brands can update application status")
    return await service.update_application_status(db, campaign_id, application_id, data, brand.id)


@router.post("/{campaign_id}/invite", response_model=ApplicationOut, status_code=201)
async def invite_creator_to_campaign(
    campaign_id: uuid.UUID,
    data: ApplicationInviteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Only brands can invite creators")
    return await service.invite_creator(db, campaign_id, brand.id, data)


@router.patch(
    "/{campaign_id}/applications/{application_id}/respond-invite",
    response_model=ApplicationOut,
)
async def respond_to_invitation(
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    data: ApplicationRespondInvite,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.creators.service import get_creator_by_user_id  # noqa: PLC0415
    creator = await get_creator_by_user_id(db, current_user.id)
    if not creator:
        raise HTTPException(status_code=403, detail="Only creators can respond to invites")
    return await service.respond_invite(db, campaign_id, application_id, creator.id, data)


# ------------------------------------------------------------------ #
# Shortlist + Offer + Negotiation                                     #
# ------------------------------------------------------------------ #

async def _resolve_brand(db: AsyncSession, current_user: User):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Brand profile not found")
    return brand


async def _resolve_party(db: AsyncSession, current_user: User) -> tuple[str, uuid.UUID]:
    """Resolve the acting party (brand or creator) and their profile id."""
    if current_user.role == "brand":
        from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
        brand = await get_brand_by_user_id(db, current_user.id)
        if not brand:
            raise HTTPException(status_code=403, detail="Brand profile not found")
        return "brand", brand.id
    if current_user.role == "creator":
        from app.creators.service import get_creator_by_user_id  # noqa: PLC0415
        creator = await get_creator_by_user_id(db, current_user.id)
        if not creator:
            raise HTTPException(status_code=403, detail="Creator profile not found")
        return "creator", creator.id
    raise HTTPException(status_code=403, detail="Only brands or creators can negotiate")


@router.post("/{campaign_id}/shortlist", response_model=ApplicationOut, status_code=201)
async def shortlist_creator(
    campaign_id: uuid.UUID,
    data: ShortlistCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Add a creator to a campaign's shortlist (allowed in any status, no contract)."""
    brand = await _resolve_brand(db, current_user)
    return await service.add_to_shortlist(db, campaign_id, brand.id, data)


@router.post(
    "/{campaign_id}/applications/{application_id}/offer",
    response_model=ApplicationOut,
    status_code=201,
)
async def send_offer(
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    data: OfferCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Brand sends a contract offer to a shortlisted creator or applicant (campaign must be active)."""
    brand = await _resolve_brand(db, current_user)
    return await service.send_offer(db, campaign_id, application_id, brand.id, data)


@router.post(
    "/{campaign_id}/applications/{application_id}/negotiate",
    response_model=ApplicationOut,
)
async def negotiate_offer(
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    data: NegotiationCounter,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Either party counters the other party's latest proposed terms."""
    role, profile_id = await _resolve_party(db, current_user)
    return await service.counter_offer(db, campaign_id, application_id, role, profile_id, data)


@router.post(
    "/{campaign_id}/applications/{application_id}/offer/accept",
    response_model=ApplicationOut,
)
async def accept_offer(
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    data: OfferDecision,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Accept the other party's latest offer — activates the contract."""
    role, profile_id = await _resolve_party(db, current_user)
    return await service.accept_offer(db, campaign_id, application_id, role, profile_id, data)


@router.post(
    "/{campaign_id}/applications/{application_id}/offer/decline",
    response_model=ApplicationOut,
)
async def decline_offer(
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    data: OfferDecision,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Either party walks away from an open offer."""
    role, profile_id = await _resolve_party(db, current_user)
    return await service.decline_offer(db, campaign_id, application_id, role, profile_id, data)


@router.get(
    "/{campaign_id}/applications/{application_id}/negotiation",
    response_model=List[NegotiationTurnOut],
)
async def get_negotiation_thread(
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Full offer/counter-offer history for an application (brand or creator party)."""
    role, profile_id = await _resolve_party(db, current_user)
    return await service.list_negotiation_turns(db, campaign_id, application_id, role, profile_id)


# ------------------------------------------------------------------ #
# Reviews (nested under campaigns router for simplicity)              #
# ------------------------------------------------------------------ #

@router.post("/reviews/", response_model=ReviewOut, status_code=201)
async def create_review(
    data: ReviewCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Submit a review. Only allowed when the application status is 'completed'."""
    return await service.create_review(db, current_user.id, data)


# ------------------------------------------------------------------ #
# AI Matching                                                        #
# ------------------------------------------------------------------ #

@router.post("/{campaign_id}/run-matching", response_model=List[AIMatchScoreOut])
async def run_campaign_matching_endpoint(
    campaign_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Run AI matching algorithm for a campaign to find the best creators."""
    campaign = await service.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand or campaign.brand_id != brand.id:
        raise HTTPException(status_code=403, detail="Not your campaign")
    
    return await service.run_campaign_matching(db, campaign_id)


# ------------------------------------------------------------------ #
# Contracts                                                            #
# ------------------------------------------------------------------ #

@router.post(
    "/{campaign_id}/applications/{application_id}/contract",
    response_model=ContractOut,
    status_code=201,
)
async def create_contract(
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    data: ContractCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Only brands can create contracts")
    return await service.create_contract(db, application_id, data, brand.id)


@router.get(
    "/{campaign_id}/applications/{application_id}/contract",
    response_model=ContractOut,
)
async def get_contract_by_application(
    campaign_id: uuid.UUID,
    application_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    contract = await service.get_contract_by_application(db, application_id)
    if not contract:
        raise HTTPException(status_code=404, detail="No contract found for this application")
    return contract


@router.patch("/contracts/{contract_id}/submit-draft", response_model=ContractOut)
async def submit_content_draft(
    contract_id: uuid.UUID,
    data: ContentDraftSubmit,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.creators.service import get_creator_by_user_id  # noqa: PLC0415
    creator = await get_creator_by_user_id(db, current_user.id)
    if not creator:
        raise HTTPException(status_code=403, detail="Only creators can submit content")
    return await service.submit_content_draft(db, contract_id, data.draft_content_url, creator.id)


@router.patch("/contracts/{contract_id}/approve", response_model=ContractOut)
async def approve_content(
    contract_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Only brands can approve content")
    return await service.approve_content(db, contract_id, brand.id)


@router.patch("/contracts/{contract_id}/request-revision", response_model=ContractOut)
async def request_revision(
    contract_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Only brands can request revisions")
    return await service.request_revision(db, contract_id, brand.id)


@router.patch("/contracts/{contract_id}/publish", response_model=ContractOut)
async def publish_content(
    contract_id: uuid.UUID,
    data: ContentPublishSubmit,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.creators.service import get_creator_by_user_id  # noqa: PLC0415
    creator = await get_creator_by_user_id(db, current_user.id)
    if not creator:
        raise HTTPException(status_code=403, detail="Only creators can publish content")
    return await service.publish_content(db, contract_id, data.live_post_url, creator.id)


@router.patch("/contracts/{contract_id}/close", response_model=ContractOut)
async def close_contract(
    contract_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Only brands can close contracts")
    return await service.close_contract(db, contract_id, brand.id)


@router.post("/contracts/{contract_id}/sync-metrics", response_model=LiveMetricSnapshotOut, status_code=201)
async def sync_contract_metric_snapshot(
    contract_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Only brands can sync contract metrics")
    return await service.sync_contract_live_metrics(db, contract_id, brand.id)


@router.get("/contracts/{contract_id}/analytics", response_model=LiveContractAnalyticsOut)
async def get_contract_live_analytics(
    contract_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Only brands can view contract analytics")
    return await service.get_contract_live_analytics(db, contract_id, brand.id)


@router.get("/brands/me/contracts", response_model=List[ContractOut])
async def list_brand_contracts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    campaign_id: Optional[uuid.UUID] = Query(None),
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Brand profile not found")
    return await service.list_contracts_for_brand(db, brand.id, campaign_id)


@router.get("/creators/me/contracts", response_model=List[ContractOut])
async def list_creator_contracts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.creators.service import get_creator_by_user_id  # noqa: PLC0415
    creator = await get_creator_by_user_id(db, current_user.id)
    if not creator:
        raise HTTPException(status_code=403, detail="Creator profile not found")
    return await service.list_contracts_for_creator(db, creator.id)


@router.get("/{campaign_id}/live-analytics", response_model=CampaignLiveAnalyticsOut)
async def get_campaign_live_analytics(
    campaign_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Only brands can view campaign analytics")
    return await service.get_campaign_live_analytics(db, campaign_id, brand.id)


@router.get("/{campaign_id}/matches", response_model=List[AIMatchScoreOut])
async def get_campaign_matches_endpoint(
    campaign_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve existing AI match scores for a campaign."""
    campaign = await service.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand or campaign.brand_id != brand.id:
        raise HTTPException(status_code=403, detail="Not your campaign")
    
    return await service.get_campaign_matches(db, campaign_id)
