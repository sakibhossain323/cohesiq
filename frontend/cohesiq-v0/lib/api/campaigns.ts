import type { Campaign, CampaignFilters, PlatformType, CampaignStatus, AIMatchScore } from "@/lib/types";
import { fetchApi } from "./client";

export const NICHE_MAP: Record<number, string> = {
  1: "technology",
  2: "gaming",
  3: "fashion",
  4: "beauty",
  5: "food",
  6: "travel",
  7: "lifestyle",
  8: "education",
  9: "finance",
  10: "fitness",
  11: "parenting",
  12: "entertainment",
  13: "news",
  14: "other",
};

let brandsCache: Record<string, any> = {};

async function resolveBrand(brandId: string): Promise<any> {
  if (brandsCache[brandId]) return brandsCache[brandId];
  try {
    const brandData = await fetchApi<any>(`/brands/${brandId}`);
    brandsCache[brandId] = brandData;
    return brandData;
  } catch (error) {
    return {
      id: brandId,
      brand_name: "Unknown Brand",
      logo_url: "",
      is_verified: false
    };
  }
}

async function mapCampaignResponse(c: any): Promise<Campaign> {
  const primaryNicheName = c.primary_niche_id ? NICHE_MAP[c.primary_niche_id] || `Niche ${c.primary_niche_id}` : "general";
  const brandData = await resolveBrand(c.brand_id);

  return {
    ...c,
    id: c.id,
    brand_id: c.brand_id,
    brand: {
      id: brandData.id || c.brand_id,
      brand_name: brandData.brand_name || "Unknown Brand",
      logo_url: brandData.logo_url || "",
      is_verified: brandData.is_verified || false,
    },
    title: c.title,
    description: c.description,
    brand_category: c.brand_category || brandData.brand_category || undefined,
    primary_niche: primaryNicheName,
    required_platforms: c.required_platforms,
    budget_per_creator_min: c.budget_per_creator_min || 0,
    budget_per_creator_max: c.budget_per_creator_max,
    application_deadline: c.application_deadline ? new Date(c.application_deadline).toISOString() : "",
    status: c.status as CampaignStatus,
    application_count: 0,
  } as Campaign; // Typecast because UI expects application_count and some other optionals
}

function mapCreatorFromRaw(c: any) {
  if (!c) return undefined;
  const primaryNicheId = c.niches?.find((n: any) => n.is_primary)?.niche_id ?? c.niches?.[0]?.niche_id;
  const primaryNicheName = primaryNicheId != null ? NICHE_MAP[primaryNicheId] || `Niche ${primaryNicheId}` : "other";

  return {
    id: c.id,
    display_name: c.display_name,
    tagline: c.tagline,
    bio: c.bio,
    profile_photo_url: c.profile_photo_url,
    city: c.city,
    primary_niche: primaryNicheName,
    niches: c.niches ? c.niches.map((n: any) => NICHE_MAP[n.niche_id] || `Niche ${n.niche_id}`) : [],
    languages: c.languages ? c.languages.map((l: any) => l.language_code) : [],
    social_profiles: c.social_profiles || [],
    rate_cards: c.rate_cards || [],
    is_available: c.is_available ?? true,
    total_collaborations: c.total_collaborations ?? 0,
    average_rating: c.average_rating ? Number(c.average_rating) : undefined,
    min_budget: c.min_budget,
  };
}

function mapMatchScore(m: any): AIMatchScore {
  return {
    id: m.id,
    campaign_id: m.campaign_id,
    creator_id: m.creator_id,
    score_niche: m.score_niche,
    score_engagement: m.score_engagement,
    score_budget: m.score_budget,
    score_language: m.score_language,
    score_platform: m.score_platform,
    score_recency: m.score_recency,
    score_semantic: m.score_semantic,
    score_total: m.score_total,
    rationale: m.rationale,
    generated_at: m.generated_at,
    creator: mapCreatorFromRaw(m.creator),
  };
}

