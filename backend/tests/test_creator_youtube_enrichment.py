import unittest
import uuid
from datetime import datetime, timezone

from app.auth import models as auth_models  # noqa: F401
from app.brands import models as brand_models  # noqa: F401
from app.campaigns import models as campaign_models  # noqa: F401
from app.creators.models import CreatorSocialProfile
from app.creators.normalization import (
    detect_content_languages,
    engagement_vs_tier_ratio,
    map_youtube_topic_categories,
    normalize_city,
    parse_groq_niche_response,
)
from app.creators.service import (
    apply_youtube_enrichment_to_social_profile,
    build_youtube_social_profile_values,
    build_youtube_portfolio_item_values,
)
from app.youtube.schemas import YouTubeChannelEnrichment, YouTubeRecentVideo
from scripts.seed_real_youtube_creators import _build_creator_bio


class CreatorYouTubeEnrichmentTests(unittest.TestCase):
    def _enrichment(self) -> YouTubeChannelEnrichment:
        return YouTubeChannelEnrichment(
            platform_user_id="UC_test",
            handle="@test",
            profile_url="https://www.youtube.com/channel/UC_test",
            title="Test Channel",
            description="This channel teaches practical skills from public YouTube descriptions.",
            thumbnail_url="https://example.com/avatar.jpg",
            subscriber_count=1200,
            total_views=50000,
            video_count=20,
            uploads_playlist_id="UU_test",
            topic_categories=["https://en.wikipedia.org/wiki/Education"],
            recent_videos=[
                YouTubeRecentVideo(
                    id="video-1",
                    title="Video 1",
                    description="Recent upload description about learning and creator growth.",
                    channel_id="UC_test",
                    published_at="2026-01-01T00:00:00Z",
                    thumbnails={
                        "default": {"url": "https://example.com/default.jpg", "width": 120},
                        "high": {"url": "https://example.com/high.jpg", "width": 480},
                    },
                    view_count=1000,
                    like_count=100,
                    comment_count=10,
                    url="https://www.youtube.com/watch?v=video-1",
                ),
            ],
            avg_views_recent=1000,
            avg_likes_recent=100,
            avg_comments_recent=10,
            estimated_engagement_rate=0.11,
            uploads_per_month=4.0,
        )

    def test_build_youtube_social_profile_values_maps_verified_metrics(self):
        reported_at = datetime(2026, 6, 6, tzinfo=timezone.utc)

        values = build_youtube_social_profile_values(
            self._enrichment(),
            reported_at=reported_at,
        )

        self.assertEqual(values["platform"], "youtube")
        self.assertEqual(values["handle"], "@test")
        self.assertEqual(values["platform_user_id"], "UC_test")
        self.assertEqual(values["api_channel_id"], "UC_test")
        self.assertEqual(values["display_name_on_platform"], "Test Channel")
        self.assertEqual(values["follower_count"], 1200)
        self.assertEqual(values["avg_views_per_post"], 1000)
        self.assertEqual(values["avg_likes_per_post"], 100)
        self.assertEqual(values["avg_comments_per_post"], 10)
        self.assertEqual(values["engagement_rate"], 0.11)
        self.assertEqual(values["posts_per_month"], 4.0)
        self.assertTrue(values["is_api_verified"])
        self.assertEqual(values["api_verified_at"], reported_at)
        self.assertEqual(values["data_source"], "verified")
        self.assertEqual(values["content_languages"], ["en"])
        self.assertEqual(values["stats_reported_for_period"], "recent 1 uploads")

    def test_apply_youtube_enrichment_updates_existing_profile(self):
        reported_at = datetime(2026, 6, 6, tzinfo=timezone.utc)
        profile = CreatorSocialProfile(
            platform="youtube",
            handle="@old",
            profile_url="https://old.example",
            follower_count=1,
            data_source="self_reported",
            is_api_verified=False,
        )

        apply_youtube_enrichment_to_social_profile(
            profile,
            self._enrichment(),
            reported_at=reported_at,
        )

        self.assertEqual(profile.handle, "@test")
        self.assertEqual(profile.profile_url, "https://www.youtube.com/channel/UC_test")
        self.assertEqual(profile.follower_count, 1200)
        self.assertEqual(profile.api_channel_id, "UC_test")
        self.assertTrue(profile.is_api_verified)
        self.assertEqual(profile.api_verified_at, reported_at)
        self.assertEqual(profile.data_source, "verified")

    def test_seed_bio_uses_channel_and_recent_video_descriptions(self):
        bio = _build_creator_bio(self._enrichment())

        self.assertIn("practical skills", bio)
        self.assertIn("Recent upload description", bio)
        self.assertLessEqual(len(bio), 420)

    def test_normalization_maps_topics_languages_city_and_tier_ratio(self):
        enrichment = self._enrichment()
        bangla_enrichment = enrichment.model_copy(
            update={
                "title": "বাংলা শিক্ষা",
                "recent_videos": [
                    YouTubeRecentVideo(
                        id="video-bn",
                        title="কীভাবে ইংরেজি শিখবেন",
                        description="Bangla tips for spoken English",
                        channel_id="UC_test",
                        url="https://www.youtube.com/watch?v=video-bn",
                    )
                ],
            }
        )

        self.assertEqual(
            map_youtube_topic_categories(enrichment.topic_categories),
            ["Education"],
        )
        self.assertEqual(detect_content_languages(bangla_enrichment), ["bn"])
        self.assertEqual(normalize_city("Chittagong"), "Chattogram")
        self.assertEqual(normalize_city("Atlantis"), "unknown_location")
        self.assertGreater(
            engagement_vs_tier_ratio(
                follower_count=enrichment.subscriber_count,
                engagement_rate=enrichment.estimated_engagement_rate,
            ),
            1,
        )

    def test_parse_groq_niche_response_accepts_only_allowed_niches(self):
        self.assertEqual(
            parse_groq_niche_response(
                '{"niche":"Education","confidence":0.91,"reason":"Learning videos"}'
            ),
            "Education",
        )
        self.assertEqual(
            parse_groq_niche_response(
                '```json\n{"niche":"Gaming","confidence":0.8,"reason":"Gameplay"}\n```'
            ),
            "Gaming",
        )
        self.assertIsNone(parse_groq_niche_response('{"niche":"Astrology"}'))
        self.assertIsNone(parse_groq_niche_response("not json"))

    def test_build_youtube_portfolio_item_values_maps_recent_video(self):
        video = self._enrichment().recent_videos[0]

        values = build_youtube_portfolio_item_values(
            video,
            niche_id=8,
            sort_order=0,
        )

        self.assertEqual(values["platform"], "youtube")
        self.assertEqual(values["content_url"], "https://www.youtube.com/watch?v=video-1")
        self.assertEqual(values["title"], "Video 1")
        self.assertEqual(values["thumbnail_url"], "https://example.com/high.jpg")
        self.assertEqual(values["niche_id"], 8)
        self.assertEqual(values["views"], 1000)
        self.assertEqual(values["likes"], 100)
        self.assertEqual(values["comments"], 10)
        self.assertEqual(str(values["published_at"]), "2026-01-01")
        self.assertTrue(values["is_featured"])
        self.assertEqual(values["sort_order"], 0)

    def test_youtube_values_can_create_new_profile(self):
        reported_at = datetime(2026, 6, 6, tzinfo=timezone.utc)
        values = build_youtube_social_profile_values(
            self._enrichment(),
            reported_at=reported_at,
        )

        profile = CreatorSocialProfile(
            creator_id=uuid.uuid4(),
            **values,
        )

        self.assertEqual(profile.platform, "youtube")
        self.assertEqual(profile.handle, "@test")
        self.assertEqual(profile.api_channel_id, "UC_test")
        self.assertTrue(profile.is_api_verified)


if __name__ == "__main__":
    unittest.main()
