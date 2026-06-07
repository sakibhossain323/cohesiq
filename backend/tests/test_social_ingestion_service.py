import unittest

from app.creators.normalization import classify_public_social_niche_from_keywords
from app.social_ingestion import service


class SocialIngestionServiceTests(unittest.TestCase):
    def test_parse_instagram_ref_accepts_handles_and_urls(self):
        cases = {
            "@natgeo": "natgeo",
            "natgeo": "natgeo",
            "https://www.instagram.com/natgeo/": "natgeo",
            "instagram.com/natgeo": "natgeo",
        }

        for profile_ref, expected in cases.items():
            with self.subTest(profile_ref=profile_ref):
                self.assertEqual(service.parse_instagram_ref(profile_ref), expected)

    def test_parse_tiktok_ref_accepts_handles_and_urls(self):
        cases = {
            "@khaby.lame": "khaby.lame",
            "khaby.lame": "khaby.lame",
            "https://www.tiktok.com/@khaby.lame": "khaby.lame",
            "tiktok.com/@khaby.lame/video/123": "khaby.lame",
        }

        for profile_ref, expected in cases.items():
            with self.subTest(profile_ref=profile_ref):
                self.assertEqual(service.parse_tiktok_ref(profile_ref), expected)

    def test_build_instagram_enrichment_aggregates_posts(self):
        enrichment = service.build_instagram_enrichment(
            username="creator.bd",
            profile_url="https://www.instagram.com/creator.bd/",
            items=[
                {
                    "id": "profile-1",
                    "username": "creator.bd",
                    "fullName": "Creator BD",
                    "biography": "Food stories from Dhaka",
                    "followersCount": 1000,
                    "followsCount": 100,
                    "postsCount": 20,
                    "verified": True,
                    "profilePicUrl": "https://example.com/avatar.jpg",
                    "profilePicUrlHD": "https://example.com/avatar-hd.jpg",
                    "latestPosts": [
                        {
                            "shortCode": "post-1",
                            "caption": "First post",
                            "timestamp": "2026-01-31T00:00:00Z",
                            "likesCount": 100,
                            "commentsCount": 10,
                            "videoViewCount": 1000,
                        }
                    ],
                },
                {
                    "id": "post-2",
                    "ownerUsername": "creator.bd",
                    "ownerFollowersCount": 1000,
                    "url": "https://www.instagram.com/p/post-2/",
                    "caption": "Second post",
                    "timestamp": "2026-01-01T00:00:00Z",
                    "likesCount": 50,
                    "commentsCount": 5,
                    "videoViewCount": 500,
                },
            ],
        )

        self.assertEqual(enrichment.platform, "instagram")
        self.assertEqual(enrichment.handle, "creator.bd")
        self.assertEqual(enrichment.display_name, "Creator BD")
        self.assertEqual(enrichment.follower_count, 1000)
        self.assertEqual(enrichment.following_count, 100)
        self.assertTrue(enrichment.is_verified)
        self.assertEqual(enrichment.thumbnail_url, "https://example.com/avatar.jpg")
        self.assertEqual(enrichment.avg_views_recent, 750)
        self.assertEqual(enrichment.avg_likes_recent, 75)
        self.assertEqual(enrichment.avg_comments_recent, 8)
        self.assertEqual(enrichment.estimated_engagement_rate, 0.0825)
        self.assertEqual(enrichment.posts_per_month, 2.0)
        self.assertEqual(enrichment.detected_content_languages, ["en"])
        self.assertEqual(
            classify_public_social_niche_from_keywords(enrichment),
            "Food",
        )

    def test_build_tiktok_enrichment_aggregates_videos(self):
        enrichment = service.build_tiktok_enrichment(
            username="creatorbd",
            profile_url="https://www.tiktok.com/@creatorbd",
            items=[
                {
                    "id": "video-1",
                    "text": "বাংলা food vlog",
                    "webVideoUrl": "https://www.tiktok.com/@creatorbd/video/1",
                    "createTimeISO": "2026-02-01T00:00:00Z",
                    "playCount": 1000,
                    "diggCount": 100,
                    "commentCount": 10,
                    "shareCount": 5,
                    "authorMeta": {
                        "id": "user-1",
                        "name": "creatorbd",
                        "nickName": "Creator BD",
                        "signature": "Daily food videos",
                        "fans": 2000,
                        "following": 50,
                        "video": 30,
                        "verified": False,
                        "avatar": "https://example.com/avatar.jpg",
                    },
                },
                {
                    "id": "video-2",
                    "text": "Second video",
                    "webVideoUrl": "https://www.tiktok.com/@creatorbd/video/2",
                    "createTimeISO": "2026-01-02T00:00:00Z",
                    "playCount": 500,
                    "diggCount": 50,
                    "commentCount": 5,
                    "shareCount": 0,
                    "authorMeta": {
                        "name": "creatorbd",
                        "fans": 2000,
                    },
                },
            ],
        )

        self.assertEqual(enrichment.platform, "tiktok")
        self.assertEqual(enrichment.platform_user_id, "user-1")
        self.assertEqual(enrichment.handle, "creatorbd")
        self.assertEqual(enrichment.display_name, "Creator BD")
        self.assertEqual(enrichment.follower_count, 2000)
        self.assertEqual(enrichment.avg_views_recent, 750)
        self.assertEqual(enrichment.avg_likes_recent, 75)
        self.assertEqual(enrichment.avg_comments_recent, 8)
        self.assertEqual(enrichment.avg_shares_recent, 2)
        self.assertEqual(enrichment.estimated_engagement_rate, 0.0425)
        self.assertEqual(enrichment.posts_per_month, 2.0)
        self.assertEqual(enrichment.detected_content_languages, ["bn"])
        self.assertEqual(
            classify_public_social_niche_from_keywords(enrichment),
            "Food",
        )

    def test_social_keyword_classifier_maps_common_bd_topics(self):
        education = service.build_instagram_enrichment(
            username="teacher",
            profile_url="https://www.instagram.com/teacher/",
            items=[
                {
                    "id": "post-1",
                    "username": "teacher",
                    "followersCount": 100,
                    "caption": "Education tutorial for students",
                }
            ],
        )
        cricket = service.build_tiktok_enrichment(
            username="cricketer",
            profile_url="https://www.tiktok.com/@cricketer",
            items=[
                {
                    "id": "video-1",
                    "text": "Cricket training and sports fitness",
                    "authorMeta": {"name": "cricketer", "fans": 100},
                }
            ],
        )

        self.assertEqual(classify_public_social_niche_from_keywords(education), "Education")
        self.assertEqual(classify_public_social_niche_from_keywords(cricket), "Fitness")


if __name__ == "__main__":
    unittest.main()
