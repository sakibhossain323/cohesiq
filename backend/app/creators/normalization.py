from __future__ import annotations

import json
import re
from collections import Counter

from groq import Groq

from app.config import settings
from app.social_ingestion.schemas import PublicSocialProfileEnrichment
from app.services.matching import ENGAGEMENT_BENCHMARKS, get_tier
from app.youtube.schemas import YouTubeChannelEnrichment


YOUTUBE_CATEGORY_MAP: dict[str, str] = {
    "Lifestyle_(sociology)": "Lifestyle",
    "Lifestyle": "Lifestyle",
    "Technology": "Technology",
    "Food": "Food",
    "Food_and_drink": "Food",
    "Travel": "Travel",
    "Tourism": "Travel",
    "Fashion": "Fashion",
    "Beauty": "Beauty",
    "Video_game_culture": "Gaming",
    "Gaming": "Gaming",
    "Education": "Education",
    "Physical_fitness": "Fitness",
    "Entertainment": "Entertainment",
    "Comedy": "Comedy",
    "Music": "Entertainment",
    "Film": "Entertainment",
}

ALLOWED_NICHES = [
    "Technology",
    "Food",
    "Travel",
    "Fashion",
    "Beauty",
    "Lifestyle",
    "Gaming",
    "Education",
    "Fitness",
    "Entertainment",
    "Comedy",
]

KNOWN_BD_CITIES = {
    "barisal",
    "bogura",
    "chattogram",
    "chittagong",
    "comilla",
    "cumilla",
    "dhaka",
    "gazipur",
    "khulna",
    "mymensingh",
    "narayanganj",
    "rajshahi",
    "rangpur",
    "sylhet",
}

_BANGLA_RE = re.compile(r"[\u0980-\u09ff]")
_LATIN_RE = re.compile(r"[A-Za-z]")
_BANGLISH_HINTS = {
    "ami",
    "apni",
    "bangla",
    "bd",
    "bhalo",
    "bhai",
    "dhaka",
    "kemon",
    "kore",
    "niye",
}


def normalize_city(city: str | None) -> str:
    if not city:
        return "unknown_location"
    cleaned = city.strip()
    if not cleaned:
        return "unknown_location"
    if cleaned.casefold() in KNOWN_BD_CITIES:
        return "Chattogram" if cleaned.casefold() == "chittagong" else cleaned.title()
    return "unknown_location"


def map_youtube_topic_categories(topic_categories: list[str]) -> list[str]:
    niches: list[str] = []
    for category in topic_categories:
        key = category.rstrip("/").split("/")[-1]
        niche = YOUTUBE_CATEGORY_MAP.get(key)
        if niche and niche not in niches:
            niches.append(niche)
    return niches


def classify_niche_with_groq(
    enrichment: YouTubeChannelEnrichment,
    *,
    allowed_niches: list[str] | None = None,
) -> str | None:
    if not settings.groq_api_key:
        return None

    allowed = allowed_niches or ALLOWED_NICHES
    client = Groq(api_key=settings.groq_api_key)
    prompt = _build_groq_niche_prompt(
        enrichment,
        allowed_niches=allowed,
    )
    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Return only valid JSON. Do not include markdown.",
                },
                {"role": "user", "content": prompt},
            ],
            model="llama-3.1-8b-instant",
            temperature=0.1,
        )
        content = response.choices[0].message.content or ""
        return parse_groq_niche_response(content, allowed_niches=allowed)
    except Exception:
        return None


def classify_public_social_niche_with_groq(
    enrichment: PublicSocialProfileEnrichment,
    *,
    allowed_niches: list[str] | None = None,
) -> str | None:
    if not settings.groq_api_key:
        return classify_public_social_niche_from_keywords(enrichment)

    allowed = allowed_niches or ALLOWED_NICHES
    client = Groq(api_key=settings.groq_api_key)
    prompt = _build_public_social_groq_niche_prompt(
        enrichment,
        allowed_niches=allowed,
    )
    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Return only valid JSON. Do not include markdown.",
                },
                {"role": "user", "content": prompt},
            ],
            model="llama-3.1-8b-instant",
            temperature=0.1,
        )
        content = response.choices[0].message.content or ""
        return (
            parse_groq_niche_response(content, allowed_niches=allowed)
            or classify_public_social_niche_from_keywords(
                enrichment,
                allowed_niches=allowed,
            )
        )
    except Exception:
        return classify_public_social_niche_from_keywords(
            enrichment,
            allowed_niches=allowed,
        )


