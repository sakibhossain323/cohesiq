"""Cohesiq MCP server — exposes the matching engine + admin read tools over MCP.

This is a real Model Context Protocol server (FastMCP) that surfaces Cohesiq's
existing service layer as callable tools. It is consumed two ways:

  * stdio transport  — for desktop MCP clients (Claude Code, Cursor).
  * streamable HTTP  — for the in-app admin "AI Assistant" (a LangChain agent
    that loads these tools via langchain-mcp-adapters).

Every tool delegates to an EXISTING service function — no business logic is
duplicated here. Tools return plain JSON-serialisable dicts (never ORM objects)
so the protocol layer stays clean.

Run:
    python -m mcp_server                      # stdio (default)
    MCP_TRANSPORT=http python -m mcp_server   # streamable HTTP on :8001

Env:
    MCP_TRANSPORT   "stdio" (default) | "http"
    MCP_HTTP_HOST   default 0.0.0.0
    MCP_HTTP_PORT   default 8001
"""

from __future__ import annotations

import os
import uuid
from typing import Any, Optional

from fastmcp import FastMCP

from app.database import AsyncSessionLocal

mcp = FastMCP(
    name="cohesiq-matching-mcp",
    instructions=(
        "Tools for the Cohesiq influencer-matching platform. Use them to read "
        "platform statistics, browse verified creators, run the deterministic "
        "6-factor matching engine for a campaign, read persisted match scores, "
        "and trigger YouTube enrichment. All data is real and read from the "
        "live PostgreSQL database."
    ),
)


def _err(message: str) -> dict[str, Any]:
    return {"ok": False, "error": message}


