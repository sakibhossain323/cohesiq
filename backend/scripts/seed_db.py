import asyncio
import random
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Import your application's database setup and models
from app.database import AsyncSessionLocal
from app.auth.models import User
from app.auth.service import hash_password
from app.creators.models import (
    CreatorProfile,
    CreatorSocialProfile,
    CreatorNiche,
    CreatorLanguage,
    CreatorRateCard,
)
from app.brands.models import BrandProfile
from app.campaigns.models import Campaign, CampaignApplication
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import Base

class Niche(Base):
    __tablename__ = "niches"
    __table_args__ = {'extend_existing': True}
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    slug: Mapped[str] = mapped_column(String)

class Language(Base):
    __tablename__ = "languages"
    __table_args__ = {'extend_existing': True}
    code: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)


# Define comprehensive mock data arrays to ensure a diverse dataset
NICHES = [
    "technology", "fashion", "food", "travel", "lifestyle", 
    "finance", "gaming", "education", "health", "beauty", 
    "fitness", "entertainment", "sports"
]

LANGUAGES = ["en", "bn"]

CITIES = ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barisal"]

PLATFORMS = ["youtube", "instagram", "tiktok", "facebook"]

MOCK_CREATORS = [
    {"first_name": "Ayesha", "last_name": "Rahman", "gender": "female"},
    {"first_name": "Karim", "last_name": "Hossain", "gender": "male"},
    {"first_name": "Sadia", "last_name": "Islam", "gender": "female"},
    {"first_name": "Arif", "last_name": "Khan", "gender": "male"},
    {"first_name": "Nusrat", "last_name": "Jahan", "gender": "female"},
    {"first_name": "Rohan", "last_name": "Ahmed", "gender": "male"},
    {"first_name": "Fatima", "last_name": "Begum", "gender": "female"},
    {"first_name": "Tanvir", "last_name": "Chowdhury", "gender": "male"},
    {"first_name": "Mehzabin", "last_name": "Akter", "gender": "female"},
    {"first_name": "Sakib", "last_name": "Hasan", "gender": "male"},
]

MOCK_BRANDS = [
    {"name": "TechCorp BD", "niche": "technology"},
    {"name": "StyleHub Dhaka", "niche": "fashion"},
    {"name": "Foodie Delights", "niche": "food"},
    {"name": "Wanderlust Travels", "niche": "travel"},
    {"name": "FitLife BD", "niche": "fitness"},
    {"name": "EduTech Solutions", "niche": "education"},
]

async def clear_database(db: AsyncSession):
    print("Clearing existing data...")
    # Clean up tables (order matters due to foreign keys)
    tables = [
        "campaign_applications", "campaign_deliverable_requirements", 
        "campaign_language_targets", "campaign_niche_targets", "campaigns",
        "creator_rate_cards", "creator_languages", "creator_niches", 
        "creator_social_profiles", "creator_profiles", "brand_profiles", "users"
    ]
    for table in tables:
        await db.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
    await db.commit()
    print("Database cleared.")

async def seed_niches_and_languages(db: AsyncSession):
    print("Seeding niches and languages...")
    # Insert Niches
    for i, niche in enumerate(NICHES, start=1):
        await db.execute(text(
            "INSERT INTO niches (id, name, slug) VALUES (:id, :name, :slug) ON CONFLICT (id) DO NOTHING"
        ), {"id": i, "name": niche, "slug": niche.lower().replace(" ", "-")})
    
    # Insert Languages
    for code in LANGUAGES:
        await db.execute(text(
            "INSERT INTO languages (code, name) VALUES (:code, :name) ON CONFLICT (code) DO NOTHING"
        ), {"code": code, "name": code.upper()})
    
    await db.commit()

async def seed_creators(db: AsyncSession, num_creators=50):
    print(f"Seeding {num_creators} creators...")
    password_hash = hash_password("password123")
    creators = []
    
    # Fetch niche IDs
    result = await db.execute(text("SELECT id, name FROM niches"))
    niche_map = {row.name: row.id for row in result.fetchall()}
    
    for i in range(num_creators):
        base_name = random.choice(MOCK_CREATORS)
        email = f"creator{i}_{random.randint(1000, 9999)}@example.com"
        
        user = User(
            email=email,
            password_hash=password_hash,
            role="creator",
            is_active=True
        )
        db.add(user)
        await db.flush()
        
        primary_niche = random.choice(NICHES)
        
        creator_profile = CreatorProfile(
            user_id=user.id,
            display_name=f"{base_name['first_name']} {base_name['last_name']}",
            full_name=f"{base_name['first_name']} {base_name['last_name']}",
            bio=f"Passionate content creator focusing on {primary_niche}.",
            tagline=f"Bringing {primary_niche} to life!",
            city=random.choice(CITIES),
            gender=base_name['gender'],
            is_available=random.choice([True, True, True, False]), # 75% availability
            min_budget=random.choice([1000, 2000, 5000, 10000]),
            total_collaborations=random.randint(0, 50),
            average_rating=round(random.uniform(3.5, 5.0), 1) if random.random() > 0.3 else None
        )
        db.add(creator_profile)
        await db.flush()
        
        # Niches
        niche_ids = random.sample(list(niche_map.values()), k=random.randint(1, 3))
        for idx, n_id in enumerate(niche_ids):
            cn = CreatorNiche(creator_id=creator_profile.id, niche_id=n_id, is_primary=(idx == 0))
            db.add(cn)
            
        # Languages
        lang_codes = random.sample(LANGUAGES, k=random.randint(1, len(LANGUAGES)))
        for idx, code in enumerate(lang_codes):
            cl = CreatorLanguage(creator_id=creator_profile.id, language_code=code, is_primary=(idx == 0))
            db.add(cl)
            
        # Social Profiles (1 to 3 platforms)
        platforms = random.sample(PLATFORMS, k=random.randint(1, 3))
        for idx, plat in enumerate(platforms):
            followers = random.randint(1000, 500000)
            sp = CreatorSocialProfile(
                creator_id=creator_profile.id,
                platform=plat,
                handle=f"@{base_name['first_name'].lower()}_{plat}",
                profile_url=f"https://{plat}.com/{base_name['first_name'].lower()}",
                follower_count=followers,
                avg_views_per_post=int(followers * random.uniform(0.1, 0.5)),
                engagement_rate=random.uniform(0.01, 0.15),
                is_primary_platform=(idx == 0)
            )
            db.add(sp)
            
        creators.append(creator_profile)
        
    await db.commit()
    return creators

