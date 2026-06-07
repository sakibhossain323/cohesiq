import argparse
import asyncio
import uuid

from sqlalchemy import text

from app.auth import models as auth_models  # noqa: F401
from app.brands import models as brand_models  # noqa: F401
from app.campaigns import models as campaign_models  # noqa: F401
from app.creators import models as creator_models  # noqa: F401
from app.database import AsyncSessionLocal

ALLOWED_PLATFORMS = {
    "youtube",
    "instagram",
    "facebook",
    "tiktok",
    "twitter_x",
    "linkedin",
    "snapchat",
    "other",
}


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Update campaign matching requirements for local/demo data."
    )
    parser.add_argument("--campaign-id", help="Campaign UUID to update.")
    parser.add_argument("--title", help="Latest campaign whose title contains this text.")
    parser.add_argument(
        "--status",
        default="active",
        help="Prefer campaigns with this status when searching by title. Use 'any' to disable.",
    )
    parser.add_argument("--budget", type=int, help="Max budget per creator in BDT.")
    parser.add_argument("--min-followers", type=int, help="Minimum follower count.")
    parser.add_argument(
        "--platforms",
        help="Comma-separated required platforms, e.g. youtube,instagram,tiktok.",
    )
    return parser.parse_args()


def _platforms_sql(platforms: str | None) -> str | None:
    if platforms is None:
        return None
    values = [item.strip().lower() for item in platforms.split(",") if item.strip()]
    invalid = [item for item in values if item not in ALLOWED_PLATFORMS]
    if invalid:
        raise SystemExit(f"Invalid platforms: {', '.join(invalid)}")
    if not values:
        raise SystemExit("At least one platform is required.")
    quoted = ",".join(f"'{value}'" for value in values)
    return f"ARRAY[{quoted}]::platform_type[]"


async def _find_campaign_id(
    session,
    *,
    campaign_id: str | None,
    title: str | None,
    status: str,
):
    if campaign_id:
        return uuid.UUID(campaign_id)
    if not title:
        raise SystemExit("Pass --campaign-id or --title.")
    result = await session.execute(
        text("""
            SELECT c.id
            FROM campaigns c
            LEFT JOIN niches n ON n.id = c.primary_niche_id
            WHERE c.title ILIKE :title_query
               OR n.name ILIKE :exact_query
            ORDER BY
                CASE
                    WHEN :status = 'any' THEN 0
                    WHEN c.status = :status THEN 0
                    ELSE 1
                END,
                CASE
                    WHEN lower(n.name) = lower(:raw_query) THEN 0
                    WHEN lower(c.title) = lower(:raw_query) THEN 1
                    ELSE 2
                END,
                c.created_at DESC
            LIMIT 1
        """),
        {
            "title_query": f"%{title}%",
            "exact_query": title,
            "raw_query": title,
            "status": status,
        },
    )
    return result.scalar_one_or_none()


async def main() -> None:
    args = _parse_args()
    platforms_sql = _platforms_sql(args.platforms)

    assignments = []
    params = {}
    if args.budget is not None:
        if args.budget <= 0:
            raise SystemExit("--budget must be greater than 0.")
        assignments.append("budget_per_creator_max = :budget")
        params["budget"] = args.budget
    if args.min_followers is not None:
        if args.min_followers < 0:
            raise SystemExit("--min-followers cannot be negative.")
        assignments.append("creator_min_followers = :min_followers")
        params["min_followers"] = args.min_followers
    if platforms_sql is not None:
        assignments.append(f"required_platforms = {platforms_sql}")
    if not assignments:
        raise SystemExit("Nothing to update. Pass --budget, --min-followers, or --platforms.")

    async with AsyncSessionLocal() as session:
        campaign_id = await _find_campaign_id(
            session,
            campaign_id=args.campaign_id,
            title=args.title,
            status=args.status,
        )
        if not campaign_id:
            raise SystemExit("Campaign not found.")

        params["campaign_id"] = campaign_id
        await session.execute(
            text(f"""
                UPDATE campaigns
                SET {", ".join(assignments)}
                WHERE id = :campaign_id
            """),
            params,
        )
        await session.execute(
            text("DELETE FROM ai_match_scores WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id},
        )
        await session.commit()

        result = await session.execute(
            text("""
                SELECT title, budget_per_creator_max, creator_min_followers, required_platforms
                FROM campaigns
                WHERE id = :campaign_id
            """),
            {"campaign_id": campaign_id},
        )
        title, budget, min_followers, platforms = result.one()
        print(f"Updated campaign: {title} ({campaign_id})")
        print(f"Budget max: {budget}")
        print(f"Min followers: {min_followers}")
        print(f"Platforms: {', '.join(platforms or [])}")
        print("Cleared old AI matches. Run matching again from the UI.")


if __name__ == "__main__":
    asyncio.run(main())
