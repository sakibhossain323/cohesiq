import asyncio

from sqlalchemy import text

from app.auth import models as auth_models  # noqa: F401
from app.brands import models as brand_models  # noqa: F401
from app.campaigns import models as campaign_models  # noqa: F401
from app.campaigns.service import run_campaign_matching
from app.creators import models as creator_models  # noqa: F401
from app.database import AsyncSessionLocal

DEMO_CAMPAIGN_TITLE = "YouTube creator launch demo"


async def _get_or_create_demo_brand_id(session):
    result = await session.execute(text("""
        SELECT bp.id
        FROM brand_profiles bp
        JOIN users u ON u.id = bp.user_id
        WHERE u.email = 'matching-demo-brand@test.com'
        LIMIT 1
    """))
    brand_id = result.scalar_one_or_none()
    if brand_id:
        return brand_id

    user_result = await session.execute(text("""
        INSERT INTO users (email, clerk_id, role, is_email_verified)
        VALUES ('matching-demo-brand@test.com', 'matching-demo-brand', 'brand', true)
        ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
        RETURNING id
    """))
    user_id = user_result.scalar_one()

    brand_result = await session.execute(text("""
        INSERT INTO brand_profiles (user_id, brand_name, description, country_code, city)
        VALUES (:user_id, 'Cohesiq Demo Brand', 'Demo brand for matching engine validation.', 'BD', 'Dhaka')
        ON CONFLICT (user_id) DO UPDATE SET brand_name = EXCLUDED.brand_name
        RETURNING id
    """), {"user_id": user_id})
    return brand_result.scalar_one()


async def _get_or_create_demo_campaign_id(session):
    brand_id = await _get_or_create_demo_brand_id(session)
    niche_result = await session.execute(text("""
        SELECT id
        FROM niches
        WHERE lower(name) IN ('education', 'lifestyle')
        ORDER BY CASE WHEN lower(name) = 'education' THEN 0 ELSE 1 END
        LIMIT 1
    """))
    niche_id = niche_result.scalar_one_or_none()

    existing_result = await session.execute(text("""
        SELECT id
        FROM campaigns
        WHERE title = :title
        ORDER BY created_at DESC
        LIMIT 1
    """), {"title": DEMO_CAMPAIGN_TITLE})
    campaign_id = existing_result.scalar_one_or_none()

    if campaign_id:
        await session.execute(text("""
            UPDATE campaigns
            SET brand_id = :brand_id,
                description = 'Looking for Bangladesh-oriented YouTube creators for an education campaign.',
                objectives = 'Validate ranked creator recommendations using verified YouTube data.',
                primary_niche_id = :niche_id,
                required_platforms = ARRAY['youtube']::platform_type[],
                budget_per_creator_max = 500000,
                creator_min_followers = 0,
                creator_max_followers = NULL,
                status = 'active',
                visibility = 'public'
            WHERE id = :campaign_id
        """), {
            "brand_id": brand_id,
            "campaign_id": campaign_id,
            "niche_id": niche_id,
        })
    else:
        campaign_result = await session.execute(text("""
            INSERT INTO campaigns (
                brand_id,
                title,
                description,
                objectives,
                primary_niche_id,
                required_platforms,
                budget_per_creator_max,
                creator_min_followers,
                creator_max_followers,
                status,
                visibility
            )
            VALUES (
                :brand_id,
                :title,
                'Looking for Bangladesh-oriented YouTube creators for an education campaign.',
                'Validate ranked creator recommendations using verified YouTube data.',
                :niche_id,
                ARRAY['youtube']::platform_type[],
                500000,
                0,
                NULL,
                'active',
                'public'
            )
            RETURNING id
        """), {
            "brand_id": brand_id,
            "title": DEMO_CAMPAIGN_TITLE,
            "niche_id": niche_id,
        })
        campaign_id = campaign_result.scalar_one()

    await session.execute(text("""
        DELETE FROM campaign_language_targets
        WHERE campaign_id = :campaign_id
    """), {"campaign_id": campaign_id})

    language_exists = await session.execute(text("SELECT 1 FROM languages WHERE code = 'bn'"))
    if language_exists.scalar_one_or_none():
        await session.execute(text("""
            INSERT INTO campaign_language_targets (campaign_id, language_code, is_required)
            VALUES (:campaign_id, 'bn', true)
            ON CONFLICT DO NOTHING
        """), {"campaign_id": campaign_id})

    await session.commit()
    return campaign_id


async def test():
    async with AsyncSessionLocal() as session:
        campaign_id = await _get_or_create_demo_campaign_id(session)

        print(f"Running live matching service for campaign: {campaign_id}")
        matches = await run_campaign_matching(session, campaign_id)
        print(f"Generated {len(matches)} matches")

        if not matches:
            raise SystemExit("No matches generated. Check seeded creators and campaign filters.")

        scores = [m.score_total or 0.0 for m in matches]
        if scores != sorted(scores, reverse=True):
            raise SystemExit("Matches are not sorted by descending total score.")

        for match in matches:
            missing_fields = [
                name for name in (
                    "score_niche",
                    "score_budget",
                    "score_platform",
                    "score_engagement",
                    "score_language",
                    "score_recency",
                    "score_semantic",
                    "score_total",
                )
                if getattr(match, name) is None
            ]
            if missing_fields:
                raise SystemExit(
                    f"Match {match.id} is missing persisted score fields: {', '.join(missing_fields)}"
                )

            creator_name = match.creator.display_name if match.creator else match.creator_id
            print(
                f"{creator_name}: total={match.score_total:.4f}, "
                f"niche={match.score_niche:.4f}, budget={match.score_budget:.4f}, "
                f"platform={match.score_platform:.4f}, engagement={match.score_engagement:.4f}, "
                f"language={match.score_language:.4f}, recency={match.score_recency:.4f}, "
                f"semantic={match.score_semantic:.4f}"
            )
            print(f"  Rationale: {match.rationale}")

if __name__ == "__main__":
    asyncio.run(test())
