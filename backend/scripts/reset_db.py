import os
import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def reset_db():
    print("Starting database reset...")
    async with AsyncSessionLocal() as session:
        # Drop everything cascaded
        print("Truncating tables...")
        await session.execute(text("""
            TRUNCATE TABLE 
                brand_profiles, 
                creator_profiles, 
                campaigns,
                users
            CASCADE;
        """))
        await session.commit()
        print("Database has been completely reset.")

if __name__ == "__main__":
    asyncio.run(reset_db())
