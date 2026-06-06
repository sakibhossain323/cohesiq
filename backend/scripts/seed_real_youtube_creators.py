import asyncio
import re
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import text

from app.auth import models as auth_models  # noqa: F401
from app.brands import models as brand_models  # noqa: F401
from app.campaigns import models as campaign_models  # noqa: F401
from app.creators.service import (
    build_youtube_social_profile_values,
    import_youtube_recent_videos_to_portfolio,
)
from app.creators.normalization import (
    classify_niche_with_groq,
    detect_content_languages,
    map_youtube_topic_categories,
)
from app.database import AsyncSessionLocal
from app.youtube import service as youtube_service


@dataclass(frozen=True)
class RealYouTubeCreatorSeed:
    handle: str


REAL_BD_YOUTUBE_CREATORS: list[RealYouTubeCreatorSeed] = [
    RealYouTubeCreatorSeed("@AymanSadiq"),
    RealYouTubeCreatorSeed("@munzereenshahid"),
    RealYouTubeCreatorSeed("@10msmain"),
    RealYouTubeCreatorSeed("@jhankarmahbub"),
    RealYouTubeCreatorSeed("@enayetchowdhuryofficial"),
    RealYouTubeCreatorSeed("@iamkhalidfarhan"),
    RealYouTubeCreatorSeed("@sohag360"),
    RealYouTubeCreatorSeed("@ATCAndroidToToCompany"),
    RealYouTubeCreatorSeed("@samzonebd"),
    RealYouTubeCreatorSeed("@petukcouple"),
    RealYouTubeCreatorSeed("@khudalagse"),
    RealYouTubeCreatorSeed("@nadironthegobangla"),
    RealYouTubeCreatorSeed("@RafsanTheChotobhai"),
    RealYouTubeCreatorSeed("@tawhidafridimytv"),
    RealYouTubeCreatorSeed("@salmanmuqtadir"),
    RealYouTubeCreatorSeed("@JhakanakaProject"),
    RealYouTubeCreatorSeed("@antikmahmud"),
    RealYouTubeCreatorSeed("@RnaRTuminoL"),
    RealYouTubeCreatorSeed("@jahidhasanjoyofficial"),
]


async def seed_real_youtube_creators(recent_video_limit: int = 10) -> None:
    print("Seeding real Bangladesh YouTube creators...")
    print("Discovery mode: handles only. Search.list is not used.")

    async with AsyncSessionLocal() as session:
        await _ensure_lookups(session)
        niche_map = await _niche_map(session)

        successes = 0
        failures: list[tuple[str, str]] = []
        for seed in REAL_BD_YOUTUBE_CREATORS:
            try:
                enrichment = await youtube_service.get_channel_enrichment(
                    channel_ref=seed.handle,
                    recent_video_limit=recent_video_limit,
                )
                creator_id = await _upsert_creator_profile(
                    session,
                    seed=seed,
                    display_name=enrichment.title,
                    profile_photo_url=enrichment.thumbnail_url,
                    bio=_build_creator_bio(enrichment),
                )
                normalized_niches = map_youtube_topic_categories(enrichment.topic_categories)
                groq_niche = classify_niche_with_groq(
                    enrichment,
                )
                selected_niche = (
                    groq_niche
                    or (normalized_niches[0] if normalized_niches else None)
                    or "Lifestyle"
                )
                await _upsert_creator_niche(
                    session,
                    creator_id,
                    selected_niche,
                    niche_map,
                )
                normalized_languages = enrichment.detected_content_languages or detect_content_languages(enrichment)
                for index, language_code in enumerate(normalized_languages):
                    await _upsert_creator_language(
                        session,
                        creator_id,
                        language_code,
                        is_primary=index == 0,
                    )
                await _upsert_verified_youtube_profile(
                    session,
                    creator_id=creator_id,
                    enrichment=enrichment,
                )
                imported_videos = await import_youtube_recent_videos_to_portfolio(
                    session,
                    creator_id=creator_id,
                    enrichment=enrichment,
                    niche_name=selected_niche,
                )
                await _upsert_estimated_companion_profiles(
                    session,
                    creator_id=creator_id,
                    handle=seed.handle,
                    youtube_subscribers=enrichment.subscriber_count,
                    youtube_avg_views=enrichment.avg_views_recent,
                    youtube_engagement_rate=enrichment.estimated_engagement_rate,
                )
                await session.commit()
                successes += 1
                print(
                    f"Seeded {enrichment.title} ({seed.handle}); "
                    f"imported {imported_videos} portfolio videos"
                )
            except Exception as exc:
                await session.rollback()
                failures.append((seed.handle, str(exc)))
                print(f"Skipped {seed.handle}: {exc}")

    print(f"Real YouTube creator seeding complete: {successes} succeeded, {len(failures)} failed.")
    if failures:
        print("Failures:")
        for handle, detail in failures:
            print(f"- {handle}: {detail}")