def classify_public_social_niche_from_keywords(
    enrichment: PublicSocialProfileEnrichment,
    *,
    allowed_niches: list[str] | None = None,
) -> str | None:
    allowed = set(allowed_niches or ALLOWED_NICHES)
    text_parts = [
        enrichment.handle,
        enrichment.display_name or "",
        enrichment.bio or "",
    ]
    text_parts.extend(post.title or "" for post in enrichment.recent_posts[:12])
    text = " ".join(text_parts).casefold()

    keyword_map: list[tuple[str, set[str]]] = [
        ("Education", {"education", "learn", "study", "teacher", "tutorial", "course", "upskill", "school", "university", "শিক্ষা"}),
        ("Food", {"food", "recipe", "restaurant", "cooking", "cook", "eat", "iftar", "ফুড", "রান্না"}),
        ("Travel", {"travel", "tour", "trip", "hotel", "resort", "flight", "beach", "ভ্রমণ"}),
        ("Fashion", {"fashion", "style", "outfit", "model", "modeling", "dress", "wear", "ফ্যাশন"}),
        ("Beauty", {"beauty", "makeup", "skincare", "cosmetic", "salon", "hair", "মেকআপ"}),
        ("Gaming", {"gaming", "gameplay", "gamer", "pubg", "free fire", "minecraft", "গেম"}),
        ("Technology", {"tech", "technology", "gadget", "phone", "laptop", "review", "software", "ai"}),
        ("Fitness", {"fitness", "gym", "workout", "sports", "cricket", "football", "athlete", "health"}),
        ("Entertainment", {"entertainment", "music", "actor", "acting", "drama", "celebrity", "comedy", "dance", "song", "funny", "বিনোদন"}),
        ("Lifestyle", {"lifestyle", "family", "daily", "life", "home", "parenting", "vlog"}),
    ]
    for niche, keywords in keyword_map:
        if niche in allowed and any(_keyword_matches(text, keyword) for keyword in keywords):
            return niche
    return None


def _keyword_matches(text: str, keyword: str) -> bool:
    if not keyword:
        return False
    if any("\u0980" <= char <= "\u09ff" for char in keyword):
        return keyword in text
    if " " in keyword:
        return keyword in text
    return bool(re.search(rf"(?<![a-z0-9]){re.escape(keyword)}(?![a-z0-9])", text))


def parse_groq_niche_response(
    content: str,
    *,
    allowed_niches: list[str] | None = None,
) -> str | None:
    allowed = set(allowed_niches or ALLOWED_NICHES)
    cleaned = content.strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0].strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned.split("```", 1)[1].split("```", 1)[0].strip()

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        return None

    niche = payload.get("niche") if isinstance(payload, dict) else None
    if isinstance(niche, str) and niche in allowed:
        return niche
    return None


def _build_groq_niche_prompt(
    enrichment: YouTubeChannelEnrichment,
    *,
    allowed_niches: list[str],
) -> str:
    recent_items = []
    for video in enrichment.recent_videos[:5]:
        recent_items.append(
            {
                "title": video.title,
                "description": _truncate_for_prompt(video.description or "", 800),
            }
        )

    payload = {
        "allowed_niches": allowed_niches,
        "channel_title": enrichment.title,
        "channel_description": _truncate_for_prompt(enrichment.description or "", 1200),
        "recent_videos": recent_items,
    }
    return (
        "Classify this YouTube creator into exactly one allowed Cohesiq niche. "
        "Use the channel description and recent video titles/descriptions. "
        "Return JSON with keys: niche, confidence, reason. "
        "The niche value must exactly match one item in allowed_niches.\n\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )


def _build_public_social_groq_niche_prompt(
    enrichment: PublicSocialProfileEnrichment,
    *,
    allowed_niches: list[str],
) -> str:
    recent_items = []
    for post in enrichment.recent_posts[:8]:
        recent_items.append(
            {
                "title": _truncate_for_prompt(post.title or "", 800),
                "url": post.url,
                "views": post.view_count,
                "likes": post.like_count,
                "comments": post.comment_count,
                "shares": post.share_count,
            }
        )

    payload = {
        "allowed_niches": allowed_niches,
        "platform": enrichment.platform,
        "handle": enrichment.handle,
        "display_name": enrichment.display_name,
        "bio": _truncate_for_prompt(enrichment.bio or "", 1200),
        "recent_posts": recent_items,
    }
    return (
        "Classify this social creator into exactly one allowed Cohesiq niche. "
        "Use the profile bio/display name and recent post captions/metrics. "
        "Return JSON with keys: niche, confidence, reason. "
        "The niche value must exactly match one item in allowed_niches.\n\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )


def detect_content_languages(enrichment: YouTubeChannelEnrichment) -> list[str]:
    text_parts: list[str] = [enrichment.title]
    for video in enrichment.recent_videos:
        text_parts.append(video.title)
        if video.description:
            text_parts.append(video.description)
    text = " ".join(text_parts)
    if not text.strip():
        return ["bn"]

    counts = Counter(_detect_language_for_text(part) for part in text_parts if part)
    languages = [language for language, _ in counts.most_common() if language]
    if not languages:
        return ["bn"]
    if "bn" in languages and "en" in languages:
        return ["bn", "en"]
    return languages[:2]


def engagement_vs_tier_ratio(
    *,
    follower_count: int | None,
    engagement_rate: float | None,
) -> float | None:
    if follower_count is None or engagement_rate is None:
        return None
    tier = get_tier(follower_count)
    benchmark = ENGAGEMENT_BENCHMARKS[tier]
    if benchmark <= 0:
        return None
    return round(engagement_rate / benchmark, 4)


def _detect_language_for_text(text: str) -> str:
    has_bangla = bool(_BANGLA_RE.search(text))
    has_latin = bool(_LATIN_RE.search(text))
    lower_words = set(re.findall(r"[a-z]+", text.lower()))
    has_banglish = bool(lower_words & _BANGLISH_HINTS)

    if has_bangla:
        return "bn"
    if has_banglish:
        return "bn"
    if has_latin:
        return "en"
    return "bn"


def _truncate_for_prompt(text: str, max_length: int) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= max_length:
        return text
    return text[: max_length - 1].rsplit(" ", 1)[0].strip()