export async function getCampaigns(filters?: CampaignFilters): Promise<Campaign[]> {
  const query = new URLSearchParams();
  
  if (filters?.niche) {
    const nicheId = Object.keys(NICHE_MAP).find(key => NICHE_MAP[Number(key)].toLowerCase() === filters.niche?.toLowerCase());
    if (nicheId) query.append("niche", nicheId);
  }
  
  if (filters?.platform) query.append("platform", filters.platform);
  if (filters?.min_budget) query.append("min_budget", filters.min_budget.toString());
  if (filters?.max_budget) query.append("max_budget", filters.max_budget.toString());
  if (filters?.status) query.append("status", filters.status);
  
  const queryString = query.toString();
  const endpoint = queryString ? `/campaigns/?${queryString}` : '/campaigns/';
  
  const data = await fetchApi<any[]>(endpoint);
  return Promise.all(data.map(mapCampaignResponse));
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  try {
    const data = await fetchApi<any>(`/campaigns/${id}`);
    return await mapCampaignResponse(data);
  } catch (error) {
    return null;
  }
}

export async function getActiveCampaigns(limit?: number): Promise<Campaign[]> {
  const endpoint = limit ? `/campaigns/?status=active&limit=${limit}` : `/campaigns/?status=active`;
  const data = await fetchApi<any[]>(endpoint);
  return Promise.all(data.map(mapCampaignResponse));
}

export async function getCampaignsByBrandId(brandId: string): Promise<Campaign[]> {
  try {
    const data = await fetchApi<any[]>(`/brands/${brandId}/campaigns`);
    return Promise.all(data.map(mapCampaignResponse));
  } catch (error) {
    return [];
  }
}

export async function getSuggestedCampaigns(creatorNiche: string, limit: number = 3): Promise<Campaign[]> {
  const query = new URLSearchParams();
  query.append("status", "active");
  query.append("limit", limit.toString());
  
  const nicheId = Object.keys(NICHE_MAP).find(key => NICHE_MAP[Number(key)].toLowerCase() === creatorNiche.toLowerCase());
  if (nicheId) query.append("niche", nicheId);
  
  const data = await fetchApi<any[]>(`/campaigns/?${query.toString()}`);
  return Promise.all(data.map(mapCampaignResponse));
}

export async function runCampaignMatching(campaignId: string, token: string): Promise<AIMatchScore[]> {
  const raw = await fetchApi<any[]>(`/campaigns/${campaignId}/run-matching`, {
    method: "POST",
    token,
  });
  return raw.map(mapMatchScore);
}

export async function getCampaignMatches(campaignId: string, token: string): Promise<AIMatchScore[]> {
  const raw = await fetchApi<any[]>(`/campaigns/${campaignId}/matches`, {
    method: "GET",
    token,
  });
  return raw.map(mapMatchScore);
}

export async function createCampaign(data: any, token: string): Promise<Campaign> {
  const result = await fetchApi<any>("/campaigns/", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
  return mapCampaignResponse(result);
}

export async function inviteCreatorToCampaign(campaignId: string, creatorId: string, brandNotes: string | undefined, token: string): Promise<any> {
  return fetchApi<any>(`/campaigns/${campaignId}/invite`, {
    method: "POST",
    body: JSON.stringify({ creator_id: creatorId, brand_notes: brandNotes }),
    token,
  });
}

export async function respondToInvitation(campaignId: string, applicationId: string, action: "accept" | "decline", proposalText: string | undefined, proposedRate: number | undefined, token: string): Promise<any> {
  return fetchApi<any>(`/campaigns/${campaignId}/applications/${applicationId}/respond-invite`, {
    method: "PATCH",
    body: JSON.stringify({ action, proposal_text: proposalText, proposed_rate: proposedRate }),
    token,
  });
}

export async function updateApplicationStatus(
  campaignId: string,
  applicationId: string,
  status: string,
  token: string,
  rejectionReason?: string,
): Promise<any> {
  return fetchApi<any>(`/campaigns/${campaignId}/applications/${applicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, rejection_reason: rejectionReason ?? null }),
    token,
  });
}

export async function updateCampaign(campaignId: string, data: any, token: string): Promise<Campaign> {
  const result = await fetchApi<any>(`/campaigns/${campaignId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    token,
  });
  return mapCampaignResponse(result);
}

export async function updateCampaignStatus(campaignId: string, status: "active" | "cancelled" | "in_progress" | "completed" | "archived", token: string): Promise<Campaign> {
  const result = await fetchApi<any>(`/campaigns/${campaignId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    token,
  });
  return mapCampaignResponse(result);
}
