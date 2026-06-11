"""
Async Redis cache client.

Used as a simple cache layer over expensive operations (e.g. matching pipeline).
Falls back gracefully if Redis is not configured or unavailable — callers should
never crash because of a missing cache.

Usage:
    from app.common.cache import cache
    await cache.set("key", value, ttl=300)
    hit = await cache.get("key")   # None on miss or error
    await cache.delete("key")
"""

import json
import logging
import os
from typing import Any, Optional

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    """Lazy-init the async Redis client. Returns None if Redis is not configured."""
    global _client
    if _client is not None:
        return _client

    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        return None

    try:
        import redis.asyncio as aioredis  # type: ignore[import]
        _client = aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        logger.info("Redis cache client initialised: %s", redis_url)
    except Exception as exc:
        logger.warning("Redis unavailable — caching disabled: %s", exc)
        _client = None

    return _client


class _Cache:
    """Thin async wrapper with JSON serialisation and soft-fail on every op."""

    async def get(self, key: str) -> Optional[Any]:
        client = _get_client()
        if client is None:
            return None
        try:
            raw = await client.get(key)
            return json.loads(raw) if raw is not None else None
        except Exception as exc:
            logger.debug("Cache GET error for %s: %s", key, exc)
            return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        client = _get_client()
        if client is None:
            return
        try:
            await client.setex(key, ttl, json.dumps(value, default=str))
        except Exception as exc:
            logger.debug("Cache SET error for %s: %s", key, exc)

    async def delete(self, key: str) -> None:
        client = _get_client()
        if client is None:
            return
        try:
            await client.delete(key)
        except Exception as exc:
            logger.debug("Cache DELETE error for %s: %s", key, exc)

    async def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching a glob pattern (e.g. 'match:*')."""
        client = _get_client()
        if client is None:
            return
        try:
            keys = await client.keys(pattern)
            if keys:
                await client.delete(*keys)
        except Exception as exc:
            logger.debug("Cache DELETE pattern error for %s: %s", pattern, exc)

    @staticmethod
    def matching_key(campaign_id: str) -> str:
        return f"match:{campaign_id}"


cache = _Cache()
