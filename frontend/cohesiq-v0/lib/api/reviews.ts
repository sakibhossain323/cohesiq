import type { Review } from "@/lib/types";
import { mockReviews } from "@/lib/mock-data/reviews";
import { sleep } from "@/lib/utils";

export async function getReviews(): Promise<Review[]> {
  await sleep(300);
  return [...mockReviews];
}

export async function getPublicReviews(): Promise<Review[]> {
  await sleep(300);
  return mockReviews.filter(r => r.is_public);
}

export async function getReviewsByCreatorName(name: string): Promise<Review[]> {
  await sleep(300);
  return mockReviews.filter(r => 
    r.reviewer_name.toLowerCase().includes(name.toLowerCase())
  );
}

export async function getRecentReviews(limit: number = 5): Promise<Review[]> {
  await sleep(300);
  return [...mockReviews]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
