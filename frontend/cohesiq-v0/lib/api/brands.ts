import type { Brand } from "@/lib/types";
import { fetchApi } from "./client";

const NICHE_MAP: Record<number, string> = {
  1: "technology", 2: "fashion", 3: "food", 4: "travel", 5: "lifestyle",
  6: "finance", 7: "gaming", 8: "education", 9: "health", 10: "beauty",
  11: "fitness", 12: "entertainment", 13: "sports", 19: "comedy"
};

function mapBrandResponse(b: any): Brand {
  return {
    id: b.id,
    brand_name: b.brand_name,
    description: b.description,
    logo_url: b.logo_url,
    website: b.website,
    city: b.city,
    niche: b.niche_id ? NICHE_MAP[b.niche_id] || `Niche ${b.niche_id}` : "general",
    brand_category: b.brand_category || undefined,
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

export async function getMyBrandProfile(token: string): Promise<Brand | null> {
  try {
    const data = await fetchApi<any>("/brands/me", { token });
    return mapBrandResponse(data);
  } catch (error) {
    return null;
  }
}

export async function updateBrandProfile(id: string, data: any, token: string): Promise<Brand> {
  const result = await fetchApi<any>(`/brands/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    token,
  });
  return mapBrandResponse(result);
}
