import asyncio
from app.database import AsyncSessionLocal
from app.services.llm_matching import get_and_generate_matches
from sqlalchemy import text
from app.brands.models import BrandProfile # Fixed the missing BrandProfile error in script

async def test():
    async with AsyncSessionLocal() as session:
        # Get first campaign ID
        res = await session.execute(text("SELECT id FROM campaigns LIMIT 1"))
        campaign_id = res.scalar_one_or_none()
        if not campaign_id:
            print("No campaigns found")
            return
        
        print(f"Running match for campaign: {campaign_id}")
        matches = await get_and_generate_matches(session, campaign_id)
        print(f"Generated {len(matches)} matches")
        for m in matches:
            print(f"Score: {m.score_total}, Rationale: {m.rationale}")

if __name__ == "__main__":
    asyncio.run(test())
