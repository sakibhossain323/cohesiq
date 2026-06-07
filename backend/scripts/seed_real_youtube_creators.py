import asyncio
import os
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
    display_name: str
    channel_ref: str | None = None

    @property
    def stable_key(self) -> str:
        return _slugify(self.channel_ref or self.display_name)


REAL_BD_YOUTUBE_CREATORS: list[RealYouTubeCreatorSeed] = [
    RealYouTubeCreatorSeed("SS Food Challenge", "@ssfoodchallenge"),
    RealYouTubeCreatorSeed("SS Food Challenge Junior", "@ssfoodchallengejunior"),
    RealYouTubeCreatorSeed("Nobabi Couple", "@NobabiCouple"),
    RealYouTubeCreatorSeed("Waziha's vlog", "@wazihasvlog"),
    RealYouTubeCreatorSeed("Doyel Agro", "@DoyelAgro"),
    RealYouTubeCreatorSeed("Village Life Fishing", "@VillageLifeFishing"),
    RealYouTubeCreatorSeed("Food Stops Here", "@FoodStopsHere"),
    RealYouTubeCreatorSeed("Humanitarian Kitchen", "@HumanitarianKitchen"),
    RealYouTubeCreatorSeed("AroundMeBD", "@AroundMeBD"),
    RealYouTubeCreatorSeed("Health Care Bangla", "@HealthcareBangla"),
    RealYouTubeCreatorSeed("দিল Deel", "@DeelBangla"),
    RealYouTubeCreatorSeed("Extreme Launch Lover", "@ExtremeLaunchLover"),
    RealYouTubeCreatorSeed("Tonni Art and Craft", "@TonniArtCraft"),
    RealYouTubeCreatorSeed("Farjana Drawing Academy", "@FarjanaDrawingAcademy"),
    RealYouTubeCreatorSeed("Mukta Art & Craft", "@MuktaArtCraft"),
    RealYouTubeCreatorSeed("Ara's Easy Art", "@ArasEasyArt"),
    RealYouTubeCreatorSeed("Selai Tutorial", "@selaitutorial"),
    RealYouTubeCreatorSeed("Bamboo / Shorts", "@craftbamboo"),
    RealYouTubeCreatorSeed("Wood Carving Art", "@WoodCarvingArt"),
    RealYouTubeCreatorSeed("Crazy Bangla Tips", "@CrazyBanglaTips"),
    RealYouTubeCreatorSeed("FRIEND DIY GIFT", "@FRIENDDIYGIFT"),
    RealYouTubeCreatorSeed("Shorts Drawing", "@ShortsDrawing"),
    RealYouTubeCreatorSeed("PC Builder Bangladesh", "@PCBuilderBangladesh"),
    RealYouTubeCreatorSeed("ATC Android Toto Company", "@ATCAndroidToToCompany"),
    RealYouTubeCreatorSeed("Toxic Bamboo", "@ToxicBamboo"),
    RealYouTubeCreatorSeed("Tanvir Anik", "@TanvirAnik"),
    RealYouTubeCreatorSeed("Hemel 360°", "@Hemel360"),
    RealYouTubeCreatorSeed("iTechFamily", "@itechfamily"),
    RealYouTubeCreatorSeed("Timeline World Bangla", "@TimelineWorldBangla"),
    RealYouTubeCreatorSeed("Ai with Rana Imam", "@AiwithRanaImam"),
    RealYouTubeCreatorSeed("Potato Pseudo Gamer", "@PotatoPseudoGamer"),
    RealYouTubeCreatorSeed("All Gaming", "@AllGaming"),
    RealYouTubeCreatorSeed("NqisiK", "@NqisiK"),
    RealYouTubeCreatorSeed("Garena Free Fire Bangladesh", "@GarenaFreeFireBangladesh"),
    RealYouTubeCreatorSeed("Gaming With Talha Is Back", "@GamingWithTalhaIsBack"),
    RealYouTubeCreatorSeed("SkySay Gaming Pro", "@SkySayGamingPro"),
    RealYouTubeCreatorSeed("REVENGE 9T4", "@REVENGE9T4"),
    RealYouTubeCreatorSeed("games hole", "@gameshole"),
    RealYouTubeCreatorSeed("Prank King Entertainment", "@PrankKingEntertainment"),
    RealYouTubeCreatorSeed("Tarikul Islam Mondal", "@TarikulIslamMondal"),
    RealYouTubeCreatorSeed("Md Junaed", "@MdJunaed"),
    RealYouTubeCreatorSeed("The Ajaira LTD", "@AjairaLtdOriginals"),
    RealYouTubeCreatorSeed("Dhruba TV", "@DhrubaTV"),
    RealYouTubeCreatorSeed("AGAIN FOYSAl", "@AGAINFOYSAl"),
    RealYouTubeCreatorSeed("TAWHID AFRIDI", "@tawhidafridimytv"),
    RealYouTubeCreatorSeed("Brain Fix", "@BrainFix"),
    RealYouTubeCreatorSeed("Funny Day", "@FunnyDay"),
    RealYouTubeCreatorSeed("Advance Search is Back", "@AdvanceSearchisBack"),
    RealYouTubeCreatorSeed("Matha Nosto", "@MathaNosto"),
    RealYouTubeCreatorSeed("Zan Zamin", "@ZanZamin"),
    RealYouTubeCreatorSeed("Mr. Triple R", "@MrTripleR"),
    RealYouTubeCreatorSeed("Sagor Bhuyan", "@SagorBhuyan"),
    RealYouTubeCreatorSeed("10 Minute School", "@10msmain"),
    RealYouTubeCreatorSeed("Shykh Seraj", "@ShykhSeraj"),
    RealYouTubeCreatorSeed("মায়াজাল", "@mayajaalbangla"),
    RealYouTubeCreatorSeed("Kuti Bari", "@KutiBari"),
    RealYouTubeCreatorSeed("Bangla Lecture", "@BanglaLecture"),
    RealYouTubeCreatorSeed("Drawing Fantasy", "@DrawingFantasy"),
    RealYouTubeCreatorSeed("AL HERA ISLAMIC CENTER", "@ALHERAISLAMICCENTER"),
    RealYouTubeCreatorSeed("R I Media", "@RIMedia"),
    RealYouTubeCreatorSeed("Rabbitholebd Sports", "@RabbitholebdSports"),
    RealYouTubeCreatorSeed("Bangladesh Cricket: The Tigers", "@bcbtigercricket"),
    RealYouTubeCreatorSeed("Jamuna Sports", "@JamunaSports"),
    RealYouTubeCreatorSeed("SOMOY SPORTS", "@somoysports"),
    RealYouTubeCreatorSeed("ON FIELD", "@ONFIELD"),
    RealYouTubeCreatorSeed("FutbalGamerz", "@FutbalGamerz"),
    RealYouTubeCreatorSeed("BD Sports Network", "@BDSportsNetwork"),
    RealYouTubeCreatorSeed("AllRounder", "@AllRounderBD"),
    RealYouTubeCreatorSeed("Rs Yasin Raj", "@RsYasinRaj"),
    RealYouTubeCreatorSeed("Manik Miah Official", "@ManikMiahOfficial"),
    RealYouTubeCreatorSeed("Ritu Hossain", "@RituHossain"),
    RealYouTubeCreatorSeed("Soniya Akter Rima", "@SoniyaAkterRima"),
    RealYouTubeCreatorSeed("Oishrat Jahan Eity", "@OishratJahanEity"),
    RealYouTubeCreatorSeed("Sayan Official", "@SayanOfficial"),
    RealYouTubeCreatorSeed("Riasad Azim", "@RiasadAzim"),
    RealYouTubeCreatorSeed("Modern YouTube Family", "@ModernYouTubeFamily"),
    RealYouTubeCreatorSeed("Apu Biswas", "@ApuBiswasOfficial"),
    RealYouTubeCreatorSeed("Zohra's Flicks", "@ZohrasFlicks"),
    RealYouTubeCreatorSeed("Disha Moni", "@DishaMoni"),
    RealYouTubeCreatorSeed("FF EDITZ 100K", "@FFEDITZ100K"),
    RealYouTubeCreatorSeed("SAIFUDDIN BD", "@SAIFUDDINBD"),
    RealYouTubeCreatorSeed("Meowphorius", "@Meowphorius"),
    RealYouTubeCreatorSeed("Hasan Pigeon Gopalganj", "@HasanPigeonGopalganj"),
    RealYouTubeCreatorSeed("Comedy Animals BD", "@ComedyAnimalsBD"),
    RealYouTubeCreatorSeed("Wildlife Cuties", "@WildlifeCuties"),
    RealYouTubeCreatorSeed("Coke Studio Bangla", "@CokeStudioBangla"),
    RealYouTubeCreatorSeed("Pritom Hasan", "@PritomHasan"),
    RealYouTubeCreatorSeed("Sathi Khan", "@SathiKhan"),
    RealYouTubeCreatorSeed("Mon Baul", "@MonBaul"),
    RealYouTubeCreatorSeed("Habib Wahid", "@habibwahid"),
    RealYouTubeCreatorSeed("Prothom Alo", "@ProthomAlo"),
    RealYouTubeCreatorSeed("The Daily Star", "@TheDailyStar"),
    RealYouTubeCreatorSeed("The Business Standard", "@TheBusinessStandard"),
    RealYouTubeCreatorSeed("Ki Keno Kivabe", "@KiKenoKivabe"),
    RealYouTubeCreatorSeed("Expert Talk", "@ExpertTalk"),
    RealYouTubeCreatorSeed("Tritiyo Matra", "@TritiyoMatra"),
    RealYouTubeCreatorSeed("The Press", "@ThePress"),
    RealYouTubeCreatorSeed("Chorki", "@ChorkiOfficial"),
    RealYouTubeCreatorSeed("Mas Media Info", "@MasMediaInfo"),
    RealYouTubeCreatorSeed("Maasranga Kids", "@MaasrangaKids"),
]


