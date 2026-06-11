import asyncio
import math
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import text

from app.auth import models as auth_models  # noqa: F401
from app.brands import models as brand_models  # noqa: F401
from app.campaigns import models as campaign_models  # noqa: F401
from app.common.deliverables import DELIVERABLE_DEFINITIONS
from app.creators.normalization import classify_public_social_niche_with_groq
from app.creators.service import (
    build_public_social_profile_values,
    import_public_social_recent_posts_to_portfolio,
)
from app.database import AsyncSessionLocal
from app.social_ingestion import service as social_service
from app.social_ingestion.schemas import PublicSocialProfileEnrichment


@dataclass(frozen=True)
class RealSocialCreatorSeed:
    platform: str
    display_name: str
    profile_ref: str
    expected_topic: str | None = None

    @property
    def handle(self) -> str:
        parser = (
            social_service.parse_instagram_ref
            if self.platform == "instagram"
            else social_service.parse_tiktok_ref
        )
        return parser(self.profile_ref)

    @property
    def stable_key(self) -> str:
        return _slugify(f"{self.platform}_{self.handle}")


REAL_BD_SOCIAL_CREATORS: list[RealSocialCreatorSeed] = [
    # Instagram: Bangladesh celebrity, sports, education, fashion, food/travel mix.
    RealSocialCreatorSeed("instagram", "Mehazabien Chowdhury", "mehazabien", "Entertainment"),
    RealSocialCreatorSeed("instagram", "Bidya Sinha Saha MiM", "bidya_mim", "Entertainment"),
    RealSocialCreatorSeed("instagram", "Sabila Nur", "sabla.babla", "Entertainment"),
    RealSocialCreatorSeed("instagram", "Purnima", "therealpurnima", "Lifestyle"),
    RealSocialCreatorSeed("instagram", "Bangladesh Cricket Tigers", "bangladeshtigers", "Fitness"),
    RealSocialCreatorSeed("instagram", "Ayman Sadiq", "aymansadiq10", "Education"),
    RealSocialCreatorSeed("instagram", "Taskin Ahmed Tazim", "taskintazim", "Fitness"),
    RealSocialCreatorSeed("instagram", "Mustafizur Rahman", "mustafizur_90", "Fitness"),
    RealSocialCreatorSeed("instagram", "Sunehra Tasnim", "t.sunehra", "Fashion"),
    RealSocialCreatorSeed("instagram", "Mahmudullah Riyad", "mohammad_mahmudullah", "Fitness"),
    # TikTok: Bangladesh entertainment, education, sports, product/lifestyle creators.
    RealSocialCreatorSeed("tiktok", "Tawhid Afridi", "tawhidafridi121", "Entertainment"),
    RealSocialCreatorSeed("tiktok", "Sakib Al Hasan Official", "sakib_al_hasan2", "Fitness"),
    RealSocialCreatorSeed("tiktok", "Rakib Hossain", "rakib_hossain_vlogs", "Entertainment"),
    RealSocialCreatorSeed("tiktok", "Reza & Puja Khan", "rezaandpuja", "Entertainment"),
    RealSocialCreatorSeed("tiktok", "Tuhin Vaia Official", "tuhinvaia01official", "Entertainment"),
    RealSocialCreatorSeed("tiktok", "Mehedi Hasan", "mr_mehedi_05", "Education"),
    RealSocialCreatorSeed("tiktok", "Ra Fi", "rafi.bhaiyu", "Entertainment"),
    RealSocialCreatorSeed("tiktok", "Rs Fahim Chowdhury", "rsfahimchowdhury", "Lifestyle"),
    RealSocialCreatorSeed("tiktok", "Shakib Khan", "theshakibkhan_", "Entertainment"),
    RealSocialCreatorSeed("tiktok", "Safiea Hafiz Retu", "safieahafizretu", "Entertainment"),
]


