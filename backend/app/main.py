from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Cohesiq API",
    description="Influencer Matching Platform — Phase 1",
    version="0.1.0",
)

# Allow all origins in development; restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}


# Domain routers
from app.auth.router import router as auth_router
from app.creators.router import router as creators_router
from app.brands.router import router as brands_router
from app.campaigns.router import router as campaigns_router

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(creators_router, prefix="/creators", tags=["creators"])
app.include_router(brands_router, prefix="/brands", tags=["brands"])
app.include_router(campaigns_router, prefix="/campaigns", tags=["campaigns"])

from app.webhooks.router import router as webhooks_router  # noqa: E402
app.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])


# ------------------------------------------------------------------ #
# Cross-domain read-only routes                                        #
# ------------------------------------------------------------------ #

import uuid
from typing import Annotated, List

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.campaigns.schemas import ApplicationOut, ReviewOut
from app.campaigns import service as campaign_service
from app.common.dependencies import get_current_user, get_db
from app.auth.models import User


@app.get("/creators/{creator_id}/applications", response_model=List[ApplicationOut], tags=["creators"])
async def creator_applications(
    creator_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Creator views their own application history."""
    from app.creators.service import get_creator  # noqa: PLC0415
    creator = await get_creator(db, creator_id)
    if not creator or creator.user_id != current_user.id:
        from fastapi import HTTPException  # noqa: PLC0415
        raise HTTPException(status_code=403, detail="Not your profile")
    return await campaign_service.list_creator_applications(db, creator_id)


@app.get("/creators/{creator_id}/reviews", response_model=List[ReviewOut], tags=["creators"])
async def creator_reviews(
    creator_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Public reviews for a creator."""
    return await campaign_service.list_creator_reviews(db, creator_id)


@app.get("/brands/{brand_id}/reviews", response_model=List[ReviewOut], tags=["brands"])
async def brand_reviews(
    brand_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Public reviews for a brand."""
    return await campaign_service.list_brand_reviews(db, brand_id)

