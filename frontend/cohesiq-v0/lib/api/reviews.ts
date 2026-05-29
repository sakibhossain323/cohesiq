import type { Review } from "@/lib/types";
import { fetchApi } from "./client";

export async function getReviews(): Promise<Review[]> {
  return [];
}

export async function getPublicReviews(): Promise<Review[]> {
  return [];
}

export async function getReviewsByCreatorName(name: string): Promise<Review[]> {
  return [];
}

export async function getRecentReviews(limit: number = 5): Promise<Review[]> {
  return [];
}
