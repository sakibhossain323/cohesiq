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
    LiveMetricSnapshotCreate,
    LiveMetricSnapshotOut,
)
from app.common.dependencies import get_current_user, get_db

router = APIRouter()


# ------------------------------------------------------------------ #
# Campaigns                                                            #
# ------------------------------------------------------------------ #

@router.get("/", response_model=List[CampaignOut])
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


@router.post("/contracts/{contract_id}/metrics-snapshots", response_model=LiveMetricSnapshotOut, status_code=201)
async def create_contract_metric_snapshot(
    contract_id: uuid.UUID,
    data: LiveMetricSnapshotCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.brands.service import get_brand_by_user_id  # noqa: PLC0415
    brand = await get_brand_by_user_id(db, current_user.id)
    if not brand:
        raise HTTPException(status_code=403, detail="Only brands can record contract metrics")
    return await service.create_live_metric_snapshot(db, contract_id, brand.id, data)


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
