from dataclasses import dataclass
from typing import Optional

from app.services.matching_config import (
    BUDGET_RATE_HARD_CAP,
    BUDGET_SOFT_BUFFER_RATIO,
    BUDGET_UNKNOWN_SCORE,
    SCORE_WEIGHTS,
    UNKNOWN_RECENCY_SCORE,
)

# --- Expected BDT rate ranges per follower tier ---
# These are realistic Bangladeshi market rates
TIER_BUDGET_RANGES = {
    "nano":  {"min": 500,    "max": 5_000},    # 1K-10K followers
    "micro": {"min": 3_000,  "max": 25_000},   # 10K-100K followers
    "macro": {"min": 20_000, "max": 150_000},  # 100K-500K followers
    "mega":  {"min": 100_000, "max": 500_000}, # 500K+ followers
}

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


def clamp_score(value: float) -> float:
    return max(0.0, min(float(value), 1.0))


def get_tier(follower_count: int) -> str:
    if follower_count <= 10_000:
        return "nano"
    elif follower_count <= 100_000:
        return "micro"
    elif follower_count <= 500_000:
        return "macro"
    return "mega"


def score_niche(campaign_niche: str, creator_primary: str, creator_sub: list[str]) -> float:
    """
    Compare niche strings case-insensitively.
    Primary niche match = 1.0, secondary match = 0.6, no match = 0.0.
    """
    if not campaign_niche or campaign_niche.lower() in ("general", "unknown", "other"):
        # Campaign has no specific niche — treat as open to all
        return 0.5
    
    campaign_lower = campaign_niche.lower()
    
    if creator_primary and creator_primary.lower() == campaign_lower:
        return 1.0
    if any(s.lower() == campaign_lower for s in (creator_sub or [])):
        return 0.6
    return 0.0


def score_budget_with_tier(
    campaign_budget_max: Optional[int],
    creator_rate: Optional[int],
    creator_follower_count: int,
) -> float:
    """
    Budget scoring keeps exact-fit creators at 1.0, then decays linearly
    across the configured over-budget buffer. Missing rates use the tier
    midpoint as an estimate.
    """
    if not campaign_budget_max or campaign_budget_max <= 0:
        return BUDGET_UNKNOWN_SCORE

    tier = get_tier(creator_follower_count)
    tier_range = TIER_BUDGET_RANGES[tier]
    tier_min = tier_range["min"]
    tier_max = tier_range["max"]

    if not creator_rate or creator_rate <= 0:
        # Use tier_min (optimistic lower bound) — not midpoint. Midpoint
        # over-penalises creators who haven't set a rate card: a micro creator
        # at midpoint (14k) scores 0.0 on a 4k budget, even though they *might*
        # accept a lower rate. tier_min is the same bound the gate uses.
        creator_rate = tier_min

    if creator_rate <= campaign_budget_max:
        return 1.0

    # Within soft buffer (budget → budget×1.3): linear decay 1.0 → 0.0
    hard_cap = campaign_budget_max * BUDGET_RATE_HARD_CAP
    if creator_rate <= hard_cap:
        over_budget = creator_rate - campaign_budget_max
        buffer_amount = campaign_budget_max * BUDGET_SOFT_BUFFER_RATIO
        if buffer_amount <= 0:
            return 0.0
        return round(clamp_score(1.0 - (over_budget / buffer_amount)), 4)

    # Beyond hard cap: budget score is 0.0.
    # Creator still appears in results (gate allows up to 5× budget) so niche
    # and platform scores drive their ranking.
    return 0.0


def score_engagement(engagement_rate: Optional[float], follower_count: int) -> float:
    if not engagement_rate or engagement_rate <= 0:
        return 0.3  # No engagement data — slight penalty but not zero
    tier = get_tier(follower_count)
    benchmark = ENGAGEMENT_BENCHMARKS[tier]
    return round(clamp_score((engagement_rate / benchmark) / 1.5), 4)


def score_platform(required_platforms: list[str], creator_platforms: list[str]) -> float:
    if not required_platforms:
        return 1.0
    covered = sum(1 for p in required_platforms if p in creator_platforms)
    return round(clamp_score(covered / len(required_platforms)), 4)


def score_language(target_language: str, creator_language_profile: dict) -> float:
    if not target_language:
        return 0.5
    return round(clamp_score(float(creator_language_profile.get(target_language, 0.0))), 4)


def score_recency(days_since_last_post: Optional[int]) -> float:
    if days_since_last_post is None:
        return UNKNOWN_RECENCY_SCORE
    if days_since_last_post <= 7:
        return 1.0
    if days_since_last_post <= 30:
        return 0.8
    if days_since_last_post <= 90:
        return 0.5
    return 0.1


def compute_match_score(
    campaign_niche: str,
    campaign_budget: Optional[int],
    campaign_platforms: list[str],
    campaign_target_language: str,
    creator_primary_niche: str,
    creator_sub_niches: list[str],
    creator_engagement_rate: Optional[float],
    creator_follower_count: int,
    creator_rate: Optional[int],
    creator_platforms: list[str],
    creator_language_profile: dict,
    creator_days_since_post: Optional[int],
    niche_score_override: Optional[float] = None,
) -> MatchScores:
    """
    Pure function. All inputs are pre-fetched primitives.
    No database calls. Fully unit-testable.
    """
    niche    = score_niche(campaign_niche, creator_primary_niche, creator_sub_niches)
    if niche_score_override is not None:
        niche = clamp_score(niche_score_override)
    engage   = score_engagement(creator_engagement_rate, creator_follower_count)
    budget   = score_budget_with_tier(campaign_budget, creator_rate, creator_follower_count)
    platform = score_platform(campaign_platforms, creator_platforms)
    language = score_language(campaign_target_language, creator_language_profile)
    recency  = score_recency(creator_days_since_post)

    total = (
        niche    * SCORE_WEIGHTS["niche"]      +
        engage   * SCORE_WEIGHTS["engagement"] +
        budget   * SCORE_WEIGHTS["budget"]     +
        platform * SCORE_WEIGHTS["platform"]   +
        language * SCORE_WEIGHTS["language"]   +
        recency  * SCORE_WEIGHTS["recency"]
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
