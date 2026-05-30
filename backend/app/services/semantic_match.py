import os
import re
from typing import List, Optional

import google.generativeai as genai

EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "models/text-embedding-004")


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


def get_gemini_embedding(text: str) -> Optional[List[float]]:
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
    except Exception:
        return None
    return None


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
