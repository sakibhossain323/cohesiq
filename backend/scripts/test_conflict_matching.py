import asyncio
from datetime import date

from sqlalchemy import text

from app.auth import models as auth_models  # noqa: F401
from app.brands import models as brand_models  # noqa: F401
from app.campaigns import models as campaign_models  # noqa: F401
from app.campaigns.service import run_campaign_matching
from app.creators import models as creator_models  # noqa: F401
from app.database import AsyncSessionLocal

DEMO_CAMPAIGN_TITLE = "YouTube creator launch demo"
COMPETITOR_EMAIL = "matching-conflict-competitor@test.com"


async def _ensure_ready(session):
    table_result = await session.execute(text("""
        SELECT table_name
        FROM (
            VALUES
                ('users'),
                ('brand_profiles'),
                ('campaigns'),
                ('creator_profiles'),
                ('creator_social_profiles'),
                ('creator_collaboration_history'),
                ('ai_match_scores')
        ) AS required(table_name)
        WHERE to_regclass('public.' || table_name) IS NULL
    """))
    missing_tables = [row[0] for row in table_result.all()]
    if missing_tables:
        raise SystemExit(
            "Database schema is not ready. Missing tables: "
            f"{', '.join(missing_tables)}. Run `docker compose exec backend alembic upgrade head`."
        )

    column_result = await session.execute(text("""
        SELECT table_name || '.' || column_name
        FROM (
            VALUES
                ('brand_profiles', 'brand_category'),
                ('campaigns', 'brand_category')
        ) AS required(table_name, column_name)
        WHERE NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = required.table_name
              AND column_name = required.column_name
        )
    """))
    missing_columns = [row[0] for row in column_result.all()]
    if missing_columns:
        raise SystemExit(
            "Database schema is not ready. Missing columns: "
            f"{', '.join(missing_columns)}. Run `docker compose exec backend alembic upgrade head`."
        )

    creator_count_result = await session.execute(text("""
        SELECT count(*)
        FROM creator_social_profiles
        WHERE platform = 'youtube'
    """))
    if creator_count_result.scalar_one() <= 0:
        raise SystemExit(
            "No YouTube creators found. Run "
            "`docker compose exec backend python -m scripts.seed_real_youtube_creators` first."
        )


async def _get_demo_campaign_id(session):
    result = await session.execute(
        text("SELECT id FROM campaigns WHERE title = :title LIMIT 1"),
        {"title": DEMO_CAMPAIGN_TITLE},
    )
    campaign_id = result.scalar_one_or_none()
    if campaign_id:
        await session.execute(
            text("""
                UPDATE campaigns
                SET brand_category = 'edtech',
                    required_platforms = ARRAY['youtube']::platform_type[],
                    creator_min_followers = 0,
                    creator_max_followers = NULL,
                    budget_per_creator_max = 500000,
                    status = 'active',
                    visibility = 'public'
                WHERE id = :campaign_id
            """),
            {"campaign_id": campaign_id},
        )
        await session.commit()
        return campaign_id

    # Reuse the normal matching script's setup rather than duplicating every
    # campaign creation detail here.
    from scripts.test_matching import _get_or_create_demo_campaign_id  # noqa: PLC0415

    return await _get_or_create_demo_campaign_id(session)


async def _get_or_create_competitor_brand_id(session, *, brand_category: str):
    user_result = await session.execute(text("""
        INSERT INTO users (email, clerk_id, role, is_email_verified)
        VALUES (:email, 'matching-conflict-competitor', 'brand', true)
        ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
        RETURNING id
    """), {"email": COMPETITOR_EMAIL})
    user_id = user_result.scalar_one()

    brand_result = await session.execute(text("""
        INSERT INTO brand_profiles (user_id, brand_name, description, brand_category, country_code, city)
        VALUES (
            :user_id,
            'Conflict Demo Competitor',
            'Demo competitor brand for conflict-of-interest matching tests.',
            :brand_category,
            'BD',
            'Dhaka'
        )
        ON CONFLICT (user_id) DO UPDATE
        SET brand_name = EXCLUDED.brand_name,
            description = EXCLUDED.description,
            brand_category = EXCLUDED.brand_category
        RETURNING id
    """), {"user_id": user_id, "brand_category": brand_category})
    return brand_result.scalar_one()


async def _set_competitor_category(session, brand_id, brand_category: str):
    await session.execute(
        text("UPDATE brand_profiles SET brand_category = :brand_category WHERE id = :brand_id"),
        {"brand_id": brand_id, "brand_category": brand_category},
    )
    await session.commit()


