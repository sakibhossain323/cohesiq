import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.config import settings
from app.models import Campaign, BrandProfile

async def run():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession)
    async with async_session() as s:
        res1 = await s.execute(select(BrandProfile.id, BrandProfile.brand_name))
        brands = res1.all()
        res2 = await s.execute(select(Campaign.id, Campaign.title, Campaign.status, Campaign.brand_id))
        camps = res2.all()
        print('Brands:', brands)
        print('Campaigns:', camps)

asyncio.run(run())
