import type { Creator, CreatorFilters } from "@/lib/types";
import { mockCreators } from "@/lib/mock-data/creators";
import { sleep } from "@/lib/utils";

export async function getCreators(filters?: CreatorFilters): Promise<Creator[]> {
  await sleep(300);
  let result = [...mockCreators];
  
  if (filters?.niche) {
    result = result.filter(c => 
      c.primary_niche.toLowerCase() === filters.niche!.toLowerCase() ||
      c.niches.some(n => n.toLowerCase() === filters.niche!.toLowerCase())
    );
  }
  
  if (filters?.platform) {
    result = result.filter(c => 
      c.social_profiles.some(sp => sp.platform === filters.platform)
    );
  }
  
  if (filters?.min_followers !== undefined) {
    result = result.filter(c => {
      const maxFollowers = Math.max(...c.social_profiles.map(sp => sp.follower_count ?? 0));
      return maxFollowers >= filters.min_followers!;
    });
  }
  
  if (filters?.max_followers !== undefined) {
    result = result.filter(c => {
      const maxFollowers = Math.max(...c.social_profiles.map(sp => sp.follower_count ?? 0));
      return maxFollowers <= filters.max_followers!;
    });
  }
  
  if (filters?.language) {
    result = result.filter(c => 
      c.languages.some(l => l.toLowerCase() === filters.language!.toLowerCase())
    );
  }
  
  if (filters?.city) {
    result = result.filter(c => 
      c.city?.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }
  
  if (filters?.is_available !== undefined) {
    result = result.filter(c => c.is_available === filters.is_available);
  }
  
  return result;
}

export async function getCreatorById(id: string): Promise<Creator | null> {
  await sleep(300);
  return mockCreators.find(c => c.id === id) ?? null;
}

export async function getFeaturedCreators(limit: number = 3): Promise<Creator[]> {
  await sleep(300);
  return [...mockCreators]
    .filter(c => c.is_available)
    .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
    .slice(0, limit);
}
