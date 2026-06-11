import { NextRequest, NextResponse } from "next/server";

export interface SuggestionRequest {
  campaign: {
    title: string;
    description?: string;
    niche?: string;
    platforms?: string[];
    budget_max?: number;
    min_followers?: number;
    max_followers?: number;
    brand_category?: string;
  };
  scores: {
    avg_niche: number;
    avg_budget: number;
    avg_platform: number;
    avg_language: number;
    avg_engagement: number;
    avg_recency: number;
    avg_total: number;
    top_total: number;
    match_count: number;
  };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }

  const body: SuggestionRequest = await req.json();
  const { campaign, scores } = body;

  const weakDimensions = [
    { name: "niche targeting", score: scores.avg_niche, label: "niche" },
    { name: "budget fit", score: scores.avg_budget, label: "budget" },
    { name: "platform coverage", score: scores.avg_platform, label: "platform" },
    { name: "language alignment", score: scores.avg_language, label: "language" },
    { name: "creator engagement", score: scores.avg_engagement, label: "engagement" },
    { name: "creator recency", score: scores.avg_recency, label: "recency" },
  ]
    .filter((d) => d.score < 0.5)
    .sort((a, b) => a.score - b.score)
    .map((d) => `${d.name} (avg score: ${(d.score * 100).toFixed(0)}%)`);

  const prompt = `You are a campaign optimization advisor for Cohesiq, a B2B influencer matching platform in Bangladesh.

A brand ran AI matching on their campaign and got weak results. Here are the details:

Campaign: "${campaign.title}"
Niche: ${campaign.niche || "not specified"}
Platforms: ${campaign.platforms?.join(", ") || "not specified"}
Budget per creator: ${campaign.budget_max ? `BDT ${campaign.budget_max.toLocaleString()}` : "not specified"}
Follower range: ${campaign.min_followers ? `${campaign.min_followers.toLocaleString()}` : "any"} – ${campaign.max_followers ? campaign.max_followers.toLocaleString() : "any"}
Description: ${campaign.description ? campaign.description.slice(0, 300) : "not provided"}

Match results:
- Total creators matched: ${scores.match_count}
- Top match score: ${(scores.top_total * 100).toFixed(0)}%
- Average match score: ${(scores.avg_total * 100).toFixed(0)}%
- Weakest dimensions: ${weakDimensions.length > 0 ? weakDimensions.join("; ") : "none critically weak"}

Give exactly 3 to 4 short, specific, actionable suggestions to improve their creator matches. Each suggestion must directly reference a concrete change to the campaign settings (niche, budget, platform, follower range, description, language targets, etc.).

Respond ONLY with a valid JSON array of objects. Each object must have:
- "title": short label (5 words max)
- "suggestion": one sentence, specific and actionable (mention exact numbers or values where relevant)
- "dimension": one of: niche | budget | platform | language | followers | description

Example format:
[
  { "title": "Widen niche targeting", "suggestion": "...", "dimension": "niche" },
  ...
]`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 512,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "AI suggestion failed." }, { status: 500 });
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "[]";

  try {
    const parsed = JSON.parse(raw);
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions ?? parsed.items ?? [];
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
