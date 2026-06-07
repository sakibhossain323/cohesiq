import os
import json
import uuid
import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

BRAND_CATEGORY_BY_INDUSTRY = {
    "technology": "electronics",
    "food": "food_beverage",
    "travel": "home_lifestyle",
    "fashion": "fashion",
    "beauty": "fashion",
    "lifestyle": "home_lifestyle",
    "gaming": "gaming",
    "education": "edtech",
    "fitness": "health_wellness",
    "entertainment": "media_entertainment",
    "news": "media_entertainment",
    "finance": "finance",
    "sports": "sports",
}

VALID_BRAND_CATEGORIES = {
    "food_beverage",
    "stationery",
    "edtech",
    "electronics",
    "fashion",
    "sports",
    "gaming",
    "health_wellness",
    "finance",
    "telecom",
    "media_entertainment",
    "home_lifestyle",
}


def normalize_brand_category(b_data: dict) -> str:
    explicit = (b_data.get("brand_category") or "").strip().lower().replace("-", "_").replace(" ", "_")
    if explicit in VALID_BRAND_CATEGORIES:
        return explicit

    industry = (b_data.get("industry") or "Lifestyle").strip().lower()
    return BRAND_CATEGORY_BY_INDUSTRY.get(industry, "home_lifestyle")

async def seed_db():
    print("Starting database seeding...")
    include_static_creators = os.getenv("SEED_INCLUDE_STATIC_CREATORS", "").strip().lower() in {
        "1",
        "true",
        "yes",
    }
    
    # Try to load real creators
    real_creators = []
    synth_creators = []
    if include_static_creators:
        try:
            with open(os.path.join(DATA_DIR, "real_creators.json"), "r", encoding="utf-8") as f:
                real_creators = json.load(f)
        except FileNotFoundError:
            real_creators = []
        
        # Try to load synthetic creators
        try:
            with open(os.path.join(DATA_DIR, "synthetic_creators.json"), "r", encoding="utf-8") as f:
                synth_creators = json.load(f)
        except FileNotFoundError:
            synth_creators = []
    else:
        print("Skipping static creator JSON; run real YouTube/Instagram/TikTok seeders for API-sourced creators.")
        
    creators_data = real_creators + synth_creators
    
    # Load brands
    try:
        with open(os.path.join(DATA_DIR, "brands.json"), "r", encoding="utf-8") as f:
            brands_data = json.load(f)
    except FileNotFoundError:
        brands_data = []
        
    async with AsyncSessionLocal() as session:
        # 1. Purge business data
        print("Purging existing business data...")
        await session.execute(text("TRUNCATE TABLE brand_profiles, creator_profiles CASCADE;"))
        
        # 2. Seed Lookups
        print("Seeding lookups...")
        await session.execute(text("""
            INSERT INTO languages (code, name, native_name) VALUES
            ('bn', 'Bengali', 'বাংলা'),
            ('en', 'English', 'English')
            ON CONFLICT (code) DO NOTHING;
        """))
        
        niches = [
            "Technology", "Food", "Travel", "Fashion", "Beauty", 
            "Lifestyle", "Gaming", "Education", "Fitness", "Entertainment"
        ]
        for niche in niches:
            await session.execute(
                text("INSERT INTO niches (name, slug) VALUES (:name, :slug) ON CONFLICT (name) DO NOTHING;"),
                {"name": niche, "slug": niche.lower().replace(" ", "-")}
            )
            
        await session.commit()
        
        # Helper to get niche_id
        result = await session.execute(text("SELECT id, name FROM niches"))
        niche_map = {row.name.lower(): row.id for row in result}
        
        # 3. Fetch test users
        print("Mapping test users...")
        users_result = await session.execute(text("SELECT id, email, role FROM users"))
        users = [{"id": row.id, "email": row.email, "role": row.role} for row in users_result]
        
        # Separate generated data
        available_brands = list(brands_data)
        available_creators = list(creators_data)
        
        # First map to test users
        for u in users:
            if "brand" in u["role"].lower() and available_brands:
                b = available_brands.pop(0)
                await insert_brand(session, u["id"], b, niche_map)
            elif "creator" in u["role"].lower() and available_creators:
                c = available_creators.pop(0)
                await insert_creator(session, u["id"], c, niche_map)
                
        # Insert remaining as dummy users
        print("Inserting remaining brand data as dummy users...")
        for i, b in enumerate(available_brands):
            dummy_email = f"dummy_brand_{i}@test.com"
            dummy_clerk_id = f"dummy_clerk_b_{uuid.uuid4().hex[:8]}"
            await session.execute(
                text("INSERT INTO users (clerk_id, email, role) VALUES (:cid, :email, 'brand') ON CONFLICT DO NOTHING"),
                {"cid": dummy_clerk_id, "email": dummy_email}
            )
            u_res = await session.execute(text("SELECT id FROM users WHERE email = :e"), {"e": dummy_email})
            u_id = u_res.scalar()
            await insert_brand(session, u_id, b, niche_map)
            
        if include_static_creators:
            print("Inserting remaining static creator data as dummy users...")
            for i, c in enumerate(available_creators):
                dummy_email = f"dummy_creator_{i}@test.com"
                dummy_clerk_id = f"dummy_clerk_c_{uuid.uuid4().hex[:8]}"
                await session.execute(
                    text("INSERT INTO users (clerk_id, email, role) VALUES (:cid, :email, 'creator') ON CONFLICT DO NOTHING"),
                    {"cid": dummy_clerk_id, "email": dummy_email}
                )
                u_res = await session.execute(text("SELECT id FROM users WHERE email = :e"), {"e": dummy_email})
                u_id = u_res.scalar()
                await insert_creator(session, u_id, c, niche_map)
            
        await session.commit()
        print("Database seeded successfully!")

