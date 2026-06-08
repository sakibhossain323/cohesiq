import asyncio

from sqlalchemy import func, select

from app.auth.models import User  # noqa: F401 - registers ORM relationships
from app.brands.models import BrandProfile
from app.campaigns.models import Campaign, CampaignDeliverableRequirement
from app.creators.models import CreatorProfile, CreatorRateCard
from app.database import AsyncSessionLocal


async def run() -> None:
    async with AsyncSessionLocal() as session:
        brand_count = await session.scalar(select(func.count()).select_from(BrandProfile))
        campaign_count = await session.scalar(select(func.count()).select_from(Campaign))
        creator_count = await session.scalar(select(func.count()).select_from(CreatorProfile))
        rate_card_count = await session.scalar(select(func.count()).select_from(CreatorRateCard))

        campaign_deliverables = (
            await session.execute(
                select(
                    CampaignDeliverableRequirement.platform,
                    CampaignDeliverableRequirement.deliverable_code,
                    func.count(),
                )
                .group_by(
                    CampaignDeliverableRequirement.platform,
                    CampaignDeliverableRequirement.deliverable_code,
                )
                .order_by(CampaignDeliverableRequirement.platform)
            )
        ).all()

        creator_rate_cards = (
            await session.execute(
                select(
                    CreatorRateCard.platform,
                    CreatorRateCard.deliverable_code,
                    func.count(),
                )
                .group_by(CreatorRateCard.platform, CreatorRateCard.deliverable_code)
                .order_by(CreatorRateCard.platform)
            )
        ).all()

        recent_campaigns = (
            await session.execute(
                select(Campaign.id, Campaign.title, Campaign.status)
                .order_by(Campaign.created_at.desc())
                .limit(5)
            )
        ).all()

        print(f"Brands: {brand_count or 0}")
        print(f"Creators: {creator_count or 0}")
        print(f"Campaigns: {campaign_count or 0}")
        print(f"Creator rate cards: {rate_card_count or 0}")
        print("Campaign deliverable codes:")
        for platform, code, count in campaign_deliverables:
            print(f"  {platform}: {code or 'legacy_unmapped'} = {count}")
        print("Creator rate card deliverable codes:")
        for platform, code, count in creator_rate_cards:
            print(f"  {platform}: {code or 'legacy_unmapped'} = {count}")
        print("Recent campaigns:")
        for campaign_id, title, status in recent_campaigns:
            print(f"  {campaign_id} | {status} | {title}")


if __name__ == "__main__":
    asyncio.run(run())
