import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.config import settings
from app.creators.normalization import classify_public_social_niche_with_groq
from app.social_ingestion import service


def test_parsers() -> None:
    instagram = service.build_instagram_enrichment(
        username="demo",
        profile_url="https://www.instagram.com/demo/",
        items=[
            {
                "id": "post-1",
                "username": "demo",
                "followersCount": 1000,
                "caption": "Demo post",
                "timestamp": "2026-01-01T00:00:00Z",
                "likesCount": 100,
                "commentsCount": 10,
            }
        ],
    )
    assert instagram.platform == "instagram"
    assert instagram.handle == "demo"
    assert instagram.avg_likes_recent == 100

    tiktok = service.build_tiktok_enrichment(
        username="demo",
        profile_url="https://www.tiktok.com/@demo",
        items=[
            {
                "id": "video-1",
                "text": "Demo video",
                "playCount": 1000,
                "diggCount": 100,
                "commentCount": 10,
                "authorMeta": {"name": "demo", "fans": 1000},
            }
        ],
    )
    assert tiktok.platform == "tiktok"
    assert tiktok.handle == "demo"
    assert tiktok.avg_views_recent == 1000


async def live_smoke_test() -> None:
    if not settings.resolved_apify_api_token:
        print("Skipped live Apify smoke test: APIFY_API_TOKEN is not set")
        return

    instagram = await service.get_instagram_enrichment(
        profile_ref="natgeo",
        recent_post_limit=1,
    )
    assert instagram.handle
    instagram_niche = classify_public_social_niche_with_groq(instagram)
    print(
        "Live Instagram Apify smoke test passed: "
        f"@{instagram.handle} niche={instagram_niche} "
        f"thumbnail={'yes' if instagram.thumbnail_url else 'no'}"
    )

    tiktok = await service.get_tiktok_enrichment(
        profile_ref="tiktok",
        recent_post_limit=1,
    )
    assert tiktok.handle
    tiktok_niche = classify_public_social_niche_with_groq(tiktok)
    print(
        "Live TikTok Apify smoke test passed: "
        f"@{tiktok.handle} niche={tiktok_niche} "
        f"thumbnail={'yes' if tiktok.thumbnail_url else 'no'}"
    )


async def main() -> None:
    test_parsers()
    print("Apify social parser tests passed")
    await live_smoke_test()


if __name__ == "__main__":
    asyncio.run(main())
