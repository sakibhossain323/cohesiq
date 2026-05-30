import json
import os
import uuid
from typing import List

import groq
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.campaigns.models import Campaign, AIMatchScore
from app.creators.models import CreatorProfile, CreatorSocialProfile
from app.common.models import Niche
from app.database import AsyncSessionLocal


import google.generativeai as genai

def generate_matches_with_llm(campaign: Campaign, candidates: List[CreatorProfile]) -> List[dict]:
    # Format campaign brief
    brief = {
        "title": campaign.title,
        "description": campaign.description,
        "budget_per_creator_max": campaign.budget_per_creator_max,
        "required_platforms": campaign.required_platforms,
        "target_countries": campaign.target_countries,
    }

    # Format candidates
    candidate_data = []
    for c in candidates:
        platforms = [{
            "platform": p.platform,
            "follower_count": p.follower_count,
            "engagement_rate": p.engagement_rate
        } for p in c.social_profiles]
        
        candidate_data.append({
            "creator_id": str(c.id),
            "display_name": c.display_name,
            "bio": c.bio,
            "city": c.city,
            "platforms": platforms
        })

    prompt = f"""
    You are the Cohesiq AI Matching Engine.
    Here is a Brand's Campaign Brief:
    {json.dumps(brief, indent=2)}

    Here are the candidate creators retrieved from our database:
    {json.dumps(candidate_data, indent=2)}

    Your task is to act as the recommendation engine. 
    Evaluate each creator against the campaign brief based on niche relevance, follower metrics, and platform fit.
    For each candidate, assign a total match_score (0.0 to 1.0) and write a short 1-2 sentence rationale explaining exactly why they are a good or bad fit for this campaign.

    Return ONLY a valid JSON array of objects. 
    Each object must have exactly these keys:
    - "creator_id": string (must match exactly the creator_id provided)
    - "score_total": float (between 0.0 and 1.0, e.g. 0.85 for 85% match)
    - "rationale": string (1-2 sentences)

    DO NOT include markdown formatting like ```json.
    """

    # 1. Try Groq
    try:
        client = groq.Groq(api_key=os.environ.get("GROQ_API_KEY"))
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You output ONLY valid JSON arrays without markdown blocks."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.2,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        return json.loads(content)
    except Exception as e:
        print(f"Groq failed: {e}. Falling back to Gemini.")

    # 2. Try Gemini Fallback
    try:
        genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            f"You output ONLY valid JSON arrays without markdown blocks.\n{prompt}",
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
            )
        )
        content = response.text.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        return json.loads(content)
    except Exception as e:
        print(f"Gemini failed: {e}. Falling back to heuristic.")
        
    # 3. Fallback Heuristic
    results = []
    for c in candidate_data:
        results.append({
            "creator_id": c["creator_id"],
            "score_total": 0.5,
            "rationale": f"Generated via fallback heuristic. {c['display_name']} was retrieved as a baseline candidate."
        })
    return results


async def get_and_generate_matches(db: AsyncSession, campaign_id: uuid.UUID) -> List[AIMatchScore]:
    # 1. Fetch Campaign
    campaign = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id)
    )
    campaign = campaign.scalar_one_or_none()
    if not campaign:
        return []

    # 2. Retrieve candidates (The "Graph" Traversal)
    # We will grab all creators who have a social profile on one of the required platforms
    # and match the primary niche (or just all creators if we want LLM to do the heavy lifting, 
    # but let's filter by platform to save tokens and time).
    query = (
        select(CreatorProfile)
        .join(CreatorSocialProfile)
        .options(selectinload(CreatorProfile.social_profiles))
        .distinct()
    )
    
    if campaign.required_platforms:
        query = query.where(CreatorSocialProfile.platform.in_(campaign.required_platforms))
    
    # Limit to 15 candidates for the LLM context window
    result = await db.execute(query.limit(15))
    candidates = list(result.scalars().all())

    if not candidates:
        return []

    # 3. Call LLM Service
    llm_results = generate_matches_with_llm(campaign, candidates)

    # 4. Save results as AIMatchScore
    saved_scores = []
    for res in llm_results:
        # Check if score already exists to avoid duplicates
        existing = await db.execute(
            select(AIMatchScore).where(
                AIMatchScore.campaign_id == campaign_id,
                AIMatchScore.creator_id == res["creator_id"]
            )
        )
        score_record = existing.scalar_one_or_none()
        
        if not score_record:
            score_record = AIMatchScore(
                campaign_id=campaign_id,
                creator_id=res["creator_id"],
                score_total=res.get("score_total", 0.0),
                rationale=res.get("rationale", "")
            )
            db.add(score_record)
        else:
            score_record.score_total = res.get("score_total", 0.0)
            score_record.rationale = res.get("rationale", "")
            
        saved_scores.append(score_record)

    await db.commit()
    
    # 5. Return sorted matches with creator loaded for the API response
    final_results = await db.execute(
        select(AIMatchScore)
        .where(AIMatchScore.campaign_id == campaign_id)
        .options(
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.social_profiles),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.niches),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.languages),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.rate_cards),
            selectinload(AIMatchScore.creator).selectinload(CreatorProfile.portfolio_items)
        )
        .order_by(AIMatchScore.score_total.desc())
    )
    return list(final_results.scalars().all())
