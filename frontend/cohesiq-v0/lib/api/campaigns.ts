import type { Campaign, CampaignFilters } from "@/lib/types";
import { mockCampaigns } from "@/lib/mock-data/campaigns";
import { sleep } from "@/lib/utils";

export async function getCampaigns(filters?: CampaignFilters): Promise<Campaign[]> {
  await sleep(300);
  let result = [...mockCampaigns];
  
  if (filters?.niche) {
    result = result.filter(c => 
      c.primary_niche.toLowerCase() === filters.niche!.toLowerCase()
    );
  }
  
  if (filters?.platform) {
    result = result.filter(c => 
      c.required_platforms && c.required_platforms.includes(filters.platform!)
    );
  }
  
  if (filters?.min_budget !== undefined) {
    result = result.filter(c => 
      c.budget_per_creator_max >= filters.min_budget!
    );
  }
  
  if (filters?.max_budget !== undefined) {
    result = result.filter(c => 
      c.budget_per_creator_max <= filters.max_budget!
    );
  }
  
  if (filters?.status) {
    result = result.filter(c => c.status === filters.status);
  }
  
  return result;
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  await sleep(300);
  return mockCampaigns.find(c => c.id === id) ?? null;
}

export async function getActiveCampaigns(limit?: number): Promise<Campaign[]> {
  await sleep(300);
  const active = mockCampaigns.filter(c => c.status === "active");
  return limit ? active.slice(0, limit) : active;
}

export async function getCampaignsByBrandId(brandId: string): Promise<Campaign[]> {
  await sleep(300);
  return mockCampaigns.filter(c => c.brand_id === brandId);
}

export async function getSuggestedCampaigns(creatorNiche: string, limit: number = 3): Promise<Campaign[]> {
  await sleep(300);
  return mockCampaigns
    .filter(c => c.status === "active" && c.primary_niche.toLowerCase() === creatorNiche.toLowerCase())
    .slice(0, limit);
}
