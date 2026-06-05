import type { Review } from "@/lib/types";
import { fetchApi } from "./client";

export async function getCreatorReviews(creatorId: string): Promise<Review[]> {
  try {
    return await fetchApi<Review[]>(`/creators/${creatorId}/reviews`);
  } catch {
    return [];
  }
}

export async function getBrandReviews(brandId: string): Promise<Review[]> {
  try {
    return await fetchApi<Review[]>(`/brands/${brandId}/reviews`);
  } catch {
    return [];
  }
}
