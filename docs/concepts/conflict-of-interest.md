# Conflict Of Interest

## Purpose

Conflict-of-interest protection keeps brands from seeing creators who recently promoted a direct competitor.

This is a trust feature, not a score booster. If a creator has a real direct-competitor conflict, they should be excluded before ranking so the recommendation list feels commercially safe.

## Core Rule

Two brands are competitors when a customer would reasonably choose one instead of the other.

Examples:

- Pepsi vs Coca-Cola: conflict
- Two pen brands: conflict
- Two edtech platforms: conflict
- Pen brand vs edtech platform: no conflict
- Pepsi vs a burger restaurant: no conflict

Creator niche is not enough to decide conflict. A creator can make education content for both a stationery brand and an edtech platform because those brands sell different things.

## Data Model

The first implementation uses product category, not creator niche.

Relevant fields:

```text
brand_profiles.brand_category
campaigns.brand_category
creator_collaboration_history.creator_id
creator_collaboration_history.brand_id
creator_collaboration_history.collaborated_on
```

Current category list lives in:

```text
backend/app/services/matching_config.py::BRAND_CATEGORIES
```

Current categories:

```text
food_beverage
stationery
edtech
electronics
fashion
sports
gaming
health_wellness
finance
telecom
media_entertainment
home_lifestyle
```

`campaigns.brand_category` is copied from the brand when omitted on campaign creation. A campaign may override it when a brand runs campaigns for different product lines.

If both the campaign and brand profile have no `brand_category`, campaign creation still succeeds and `campaigns.brand_category` stays `NULL`. In that case the conflict gate is skipped because missing data is not a confirmed conflict.

## Matching Gate

The active first-cut rule:

```text
same creator
different registered brand
same brand_category
collaboration within last 90 days
=> hard exclude before scoring
```

The gate runs inside:

```text
backend/app/campaigns/service.py::run_campaign_matching
```

Helper:

```text
_has_recent_competitor_conflict(...)
```

The lookback window is configured in:

```text
backend/app/services/matching_config.py::CONFLICT_LOOKBACK_DAYS
```

Current default:

```python
CONFLICT_LOOKBACK_DAYS = 90
```

This is a product/demo assumption, not a verified Bangladesh market standard. Change it only in `matching_config.py` so matching behavior and documentation stay aligned.

## Missing Data Behavior

Missing category data must not create phantom exclusions.

If `campaigns.brand_category` is `NULL`:

```text
skip conflict gate
do not hard exclude
```

If a `creator_collaboration_history` row has `brand_id IS NULL`:

```text
skip that collaboration row
log a warning
do not hard exclude
```

If a registered past brand has no `brand_category`:

```text
skip that collaboration row
do not hard exclude
```

The rule is: missing data is a data-quality issue, not a confirmed conflict.

## Logging

The current implementation logs two useful cases from `_has_recent_competitor_conflict(...)`:

```text
warning: skipped unregistered past brand because no brand_category is available
info: excluded creator because same brand_category conflict was confirmed
```

Example exclusion log shape:

```text
Excluded creator <creator_id> for competitor conflict:
brand_category='edtech', past_brand='Brand B', collaborated_on=2026-05-01
```

## What It Does Not Do Yet

Current limitations:

- It only checks historical collaborations linked to a registered `brand_profiles.id`.
- If a past collaboration stores only `brand_name` without `brand_id`, that row is skipped and logged.
- It does not persist an audit reason for excluded creators; audit is currently log-only.
- It does not support category hierarchies such as `food_beverage -> soft_drinks`.
- The 90-day window is a demo/product assumption, not a verified Bangladesh contract standard.

Planned extensions:

- Add `brand_category` to `creator_collaboration_history` for unregistered past brands.
- Store conflict audit metadata for debug/admin views.
- Consider direct competitor lists or category hierarchy only after flat categories become insufficient.

## Why Not Neo4j Yet

This first cut is relational and enough for demo trust.

Neo4j can later help with multi-hop relationships, agency networks, shared owners, and lookalike conflict expansion, but direct same-category recent collaboration is simple and fast in PostgreSQL.

## Testing Checklist

After migration:

```bash
docker compose exec backend alembic upgrade head
```

Basic matching smoke test:

```bash
docker compose exec backend python -m scripts.test_matching
```

Automated conflict smoke test:

```bash
docker compose exec backend python -m scripts.test_conflict_matching
```

The automated script prints a lightweight audit line after the conflict run:

```text
Conflict audit: 1 baseline creators excluded by same-category recent history.
  - Creator Name conflicted with Conflict Demo Competitor (edtech), collaborated 0 days ago.
```

This is script/debug visibility only. The API still returns only the final matched creators.

Manual conflict test shape:

1. Create Brand A with `brand_category = 'edtech'`.
2. Create Brand B with `brand_category = 'edtech'`.
3. Add a `creator_collaboration_history` row for a creator with Brand B, dated within 90 days.
4. Run matching for Brand A's campaign.
5. The creator should not appear.
6. Change Brand B to `brand_category = 'stationery'`.
7. Run matching again.
8. The creator may appear if other filters pass.

## Product Guidance

Use conflict exclusion carefully. The category should describe what the brand sells, not the content style requested from the creator.

Good examples:

```text
Matador Pen -> stationery
10 Minute School -> edtech
Samsung Bangladesh -> electronics
Grameenphone -> telecom
Coke Studio Bangla -> media_entertainment
```

Bad examples:

```text
Matador Pen -> education
10 Minute School -> education
Samsung Bangladesh -> technology
```

Those bad examples are creator/campaign content niches, not competitor categories.
