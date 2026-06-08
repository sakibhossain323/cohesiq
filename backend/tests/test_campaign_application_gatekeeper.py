import unittest
import uuid
from types import SimpleNamespace

from fastapi import HTTPException

from app.campaigns import service
from app.campaigns.schemas import (
    ApplicationAnswerCreate,
    ApplicationQuestionCreate,
    CampaignCreate,
)


class CampaignApplicationGatekeeperTests(unittest.TestCase):
    def test_campaign_screening_allows_at_most_five_questions(self):
        data = CampaignCreate(
            title="Creator campaign",
            description="Promote a product",
            budget_per_creator_max=10_000,
            application_questions=[
                ApplicationQuestionCreate(question_text=f"Question {index}")
                for index in range(6)
            ],
        )

        with self.assertRaises(HTTPException) as exc:
            service._validate_campaign_screening_payload(data)

        self.assertEqual(exc.exception.status_code, 400)

    def test_required_questions_and_acknowledgments_must_be_completed(self):
        question_id = uuid.uuid4()
        ack_id = uuid.uuid4()
        campaign = SimpleNamespace(
            application_questions=[
                SimpleNamespace(id=question_id, is_required=True),
            ],
            acknowledgments=[
                SimpleNamespace(id=ack_id, is_required=True),
            ],
        )

        with self.assertRaises(HTTPException):
            service._validate_application_requirement_payload(campaign, [], [])

        service._validate_application_requirement_payload(
            campaign,
            [ApplicationAnswerCreate(question_id=question_id, answer_text="Yes, I can do this.")],
            [ack_id],
        )

    def test_unknown_question_answers_are_rejected(self):
        campaign = SimpleNamespace(
            application_questions=[],
            acknowledgments=[],
        )

        with self.assertRaises(HTTPException) as exc:
            service._validate_application_requirement_payload(
                campaign,
                [ApplicationAnswerCreate(question_id=uuid.uuid4(), answer_text="Unknown")],
                [],
            )

        self.assertEqual(exc.exception.status_code, 400)

    def test_invited_creator_must_respond_before_shortlist_or_accept(self):
        for next_status in ("shortlisted", "pending_agreement", "accepted"):
            with self.subTest(next_status=next_status):
                with self.assertRaises(HTTPException) as exc:
                    service._validate_application_status_transition("invited", next_status)
                self.assertEqual(exc.exception.status_code, 400)

        service._validate_application_status_transition("invited", "rejected")
        service._validate_application_status_transition("pending", "shortlisted")
        service._validate_application_status_transition("shortlisted", "accepted")

    def test_live_post_url_matches_connected_creator_profiles(self):
        instagram = SimpleNamespace(
            platform="instagram",
            handle="creator.bd",
            profile_url="https://www.instagram.com/creator.bd/",
            api_channel_id=None,
        )
        tiktok = SimpleNamespace(
            platform="tiktok",
            handle="creatorbd",
            profile_url="https://www.tiktok.com/@creatorbd",
            api_channel_id=None,
        )
        youtube = SimpleNamespace(
            platform="youtube",
            handle="10msmain",
            profile_url="https://www.youtube.com/@10msmain",
            api_channel_id="UC123",
        )

        self.assertTrue(service._matches_creator_platform_url("https://www.instagram.com/creator.bd/reel/abc/", instagram))
        self.assertTrue(service._matches_creator_platform_url("https://www.tiktok.com/@creatorbd/video/123", tiktok))
        self.assertTrue(service._matches_creator_platform_url("https://www.youtube.com/@10msmain/shorts/123", youtube))
        self.assertTrue(service._matches_creator_platform_url("https://www.youtube.com/channel/UC123/videos", youtube))
        self.assertFalse(service._matches_creator_platform_url("https://www.instagram.com/othercreator/reel/abc/", instagram))
        self.assertFalse(service._matches_creator_platform_url("https://youtu.be/abc123", youtube))

    def test_live_metric_calculations_are_time_series_ready(self):
        self.assertEqual(
            service.calculate_engagement_rate(
                views=10_000,
                impressions=20_000,
                likes=500,
                comments=100,
                shares=50,
                saves=25,
            ),
            3.38,
        )
        self.assertEqual(
            service.estimate_live_content_revenue_bdt(
                views=10_000,
                likes=500,
                comments=100,
                shares=50,
                saves=25,
            ),
            3550,
        )
        self.assertEqual(service.calculate_engagement_rate(0, 0, 0, 0, 0, 0), 0.0)

    def test_youtube_live_metric_sync_extracts_video_ids(self):
        self.assertEqual(
            service.extract_youtube_video_id("https://www.youtube.com/watch?v=llopFi5XDYw"),
            "llopFi5XDYw",
        )
        self.assertEqual(
            service.extract_youtube_video_id("https://youtu.be/llopFi5XDYw"),
            "llopFi5XDYw",
        )
        self.assertEqual(
            service.extract_youtube_video_id("https://www.youtube.com/shorts/llopFi5XDYw"),
            "llopFi5XDYw",
        )
        self.assertIsNone(service.extract_youtube_video_id("https://www.instagram.com/reel/abc"))


if __name__ == "__main__":
    unittest.main()
