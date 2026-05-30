from dataclasses import dataclass

# --- Weights (must sum to 1.0) ---
W_NICHE      = 0.30
W_ENGAGEMENT = 0.20
W_BUDGET     = 0.20
W_PLATFORM   = 0.15
W_LANGUAGE   = 0.10
W_RECENCY    = 0.05

# --- Tier engagement benchmarks for normalization ---
ENGAGEMENT_BENCHMARKS = {
    "nano":  0.060,   # 1K-10K followers
    "micro": 0.0386,  # 10K-100K
    "macro": 0.018,   # 100K-500K
    "mega":  0.012,   # 500K+
}


@dataclass
class MatchScores:
    niche: float
    engagement: float
    budget: float
    platform: float
    language: float
    recency: float
    total: float
    semantic_similarity: float = 0.0


def get_tier(follower_count: int) -> str:
    if follower_count <= 10_000:
        return "nano"
    elif follower_count <= 100_000:
        return "micro"
    elif follower_count <= 500_000:
        return "macro"
    return "mega"


def score_niche(campaign_niche: str, creator_primary: str, creator_sub: list[str]) -> float:
    if campaign_niche == creator_primary:
        return 1.0
    if campaign_niche in (creator_sub or []):
        return 0.6
    return 0.0


def score_engagement(engagement_rate: float | None, follower_count: int) -> float:
    if not engagement_rate or engagement_rate <= 0:
        return 0.0
    tier = get_tier(follower_count)
    benchmark = ENGAGEMENT_BENCHMARKS[tier]
    return min((engagement_rate / benchmark) / 1.5, 1.0)


def score_budget(budget_per_creator: int, creator_rate: int | None) -> float:
    if not creator_rate or creator_rate <= 0:
        return 0.5   # No rate set: treat as negotiable
    if creator_rate <= budget_per_creator:
        return 1.0
    if creator_rate <= budget_per_creator * 1.3:
        return 0.5
    return 0.0


def score_platform(required_platforms: list[str], creator_platforms: list[str]) -> float:
    if not required_platforms:
        return 1.0
    covered = sum(1 for p in required_platforms if p in creator_platforms)
    return covered / len(required_platforms)


def score_language(target_language: str, creator_language_profile: dict) -> float:
    return float(creator_language_profile.get(target_language, 0.0))


def score_recency(days_since_last_post: int | None) -> float:
    if days_since_last_post is None:
        return 0.3
    if days_since_last_post <= 7:
        return 1.0
    if days_since_last_post <= 30:
        return 0.7
    if days_since_last_post <= 90:
        return 0.3
    return 0.0


def compute_match_score(
    campaign_niche: str,
    campaign_budget: int,
    campaign_platforms: list[str],
    campaign_target_language: str,
    creator_primary_niche: str,
    creator_sub_niches: list[str],
    creator_engagement_rate: float | None,
    creator_follower_count: int,
    creator_rate: int | None,
    creator_platforms: list[str],
    creator_language_profile: dict,
    creator_days_since_post: int | None,
) -> MatchScores:
    """
    Pure function. All inputs are pre-fetched primitives.
    No database calls. Fully unit-testable.
    """
    niche    = score_niche(campaign_niche, creator_primary_niche, creator_sub_niches)
    engage   = score_engagement(creator_engagement_rate, creator_follower_count)
    budget   = score_budget(campaign_budget, creator_rate)
    platform = score_platform(campaign_platforms, creator_platforms)
    language = score_language(campaign_target_language, creator_language_profile)
    recency  = score_recency(creator_days_since_post)

    total = (
        niche    * W_NICHE      +
        engage   * W_ENGAGEMENT +
        budget   * W_BUDGET     +
        platform * W_PLATFORM   +
        language * W_LANGUAGE   +
        recency  * W_RECENCY
    )

    return MatchScores(
        niche=round(niche, 4),
        engagement=round(engage, 4),
        budget=round(budget, 4),
        platform=round(platform, 4),
        language=round(language, 4),
        recency=round(recency, 4),
        total=round(total, 4),
    )