async def seed_real_youtube_creators(recent_video_limit: int = 10) -> None:
    print("Seeding real Bangladesh YouTube creators...")
    search_limit = _search_resolution_limit()
    if search_limit:
        print(
            "Discovery mode: guarded Search.list resolution enabled for "
            f"up to {search_limit} unresolved names."
        )
    else:
        print(
            "Discovery mode: handles/channel IDs only. Search.list is not used. "
            "Set YOUTUBE_SEED_SEARCH_RESOLVE_LIMIT to resolve display names in batches."
        )

    async with AsyncSessionLocal() as session:
        await _ensure_lookups(session)
        niche_map = await _niche_map(session)

        successes = 0
        skipped_unresolved: list[str] = []
        failures: list[tuple[str, str]] = []
        seeds = _selected_youtube_seeds()
        print(f"Selected {len(seeds)} YouTube creators; recent_video_limit={recent_video_limit}")
        for seed in seeds:
            channel_ref = seed.channel_ref
            if not channel_ref:
                channel_ref = await _existing_seed_channel_ref(session, seed)
            if not channel_ref:
                if search_limit <= 0:
                    skipped_unresolved.append(seed.display_name)
                    continue
                search_limit -= 1
                channel_ref = await _resolve_channel_ref_from_search(seed.display_name)
                if not channel_ref:
                    skipped_unresolved.append(seed.display_name)
                    continue

            try:
                enrichment = await youtube_service.get_channel_enrichment(
                    channel_ref=channel_ref,
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
                )
                if selected_niche:
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
                await session.commit()
                successes += 1
                print(
                    f"Seeded {enrichment.title} ({channel_ref}); "
                    f"imported {imported_videos} portfolio videos"
                )
            except Exception as exc:
                await session.rollback()
                failures.append((seed.display_name, str(exc)))
                print(f"Skipped {seed.display_name}: {exc}")

    print(
        "Real YouTube creator seeding complete: "
        f"{successes} succeeded, {len(skipped_unresolved)} unresolved, {len(failures)} failed."
    )
    if skipped_unresolved:
        print("Unresolved display names need channel handles/IDs, or run a guarded search batch:")
        print("  docker compose exec backend env YOUTUBE_SEED_SEARCH_RESOLVE_LIMIT=25 python -m scripts.seed_real_youtube_creators")
        for name in skipped_unresolved:
            print(f"- {name}")
    if failures:
        print("Failures:")
        for name, detail in failures:
            print(f"- {name}: {detail}")


