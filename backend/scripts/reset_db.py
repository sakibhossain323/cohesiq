import os
import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def reset_db():
    print("Starting database reset...")
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(
            "SELECT tablename FROM pg_tables "
            "WHERE schemaname = 'public' AND tablename != 'alembic_version'"
        ))
        tables = [row[0] for row in result]
        if tables:
            table_list = ", ".join(f'"{t}"' for t in tables)
            print(f"Truncating {len(tables)} tables...")
            await session.execute(text(f"TRUNCATE TABLE {table_list} CASCADE"))
        await session.commit()
        print("Database has been completely reset.")

if __name__ == "__main__":
    asyncio.run(reset_db())
