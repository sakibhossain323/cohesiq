"use server";

export interface BriefAnalysisResult {
  title?: string;
  description?: string;
  campaign_type?: string;
  primary_niche_id?: number;
  budget_per_creator_max?: number;
  number_of_creators?: number;
  creator_min_followers?: number;
  kpi_targets?: {
    reach?: number;
    engagement_rate?: number;
    conversions?: number;
    roi_target?: number;
  };
  hashtags?: string[];
  tracking_notes?: string;
  summary?: string;
}

const NICHE_MAP: Record<string, number> = {
  technology: 1, gaming: 2, fashion: 3, beauty: 4, food: 5,
  travel: 6, lifestyle: 7, education: 8, finance: 9, fitness: 10,
  parenting: 11, entertainment: 12, news: 13, other: 14,
};

const SYSTEM_PROMPT = `You are a campaign brief parser for an influencer marketing platform in Bangladesh.
Extract AND intelligently infer campaign details from the user's brief. Always return all fields with your best estimate — never leave a field null unless it truly cannot be guessed.

Output schema (return ALL fields, infer reasonable defaults when not explicitly stated):
{
  "title": string (short punchy campaign title, max 60 chars, based on the brand/product/goal),
  "description": string (2-3 sentence campaign brief expanding on the user's input — include product, target audience, and creator expectations),
  "campaign_type": one of ["paid_content","product_gifting","affiliate","brand_ambassador","talent_booking","ugc_only"],
  "primary_niche": one of ["technology","gaming","fashion","beauty","food","travel","lifestyle","education","finance","fitness","parenting","entertainment","news","other"],
  "budget_per_creator_max": integer in BDT (infer a reasonable amount if not stated — small brands ~5000-15000, mid ~15000-50000, large ~50000-150000),
  "number_of_creators": integer (default 3 if unclear),
  "creator_min_followers": integer (default 10000 if unclear),
  "kpi_targets": {
    "reach": integer (estimate: number_of_creators × creator_min_followers × 1.5),
    "engagement_rate": float percentage (typical: 3.5 for YouTube, 5.0 for Instagram),
    "conversions": integer (optional, only if sales/conversions mentioned),
    "roi_target": float percentage (optional, only if ROI mentioned)
  },
  "hashtags": string[] without # prefix (suggest 2-3 relevant hashtags based on brand/product),
  "tracking_notes": string (suggest UTM or promo code tracking if relevant),
  "summary": string (1-sentence summary of what you extracted and inferred)
}

Campaign type rules:
- "cashback", "commission", "affiliate link" → affiliate
- "gifting", "free product", "send product" → product_gifting
- "ambassador", "long-term", "ongoing" → brand_ambassador
- "talent booking", "event", "appearance" → talent_booking
- "ugc", "user generated content" → ugc_only
- payment mentioned or implied → paid_content (default)

Return only the JSON object, no markdown, no explanation.`;

async function callGroq(brief: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("no key");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Brief:\n${brief}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 512,
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callGemini(brief: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("no key");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nBrief:\n${brief}` }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 512 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${err}`);
  }
  const data = await res.json();
  return JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
}

export async function analyzeBriefAction(brief: string): Promise<BriefAnalysisResult> {
  if (!brief.trim() || brief.trim().length < 20) {
    throw new Error("Brief is too short — write at least 20 characters describing your campaign.");
  }

  let parsed: any;
  try {
    parsed = await callGroq(brief);
  } catch {
    parsed = await callGemini(brief);
  }

  const nicheId = parsed.primary_niche
    ? NICHE_MAP[parsed.primary_niche.toLowerCase()] ?? undefined
    : undefined;

  return {
    title: parsed.title,
    description: parsed.description,
    campaign_type: parsed.campaign_type,
    primary_niche_id: nicheId,
    budget_per_creator_max: parsed.budget_per_creator_max,
    number_of_creators: parsed.number_of_creators,
    creator_min_followers: parsed.creator_min_followers,
    kpi_targets: parsed.kpi_targets,
    hashtags: parsed.hashtags,
    tracking_notes: parsed.tracking_notes,
    summary: parsed.summary,
  };
}
