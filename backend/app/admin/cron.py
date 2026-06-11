"""
Admin cron endpoints — called by n8n scheduled workflows (or any HTTP client).

Routes are gated by a shared `CRON_SECRET` header so only n8n (or ops tooling)
can invoke them — they are NOT authenticated via Clerk JWT.

Required env var:
    CRON_SECRET   — arbitrary long random string, set in backend/.env
"""

import logging
from datetime import date, datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.dependencies import get_db
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/cron", tags=["cron"])


# ---------------------------------------------------------------------------
# Auth guard
# ---------------------------------------------------------------------------

async def _require_cron_secret(x_cron_secret: str = Header(None, alias="x-cron-secret")) -> None:
    """Reject requests that don't supply the shared CRON_SECRET header."""
    if not settings.cron_secret:
        raise HTTPException(status_code=503, detail="Cron secret not configured on server")
    if x_cron_secret != settings.cron_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid cron secret")


CronAuth = Annotated[None, Depends(_require_cron_secret)]


# ---------------------------------------------------------------------------
# 1. Expire stale campaigns
# ---------------------------------------------------------------------------

@router.post("/expire-campaigns")
async def expire_stale_campaigns(
    _: CronAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Mark campaigns whose application_deadline has passed and are still `active`
    as `archived`.

    Designed to be called once per day by n8n.
    """
    from app.campaigns.models import Campaign  # noqa: PLC0415

    today = date.today()
    result = await db.execute(
        update(Campaign)
        .where(
            Campaign.status == "active",
            Campaign.application_deadline != None,  # noqa: E711
            Campaign.application_deadline < today,
        )
        .returning(Campaign.id, Campaign.title)
    )
    expired = result.fetchall()
    await db.commit()

    count = len(expired)
    logger.info("Cron expire-campaigns: archived %d campaigns", count)
    return {
        "archived": count,
        "campaign_ids": [str(row.id) for row in expired],
        "ran_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# 2. Daily YouTube re-enrichment for all verified creators
# ---------------------------------------------------------------------------

@router.post("/reenrich-youtube-creators")
async def reenrich_youtube_creators(
    _: CronAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    recent_video_limit: int = 6,
) -> dict:
    """
    Re-pull YouTube stats for every creator who has an `is_api_verified=True`
    YouTube social profile.

    Iterates over verified creators and calls the existing enrichment service.
    Designed to be called once per day by n8n.
    """
    from app.creators.models import CreatorSocialProfile  # noqa: PLC0415
    from app.creators.service import enrich_creator_youtube  # noqa: PLC0415

    result = await db.execute(
        select(CreatorSocialProfile).where(
            CreatorSocialProfile.platform == "youtube",
            CreatorSocialProfile.is_api_verified == True,  # noqa: E712
            CreatorSocialProfile.handle != None,  # noqa: E711
        )
    )
    profiles = result.scalars().all()

    succeeded, failed = 0, 0
    errors: list[dict] = []

    for profile in profiles:
        try:
            channel_ref = profile.handle or profile.api_channel_id
            if not channel_ref:
                continue
            await enrich_creator_youtube(
                db=db,
                creator_id=profile.creator_id,
                channel_ref=channel_ref,
                recent_video_limit=recent_video_limit,
            )
            succeeded += 1
        except Exception as exc:
            failed += 1
            errors.append({"creator_id": str(profile.creator_id), "error": str(exc)})
            logger.warning("Cron reenrich: failed for creator %s — %s", profile.creator_id, exc)

    logger.info("Cron reenrich-youtube: %d succeeded, %d failed", succeeded, failed)
    return {
        "succeeded": succeeded,
        "failed": failed,
        "errors": errors,
        "ran_at": datetime.now(timezone.utc).isoformat(),
    }