async def seed_real_social_creators(recent_post_limit: int = 12) -> None:
    print("Seeding real Bangladesh Instagram/TikTok creators...")
    seeds = _selected_seeds()
    print(f"Selected {len(seeds)} social creators; recent_post_limit={recent_post_limit}")

    async with AsyncSessionLocal() as session:
        await _ensure_lookups(session)
        niche_map = await _niche_map(session)

        successes = 0
        failures: list[tuple[str, str, str]] = []
        for seed in seeds:
            try:
                enrichment = await _fetch_enrichment(
                    seed,
                    recent_post_limit=recent_post_limit,
                )
                selected_niche = classify_public_social_niche_with_groq(enrichment)
                creator_id = await _upsert_creator_profile(
                    session,
                    seed=seed,
                    enrichment=enrichment,
                    bio=_build_creator_bio(enrichment),
                )
                if selected_niche:
                    await _upsert_creator_niche(
                        session,
                        creator_id,
                        selected_niche,
                        niche_map,
                    )
                for index, language_code in enumerate(
                    enrichment.detected_content_languages or ["en"]
                ):
                    await _upsert_creator_language(
                        session,
                        creator_id,
                        language_code,
                        is_primary=index == 0,
                    )
                await _upsert_verified_social_profile(
                    session,
                    creator_id=creator_id,
                    enrichment=enrichment,
                )
                await _upsert_social_rate_cards(
                    session,
                    creator_id=creator_id,
                    enrichment=enrichment,
                )
                await import_public_social_recent_posts_to_portfolio(
                    session,
                    creator_id=creator_id,
                    enrichment=enrichment,
                    niche_name=selected_niche,
                )
                await session.commit()
                successes += 1
                print(
                    f"Seeded {seed.platform} @{enrichment.handle} "
                    f"followers={enrichment.follower_count} niche={selected_niche}"
                )
            except Exception as exc:
                await session.rollback()
                failures.append((seed.platform, seed.profile_ref, str(exc)))
                print(f"Skipped {seed.platform} {seed.profile_ref}: {exc}")

    print(
        "Real social creator seeding complete: "
        f"{successes} succeeded, {len(failures)} failed."
    )
    if failures:
        print("Failures:")
        for platform, profile_ref, detail in failures:
            print(f"- {platform} {profile_ref}: {detail}")


async def _fetch_enrichment(
    seed: RealSocialCreatorSeed,
    *,
    recent_post_limit: int,
) -> PublicSocialProfileEnrichment:
    if seed.platform == "instagram":
        return await social_service.get_instagram_enrichment(
            profile_ref=seed.profile_ref,
            recent_post_limit=recent_post_limit,
        )
    if seed.platform == "tiktok":
        return await social_service.get_tiktok_enrichment(
            profile_ref=seed.profile_ref,
            recent_post_limit=recent_post_limit,
        )
    raise ValueError(f"Unsupported platform: {seed.platform}")


def _selected_seeds() -> list[RealSocialCreatorSeed]:
    platform = os.getenv("SOCIAL_SEED_PLATFORM", "").strip().lower()
    topic = os.getenv("SOCIAL_SEED_TOPIC", "").strip().lower()
    name_contains = os.getenv("SOCIAL_SEED_NAME_CONTAINS", "").strip().lower()
    limit = _int_env("SOCIAL_SEED_LIMIT", len(REAL_BD_SOCIAL_CREATORS))
    seeds = [
        seed
        for seed in REAL_BD_SOCIAL_CREATORS
        if not platform or seed.platform == platform
    ]
    if topic:
        seeds = [
            seed
            for seed in seeds
            if (seed.expected_topic or "").lower() == topic
        ]
    if name_contains:
        seeds = [
            seed
            for seed in seeds
            if name_contains in seed.display_name.lower()
            or name_contains in seed.profile_ref.lower()
        ]
    return seeds[: max(limit, 0)]


async def _ensure_lookups(session) -> None:
    languages_table = await session.execute(text("SELECT to_regclass('public.languages')"))
    if languages_table.scalar_one() is None:
        raise RuntimeError(
            "Database schema is not migrated: table 'languages' is missing. "
            "Run `docker compose exec backend alembic upgrade head`, then retry."
        )

    await session.execute(text("""
        INSERT INTO languages (code, name, native_name) VALUES
        ('bn', 'Bengali', 'বাংলা'),
        ('en', 'English', 'English')
        ON CONFLICT (code) DO NOTHING;
    """))

    for niche in {
        "Technology",
        "Food",
        "Travel",
        "Fashion",
        "Beauty",
        "Lifestyle",
        "Gaming",
        "Education",
        "Fitness",
        "Entertainment",
        "Comedy",
    }:
        await session.execute(
            text("""
                INSERT INTO niches (name, slug)
                VALUES (:name, :slug)
                ON CONFLICT (name) DO NOTHING;
            """),
            {"name": niche, "slug": niche.lower().replace(" ", "-")},
        )
    await session.commit()


