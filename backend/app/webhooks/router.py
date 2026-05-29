"""
Clerk webhook handler.

Receives signed events from Clerk and syncs the user into our PostgreSQL
database. See: https://clerk.com/docs/webhooks/overview

Required env var: CLERK_WEBHOOK_SECRET (from Clerk Dashboard → Webhooks)
"""

import hashlib
import hmac
import logging
import time
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.common.dependencies import get_db
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def _verify_svix_signature(
    payload: bytes,
    svix_id: str,
    svix_timestamp: str,
    svix_signature: str,
    secret: str,
) -> None:
    """Verify the Svix webhook signature used by Clerk."""
    # Strip the 'whsec_' prefix if present
    raw_secret = secret.removeprefix("whsec_")
    import base64
    key = base64.b64decode(raw_secret)

    to_sign = f"{svix_id}.{svix_timestamp}.{payload.decode()}"
    expected = hmac.new(key, to_sign.encode(), hashlib.sha256).digest()
    expected_b64 = base64.b64encode(expected).decode()

    # svix_signature can be a space-separated list of "v1,<base64>"
    sigs = [s.split(",", 1)[1] for s in svix_signature.split() if "," in s]
    if not any(hmac.compare_digest(s, expected_b64) for s in sigs):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature",
        )

    # Reject stale webhooks (> 5 minutes)
    if abs(time.time() - int(svix_timestamp)) > 300:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Webhook timestamp too old",
        )


@router.post("/clerk", status_code=200)
async def clerk_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    svix_id: str = Header(None, alias="svix-id"),
    svix_timestamp: str = Header(None, alias="svix-timestamp"),
    svix_signature: str = Header(None, alias="svix-signature"),
):
    """
    Clerk sends signed POST requests here for user lifecycle events.
    We sync the user record into our DB so the rest of the app can reference it.
    """
    payload = await request.body()

    # Verify signature only when the secret is configured
    if settings.clerk_webhook_secret:
        _verify_svix_signature(
            payload, svix_id, svix_timestamp, svix_signature,
            settings.clerk_webhook_secret
        )

    import json
    body = json.loads(payload)
    event_type: str = body.get("type", "")
    data: dict = body.get("data", {})

    logger.info("Clerk webhook: %s", event_type)

    if event_type == "user.created":
        await _handle_user_created(db, data)

    elif event_type == "user.updated":
        await _handle_user_updated(db, data)

    elif event_type == "user.deleted":
        await _handle_user_deleted(db, data)

    return {"received": True}


async def _handle_user_created(db: AsyncSession, data: dict) -> None:
    """
    Create a User row when someone signs up via Clerk.
    Clerk stores the intended role in publicMetadata.role.
    Default role is 'creator' if not set.
    """
    clerk_id: str = data["id"]
    emails = data.get("email_addresses", [])
    primary_email_id = data.get("primary_email_address_id")
    email = next(
        (e["email_address"] for e in emails if e["id"] == primary_email_id),
        emails[0]["email_address"] if emails else None,
    )
    if not email:
        logger.warning("Clerk user.created with no email — skipping: %s", clerk_id)
        return

    role: str = data.get("public_metadata", {}).get("role", "creator")
    display_name: str | None = data.get("public_metadata", {}).get("display_name")
    brand_name: str | None = data.get("public_metadata", {}).get("brand_name")

    first_name = data.get("first_name") or ""
    last_name = data.get("last_name") or ""
    if not display_name:
        display_name = f"{first_name} {last_name}".strip() or email.split("@")[0]
    if not brand_name and role == "brand":
        brand_name = display_name

    # Idempotency: skip if clerk_id already known
    existing = await db.execute(select(User).where(User.clerk_id == clerk_id))
    if existing.scalar_one_or_none():
        logger.info("User with clerk_id %s already exists — skipping", clerk_id)
        return

    # Also check by email to avoid duplicates from seeded data
    by_email = await db.execute(select(User).where(User.email == email))
    existing_by_email = by_email.scalar_one_or_none()
    if existing_by_email:
        # Link the existing seeded row to this Clerk user
        existing_by_email.clerk_id = clerk_id
        await db.commit()
        logger.info("Linked clerk_id %s to existing user %s", clerk_id, existing_by_email.id)
        return

    user = User(
        email=email,
        password_hash=None,  # Clerk handles auth — no local password
        clerk_id=clerk_id,
        role=role,
        is_email_verified=True,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    onboarding_complete = data.get("public_metadata", {}).get("onboardingComplete", False)
    if onboarding_complete:
        if role == "creator":
            from app.creators.service import create_creator_profile  # noqa: PLC0415
            await create_creator_profile(db, user_id=user.id, display_name=display_name)
        elif role == "brand":
            from app.brands.service import create_brand_profile  # noqa: PLC0415
            await create_brand_profile(db, user_id=user.id, brand_name=brand_name or display_name)

    await db.commit()
    logger.info("Created user %s from Clerk webhook (clerk_id=%s)", user.id, clerk_id)


async def _handle_user_updated(db: AsyncSession, data: dict) -> None:
    """Sync email updates and handle onboarding completion from Clerk."""
    clerk_id: str = data["id"]
    emails = data.get("email_addresses", [])
    primary_email_id = data.get("primary_email_address_id")
    email = next(
        (e["email_address"] for e in emails if e["id"] == primary_email_id),
        None,
    )

    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalar_one_or_none()
    if not user:
        return

    if email and user.email != email:
        user.email = email
    
    # Check if onboarding was completed in this update
    onboarding_complete = data.get("public_metadata", {}).get("onboardingComplete", False)
    role = data.get("public_metadata", {}).get("role")
    
    if onboarding_complete and role:
        # Check if we need to update the role
        if user.role != role:
            user.role = role
        
        # Check if profile exists, if not create it
        if role == "creator":
            from app.creators.models import CreatorProfile  # noqa: PLC0415
            from app.creators.service import create_creator_profile  # noqa: PLC0415
            profile_exists = await db.execute(select(CreatorProfile).where(CreatorProfile.user_id == user.id))
            if not profile_exists.scalar_one_or_none():
                display_name = data.get("public_metadata", {}).get("display_name") or data.get("first_name", "") or email.split("@")[0]
                await create_creator_profile(db, user_id=user.id, display_name=display_name)
        elif role == "brand":
            from app.brands.models import BrandProfile  # noqa: PLC0415
            from app.brands.service import create_brand_profile  # noqa: PLC0415
            profile_exists = await db.execute(select(BrandProfile).where(BrandProfile.user_id == user.id))
            if not profile_exists.scalar_one_or_none():
                brand_name = data.get("public_metadata", {}).get("brand_name") or data.get("public_metadata", {}).get("display_name") or data.get("first_name", "") or email.split("@")[0]
                await create_brand_profile(db, user_id=user.id, brand_name=brand_name)

    await db.commit()


async def _handle_user_deleted(db: AsyncSession, data: dict) -> None:
    """Soft-delete the user when removed from Clerk."""
    from datetime import datetime, timezone  # noqa: PLC0415
    clerk_id: str = data["id"]
    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalar_one_or_none()
    if user:
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        await db.commit()
