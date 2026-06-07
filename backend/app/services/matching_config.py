SCORE_WEIGHTS = {
    "niche": 0.35,
    "budget": 0.30,
    "platform": 0.15,
    "engagement": 0.10,
    "language": 0.08,
    "recency": 0.02,
}

BUDGET_SOFT_BUFFER_RATIO = 0.30
BUDGET_RATE_HARD_CAP = 1.0 + BUDGET_SOFT_BUFFER_RATIO
BUDGET_UNKNOWN_SCORE = 0.5

SEMANTIC_SIMILARITY_THRESHOLD = 0.28
SEMANTIC_RESCUE_NICHE_CAP = 0.40

UNKNOWN_RECENCY_SCORE = 0.20

TOP_MATCH_LIMIT = 10
LLM_RATIONALE_TOP_N = 5

TIER_MIN_FLOOR = 0.5
CONFLICT_LOOKBACK_DAYS = 90

BRAND_CATEGORIES = {
    "food_beverage",
    "stationery",
    "edtech",
    "electronics",
    "fashion",
    "sports",
    "gaming",
    "health_wellness",
    "finance",
    "telecom",
    "media_entertainment",
    "home_lifestyle",
}