async def _insert_recent_collaboration(session, *, creator_id, competitor_brand_id):
    await session.execute(text("""
        DELETE FROM creator_collaboration_history
        WHERE creator_id = :creator_id
          AND brand_name = 'Conflict Demo Competitor'
    """), {"creator_id": creator_id})

    await session.execute(text("""
        INSERT INTO creator_collaboration_history (
            creator_id,
            brand_id,
            brand_name,
            platform,
            collaboration_type,
            collaborated_on,
            deliverable_description
        )
        VALUES (
            :creator_id,
            :brand_id,
            'Conflict Demo Competitor',
            'youtube',
            'sponsored_post',
            :collaborated_on,
            'Demo recent competitor collaboration.'
        )
    """), {
        "creator_id": creator_id,
        "brand_id": competitor_brand_id,
        "collaborated_on": date.today(),
    })
    await session.commit()


def _creator_ids(matches):
    return {match.creator_id for match in matches}


async def _get_conflict_audit_rows(session, campaign_id):
    result = await session.execute(text("""
        SELECT
            cch.creator_id,
            cp.display_name,
            COALESCE(bp.brand_name, cch.brand_name) AS conflicting_brand,
            bp.brand_category,
            cch.collaborated_on,
            CURRENT_DATE - cch.collaborated_on AS days_ago
        FROM creator_collaboration_history cch
        JOIN creator_profiles cp ON cp.id = cch.creator_id
        JOIN brand_profiles bp ON bp.id = cch.brand_id
        JOIN campaigns c ON c.id = :campaign_id
        WHERE c.brand_category IS NOT NULL
          AND cch.brand_id IS NOT NULL
          AND cch.brand_id <> c.brand_id
          AND bp.brand_category = c.brand_category
          AND cch.collaborated_on IS NOT NULL
          AND cch.collaborated_on >= CURRENT_DATE - INTERVAL '90 days'
        ORDER BY cch.collaborated_on DESC, cp.display_name ASC
    """), {"campaign_id": campaign_id})
    return result.mappings().all()


async def _print_conflict_audit(session, *, campaign_id, baseline_matches, current_matches):
    baseline_ids = _creator_ids(baseline_matches)
    current_ids = _creator_ids(current_matches)
    excluded_ids = baseline_ids - current_ids
    audit_rows = await _get_conflict_audit_rows(session, campaign_id)
    relevant_rows = [row for row in audit_rows if row["creator_id"] in excluded_ids]

    print(f"Conflict audit: {len(relevant_rows)} baseline creators excluded by same-category recent history.")
    for row in relevant_rows:
        print(
            "  - "
            f"{row['display_name']} conflicted with {row['conflicting_brand']} "
            f"({row['brand_category']}), collaborated {row['days_ago']} days ago."
        )


async def test_conflict_matching():
    async with AsyncSessionLocal() as session:
        await _ensure_ready(session)
        campaign_id = await _get_demo_campaign_id(session)

        baseline_matches = await run_campaign_matching(session, campaign_id)
        if not baseline_matches:
            raise SystemExit("No baseline matches found. Seed creators and run scripts.test_matching first.")

        target_match = baseline_matches[0]
        target_creator_id = target_match.creator_id
        target_name = target_match.creator.display_name if target_match.creator else target_creator_id
        print(f"Baseline top creator: {target_name} ({target_creator_id})")

        competitor_brand_id = await _get_or_create_competitor_brand_id(
            session,
            brand_category="edtech",
        )
        await _insert_recent_collaboration(
            session,
            creator_id=target_creator_id,
            competitor_brand_id=competitor_brand_id,
        )

        conflicted_matches = await run_campaign_matching(session, campaign_id)
        await _print_conflict_audit(
            session,
            campaign_id=campaign_id,
            baseline_matches=baseline_matches,
            current_matches=conflicted_matches,
        )
        if target_creator_id in _creator_ids(conflicted_matches):
            raise SystemExit(
                f"Conflict check failed: {target_name} still appears after same-category competitor history."
            )
        print(f"Conflict exclusion OK: {target_name} disappeared for same-category competitor.")

        await _set_competitor_category(session, competitor_brand_id, "stationery")
        non_conflicted_matches = await run_campaign_matching(session, campaign_id)
        if target_creator_id not in _creator_ids(non_conflicted_matches):
            raise SystemExit(
                f"Conflict relaxation failed: {target_name} did not return after competitor category changed."
            )
        print(f"Category relaxation OK: {target_name} returned when competitor became stationery.")


if __name__ == "__main__":
    asyncio.run(test_conflict_matching())
