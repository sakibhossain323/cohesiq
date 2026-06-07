import unittest
from datetime import date
from types import SimpleNamespace

from app.services.matching import (
    compute_match_score,
    score_budget_with_tier,
    score_recency,
)

try:
    from app.campaigns.service import (
        _creator_evidence_brief,
        _first_sentences,
        _polish_rationale_text,
    )
except ModuleNotFoundError:
    _creator_evidence_brief = None
    _first_sentences = None
    _polish_rationale_text = None


class MatchingEngineTests(unittest.TestCase):
    def test_budget_score_uses_soft_buffer_then_hard_drop(self):
        self.assertEqual(score_budget_with_tier(50_000, 50_000, 150_000), 1.0)
        self.assertAlmostEqual(
            score_budget_with_tier(50_000, 57_500, 150_000),
            0.5,
        )
        self.assertEqual(score_budget_with_tier(50_000, 65_001, 150_000), 0.0)

    def test_recency_unknown_and_buckets(self):
        self.assertEqual(score_recency(None), 0.2)
        self.assertEqual(score_recency(7), 1.0)
        self.assertEqual(score_recency(30), 0.8)
        self.assertEqual(score_recency(90), 0.5)
        self.assertEqual(score_recency(91), 0.1)

    def test_semantic_rescue_is_capped_as_niche_override(self):
        scores = compute_match_score(
            campaign_niche="Beauty",
            campaign_budget=50_000,
            campaign_platforms=["youtube"],
            campaign_target_language="bn",
            creator_primary_niche="Technology",
            creator_sub_niches=[],
            creator_engagement_rate=0.03,
            creator_follower_count=100_000,
            creator_rate=45_000,
            creator_platforms=["youtube"],
            creator_language_profile={"bn": 1.0},
            creator_days_since_post=5,
            niche_score_override=0.4,
        )

        self.assertEqual(scores.niche, 0.4)
        self.assertLess(scores.total, 1.0)

    def test_all_subscores_and_total_are_normalized(self):
        scores = compute_match_score(
            campaign_niche="Education",
            campaign_budget=100_000,
            campaign_platforms=["youtube", "instagram"],
            campaign_target_language="bn",
            creator_primary_niche="Education",
            creator_sub_niches=["Technology"],
            creator_engagement_rate=0.50,
            creator_follower_count=500_000,
            creator_rate=90_000,
            creator_platforms=["youtube"],
            creator_language_profile={"bn": 1.5},
            creator_days_since_post=3,
        )

        for value in (
            scores.niche,
            scores.engagement,
            scores.budget,
            scores.platform,
            scores.language,
            scores.recency,
            scores.total,
        ):
            self.assertGreaterEqual(value, 0.0)
            self.assertLessEqual(value, 1.0)

    def test_rationale_evidence_brief_does_not_copy_bangla_titles(self):
        if _creator_evidence_brief is None:
            self.skipTest("campaign service dependencies are not installed in this local Python")

        creator = SimpleNamespace(
            bio="English learning and practical education creator.",
            tagline=None,
            portfolio_items=[
                SimpleNamespace(
                    title="টাকা আয় করো কিন্তু শেষে কিছুই থাকে না কেন?",
                    content_url="https://youtube.com/watch?v=demo",
                    published_at=date.today(),
                    views=12000,
                )
            ],
        )
        scores = SimpleNamespace(
            niche=1.0,
            budget=1.0,
            engagement=0.9,
            language=1.0,
            recency=1.0,
        )

        brief = _creator_evidence_brief(creator, scores)

        self.assertIn("mostly local-language or non-English", brief)
        self.assertNotIn("টাকা", brief)

    def test_personalized_rationale_is_limited_to_two_sentences(self):
        if _first_sentences is None:
            self.skipTest("campaign service dependencies are not installed in this local Python")

        text = _first_sentences("One. Two. Three.", limit=2)
        self.assertEqual(text, "One. Two.")

    def test_personalized_rationale_removes_canned_openers(self):
        if _polish_rationale_text is None:
            self.skipTest("campaign service dependencies are not installed in this local Python")

        text = _polish_rationale_text(
            "Based on the creator's profile and recent content pattern, "
            "I recommend Example Creator for the campaign."
        )
        self.assertEqual(text, "I recommend Example Creator for the campaign.")


if __name__ == "__main__":
    unittest.main()
