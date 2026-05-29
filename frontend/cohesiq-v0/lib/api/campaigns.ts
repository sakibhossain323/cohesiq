import type { Campaign, CampaignFilters, PlatformType, CampaignStatus } from "@/lib/types";
import { fetchApi } from "./client";

const NICHE_MAP: Record<number, string> = {
  1: "technology", 2: "fashion", 3: "food", 4: "travel", 5: "lifestyle",
  6: "finance", 7: "gaming", 8: "education", 9: "health", 10: "beauty",
  11: "fitness", 12: "entertainment", 13: "sports"
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
    primary_niche: primaryNicheName,
    required_platforms: c.required_platforms,
    budget_per_creator_min: c.budget_per_creator_min || 0,
    budget_per_creator_max: c.budget_per_creator_max,
    application_deadline: c.application_deadline ? new Date(c.application_deadline).toISOString() : "",
    status: c.status as CampaignStatus,
    application_count: 0,
  } as Campaign; // Typecast because UI expects application_count and some other optionals
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