async def seed_brands(db: AsyncSession):
    print("Seeding brands...")
    password_hash = hash_password("password123")
    brands = []
    
    result = await db.execute(text("SELECT id, name FROM niches"))
    niche_map = {row.name: row.id for row in result.fetchall()}
    
    for i, b_data in enumerate(MOCK_BRANDS):
        email = f"brand{i}@example.com"
        user = User(
            email=email,
            password_hash=password_hash,
            role="brand",
            is_active=True
        )
        db.add(user)
        await db.flush()
        
        brand = BrandProfile(
            user_id=user.id,
            brand_name=b_data["name"],
            description=f"Leading brand in the {b_data['niche']} space.",
            website=f"https://www.{b_data['name'].lower().replace(' ', '')}.com",
            city=random.choice(CITIES),
            niche_id=niche_map.get(b_data["niche"]),
            is_verified=random.choice([True, False]),
            total_campaigns=random.randint(1, 20)
        )
        db.add(brand)
        brands.append(brand)
        
    await db.commit()
    return brands

async def seed_campaigns(db: AsyncSession, brands: list):
    print("Seeding campaigns...")
    campaigns = []
    
    result = await db.execute(text("SELECT id, name FROM niches"))
    niche_map = {row.name: row.id for row in result.fetchall()}
    
    for brand in brands:
        num_campaigns = random.randint(1, 5)
        for _ in range(num_campaigns):
            budget_max = random.randint(5000, 50000)
            budget_min = int(budget_max * 0.5)
            status = random.choice(["active", "active", "in_progress", "completed", "draft"])
            niche_name = random.choice(NICHES)
            
            campaign = Campaign(
                brand_id=brand.id,
                title=f"{brand.brand_name} - {niche_name.capitalize()} Campaign",
                description=f"Looking for amazing creators to promote our new {niche_name} line.",
                primary_niche_id=niche_map.get(niche_name),
                required_platforms=random.sample(PLATFORMS, k=random.randint(1, 2)),
                budget_per_creator_min=budget_min,
                budget_per_creator_max=budget_max,
                creator_min_followers=random.choice([1000, 5000, 10000, 50000]),
                target_cities=[random.choice(CITIES)],
                number_of_creators=random.randint(1, 10),
                status=status
            )
            db.add(campaign)
            campaigns.append(campaign)
            
    await db.commit()
    return campaigns

async def seed_applications(db: AsyncSession, campaigns: list, creators: list):
    print("Seeding applications...")
    statuses = ["pending", "shortlisted", "accepted", "rejected", "completed"]
    
    for campaign in campaigns:
        if campaign.status == "draft":
            continue
            
        num_applicants = random.randint(0, min(10, len(creators)))
        applicants = random.sample(creators, k=num_applicants)
        
        for creator in applicants:
            app = CampaignApplication(
                campaign_id=campaign.id,
                creator_id=creator.id,
                proposed_rate=random.randint(
                    campaign.budget_per_creator_min or 1000, 
                    campaign.budget_per_creator_max
                ),
                proposal_text="I would love to work on this campaign! I have a highly engaged audience.",
                status=random.choice(statuses)
            )
            db.add(app)
            
    await db.commit()

async def main():
    async with AsyncSessionLocal() as db:
        await clear_database(db)
        await seed_niches_and_languages(db)
        creators = await seed_creators(db, num_creators=100)
        brands = await seed_brands(db)
        campaigns = await seed_campaigns(db, brands)
        await seed_applications(db, campaigns, creators)
        
        print(f"Successfully seeded:")
        print(f"- {len(creators)} creators")
        print(f"- {len(brands)} brands")
        print(f"- {len(campaigns)} campaigns")
        print("Data population complete!")

if __name__ == "__main__":
    asyncio.run(main())