def _search_resolution_limit() -> int:
    raw = os.getenv("YOUTUBE_SEED_SEARCH_RESOLVE_LIMIT", "0").strip()
    if not raw:
        return 0
    try:
        return max(0, int(raw))
    except ValueError:
        return 0


def _selected_youtube_seeds() -> list[RealYouTubeCreatorSeed]:
    limit = _int_env("YOUTUBE_SEED_LIMIT", len(REAL_BD_YOUTUBE_CREATORS))
    return REAL_BD_YOUTUBE_CREATORS[: max(limit, 0)]


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


async def _resolve_channel_ref_from_search(display_name: str) -> str | None:
    search = await youtube_service.search_public(
        q=display_name,
        max_results=1,
        resource_type="channel",
        region_code="BD",
        relevance_language="bn",
    )
    if not search.results:
        print(f"Could not resolve {display_name}: no channel search result")
        return None
    channel_id = search.results[0].channel_id
    if not channel_id:
        print(f"Could not resolve {display_name}: search result had no channel ID")
        return None
    print(f"Resolved {display_name} -> {channel_id} ({search.results[0].title})")
    return channel_id


async def _existing_seed_channel_ref(session, seed: RealYouTubeCreatorSeed) -> str | None:
    email = f"real_youtube_{seed.stable_key}@test.com"
    result = await session.execute(
        text("""
            SELECT csp.api_channel_id
            FROM users u
            JOIN creator_profiles cp ON cp.user_id = u.id
            JOIN creator_social_profiles csp ON csp.creator_id = cp.id
            WHERE u.email = :email
              AND csp.platform = 'youtube'
              AND csp.api_channel_id IS NOT NULL
            LIMIT 1
        """),
        {"email": email},
    )
    return result.scalar_one_or_none()


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
    safe_key = seed.stable_key
    email = f"real_youtube_{safe_key}@test.com"
    clerk_id = f"seed_real_youtube_{safe_key}"

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


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower())
    slug = slug.strip("_")
    return slug or "unknown"


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
