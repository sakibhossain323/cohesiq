import argparse
import asyncio
import uuid
from collections import Counter

from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

from app.auth import models as auth_models  # noqa: F401
from app.brands import models as brand_models  # noqa: F401
from app.campaigns import models as campaign_models  # noqa: F401
from app.campaigns.service import (
    _passes_budget_gate,
    _select_matching_social_profile,
    get_campaign,
)
from app.common.models import Niche
from app.creators.models import CreatorProfile
from app.database import AsyncSessionLocal
from app.services.matching import score_niche


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Explain why creators pass or fail campaign matching gates."
    )
    parser.add_argument("--campaign-id", help="Campaign UUID to inspect.")
    parser.add_argument(
        "--title",
        help="Find the latest campaign whose title contains this text.",
    )
    parser.add_argument(
        "--status",
        default="active",
        help="Prefer campaigns with this status when searching by title. Use 'any' to disable.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Number of creators to print from each section.",
    )
    return parser.parse_args()


async def _find_campaign_id(
    session,
    *,
    campaign_id: str | None,
    title: str | None,
    status: str,
):
    if campaign_id:
        return uuid.UUID(campaign_id)
    if title:
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

    result = await session.execute(
        select(campaign_models.Campaign.id)
        .order_by(campaign_models.Campaign.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def main() -> None:
    args = _parse_args()
    async with AsyncSessionLocal() as session:
        campaign_id = await _find_campaign_id(
            session,
            campaign_id=args.campaign_id,
            title=args.title,
            status=args.status,
        )
        if not campaign_id:
            raise SystemExit("No campaign found. Pass --campaign-id or --title.")

        campaign = await get_campaign(session, campaign_id)
        if not campaign:
            raise SystemExit(f"Campaign not found: {campaign_id}")

        niches_result = await session.execute(select(Niche))
        niche_map = {n.id: n.name for n in niches_result.scalars().all()}
        campaign_niche = niche_map.get(campaign.primary_niche_id, "general")
        campaign_plats = campaign.required_platforms or []
        min_followers = campaign.creator_min_followers or 0
        max_followers = campaign.creator_max_followers

        creators_result = await session.execute(
            select(CreatorProfile).options(
                selectinload(CreatorProfile.niches),
                selectinload(CreatorProfile.social_profiles),
                selectinload(CreatorProfile.rate_cards),
            )
        )
        creators = list(creators_result.scalars().all())

        print(f"Campaign: {campaign.title} ({campaign.id})")
        print(f"Niche: {campaign_niche}")
        print(f"Platforms: {', '.join(campaign_plats) or 'Any'}")
        print(f"Budget max: {campaign.budget_per_creator_max}")
        print(f"Follower range: {min_followers} - {max_followers or 'unbounded'}")
        print(f"Creators inspected: {len(creators)}")

        reject_counts: Counter[str] = Counter()
        passed = []
        nearest = []

        for creator in creators:
            reasons = []
            if not creator.is_available or creator.deleted_at is not None:
                reasons.append("unavailable")

            primary_niche = "general"
            sub_niches = []
            for creator_niche in creator.niches:
                niche_name = niche_map.get(creator_niche.niche_id, "general")
                if creator_niche.is_primary:
                    primary_niche = niche_name
                else:
                    sub_niches.append(niche_name)

            primary_profile = _select_matching_social_profile(
                creator.social_profiles,
                campaign_plats,
            )
            follower_count = primary_profile.follower_count if primary_profile else 0
            follower_count = follower_count or 0
            creator_platforms = [profile.platform for profile in creator.social_profiles]

            creator_rate = None
            for rate_card in creator.rate_cards:
                if rate_card.platform in campaign_plats:
                    creator_rate = rate_card.price_bdt
                    break
            if creator_rate is None:
                creator_rate = creator.min_budget

            if campaign_plats and not any(p in creator_platforms for p in campaign_plats):
                reasons.append("platform_mismatch")
            if follower_count < min_followers:
                reasons.append("below_min_followers")
            if max_followers and follower_count > max_followers:
                reasons.append("above_max_followers")
            if not _passes_budget_gate(
                campaign.budget_per_creator_max,
                creator_rate,
                follower_count,
            ):
                reasons.append("over_budget")

            niche_score = score_niche(campaign_niche, primary_niche, sub_niches)
            if niche_score <= 0.0 and campaign_niche.lower() not in ("general", "unknown", "other"):
                reasons.append("niche_mismatch")

            row = {
                "name": creator.display_name,
                "followers": follower_count,
                "platforms": ",".join(creator_platforms) or "-",
                "niche": primary_niche,
                "sub_niches": ",".join(sub_niches) or "-",
                "rate": creator_rate or "-",
                "niche_score": niche_score,
                "reasons": reasons,
            }
            if reasons:
                reject_counts.update(reasons)
                nearest.append(row)
            else:
                passed.append(row)

        print("\nReject counts:")
        if reject_counts:
            for reason, count in reject_counts.most_common():
                print(f"- {reason}: {count}")
        else:
            print("- none")

        def print_rows(title: str, rows: list[dict]) -> None:
            print(f"\n{title}:")
            if not rows:
                print("- none")
                return
            rows = sorted(
                rows,
                key=lambda row: (row["niche_score"], row["followers"]),
                reverse=True,
            )
            for row in rows[: max(args.limit, 0)]:
                reason_text = ", ".join(row["reasons"]) if row["reasons"] else "passes"
                print(
                    f"- {row['name']} | niche={row['niche']} | "
                    f"followers={row['followers']} | platforms={row['platforms']} | "
                    f"rate={row['rate']} | {reason_text}"
                )

        print_rows("Passing creators", passed)
        print_rows("Nearest rejected creators", nearest)


if __name__ == "__main__":
    asyncio.run(main())