async def _niche_map(session) -> dict[str, int]:
    result = await session.execute(text("SELECT id, name FROM niches"))
    return {row.name.lower(): row.id for row in result}


async def _upsert_creator_profile(
    session,
    *,
    seed: RealSocialCreatorSeed,
    enrichment: PublicSocialProfileEnrichment,
    bio: str,
):
    email = f"real_{seed.platform}_{seed.stable_key}@test.com"
    clerk_id = f"seed_real_{seed.platform}_{seed.stable_key}"
    display_name = enrichment.display_name or seed.display_name

    await session.execute(
        text("""
            INSERT INTO users (clerk_id, email, role, is_email_verified)
            VALUES (:clerk_id, :email, 'creator', true)
            ON CONFLICT (email) DO UPDATE
            SET clerk_id = EXCLUDED.clerk_id,
                role = 'creator',
                is_email_verified = true
            RETURNING id;
        """),
        {"clerk_id": clerk_id, "email": email},
    )
    user_result = await session.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": email},
    )
    user_id = user_result.scalar_one()

    await session.execute(
        text("""
            INSERT INTO creator_profiles (user_id, display_name, profile_photo_url, bio, city)
            VALUES (:user_id, :display_name, :profile_photo_url, :bio, NULL)
            ON CONFLICT (user_id) DO UPDATE
            SET display_name = EXCLUDED.display_name,
                profile_photo_url = EXCLUDED.profile_photo_url,
                bio = EXCLUDED.bio,
                city = NULL
            RETURNING id;
        """),
        {
            "user_id": user_id,
            "display_name": display_name,
            "profile_photo_url": enrichment.thumbnail_url,
            "bio": bio,
        },
    )
    creator_result = await session.execute(
        text("SELECT id FROM creator_profiles WHERE user_id = :user_id"),
        {"user_id": user_id},
    )
    return creator_result.scalar_one()


async def _upsert_creator_niche(
    session,
    creator_id,
    niche: str,
    niche_map: dict[str, int],
) -> None:
    niche_id = niche_map.get(niche.lower())
    if not niche_id:
        return
    await session.execute(
        text("""
            INSERT INTO creator_niches (creator_id, niche_id, is_primary)
            VALUES (:creator_id, :niche_id, true)
            ON CONFLICT (creator_id, niche_id) DO UPDATE
            SET is_primary = true;
        """),
        {"creator_id": creator_id, "niche_id": niche_id},
    )


async def _upsert_creator_language(
    session,
    creator_id,
    language_code: str,
    *,
    is_primary: bool,
) -> None:
    await session.execute(
        text("""
            INSERT INTO creator_languages (creator_id, language_code, is_primary)
            VALUES (:creator_id, :language_code, :is_primary)
            ON CONFLICT (creator_id, language_code) DO UPDATE
            SET is_primary = EXCLUDED.is_primary;
        """),
        {
            "creator_id": creator_id,
            "language_code": language_code,
            "is_primary": is_primary,
        },
    )