async def _ensure_lookups(session) -> None:
    languages_table = await session.execute(text("SELECT to_regclass('public.languages')"))
    if languages_table.scalar_one() is None:
        raise RuntimeError(
            "Database schema is not migrated: table 'languages' is missing. "
            "Run `docker compose exec backend alembic upgrade head` against the same Docker database, "
            "then retry `docker compose exec backend python -m scripts.seed_real_youtube_creators`."
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
    seed: RealYouTubeCreatorSeed,
    display_name: str,
    profile_photo_url: str | None,
    bio: str,
):
    safe_handle = seed.handle.lstrip("@").lower()
    email = f"real_youtube_{safe_handle}@test.com"
    clerk_id = f"seed_real_youtube_{safe_handle}"

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
            "profile_photo_url": profile_photo_url,
            "bio": bio,
        },
    )
    creator_result = await session.execute(
        text("SELECT id FROM creator_profiles WHERE user_id = :user_id"),
        {"user_id": user_id},
    )
    return creator_result.scalar_one()


async def _upsert_creator_niche(session, creator_id, niche: str, niche_map: dict[str, int]) -> None:
    niche_id = niche_map.get(niche.lower()) or niche_map.get("lifestyle")
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


async def _upsert_verified_youtube_profile(session, *, creator_id, enrichment) -> None:
    values = build_youtube_social_profile_values(
        enrichment,
        reported_at=datetime.now(timezone.utc),
    )
    await session.execute(
        text("""
            INSERT INTO creator_social_profiles (
                creator_id, platform, handle, profile_url, platform_user_id,
                api_channel_id, display_name_on_platform, follower_count,
                avg_views_per_post, avg_likes_per_post, avg_comments_per_post,
                engagement_rate, posts_per_month, is_api_verified, api_verified_at,
                data_source, stats_reported_at, stats_reported_for_period,
                is_primary_platform
            )
            VALUES (
                :creator_id, :platform, :handle, :profile_url, :platform_user_id,
                :api_channel_id, :display_name_on_platform, :follower_count,
                :avg_views_per_post, :avg_likes_per_post, :avg_comments_per_post,
                :engagement_rate, :posts_per_month, :is_api_verified, :api_verified_at,
                :data_source, :stats_reported_at, :stats_reported_for_period,
                true
            )
            ON CONFLICT (creator_id, platform) DO UPDATE
            SET handle = EXCLUDED.handle,
                profile_url = EXCLUDED.profile_url,
                platform_user_id = EXCLUDED.platform_user_id,
                api_channel_id = EXCLUDED.api_channel_id,
                display_name_on_platform = EXCLUDED.display_name_on_platform,
                follower_count = EXCLUDED.follower_count,
                avg_views_per_post = EXCLUDED.avg_views_per_post,
                avg_likes_per_post = EXCLUDED.avg_likes_per_post,
                avg_comments_per_post = EXCLUDED.avg_comments_per_post,
                engagement_rate = EXCLUDED.engagement_rate,
                posts_per_month = EXCLUDED.posts_per_month,
                is_api_verified = true,
                api_verified_at = EXCLUDED.api_verified_at,
                data_source = 'verified',
                stats_reported_at = EXCLUDED.stats_reported_at,
                stats_reported_for_period = EXCLUDED.stats_reported_for_period,
                is_primary_platform = true;
        """),
        {"creator_id": creator_id, **values},
    )