def _to_uuid(value: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        return None


def _match_to_dict(match: Any) -> dict[str, Any]:
    """Compact, JSON-safe view of an AIMatchScore row."""
    return {
        "creator_id": str(match.creator_id),
        "score_total": match.score_total,
        "sub_scores": {
            "niche": match.score_niche,
            "budget": match.score_budget,
            "platform": match.score_platform,
            "engagement": match.score_engagement,
            "language": match.score_language,
            "recency": match.score_recency,
            "semantic": match.score_semantic,
        },
        "rationale": match.rationale,
    }


def _creator_to_dict(creator: Any) -> dict[str, Any]:
    """Compact, JSON-safe view of a CreatorProfile + primary social profile."""
    socials = getattr(creator, "social_profiles", None) or []
    primary = next(
        (s for s in socials if getattr(s, "is_primary_platform", False)),
        socials[0] if socials else None,
    )
    niches = getattr(creator, "niches", None) or []
    return {
        "creator_id": str(creator.id),
        "display_name": creator.display_name,
        "city": getattr(creator, "city", None),
        "primary_niche": next(
            (n.niche.name for n in niches if getattr(n, "is_primary", False) and getattr(n, "niche", None)),
            None,
        ),
        "platform": getattr(primary, "platform", None) if primary else None,
        "handle": getattr(primary, "handle", None) if primary else None,
        "follower_count": getattr(primary, "follower_count", None) if primary else None,
        "engagement_rate": getattr(primary, "engagement_rate", None) if primary else None,
        "is_api_verified": getattr(primary, "is_api_verified", None) if primary else None,
        "data_source": getattr(primary, "data_source", None) if primary else None,
    }


# --------------------------------------------------------------------------- #
# Tools                                                                        #
# --------------------------------------------------------------------------- #


@mcp.tool
async def platform_stats() -> dict[str, Any]:
    """Return live platform statistics: total users, creators, brands, admins,
    total/active campaigns, total applications, and 7-day signup/application
    counts. Use this to answer "how many ...?" questions about the platform."""
    from app.admin import service as admin_service

    async with AsyncSessionLocal() as db:
        stats = await admin_service.get_platform_stats(db)
    return {"ok": True, "stats": stats}


@mcp.tool
async def list_creators(
    niche: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = 10,
) -> dict[str, Any]:
    """List verified creators, optionally filtered by niche (e.g. "Beauty",
    "Food", "Fitness") and/or platform ("youtube", "instagram", "tiktok").
    Returns up to `limit` compact creator records with follower counts and
    verification provenance."""
    from sqlalchemy import select

    from app.common.models import Niche
    from app.creators import service as creators_service
    from app.creators.schemas import CreatorFilters

    limit = max(1, min(int(limit or 10), 50))

    async with AsyncSessionLocal() as db:
        # CreatorFilters.niche is a niche_id (int) — resolve a human niche name to it.
        niche_id: Optional[int] = None
        if niche:
            row = await db.execute(
                select(Niche.id).where(Niche.name.ilike(niche.strip()))
            )
            niche_id = row.scalar_one_or_none()

        filters = CreatorFilters(
            niche=niche_id,
            platform=(platform.strip().lower() if platform else None),
            limit=limit,
        )
        creators = await creators_service.list_creators(db, filters)

    items = [_creator_to_dict(c) for c in creators[:limit]]
    return {
        "ok": True,
        "count": len(items),
        "niche_resolved": niche_id is not None if niche else None,
        "creators": items,
    }


@mcp.tool
async def get_creator(creator_id: str) -> dict[str, Any]:
    """Fetch a single creator profile by UUID, including their primary social
    profile metrics and verification provenance."""
    cid = _to_uuid(creator_id)
    if cid is None:
        return _err(f"'{creator_id}' is not a valid creator UUID")

    from app.creators import service as creators_service

    async with AsyncSessionLocal() as db:
        creator = await creators_service.get_creator(db, cid)
    if not creator:
        return _err("Creator not found")
    return {"ok": True, "creator": _creator_to_dict(creator)}


@mcp.tool
async def run_matching(campaign_id: str) -> dict[str, Any]:
    """Run the deterministic 6-factor matching engine for a campaign. Scores
    every eligible creator (niche, budget, platform, engagement, language,
    recency), persists results to ai_match_scores, and returns the ranked
    shortlist with sub-scores and rationale."""
    cid = _to_uuid(campaign_id)
    if cid is None:
        return _err(f"'{campaign_id}' is not a valid campaign UUID")

    from app.campaigns import service as campaign_service

    async with AsyncSessionLocal() as db:
        try:
            matches = await campaign_service.run_campaign_matching(db, cid)
        except Exception as exc:  # HTTPException or otherwise — keep tool safe
            detail = getattr(exc, "detail", str(exc))
            return _err(f"Matching failed: {detail}")

    ranked = sorted(
        matches,
        key=lambda m: (m.score_total if m.score_total is not None else -1),
        reverse=True,
    )
    return {
        "ok": True,
        "campaign_id": str(cid),
        "match_count": len(ranked),
        "matches": [_match_to_dict(m) for m in ranked[:10]],
    }


@mcp.tool
async def get_match_scores(campaign_id: str) -> dict[str, Any]:
    """Read the persisted, ranked match scores for a campaign (does not re-run
    matching). Returns the same sub-score breakdown shown in the brand
    dashboard."""
    cid = _to_uuid(campaign_id)
    if cid is None:
        return _err(f"'{campaign_id}' is not a valid campaign UUID")

    from app.campaigns import service as campaign_service

    async with AsyncSessionLocal() as db:
        try:
            matches = await campaign_service.get_campaign_matches(db, cid)
        except Exception as exc:
            detail = getattr(exc, "detail", str(exc))
            return _err(f"Could not read match scores: {detail}")

    return {
        "ok": True,
        "campaign_id": str(cid),
        "match_count": len(matches),
        "matches": [_match_to_dict(m) for m in matches[:10]],
    }


@mcp.tool
async def enrich_creator_youtube(
    creator_id: str,
    channel_ref: str,
    recent_video_limit: int = 6,
) -> dict[str, Any]:
    """Trigger YouTube Data API enrichment for a creator's channel. `channel_ref`
    is a channel ID, @handle, or URL. Persists verified stats + recent videos to
    the creator's social profile and returns the updated follower count."""
    cid = _to_uuid(creator_id)
    if cid is None:
        return _err(f"'{creator_id}' is not a valid creator UUID")

    from app.creators import service as creators_service

    async with AsyncSessionLocal() as db:
        try:
            profile = await creators_service.enrich_youtube_social_profile(
                db,
                cid,
                channel_ref=channel_ref,
                recent_video_limit=max(1, min(int(recent_video_limit or 6), 25)),
            )
        except Exception as exc:
            detail = getattr(exc, "detail", str(exc))
            return _err(f"Enrichment failed: {detail}")

    return {
        "ok": True,
        "creator_id": str(cid),
        "platform": "youtube",
        "handle": getattr(profile, "handle", None),
        "follower_count": getattr(profile, "follower_count", None),
        "is_api_verified": getattr(profile, "is_api_verified", None),
    }


def main() -> None:
    transport = os.getenv("MCP_TRANSPORT", "stdio").strip().lower()
    if transport in {"http", "streamable-http"}:
        host = os.getenv("MCP_HTTP_HOST", "0.0.0.0")
        port = int(os.getenv("MCP_HTTP_PORT", "8001"))
        mcp.run(transport="http", host=host, port=port)
    else:
        mcp.run()  # stdio


if __name__ == "__main__":
    main()
