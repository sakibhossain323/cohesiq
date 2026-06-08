import argparse
import asyncio
import uuid

from sqlalchemy import select, text

from app.auth import models as auth_models  # noqa: F401
from app.brands import models as brand_models  # noqa: F401
from app.campaigns import models as campaign_models  # noqa: F401
from app.creators import models as creator_models  # noqa: F401
from app.creators.service import enrich_public_social_profile
from app.database import AsyncSessionLocal


async def seed_social_profile_for_creator(
    creator_id: str,
    platform: str,
    profile_ref: str,
    recent_post_limit: int = 12,
) -> None:
    creator_uuid = uuid.UUID(creator_id)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT id FROM creator_profiles WHERE id = :creator_id"),
            {"creator_id": creator_uuid},
        )
        existing_id = result.scalar_one_or_none()
        if not existing_id:
            raise ValueError(f"creator_id {creator_id} does not exist")

        social_profile = await enrich_public_social_profile(
            db=session,
            creator_id=creator_uuid,
            platform=platform,
            profile_ref=profile_ref,
            recent_post_limit=recent_post_limit,
        )

        print(f"Seeded social profile for creator_id={creator_id}")
        print(f"  platform={social_profile.platform}")
        print(f"  handle={social_profile.handle}")
        print(f"  follower_count={social_profile.follower_count}")
        print(f"  profile_url={social_profile.profile_url}")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed public social data directly for an existing creator profile."
    )
    parser.add_argument(
        "--creator-id",
        required=True,
        help="UUID of the existing creator_profiles row",
    )
    parser.add_argument(
        "--platform",
        required=True,
        choices=["instagram", "tiktok"],
        help="Social platform to seed",
    )
    parser.add_argument(
        "--handle",
        required=True,
        help="Instagram or TikTok handle to seed (e.g. farjanadrawingacademy)",
    )
    parser.add_argument(
        "--recent-post-limit",
        type=int,
        default=12,
        help="How many recent posts to import into portfolio",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    asyncio.run(
        seed_social_profile_for_creator(
            creator_id=args.creator_id,
            platform=args.platform,
            profile_ref=args.handle,
            recent_post_limit=args.recent_post_limit,
        )
    )
