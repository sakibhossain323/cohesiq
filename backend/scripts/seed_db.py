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

REAL_BANGLADESHI_CREATORS = [
    {
        "display_name": "Rakib Hossain",
        "full_name": "Rakib Hossain",
        "gender": "male",
        "primary_niche": "travel",
        "sub_niches": ["lifestyle", "entertainment"],
        "bio": "Top vlogger from Bangladesh sharing adventure travel, vlogs, and lifestyle content.",
        "tagline": "Living life to the absolute fullest!",
        "min_budget": 50000,
        "is_identity_verified": True,
        "social_profiles": [
            {
                "platform": "youtube",
                "handle": "@RakibHossain",
                "profile_url": "https://youtube.com/@RakibHossain",
                "follower_count": 3400000,
                "engagement_rate": 0.045,
                "is_primary_platform": True
            },
            {
                "platform": "facebook",
                "handle": "RakibHossainOfficial",
                "profile_url": "https://facebook.com/RakibHossainOfficial",
                "follower_count": 5000000,
                "engagement_rate": 0.035,
                "is_primary_platform": False
            }
        ],
        "rate_cards": [
            {"platform": "youtube", "deliverable_type": "dedicated_video", "price_bdt": 120000},
            {"platform": "youtube", "deliverable_type": "integrated_mention", "price_bdt": 60000}
        ]
    },
    {
        "display_name": "Rafsan The Chotobhai",
        "full_name": "Iftekhar Rafsan",
        "gender": "male",
        "primary_niche": "food",
        "sub_niches": ["lifestyle", "travel"],
        "bio": "Food reviewer, traveler, and entertainer. Showing the best eats and sights around BD.",
        "tagline": "Eat, travel, repeat!",
        "min_budget": 40000,
        "is_identity_verified": True,
        "social_profiles": [
            {
                "platform": "youtube",
                "handle": "@RafsanTheChotobhai",
                "profile_url": "https://youtube.com/@RafsanTheChotobhai",
                "follower_count": 1800000,
                "engagement_rate": 0.052,
                "is_primary_platform": True
            },
            {
                "platform": "instagram",
                "handle": "@rafsanthechotobhai",
                "profile_url": "https://instagram.com/rafsanthechotobhai",
                "follower_count": 800000,
                "engagement_rate": 0.065,
                "is_primary_platform": False
            }
        ],
        "rate_cards": [
            {"platform": "youtube", "deliverable_type": "dedicated_video", "price_bdt": 100000},
            {"platform": "instagram", "deliverable_type": "photo_post", "price_bdt": 35000}
        ]
    },
    {
        "display_name": "Ayman Sadiq",
        "full_name": "Ayman Sadiq",
        "gender": "male",
        "primary_niche": "education",
        "sub_niches": ["technology", "finance"],
        "bio": "Founder of 10 Minute School. Helping millions learn, grow, and achieve their career dreams.",
        "tagline": "Empowering minds, one class at a time.",
        "min_budget": 60000,
        "is_identity_verified": True,
        "social_profiles": [
            {
                "platform": "youtube",
                "handle": "@AymanSadiq",
                "profile_url": "https://youtube.com/@AymanSadiq",
                "follower_count": 2500000,
                "engagement_rate": 0.038,
                "is_primary_platform": True
            },
            {
                "platform": "facebook",
                "handle": "aymansadiq10ms",
                "profile_url": "https://facebook.com/aymansadiq10ms",
                "follower_count": 4500000,
                "engagement_rate": 0.029,
                "is_primary_platform": False
            }
        ],
        "rate_cards": [
            {"platform": "youtube", "deliverable_type": "dedicated_video", "price_bdt": 150000},
            {"platform": "facebook", "deliverable_type": "integrated_mention", "price_bdt": 75000}
        ]
    },
    {
        "display_name": "Khalid Farhan",
        "full_name": "Khalid Farhan",
        "gender": "male",
        "primary_niche": "finance",
        "sub_niches": ["education", "technology"],
        "bio": "Digital marketer and passive income expert sharing business models, investing, and freelancing tips.",
        "tagline": "Decoding the digital economy.",
        "min_budget": 30000,
        "is_identity_verified": True,
        "social_profiles": [
            {
                "platform": "youtube",
                "handle": "@khalidfarhan",
                "profile_url": "https://youtube.com/@khalidfarhan",
                "follower_count": 600000,
                "engagement_rate": 0.048,
                "is_primary_platform": True
            }
        ],
        "rate_cards": [
            {"platform": "youtube", "deliverable_type": "dedicated_video", "price_bdt": 80000}
        ]
    },
    {
        "display_name": "Shahnaz Shimul",
        "full_name": "Shahnaz Shimul",
        "gender": "female",
        "primary_niche": "beauty",
        "sub_niches": ["fashion", "lifestyle"],
        "bio": "Beauty blogger and fashion influencer sharing makeup tutorials, skincare routines, and styling.",
        "tagline": "Beauty, fashion, and lifestyle inspiration.",
        "min_budget": 25000,
        "is_identity_verified": True,
        "social_profiles": [
            {
                "platform": "youtube",
                "handle": "@ShahnazShimul",
                "profile_url": "https://youtube.com/@ShahnazShimul",
                "follower_count": 800000,
                "engagement_rate": 0.041,
                "is_primary_platform": True
            },
            {
                "platform": "instagram",
                "handle": "@shahnaz_shimul",
                "profile_url": "https://instagram.com/shahnaz_shimul",
                "follower_count": 400000,
                "engagement_rate": 0.055,
                "is_primary_platform": False
            }
        ],
        "rate_cards": [
            {"platform": "youtube", "deliverable_type": "dedicated_video", "price_bdt": 60000},
            {"platform": "instagram", "deliverable_type": "photo_post", "price_bdt": 20000}
        ]
    },
    {
        "display_name": "Mehzabin Chowdhury",
        "full_name": "Mehzabin Chowdhury",
        "gender": "female",
        "primary_niche": "entertainment",
        "sub_niches": ["lifestyle", "fashion"],
        "bio": "Popular Bangladeshi actress and television star sharing lifestyle, behind-the-scenes, and style tips.",
        "tagline": "Bringing stories and glamour to screen.",
        "min_budget": 100000,
        "is_identity_verified": True,
        "social_profiles": [
            {
                "platform": "facebook",
                "handle": "MehzabinChowdhuryOfficial",
                "profile_url": "https://facebook.com/MehzabinChowdhuryOfficial",
                "follower_count": 10000000,
                "engagement_rate": 0.025,
                "is_primary_platform": True
            },
            {
                "platform": "instagram",
                "handle": "@mehazabien",
                "profile_url": "https://instagram.com/mehazabien",
                "follower_count": 5000000,
                "engagement_rate": 0.038,
                "is_primary_platform": False
            }
        ],
        "rate_cards": [
            {"platform": "facebook", "deliverable_type": "dedicated_video", "price_bdt": 250000},
            {"platform": "instagram", "deliverable_type": "photo_post", "price_bdt": 80000}
        ]
    },
    {
        "display_name": "Tawhid Afridi",
        "full_name": "Tawhid Afridi",
        "gender": "male",
        "primary_niche": "entertainment",
        "sub_niches": ["travel", "lifestyle"],
        "bio": "One of Bangladesh's biggest YouTubers, famous for pranks, travel vlogs, and comedy sketches.",
        "tagline": "Entertainment like never before!",
        "min_budget": 80000,
        "is_identity_verified": True,
        "social_profiles": [
            {
                "platform": "youtube",
                "handle": "@TawhidAfridi",
                "profile_url": "https://youtube.com/@TawhidAfridi",
                "follower_count": 5600000,
                "engagement_rate": 0.032,
                "is_primary_platform": True
            }
        ],
        "rate_cards": [
            {"platform": "youtube", "deliverable_type": "dedicated_video", "price_bdt": 200000}
        ]
    },
    {
        "display_name": "Munzereen Shahid",
        "full_name": "Munzereen Shahid",
        "gender": "female",
        "primary_niche": "education",
        "sub_niches": ["lifestyle", "entertainment"],
        "bio": "English educator at 10 Minute School, author, and Oxford graduate helping you master communication.",
        "tagline": "Learn English the easy way.",
        "min_budget": 45000,
        "is_identity_verified": True,
        "social_profiles": [
            {
                "platform": "facebook",
                "handle": "munzereenshahid",
                "profile_url": "https://facebook.com/munzereenshahid",
                "follower_count": 3000000,
                "engagement_rate": 0.043,
                "is_primary_platform": True
            },
            {
                "platform": "instagram",
                "handle": "@munzereen.shahid",
                "profile_url": "https://instagram.com/munzereen.shahid",
                "follower_count": 1200000,
                "engagement_rate": 0.052,
                "is_primary_platform": False
            }
        ],
        "rate_cards": [
            {"platform": "facebook", "deliverable_type": "dedicated_video", "price_bdt": 120000},
            {"platform": "instagram", "deliverable_type": "photo_post", "price_bdt": 40000}
        ]
    }
]

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

