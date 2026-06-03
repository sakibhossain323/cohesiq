import asyncio

from app.config import settings
from app.youtube import service


def test_parsers() -> None:
    search = service.parse_search_response(
        "python tutorial",
        {
            "nextPageToken": "next-token",
            "pageInfo": {"totalResults": 1, "resultsPerPage": 1},
            "items": [
                {
                    "id": {"kind": "youtube#video", "videoId": "abc123"},
                    "snippet": {
                        "title": "Python Tutorial",
                        "description": "Learn Python",
                        "channelId": "UC_test",
                        "channelTitle": "Test Channel",
                        "publishedAt": "2026-01-01T00:00:00Z",
                        "thumbnails": {
                            "default": {
                                "url": "https://example.com/thumb.jpg",
                                "width": 120,
                                "height": 90,
                            }
                        },
                    },
                }
            ],
        },
    )
    assert search.query == "python tutorial"
    assert search.total_results == 1
    assert search.results[0].video_id == "abc123"
    assert search.results[0].url == "https://www.youtube.com/watch?v=abc123"

    video = service.parse_video_response(
        {
            "items": [
                {
                    "id": "abc123",
                    "snippet": {
                        "title": "Python Tutorial",
                        "channelId": "UC_test",
                        "channelTitle": "Test Channel",
                        "publishedAt": "2026-01-01T00:00:00Z",
                    },
                    "statistics": {
                        "viewCount": "100",
                        "likeCount": "10",
                        "commentCount": "2",
                    },
                    "contentDetails": {"duration": "PT5M"},
                }
            ]
        }
    )
    assert video.id == "abc123"
    assert video.view_count == 100
    assert video.duration == "PT5M"

    channel = service.parse_channel_response(
        {
            "items": [
                {
                    "id": "UC_test",
                    "snippet": {
                        "title": "Test Channel",
                        "publishedAt": "2026-01-01T00:00:00Z",
                    },
                    "statistics": {
                        "subscriberCount": "1000",
                        "videoCount": "12",
                        "viewCount": "5000",
                        "hiddenSubscriberCount": False,
                    },
                    "contentDetails": {
                        "relatedPlaylists": {"uploads": "UU_test"},
                    },
                }
            ]
        }
    )
    assert channel.id == "UC_test"
    assert channel.subscriber_count == 1000
    assert channel.uploads_playlist_id == "UU_test"


async def live_smoke_test() -> None:
    if not settings.youtube_api_key:
        print("Skipped live YouTube API smoke test: YOUTUBE_API_KEY is not set")
        return

    response = await service.search_public(q="python tutorial", max_results=1)
    assert response.results
    print(f"Live YouTube API smoke test passed: {response.results[0].title}")


async def main() -> None:
    test_parsers()
    print("YouTube parser tests passed")
    await live_smoke_test()


if __name__ == "__main__":
    asyncio.run(main())