async def insert_brand(session, user_id, b_data, niche_map):
    # Insert brand profile
    brand_category = normalize_brand_category(b_data)
    await session.execute(text("""
        INSERT INTO brand_profiles (user_id, brand_name, logo_url, description, brand_category)
        VALUES (:user_id, :name, :logo, :desc, :brand_category)
        ON CONFLICT (user_id) DO UPDATE
        SET brand_name = EXCLUDED.brand_name,
            logo_url = EXCLUDED.logo_url,
            description = EXCLUDED.description,
            brand_category = EXCLUDED.brand_category
    """), {
        "user_id": user_id, "name": b_data.get("name", "Unknown"), 
        "logo": b_data.get("logo_url", ""), "desc": b_data.get("description", ""),
        "brand_category": brand_category,
    })
    
    # Get brand id
    b_res = await session.execute(text("SELECT id FROM brand_profiles WHERE user_id = :uid"), {"uid": user_id})
    brand_id = b_res.scalar()
    
    if not brand_id:
        return
        
    # Create an active campaign
    niche_name = b_data.get("industry", "Lifestyle").lower()
    niche_id = niche_map.get(niche_name, niche_map.get("lifestyle"))
    
    # Campaign 1: Active, high budget
    await session.execute(text("""
        INSERT INTO campaigns (brand_id, title, description, primary_niche_id, brand_category, budget_per_creator_max, status, visibility)
        VALUES (:bid, :title, :desc, :nid, :brand_category, 100000, 'active', 'public')
    """), {
        "bid": brand_id,
        "title": f"Looking for {niche_name} influencers for {b_data.get('name', 'brand')}",
        "desc": f"We are launching a new flagship product and need top {niche_name} influencers to create high-quality videos.",
        "nid": niche_id,
        "brand_category": brand_category,
    })
    
    # Campaign 2: Active, lower budget
    await session.execute(text("""
        INSERT INTO campaigns (brand_id, title, description, primary_niche_id, brand_category, budget_per_creator_max, status, visibility)
        VALUES (:bid, :title, :desc, :nid, :brand_category, 15000, 'active', 'public')
    """), {
        "bid": brand_id,
        "title": f"Micro-influencers for {b_data.get('name', 'brand')} UGC",
        "desc": f"Seeking authentic user-generated content from smaller creators.",
        "nid": niche_map.get("lifestyle", niche_id),
        "brand_category": brand_category,
    })
    
    # Campaign 3: Archived
    await session.execute(text("""
        INSERT INTO campaigns (brand_id, title, description, primary_niche_id, brand_category, budget_per_creator_max, status, visibility)
        VALUES (:bid, :title, :desc, :nid, :brand_category, 30000, 'archived', 'private')
    """), {
        "bid": brand_id,
        "title": f"Past campaign: {b_data.get('name', 'brand')} Summer Sale",
        "desc": f"This campaign is now closed.",
        "nid": niche_id,
        "brand_category": brand_category,
    })

async def insert_creator(session, user_id, c_data, niche_map):
    # Insert creator profile
    await session.execute(text("""
        INSERT INTO creator_profiles (user_id, display_name, profile_photo_url, bio, city)
        VALUES (:uid, :name, :photo, :bio, :city)
        ON CONFLICT (user_id) DO NOTHING
    """), {
        "uid": user_id, "name": c_data.get("display_name", "Unknown"),
        "photo": c_data.get("profile_photo_url", ""), "bio": c_data.get("bio", ""),
        "city": c_data.get("city", "Dhaka")
    })
    
    c_res = await session.execute(text("SELECT id FROM creator_profiles WHERE user_id = :uid"), {"uid": user_id})
    creator_id = c_res.scalar()
    
    if not creator_id:
        return
        
    niche_name = c_data.get("niche", "Lifestyle").lower()
    niche_id = niche_map.get(niche_name, niche_map.get("lifestyle"))
    
    # Insert niche
    if niche_id:
        await session.execute(text("""
            INSERT INTO creator_niches (creator_id, niche_id, is_primary)
            VALUES (:cid, :nid, true) ON CONFLICT DO NOTHING
        """), {"cid": creator_id, "nid": niche_id})
        
    # Insert social profile (Primary)
    platform1 = c_data.get("platform", "youtube").lower()
    followers1 = c_data.get("follower_count", 10000)
    await session.execute(text("""
        INSERT INTO creator_social_profiles (creator_id, platform, handle, profile_url, follower_count, is_primary_platform)
        VALUES (:cid, :platform, :handle, :url, :followers, true)
        ON CONFLICT DO NOTHING
    """), {
        "cid": creator_id,
        "platform": platform1,
        "handle": c_data.get("display_name", "").lower().replace(" ", "_"),
        "url": f"https://{platform1}.com/{c_data.get('display_name', '').lower().replace(' ', '')}",
        "followers": followers1
    })
    
    # Insert secondary profile to make test data richer
    platform2 = "instagram" if platform1 == "youtube" else "youtube"
    followers2 = int(followers1 * 0.4) # arbitrary variation
    await session.execute(text("""
        INSERT INTO creator_social_profiles (creator_id, platform, handle, profile_url, follower_count, is_primary_platform)
        VALUES (:cid, :platform, :handle, :url, :followers, false)
        ON CONFLICT DO NOTHING
    """), {
        "cid": creator_id,
        "platform": platform2,
        "handle": c_data.get("display_name", "").lower().replace(" ", "_"),
        "url": f"https://{platform2}.com/{c_data.get('display_name', '').lower().replace(' ', '')}",
        "followers": followers2
    })

if __name__ == "__main__":
    asyncio.run(seed_db())
