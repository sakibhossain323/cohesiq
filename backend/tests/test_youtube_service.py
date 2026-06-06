import unittest

from app.youtube import service


class YouTubeServiceTests(unittest.TestCase):
    def test_parse_channel_ref_accepts_handle_and_urls(self):
        cases = {
            "@mkbhd": {"handle": "@mkbhd"},
            "mkbhd": {"handle": "mkbhd"},
            "UC123": {"channel_id": "UC123"},
            "https://www.youtube.com/@mkbhd/videos": {"handle": "@mkbhd"},
            "https://www.youtube.com/channel/UC123": {"channel_id": "UC123"},
            "https://www.youtube.com/user/GoogleDevelopers": {
                "username": "GoogleDevelopers",
            },
        }

        for channel_ref, expected in cases.items():
            with self.subTest(channel_ref=channel_ref):
                self.assertEqual(service.parse_channel_ref(channel_ref), expected)

    def test_extract_playlist_video_ids(self):
        payload = {
            "items": [
                {"contentDetails": {"videoId": "video-1"}},
                {"contentDetails": {"videoId": "video-2"}},
                {"contentDetails": {}},
            ]
        }

        self.assertEqual(
            service.extract_playlist_video_ids(payload),
            ["video-1", "video-2"],
        )

    def test_build_channel_enrichment_calculates_recent_metrics(self):
        channel = service.parse_channel_response(
            {
                "items": [
                    {
                        "id": "UC_test",
                        "snippet": {
                            "title": "Test Channel",
                            "description": "Channel description from YouTube.",
                            "customUrl": "@test",
                            "thumbnails": {
                                "high": {"url": "https://example.com/high.jpg"}
                            },
                        },
                        "statistics": {
                            "subscriberCount": "1000",
                            "videoCount": "2",
                            "viewCount": "3000",
                        },
                        "contentDetails": {
                            "relatedPlaylists": {"uploads": "UU_test"},
                        },
                        "topicDetails": {
                            "topicCategories": [
                                "https://en.wikipedia.org/wiki/Technology"
                            ]
                        },
                    }
                ]
            }
        )
        videos = service.parse_videos_response(
            {
                "items": [
                    {
                        "id": "video-1",
                        "snippet": {
                            "title": "Video 1",
                            "channelId": "UC_test",
                            "publishedAt": "2026-01-31T00:00:00Z",
                        },
                        "statistics": {
                            "viewCount": "1000",
                            "likeCount": "100",
                            "commentCount": "10",
                        },
                        "contentDetails": {"duration": "PT1M"},
                    },
                    {
                        "id": "video-2",
                        "snippet": {
                            "title": "Video 2",
                            "channelId": "UC_test",
                            "publishedAt": "2026-01-01T00:00:00Z",
                        },
                        "statistics": {
                            "viewCount": "2000",
                            "likeCount": "200",
                            "commentCount": "20",
                        },
                        "contentDetails": {"duration": "PT2M"},
                    },
                ]
            }
        )

        enrichment = service.build_channel_enrichment(
            channel=channel,
            recent_videos=videos,
        )

        self.assertEqual(enrichment.platform_user_id, "UC_test")
        self.assertEqual(enrichment.handle, "@test")
        self.assertEqual(enrichment.description, "Channel description from YouTube.")
        self.assertEqual(enrichment.thumbnail_url, "https://example.com/high.jpg")
        self.assertEqual(
            enrichment.topic_categories,
            ["https://en.wikipedia.org/wiki/Technology"],
        )
        self.assertEqual(enrichment.detected_content_languages, ["en"])
        self.assertEqual(enrichment.avg_views_recent, 1500)
        self.assertEqual(enrichment.avg_likes_recent, 150)
        self.assertEqual(enrichment.avg_comments_recent, 15)
        self.assertEqual(enrichment.estimated_engagement_rate, 0.11)
        self.assertEqual(enrichment.uploads_per_month, 2.0)


if __name__ == "__main__":
    unittest.main()
