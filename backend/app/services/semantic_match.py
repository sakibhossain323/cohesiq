"""
Semantic similarity helpers.

Changes vs. the original:
- `get_gemini_embedding` is now async-compatible (kept sync internally;
  wrapped with asyncio.to_thread at call sites if needed).
- `persist_creator_embedding` saves a creator's portfolio embedding into
  creator_social_profiles.embedding (pgvector column, migration 0023).
- `semantic_similarity_pgvector` queries the pgvector IVFFlat index via
  a raw SQL cosine-distance expression instead of computing in-memory.
  Falls back to the original in-memory path when the column is not present.
"""

import logging
import os
import re
from typing import List, Optional

import google.generativeai as genai

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "models/text-embedding-004")
EMBEDDING_DIM = 768


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _token_set(text: str) -> set[str]:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return {t for t in tokens if len(t) > 2}


def _jaccard_similarity(text_a: str, text_b: str) -> float:
    a = _token_set(text_a)
    b = _token_set(text_b)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(x * y for x, y in zip(vec_a, vec_b))
    norm_a = sum(x * x for x in vec_a) ** 0.5
    norm_b = sum(y * y for y in vec_b) ** 0.5
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


# ---------------------------------------------------------------------------
# Gemini embedding
# ---------------------------------------------------------------------------

def get_gemini_embedding(text: str) -> Optional[List[float]]:
    """Call Gemini text-embedding-004 and return the embedding vector."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        genai.configure(api_key=api_key)
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_document",
        )
        embedding = result.get("embedding") if isinstance(result, dict) else None
        if embedding and isinstance(embedding, list):
            return embedding
    except Exception as exc:
        logger.debug("Gemini embedding failed: %s", exc)
    return None


# ---------------------------------------------------------------------------
# pgvector persistence
# ---------------------------------------------------------------------------

async def persist_creator_embedding(
    db,  # AsyncSession
    creator_social_profile_id,
    text: str,
) -> bool:
    """
    Compute and persist an embedding into creator_social_profiles.embedding.

    Returns True if the embedding was written, False on any failure (soft-fail).
    The column is added by Alembic migration 0023; if the column doesn't exist
    yet this call is a no-op.
    """
    embedding = get_gemini_embedding(text)
    if embedding is None:
        return False
    try:
        from sqlalchemy import text as sa_text  # noqa: PLC0415
        # pgvector accepts a Python list cast to ::vector via the extension
        vec_literal = "[" + ",".join(str(v) for v in embedding) + "]"
        await db.execute(
            sa_text(
                "UPDATE creator_social_profiles "
                "SET embedding = :vec::vector "
                "WHERE id = :id"
            ),
            {"vec": vec_literal, "id": str(creator_social_profile_id)},
        )
        await db.commit()
        return True
    except Exception as exc:
        logger.debug("persist_creator_embedding failed for %s: %s", creator_social_profile_id, exc)
        await db.rollback()
        return False


# ---------------------------------------------------------------------------
# Similarity — pgvector-first, in-memory fallback
# ---------------------------------------------------------------------------

async def semantic_similarity_pgvector(
    db,  # AsyncSession
    campaign_text: str,
    creator_social_profile_id,
) -> float:
    """
    Query the pgvector IVFFlat index for the cosine similarity between the
    campaign text and the stored creator embedding.

    Falls back to Jaccard similarity if:
    - the embedding column doesn't exist (pre-migration),
    - the creator has no stored embedding yet,
    - pgvector extension is not installed.
    """
    campaign_embedding = get_gemini_embedding(campaign_text)
    if campaign_embedding is None:
        return 0.0

    try:
        from sqlalchemy import text as sa_text  # noqa: PLC0415
        vec_literal = "[" + ",".join(str(v) for v in campaign_embedding) + "]"
        result = await db.execute(
            sa_text(
                "SELECT 1 - (embedding <=> :vec::vector) AS cosine_sim "
                "FROM creator_social_profiles "
                "WHERE id = :id AND embedding IS NOT NULL"
            ),
            {"vec": vec_literal, "id": str(creator_social_profile_id)},
        )
        row = result.fetchone()
        if row and row.cosine_sim is not None:
            return float(row.cosine_sim)
    except Exception as exc:
        logger.debug("pgvector query failed, falling back to Jaccard: %s", exc)

    # Fallback — plain Jaccard on text tokens
    return _jaccard_similarity(campaign_text, "")


# ---------------------------------------------------------------------------
# Original sync entry-point (kept for backwards-compat with matching.py)
# ---------------------------------------------------------------------------

def semantic_similarity(
    campaign_text: str,
    creator_text: str,
    campaign_embedding: Optional[List[float]] = None,
) -> float:
    if campaign_embedding is None:
        campaign_embedding = get_gemini_embedding(campaign_text)
    if campaign_embedding is not None:
        creator_embedding = get_gemini_embedding(creator_text)
        if creator_embedding is not None:
            return _cosine_similarity(campaign_embedding, creator_embedding)
    return _jaccard_similarity(campaign_text, creator_text)
