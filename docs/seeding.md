# Database Seeding Guide

## TL;DR — Use `db/seed.sql`

```bash
docker compose exec -T postgres psql -U cohesiq -d cohesiq < db/seed.sql
```

That's all you need. `db/seed.sql` is a symlink to the latest snapshot in `db/snapshots/`. Everything else in `backend/scripts/` is for regenerating snapshots and is not needed for day-to-day development.

---

## What `seed.sql` Contains

| Table | Rows | Notes |
|---|---|---|
| `users` | ~219 | Seeded creator/brand users with fake `clerk_id`s (`seed_real_youtube_*`, `seed_real_instagram_*`) |
| `creator_profiles` | ~86 | Real Bangladeshi creators |
| `creator_social_profiles` | ~86 | Real follower counts, handles, profile URLs |
| `creator_portfolio_items` | ~617 | Real recent videos/posts pulled from APIs |
| `creator_rate_cards` | ~266 | Generated rate cards |
| `creator_niches` / `creator_languages` | ~79 / ~122 | Classified via Groq |
| `niches` / `languages` | 16 / 6 | Lookup tables |
| `brand_profiles` | 2 | Test brands |
| `campaigns` | 2 | Test campaigns |

The seeded users are **not real Clerk accounts** — their `clerk_id` values are placeholder strings. They exist purely as the creator corpus for the matching engine and marketplace browsing.

---

## DB Reset + Re-seed

If you need a clean slate:

```bash
# 1. Wipe all data (dynamically truncates every table except alembic_version)
docker compose exec backend python -m scripts.reset_db

# 2. Reload from latest snapshot
docker compose exec -T postgres psql -U cohesiq -d cohesiq < db/seed.sql

# 3. Re-link your Clerk test accounts (optional)
docker compose exec backend python -m scripts.sync_clerk_users
```

Step 3 is only needed if you have `@test.com` Clerk accounts that need their `role` metadata assigned.

`reset_db.py` is schema-agnostic — it discovers all tables at runtime, so it never needs updating as new migrations are added. It never touches `alembic_version` (Alembic owns that).

### What survives a DB reset

| Data | Survives? | Why |
|---|---|---|
| Seeded creators (86 profiles) | ❌ wiped | DB-only rows — restore from `seed.sql` |
| Your Clerk account | ✅ | Identity lives in Clerk, not PostgreSQL |
| Your onboarding profile | ❌ wiped | Re-onboard after reset, or run `sync_clerk_users` |
| Campaigns you created | ❌ wiped | Manual re-entry |

When you log back in after a reset, `get_current_user` lazy-creates your `users` row. The Clerk webhook will also re-fire and recreate it on the next user event.

---

## Snapshot Structure

```
db/
  seed.sql                  ← symlink → snapshots/<latest>.sql  (always load this)
  snapshots/
    2026-06-09.sql          ← data-only dump, no DDL, no alembic_version
```

When the creator corpus changes significantly, regenerate with:

```bash
docker compose exec postgres pg_dump -U cohesiq -d cohesiq \
  --data-only --disable-triggers \
  --exclude-table=alembic_version \
  > db/snapshots/$(date +%Y-%m-%d).sql

# Then repoint the symlink
cd db && ln -sf snapshots/$(date +%Y-%m-%d).sql seed.sql
```

Old snapshots stay in `db/snapshots/` for rollback. The root `seed.sql` at repo root is the original full-schema dump kept as a fallback — use `db/seed.sql` for all normal operations.

---

## How `db/snapshots/2026-06-09.sql` Was Generated (background)

This is reference only — you do not need to run these to use the project.

The dump was produced by Navid's real-data ingestion pipeline:

1. **YouTube** — `scripts/seed_real_youtube_creators.py` calls YouTube Data API v3 for real Bangladeshi creator channels, pulls channel stats, recent videos, topic categories.
2. **Instagram / TikTok** — `scripts/seed_real_social_creators.py` uses Apify to scrape public profile data and recent posts.
3. Both scripts write to the DB, then the DB was dumped with `pg_dump`.

### Legacy scripts (do not use)

| Script | Status | What it did |
|---|---|---|
| `scripts/generate_seed_data.py` | **Outdated** | Tavily + Groq to generate ~100 synthetic Bangladeshi creator/brand profiles as JSON |
| `scripts/seed_db.py` | **Outdated** | Loaded the JSON from `generate_seed_data` into the DB |

These scripts produced synthetic data with made-up follower counts and fake social handles. They have been superseded by the real API pipeline above and the resulting `seed.sql` dump.
