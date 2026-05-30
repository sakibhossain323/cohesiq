from dataclasses import dataclass
from typing import Optional

# --- Weights (must sum to 1.0) ---
# Niche & budget are now primary drivers. Platform & engagement are secondary.
W_NICHE      = 0.35   # Content relevance — highest weight
W_BUDGET     = 0.30   # Budget vs follower tier fit — second highest
W_PLATFORM   = 0.15   # Creator must be on required platforms
W_ENGAGEMENT = 0.10   # Engagement rate bonus
W_LANGUAGE   = 0.08   # Language preference
W_RECENCY    = 0.02   # Small recency bonus

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
    Budget scoring: checks two things:
    1. Can we afford this creator? (campaign_budget >= creator_rate)
    2. Is this creator's tier appropriate for the budget?
       (a mega creator is NOT a good fit for a BDT 1,500 campaign)
    """
    if not campaign_budget_max or campaign_budget_max <= 0:
        return 0.5  # Unknown campaign budget — neutral

    tier = get_tier(creator_follower_count)
    tier_range = TIER_BUDGET_RANGES[tier]

    # --- Tier appropriateness (does the campaign budget make sense for this creator's size?) ---
    tier_min = tier_range["min"]
    tier_max = tier_range["max"]

    if campaign_budget_max >= tier_min and campaign_budget_max <= tier_max * 1.5:
        # Campaign budget falls within the expected range for this creator's tier
        tier_score = 1.0
    elif campaign_budget_max >= tier_min * 0.5 and campaign_budget_max < tier_min:
        # Budget slightly below the tier's minimum — partial match
        tier_score = 0.5
    elif campaign_budget_max > tier_max * 1.5:
        # Budget is way above the tier — overspending on a small creator
        tier_score = 0.7  # Still okay, but not ideal
    else:
        # Budget is way too low for this creator's tier (e.g., BDT 1,500 for a mega creator)
        tier_score = 0.0

    # --- Rate affordability check (can campaign budget cover this creator's rate?) ---
    if not creator_rate or creator_rate <= 0:
        # Creator has no explicit rate — use tier midpoint as estimate
        creator_rate = (tier_min + tier_max) // 2

    if creator_rate <= campaign_budget_max:
        rate_score = 1.0
    elif creator_rate <= campaign_budget_max * 1.25:
        rate_score = 0.5  # Slightly over but negotiable
    else:
        rate_score = 0.0  # Definitely too expensive

    # Combine: tier fit is the primary signal, rate affordability is secondary
    return round(tier_score * 0.6 + rate_score * 0.4, 4)


def score_engagement(engagement_rate: Optional[float], follower_count: int) -> float:
    if not engagement_rate or engagement_rate <= 0:
        return 0.3  # No engagement data — slight penalty but not zero
    tier = get_tier(follower_count)
    benchmark = ENGAGEMENT_BENCHMARKS[tier]
    return min((engagement_rate / benchmark) / 1.5, 1.0)


def score_platform(required_platforms: list[str], creator_platforms: list[str]) -> float:
    if not required_platforms:
        return 1.0
    covered = sum(1 for p in required_platforms if p in creator_platforms)
    return covered / len(required_platforms)


def score_language(target_language: str, creator_language_profile: dict) -> float:
    if not target_language:
        return 0.5
    return float(creator_language_profile.get(target_language, 0.0))


def score_recency(days_since_last_post: Optional[int]) -> float:
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
) -> MatchScores:
    """
    Pure function. All inputs are pre-fetched primitives.
    No database calls. Fully unit-testable.
    """
    niche    = score_niche(campaign_niche, creator_primary_niche, creator_sub_niches)
    engage   = score_engagement(creator_engagement_rate, creator_follower_count)
    budget   = score_budget_with_tier(campaign_budget, creator_rate, creator_follower_count)
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