async def _upsert_verified_social_profile(
    session,
    *,
    creator_id,
    enrichment: PublicSocialProfileEnrichment,
) -> None:
    values = build_public_social_profile_values(
        enrichment,
        reported_at=datetime.now(timezone.utc),
    )
    await session.execute(
        text("""
            INSERT INTO creator_social_profiles (
                creator_id, platform, handle, profile_url, platform_user_id,
                api_channel_id, display_name_on_platform, follower_count,
                following_count, avg_views_per_post, avg_likes_per_post,
                avg_comments_per_post, avg_shares_per_post, engagement_rate,
                posts_per_month, has_verified_badge, is_api_verified,
                api_verified_at, data_source, content_languages,
                notes, stats_reported_at, stats_reported_for_period, is_primary_platform
            )
            VALUES (
                :creator_id, :platform, :handle, :profile_url, :platform_user_id,
                :api_channel_id, :display_name_on_platform, :follower_count,
                :following_count, :avg_views_per_post, :avg_likes_per_post,
                :avg_comments_per_post, :avg_shares_per_post, :engagement_rate,
                :posts_per_month, :has_verified_badge, :is_api_verified,
                :api_verified_at, :data_source, :content_languages,
                :notes, :stats_reported_at, :stats_reported_for_period, true
            )
            ON CONFLICT (creator_id, platform) DO UPDATE
            SET handle = EXCLUDED.handle,
                profile_url = EXCLUDED.profile_url,
                platform_user_id = EXCLUDED.platform_user_id,
                api_channel_id = EXCLUDED.api_channel_id,
                display_name_on_platform = EXCLUDED.display_name_on_platform,
                follower_count = EXCLUDED.follower_count,
                following_count = EXCLUDED.following_count,
                avg_views_per_post = EXCLUDED.avg_views_per_post,
                avg_likes_per_post = EXCLUDED.avg_likes_per_post,
                avg_comments_per_post = EXCLUDED.avg_comments_per_post,
                avg_shares_per_post = EXCLUDED.avg_shares_per_post,
                engagement_rate = EXCLUDED.engagement_rate,
                posts_per_month = EXCLUDED.posts_per_month,
                has_verified_badge = EXCLUDED.has_verified_badge,
                is_api_verified = true,
                api_verified_at = EXCLUDED.api_verified_at,
                data_source = 'verified',
                content_languages = EXCLUDED.content_languages,
                notes = EXCLUDED.notes,
                stats_reported_at = EXCLUDED.stats_reported_at,
                stats_reported_for_period = EXCLUDED.stats_reported_for_period,
                is_primary_platform = true;
        """),
        {"creator_id": creator_id, **values},
    )


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def _round_to_nearest(value: float, step: int = 500) -> int:
    return int(round(value / step) * step)


def _follower_price_ratio(follower_count: int | None) -> float:
    followers = max(int(follower_count or 0), 5_000)
    normalized = (math.log10(followers) - math.log10(5_000)) / (
        math.log10(10_000_000) - math.log10(5_000)
    )
    return _clamp(normalized, 0.0, 1.0)


def _bounded_price(follower_count: int | None, *, minimum: int, maximum: int) -> int:
    ratio = _follower_price_ratio(follower_count)
    return _round_to_nearest(minimum + ((maximum - minimum) * ratio))


def _suggest_social_rate_cards(enrichment: PublicSocialProfileEnrichment) -> list[dict[str, int | str]]:
    follower_count = enrichment.follower_count or 0
    if enrichment.platform == "instagram":
        return [
            {
                "platform": "instagram",
                "deliverable_code": "instagram_story",
                "deliverable_type": DELIVERABLE_DEFINITIONS["instagram_story"].legacy_type,
                "label": DELIVERABLE_DEFINITIONS["instagram_story"].label,
                "price_bdt": _bounded_price(follower_count, minimum=1_000, maximum=6_000),
                "turnaround_days": 2,
            },
            {
                "platform": "instagram",
                "deliverable_code": "instagram_feed",
                "deliverable_type": DELIVERABLE_DEFINITIONS["instagram_feed"].legacy_type,
                "label": DELIVERABLE_DEFINITIONS["instagram_feed"].label,
                "price_bdt": _bounded_price(follower_count, minimum=1_500, maximum=8_000),
                "turnaround_days": 3,
            },
            {
                "platform": "instagram",
                "deliverable_code": "instagram_reel",
                "deliverable_type": DELIVERABLE_DEFINITIONS["instagram_reel"].legacy_type,
                "label": DELIVERABLE_DEFINITIONS["instagram_reel"].label,
                "price_bdt": _bounded_price(follower_count, minimum=2_000, maximum=15_000),
                "turnaround_days": 4,
            },
            {
                "platform": "instagram",
                "deliverable_code": "instagram_live",
                "deliverable_type": DELIVERABLE_DEFINITIONS["instagram_live"].legacy_type,
                "label": DELIVERABLE_DEFINITIONS["instagram_live"].label,
                "price_bdt": _bounded_price(follower_count, minimum=10_000, maximum=50_000),
                "turnaround_days": 5,
            },
        ]
    if enrichment.platform == "tiktok":
        return [
            {
                "platform": "tiktok",
                "deliverable_code": "tiktok_story",
                "deliverable_type": DELIVERABLE_DEFINITIONS["tiktok_story"].legacy_type,
                "label": DELIVERABLE_DEFINITIONS["tiktok_story"].label,
                "price_bdt": _bounded_price(follower_count, minimum=1_000, maximum=6_000),
                "turnaround_days": 2,
            },
            {
                "platform": "tiktok",
                "deliverable_code": "tiktok_video",
                "deliverable_type": DELIVERABLE_DEFINITIONS["tiktok_video"].legacy_type,
                "label": DELIVERABLE_DEFINITIONS["tiktok_video"].label,
                "price_bdt": _bounded_price(follower_count, minimum=2_000, maximum=14_000),
                "turnaround_days": 4,
            },
            {
                "platform": "tiktok",
                "deliverable_code": "tiktok_live",
                "deliverable_type": DELIVERABLE_DEFINITIONS["tiktok_live"].legacy_type,
                "label": DELIVERABLE_DEFINITIONS["tiktok_live"].label,
                "price_bdt": _bounded_price(follower_count, minimum=10_000, maximum=50_000),
                "turnaround_days": 5,
            },
        ]
    return []


