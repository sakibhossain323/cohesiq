import type { Brand } from "@/lib/types";
import { mockBrands } from "@/lib/mock-data/brands";
import { sleep } from "@/lib/utils";

export async function getBrands(): Promise<Brand[]> {
  await sleep(300);
  return [...mockBrands];
}

export async function getBrandById(id: string): Promise<Brand | null> {
  await sleep(300);
  return mockBrands.find(b => b.id === id) ?? null;
}

export async function getVerifiedBrands(): Promise<Brand[]> {
  await sleep(300);
  return mockBrands.filter(b => b.is_verified);
}
