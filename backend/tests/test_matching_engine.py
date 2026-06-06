import unittest

from app.services.matching import (
    compute_match_score,
    score_budget_with_tier,
    score_recency,
)


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


if __name__ == "__main__":
    unittest.main()

