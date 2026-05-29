import type { Creator, CreatorFilters } from "@/lib/types";
import { fetchApi } from "./client";

const NICHE_MAP: Record<number, string> = {
  1: "technology", 2: "fashion", 3: "food", 4: "travel", 5: "lifestyle",
  6: "finance", 7: "gaming", 8: "education", 9: "health", 10: "beauty",
  11: "fitness", 12: "entertainment", 13: "sports"
};

function mapCreatorResponse(c: any): Creator {
  const primaryNicheId = c.niches?.find((n: any) => n.is_primary)?.niche_id || c.niches?.[0]?.niche_id;
  const primaryNicheName = primaryNicheId ? NICHE_MAP[primaryNicheId] || `Niche ${primaryNicheId}` : "general";

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
    is_available: c.is_available,
    total_collaborations: c.total_collaborations,
    average_rating: c.average_rating ? Number(c.average_rating) : undefined,
  };
}

export async function getCreators(filters?: CreatorFilters): Promise<Creator[]> {
  const query = new URLSearchParams();
  
  if (filters?.niche) {
    // Reverse map niche name to ID
    const nicheId = Object.keys(NICHE_MAP).find(key => NICHE_MAP[Number(key)].toLowerCase() === filters.niche?.toLowerCase());
    if (nicheId) query.append("niche", nicheId);
  }
  
  if (filters?.platform) query.append("platform", filters.platform);
  if (filters?.min_followers) query.append("min_followers", filters.min_followers.toString());
  if (filters?.max_followers) query.append("max_followers", filters.max_followers.toString());
  if (filters?.language) query.append("language", filters.language);
  if (filters?.city) query.append("city", filters.city);
  if (filters?.is_available !== undefined) query.append("is_available", filters.is_available.toString());
  
  const queryString = query.toString();
  const endpoint = queryString ? `/creators/?${queryString}` : '/creators/';
  
  const data = await fetchApi<any[]>(endpoint);
  return data.map(mapCreatorResponse);
}

export async function getCreatorById(id: string): Promise<Creator | null> {
  try {
    const data = await fetchApi<any>(`/creators/${id}`);
    return mapCreatorResponse(data);
  } catch (error) {
    return null;
  }
}

export async function getFeaturedCreators(limit: number = 3): Promise<Creator[]> {
  const data = await fetchApi<any[]>(`/creators/?limit=${limit}`);
  return data.map(mapCreatorResponse);
}