async def _upsert_social_rate_cards(session, *, creator_id, enrichment: PublicSocialProfileEnrichment) -> None:
    rate_cards = _suggest_social_rate_cards(enrichment)
    if not rate_cards:
        return

    platform = enrichment.platform
    await session.execute(
        text("""
            DELETE FROM creator_rate_cards
            WHERE creator_id = :creator_id
              AND platform = :platform;
        """),
        {"creator_id": creator_id, "platform": platform},
    )

    for rate_card in rate_cards:
        await session.execute(
            text("""
                INSERT INTO creator_rate_cards (
                    creator_id,
                    platform,
                    deliverable_type,
                    deliverable_code,
                    price_bdt,
                    suggested_price_bdt,
                    includes,
                    turnaround_days,
                    is_negotiable,
                    is_active
                )
                VALUES (
                    :creator_id,
                    :platform,
                    :deliverable_type,
                    :deliverable_code,
                    :price_bdt,
                    :suggested_price_bdt,
                    :includes,
                    :turnaround_days,
                    true,
                    true
                );
            """),
            {
                "creator_id": creator_id,
                "platform": rate_card["platform"],
                "deliverable_type": rate_card["deliverable_type"],
                "deliverable_code": rate_card["deliverable_code"],
                "price_bdt": rate_card["price_bdt"],
                "suggested_price_bdt": rate_card["price_bdt"],
                "includes": f"1 {rate_card['label']}",
                "turnaround_days": rate_card["turnaround_days"],
            },
        )

    await session.execute(
        text("""
            UPDATE creator_profiles
            SET min_budget = CASE
                WHEN min_budget IS NULL THEN :min_budget
                ELSE LEAST(min_budget, :min_budget)
            END
            WHERE id = :creator_id;
        """),
        {
            "creator_id": creator_id,
            "min_budget": min(int(rate_card["price_bdt"]) for rate_card in rate_cards),
        },
    )


def _build_creator_bio(enrichment: PublicSocialProfileEnrichment) -> str:
    source_parts: list[str] = []
    if enrichment.bio:
        source_parts.append(enrichment.bio)
    source_parts.extend(
        post.title
        for post in enrichment.recent_posts[:5]
        if post.title
    )
    if source_parts:
        return _truncate_text(_clean_text(" ".join(source_parts)), max_length=420)
    return f"{enrichment.display_name or enrichment.handle} creates content on {enrichment.platform}."


def _clean_text(value: str) -> str:
    value = re.sub(r"https?://\S+", "", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def _truncate_text(value: str, *, max_length: int) -> str:
    if len(value) <= max_length:
        return value
    truncated = value[: max_length - 1].rsplit(" ", 1)[0].strip()
    return f"{truncated}."


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower())
    slug = slug.strip("_")
    return slug or "unknown"


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


if __name__ == "__main__":
    asyncio.run(seed_real_social_creators(_int_env("SOCIAL_SEED_RECENT_POST_LIMIT", 12)))
