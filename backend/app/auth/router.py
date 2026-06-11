from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service
from app.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut, OnboardingRequest
from app.auth.models import User
from app.common.dependencies import get_current_user, get_db

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    data: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new creator or brand account. Returns a JWT on success."""
    user, token = await service.register_user(db, data)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate and return a JWT access token."""
    user = await service.authenticate_user(db, str(data.email), data.password)
    return TokenResponse(access_token=token)

@router.get("/me", response_model=UserOut)
async def me(current_user: Annotated[User, Depends(get_current_user)]):
    """Return the currently authenticated user's info."""
    return current_user


@router.post("/onboarding")
async def onboarding_sync(
    data: OnboardingRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Sync onboarding data and create necessary profiles."""
    if current_user.role != data.role:
        current_user.role = data.role

    if data.role == "creator" and data.creatorProfile:
        from app.creators.models import CreatorProfile, CreatorSocialProfile, CreatorNiche
        from app.creators.service import create_creator_profile
        
        # Check if profile exists
        existing = await db.execute(select(CreatorProfile).where(CreatorProfile.user_id == current_user.id))
        profile = existing.scalar_one_or_none()
        
        if not profile:
            display_name = data.creatorProfile.get("displayName", current_user.email.split("@")[0])
            profile = await create_creator_profile(db, user_id=current_user.id, display_name=display_name)
        
        # Update profile fields
        profile.bio = data.creatorProfile.get("bio")
        profile.tagline = data.creatorProfile.get("tagline")
        profile.city = data.creatorProfile.get("city")
        profile.gender = data.creatorProfile.get("gender") or None
        
        # Replace niches so onboarding can be retried/reset without duplicates.
        if data.creatorNiches:
            await db.execute(
                delete(CreatorNiche).where(CreatorNiche.creator_id == profile.id)
            )
            primary = data.creatorNiches.get("primary")
            if primary:
                db.add(CreatorNiche(creator_id=profile.id, niche_id=primary, is_primary=True))
            for sub in data.creatorNiches.get("sub", []):
                if sub == primary:
                    continue
                db.add(CreatorNiche(creator_id=profile.id, niche_id=sub, is_primary=False))
                
        # Update-or-create platforms; creator_id + platform is unique.
        if data.creatorPlatforms:
            for p in data.creatorPlatforms:
                existing_platform = await db.execute(
                    select(CreatorSocialProfile).where(
                        CreatorSocialProfile.creator_id == profile.id,
                        CreatorSocialProfile.platform == p["platform"],
                    )
                )
                social_profile = existing_platform.scalar_one_or_none()
                if not social_profile:
                    social_profile = CreatorSocialProfile(
                        creator_id=profile.id,
                        platform=p["platform"],
                    )
                    db.add(social_profile)

                social_profile.handle = p["handle"]
                social_profile.profile_url = p["profileUrl"]
                social_profile.follower_count = p.get("followerCount") or 0
                
    elif data.role == "brand" and data.brandProfile:
        from app.brands.models import BrandProfile
        from app.brands.service import create_brand_profile
        
        existing = await db.execute(select(BrandProfile).where(BrandProfile.user_id == current_user.id))
        profile = existing.scalar_one_or_none()
        
        if not profile:
            brand_name = data.brandProfile.get("brandName", current_user.email.split("@")[0])
            profile = await create_brand_profile(db, user_id=current_user.id, brand_name=brand_name)
            
        profile.description = data.brandProfile.get("description")
        profile.website = data.brandProfile.get("website")
        profile.city = data.brandProfile.get("city")

    await db.commit()
    return {"success": True}
