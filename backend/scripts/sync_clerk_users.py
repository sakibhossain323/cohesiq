import os
import asyncio
import httpx
from dotenv import load_dotenv
from sqlalchemy import text
from app.database import AsyncSessionLocal

load_dotenv(dotenv_path=".env")

CLERK_API_URL = "https://api.clerk.com/v1/users"

async def fetch_clerk_users():
    secret_key = os.environ.get("CLERK_SECRET_KEY")
    if not secret_key:
        print("Error: CLERK_SECRET_KEY missing in backend/.env")
        return []
        
    print("Fetching users from Clerk API...")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            CLERK_API_URL,
            headers={"Authorization": f"Bearer {secret_key}"}
        )
        response.raise_for_status()
        users = response.json()
        print(f"Fetched {len(users)} users from Clerk.")
        return users

async def sync_users():
    clerk_users = await fetch_clerk_users()
    
    async with AsyncSessionLocal() as session:
        for user in clerk_users:
            clerk_id = user["id"]
            email = None
            if user.get("email_addresses"):
                email = user["email_addresses"][0]["email_address"]
            
            if not email:
                continue
                
            # Assign role
            role = "creator" # default
            if "@test.com" in email:
                if email.startswith("b"):
                    role = "brand"
                elif email.startswith("c"):
                    role = "creator"
            elif "brand" in email:
                role = "brand"
                
            print(f"Upserting user {email} as {role}...")
            
            # Upsert user
            query = text("""
                INSERT INTO users (clerk_id, email, role)
                VALUES (:clerk_id, :email, :role)
                ON CONFLICT (clerk_id) DO UPDATE SET 
                    email = EXCLUDED.email,
                    role = EXCLUDED.role;
            """)
            await session.execute(query, {"clerk_id": clerk_id, "email": email, "role": role})
            
        await session.commit()
        print("Clerk users synced to database successfully.")

if __name__ == "__main__":
    asyncio.run(sync_users())
