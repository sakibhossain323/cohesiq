import unittest
import uuid
from datetime import datetime, timezone

from app.auth import models as auth_models  # noqa: F401
from app.brands import models as brand_models  # noqa: F401
from app.campaigns import models as campaign_models  # noqa: F401
from app.creators.models import CreatorSocialProfile
from app.creators.service import (
    apply_public_social_enrichment_to_social_profile,
    build_public_social_profile_values,
)
from app.social_ingestion.schemas import (
    PublicSocialProfileEnrichment,
    SocialRecentPost,
)


class CreatorPublicSocialEnrichmentTests(unittest.TestCase):
    def _instagram_enrichment(self) -> PublicSocialProfileEnrichment:
        return PublicSocialProfileEnrichment(
            platform="instagram",
            platform_user_id="ig-123",
            handle="creator.bd",
            profile_url="https://www.instagram.com/creator.bd/",
            display_name="Creator BD",
            bio="Food creator",
            follower_count=1500,
            following_count=100,
            post_count=25,
            is_verified=True,
            recent_posts=[
                SocialRecentPost(
                    id="post-1",
                    title="Post 1",
                    url="https://www.instagram.com/p/post-1/",
                    view_count=1000,
                    like_count=100,
                    comment_count=10,
                    share_count=5,
                )
            ],
            avg_views_recent=1000,
            avg_likes_recent=100,
            avg_comments_recent=10,
            avg_shares_recent=5,
            estimated_engagement_rate=0.0767,
            posts_per_month=4.0,
            detected_content_languages=["en"],
        )

    def test_build_public_social_profile_values_maps_verified_metrics(self):
        reported_at = datetime(2026, 6, 7, tzinfo=timezone.utc)

        values = build_public_social_profile_values(
            self._instagram_enrichment(),
            reported_at=reported_at,
        )

        self.assertEqual(values["platform"], "instagram")
        self.assertEqual(values["handle"], "creator.bd")
        self.assertEqual(values["platform_user_id"], "ig-123")
        self.assertEqual(values["api_channel_id"], "ig-123")
        self.assertEqual(values["display_name_on_platform"], "Creator BD")
        self.assertEqual(values["follower_count"], 1500)
        self.assertEqual(values["following_count"], 100)
        self.assertEqual(values["avg_views_per_post"], 1000)
        self.assertEqual(values["avg_likes_per_post"], 100)
        self.assertEqual(values["avg_comments_per_post"], 10)
        self.assertEqual(values["avg_shares_per_post"], 5)
        self.assertEqual(values["engagement_rate"], 0.0767)
        self.assertTrue(values["has_verified_badge"])
        self.assertTrue(values["is_api_verified"])
        self.assertEqual(values["data_source"], "verified")
        self.assertEqual(values["stats_reported_for_period"], "recent 1 posts")

    def test_apply_public_social_enrichment_updates_existing_profile(self):
        reported_at = datetime(2026, 6, 7, tzinfo=timezone.utc)
        profile = CreatorSocialProfile(
            platform="instagram",
            handle="old",
            profile_url="https://old.example",
            follower_count=1,
            data_source="self_reported",
            is_api_verified=False,
        )

        apply_public_social_enrichment_to_social_profile(
            profile,
            self._instagram_enrichment(),
            reported_at=reported_at,
        )

        self.assertEqual(profile.handle, "creator.bd")
        self.assertEqual(profile.profile_url, "https://www.instagram.com/creator.bd/")
        self.assertEqual(profile.follower_count, 1500)
        self.assertEqual(profile.avg_shares_per_post, 5)
        self.assertTrue(profile.has_verified_badge)
        self.assertTrue(profile.is_api_verified)
        self.assertEqual(profile.api_verified_at, reported_at)

    def test_public_social_values_can_create_new_profile(self):
        values = build_public_social_profile_values(
            self._instagram_enrichment(),
            reported_at=datetime(2026, 6, 7, tzinfo=timezone.utc),
        )

        profile = CreatorSocialProfile(
            creator_id=uuid.uuid4(),
            **values,
        )

        self.assertEqual(profile.platform, "instagram")
        self.assertEqual(profile.handle, "creator.bd")
        self.assertTrue(profile.is_api_verified)


if __name__ == "__main__":
    unittest.main()