REAL_BANGLADESHI_BRANDS = [
    {
        "name": "Aarong",
        "niche": "fashion",
        "description": "Bangladesh's leading lifestyle retail chain and BRAC social enterprise showcasing traditional artisan crafts.",
        "website": "https://www.aarong.com",
        "is_verified": True
    },
    {
        "name": "bKash",
        "niche": "finance",
        "description": "The largest Mobile Financial Services (MFS) provider in Bangladesh offering fast, secure mobile payments.",
        "website": "https://www.bkash.com",
        "is_verified": True
    },
    {
        "name": "Pathao",
        "niche": "technology",
        "description": "Leading ride-sharing, courier, and food delivery platform transforming transportation and logistics in BD.",
        "website": "https://www.pathao.com",
        "is_verified": True
    },
    {
        "name": "Walton",
        "niche": "technology",
        "description": "Bangladesh's giant electronics manufacturer, renowned for high-quality refrigerators, TVs, and mobile phones.",
        "website": "https://www.waltonbd.com",
        "is_verified": True
    },
    {
        "name": "Shwapno",
        "niche": "food",
        "description": "The most popular retail supermarket chain in Bangladesh providing fresh produce and daily grocery essentials.",
        "website": "https://www.shwapno.com",
        "is_verified": True
    },
    {
        "name": "Chaldal",
        "niche": "food",
        "description": "The pioneer online grocery platform in Bangladesh delivering fresh food directly to your doorstep.",
        "website": "https://www.chaldal.com",
        "is_verified": True
    },
    {
        "name": "Daraz Bangladesh",
        "niche": "fashion",
        "description": "The largest e-commerce platform in Bangladesh offering millions of products across all categories.",
        "website": "https://www.daraz.com.bd",
        "is_verified": True
    },
    {
        "name": "Foodpanda BD",
        "niche": "food",
        "description": "Leading online food and grocery delivery service bringing delicious meals from your favorite local eateries.",
        "website": "https://www.foodpanda.com.bd",
        "is_verified": True
    }
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
        "creator_social_profiles", "creator_profiles", "brand_profiles", "users",
        "ai_match_scores"
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
    niche_map = {row.name.lower(): row.id for row in result.fetchall()}
    
    for i in range(num_creators):
        is_real = i < len(REAL_BANGLADESHI_CREATORS)
        
        if is_real:
            c_data = REAL_BANGLADESHI_CREATORS[i]
            display_name = c_data["display_name"]
            full_name = c_data["full_name"]
            gender = c_data["gender"]
            primary_niche = c_data["primary_niche"]
            bio = c_data["bio"]
            tagline = c_data["tagline"]
            min_budget = c_data["min_budget"]
            is_identity_verified = c_data["is_identity_verified"]
            email = f"creator_{display_name.lower().replace(' ', '')}@example.com"
        else:
            base_name = random.choice(MOCK_CREATORS)
            display_name = f"{base_name['first_name']} {base_name['last_name']}"
            full_name = display_name
            gender = base_name['gender']
            primary_niche = random.choice(NICHES)
            bio = f"Passionate content creator focusing on {primary_niche}."
            tagline = f"Bringing {primary_niche} to life!"
            min_budget = random.choice([1000, 2000, 5000, 10000])
            is_identity_verified = False
            email = f"creator{i}_{random.randint(1000, 9999)}@example.com"
        
        user = User(
            email=email,
            password_hash=password_hash,
            role="creator",
            is_active=True
        )
        db.add(user)
        await db.flush()
        
        creator_profile = CreatorProfile(
            user_id=user.id,
            display_name=display_name,
            full_name=full_name,
            bio=bio,
            tagline=tagline,
            city=random.choice(CITIES),
            gender=gender,
            is_available=True,
            min_budget=min_budget,
            is_identity_verified=is_identity_verified,
            total_collaborations=random.randint(0, 50),
            average_rating=round(random.uniform(3.5, 5.0), 1) if random.random() > 0.3 else None
        )
        db.add(creator_profile)
        await db.flush()
        
        # Niches
        if is_real:
            cn = CreatorNiche(creator_id=creator_profile.id, niche_id=niche_map.get(primary_niche), is_primary=True)
            db.add(cn)
            for sub in c_data.get("sub_niches", []):
                if sub in niche_map:
                    cn_sub = CreatorNiche(creator_id=creator_profile.id, niche_id=niche_map.get(sub), is_primary=False)
                    db.add(cn_sub)
        else:
            niche_ids = random.sample(list(niche_map.values()), k=random.randint(1, 3))
            for idx, n_id in enumerate(niche_ids):
                cn = CreatorNiche(creator_id=creator_profile.id, niche_id=n_id, is_primary=(idx == 0))
                db.add(cn)
            
        # Languages
        lang_codes = random.sample(LANGUAGES, k=random.randint(1, len(LANGUAGES)))
        for idx, code in enumerate(lang_codes):
            cl = CreatorLanguage(creator_id=creator_profile.id, language_code=code, is_primary=(idx == 0))
            db.add(cl)
            
        # Social Profiles and Rate Cards
        if is_real:
            for idx, sp_data in enumerate(c_data["social_profiles"]):
                sp = CreatorSocialProfile(
                    creator_id=creator_profile.id,
                    platform=sp_data["platform"],
                    handle=sp_data["handle"],
                    profile_url=sp_data["profile_url"],
                    follower_count=sp_data["follower_count"],
                    avg_views_per_post=int(sp_data["follower_count"] * random.uniform(0.1, 0.4)),
                    engagement_rate=sp_data["engagement_rate"],
                    is_primary_platform=sp_data["is_primary_platform"]
                )
                db.add(sp)
            for rc_data in c_data.get("rate_cards", []):
                rc = CreatorRateCard(
                    creator_id=creator_profile.id,
                    platform=rc_data["platform"],
                    deliverable_type=rc_data["deliverable_type"],
                    price_bdt=rc_data["price_bdt"],
                    is_negotiable=True,
                    is_active=True
                )
                db.add(rc)
        else:
            platforms = random.sample(PLATFORMS, k=random.randint(1, 3))
            for idx, plat in enumerate(platforms):
                followers = random.randint(1000, 500000)
                sp = CreatorSocialProfile(
                    creator_id=creator_profile.id,
                    platform=plat,
                    handle=f"@{display_name.lower().replace(' ', '_')}_{plat}",
                    profile_url=f"https://{plat}.com/{display_name.lower().replace(' ', '_')}",
                    follower_count=followers,
                    avg_views_per_post=int(followers * random.uniform(0.1, 0.5)),
                    engagement_rate=random.uniform(0.01, 0.15),
                    is_primary_platform=(idx == 0)
                )
                db.add(sp)
                
                # Synthetic Rate Card
                rc = CreatorRateCard(
                    creator_id=creator_profile.id,
                    platform=plat,
                    deliverable_type=random.choice(["dedicated_video", "integrated_mention", "photo_post"]),
                    price_bdt=random.randint(min_budget, min_budget * 2),
                    is_negotiable=True,
                    is_active=True
                )
                db.add(rc)
            
        creators.append(creator_profile)
        
    await db.commit()
    return creators

async def seed_brands(db: AsyncSession):
    print("Seeding brands...")
    password_hash = hash_password("password123")
    brands = []
    
    result = await db.execute(text("SELECT id, name FROM niches"))
    niche_map = {row.name.lower(): row.id for row in result.fetchall()}
    
    # 1. Seed Real Bangladeshi Brands
    for i, b_data in enumerate(REAL_BANGLADESHI_BRANDS):
        email = f"brand_{b_data['name'].lower().replace(' ', '')}@example.com"
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
            description=b_data["description"],
            website=b_data["website"],
            city="Dhaka",
            niche_id=niche_map.get(b_data["niche"]),
            is_verified=b_data["is_verified"],
            total_campaigns=random.randint(1, 20)
        )
        db.add(brand)
        brands.append(brand)
        
    # 2. Seed Mock/Synthetic Brands
    for i, b_data in enumerate(MOCK_BRANDS):
        email = f"brand{i}_{random.randint(100, 999)}@example.com"
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
            is_verified=False,
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
    niche_map = {row.name.lower(): row.id for row in result.fetchall()}
    
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
