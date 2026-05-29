import type { Brand } from "@/lib/types";
import { fetchApi } from "./client";

const NICHE_MAP: Record<number, string> = {
  1: "technology", 2: "fashion", 3: "food", 4: "travel", 5: "lifestyle",
  6: "finance", 7: "gaming", 8: "education", 9: "health", 10: "beauty",
  11: "fitness", 12: "entertainment", 13: "sports"
};

function mapBrandResponse(b: any): Brand {
  return {
    id: b.id,
    brand_name: b.brand_name,
    description: b.description,
    logo_url: b.logo_url,
    website: b.website,
    city: b.city,
    primary_niche: b.niche_id ? NICHE_MAP[b.niche_id] || `Niche ${b.niche_id}` : "general",
    is_verified: b.is_verified,
    total_campaigns: b.total_campaigns,
    average_rating: b.average_rating ? Number(b.average_rating) : undefined,
  };
}

export async function getBrands(): Promise<Brand[]> {
  const data = await fetchApi<any[]>("/brands/");
  return data.map(mapBrandResponse);
}

export async function getBrandById(id: string): Promise<Brand | null> {
  try {
    const data = await fetchApi<any>(`/brands/${id}`);
    return mapBrandResponse(data);
  } catch (error) {
    return null;
  }
}

export async function getVerifiedBrands(): Promise<Brand[]> {
  const data = await fetchApi<any[]>("/brands/");
  return data.map(mapBrandResponse).filter(b => b.is_verified);
}