async def _upsert_estimated_companion_profiles(
    session,
    *,
    creator_id,
    handle: str,
    youtube_subscribers: int | None,
    youtube_avg_views: int | None,
    youtube_engagement_rate: float | None,
) -> None:
    handle_slug = handle.lstrip("@").lower()
    estimates = [
        {
            "platform": "instagram",
            "handle": handle_slug,
            "profile_url": f"https://www.instagram.com/{handle_slug}",
            "follower_count": _scaled_int(youtube_subscribers, 0.55),
            "avg_views_per_post": _scaled_int(youtube_avg_views, 0.35),
            "engagement_rate": _scaled_rate(youtube_engagement_rate, 1.1),
        },
        {
            "platform": "tiktok",
            "handle": handle_slug,
            "profile_url": f"https://www.tiktok.com/@{handle_slug}",
            "follower_count": _scaled_int(youtube_subscribers, 0.45),
            "avg_views_per_post": _scaled_int(youtube_avg_views, 0.5),
            "engagement_rate": _scaled_rate(youtube_engagement_rate, 1.25),
        },
    ]
    reported_at = datetime.now(timezone.utc)
    for estimate in estimates:
        await session.execute(
            text("""
                INSERT INTO creator_social_profiles (
                    creator_id, platform, handle, profile_url, follower_count,
                    avg_views_per_post, engagement_rate, posts_per_month,
                    is_primary_platform, is_api_verified, data_source,
                    stats_reported_at, stats_reported_for_period
                )
                VALUES (
                    :creator_id, :platform, :handle, :profile_url, :follower_count,
                    :avg_views_per_post, :engagement_rate, 12.0,
                    false, false, 'estimated', :stats_reported_at, 'youtube_estimate'
                )
                ON CONFLICT (creator_id, platform) DO UPDATE
                SET handle = EXCLUDED.handle,
                    profile_url = EXCLUDED.profile_url,
                    follower_count = EXCLUDED.follower_count,
                    avg_views_per_post = EXCLUDED.avg_views_per_post,
                    engagement_rate = EXCLUDED.engagement_rate,
                    posts_per_month = EXCLUDED.posts_per_month,
                    is_primary_platform = false,
                    is_api_verified = false,
                    data_source = 'estimated',
                    stats_reported_at = EXCLUDED.stats_reported_at,
                    stats_reported_for_period = EXCLUDED.stats_reported_for_period;
            """),
            {
                "creator_id": creator_id,
                "stats_reported_at": reported_at,
                **estimate,
            },
        )


def _scaled_int(value: int | None, multiplier: float) -> int | None:
    if value is None:
        return None
    return max(1, round(value * multiplier))


def _scaled_rate(value: float | None, multiplier: float) -> float | None:
    if value is None:
        return None
    return round(min(value * multiplier, 0.9999), 4)


def _build_creator_bio(enrichment) -> str:
    source_parts: list[str] = []
    if enrichment.description:
        source_parts.append(enrichment.description)
    source_parts.extend(
        video.description
        for video in enrichment.recent_videos[:5]
        if video.description
    )

    cleaned_parts = [_clean_text(part) for part in source_parts]
    cleaned_parts = [part for part in cleaned_parts if part]
    if cleaned_parts:
        return _truncate_text(" ".join(cleaned_parts), max_length=420)

    recent_titles = [
        _clean_text(video.title)
        for video in enrichment.recent_videos[:5]
        if video.title
    ]
    if recent_titles:
        return _truncate_text(
            f"{enrichment.title} creates YouTube content. Recent uploads include: "
            + "; ".join(recent_titles),
            max_length=420,
        )

    return f"{enrichment.title} creates content on YouTube."


def _clean_text(text: str) -> str:
    text = re.sub(r"https?://\\S+", "", text)
    text = re.sub(r"\\s+", " ", text)
    return text.strip()


def _truncate_text(text: str, *, max_length: int) -> str:
    if len(text) <= max_length:
        return text
    truncated = text[: max_length - 1].rsplit(" ", 1)[0].strip()
    return f"{truncated}."


if __name__ == "__main__":
    asyncio.run(seed_real_youtube_creators())
