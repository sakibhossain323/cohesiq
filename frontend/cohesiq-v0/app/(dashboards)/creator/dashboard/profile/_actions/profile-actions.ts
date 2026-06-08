"use server";

import { auth } from "@clerk/nextjs/server";
import { fetchApi } from "@/lib/api/client";
import { revalidatePath } from "next/cache";

export async function addPlatformAction(creatorId: string, payload: any) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const data = await fetchApi<any>(
      `/creators/${creatorId}/platforms`,
      { method: "POST", token, body: JSON.stringify(payload) }
    );
    revalidatePath("/creator/dashboard/profile");
    return { success: true, platform: data };
  } catch (error) {
    console.error("Failed to add platform:", error);
    return { success: false, error: "Failed to add platform" };
  }
}

export async function updatePlatformAction(creatorId: string, platformId: string, payload: any) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    // using raw fetchApi for update since updateSocialProfile isn't exported from client but creators
    const data = await fetchApi<any>(
      `/creators/${creatorId}/platforms/${platformId}`,
      { method: "PUT", token, body: JSON.stringify(payload) }
    );
    revalidatePath("/creator/dashboard/profile");
    return { success: true, platform: data };
  } catch (error) {
    console.error("Failed to update platform:", error);
    return { success: false, error: "Failed to update platform" };
  }
}

export async function updateRateCardAction(creatorId: string, rateCardId: string, payload: any) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const data = await fetchApi<any>(
      `/creators/${creatorId}/rate-cards/${rateCardId}`,
      { method: "PUT", token, body: JSON.stringify(payload) }
    );
    revalidatePath("/creator/dashboard/profile");
    return { success: true, rateCard: data };
  } catch (error) {
    console.error("Failed to update rate card:", error);
    return { success: false, error: "Failed to update rate card" };
  }
}

export async function createRateCardAction(creatorId: string, payload: any) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const data = await fetchApi<any>(
      `/creators/${creatorId}/rate-cards`,
      { method: "POST", token, body: JSON.stringify(payload) }
    );
    revalidatePath("/creator/dashboard/profile");
    return { success: true, rateCard: data };
  } catch (error) {
    console.error("Failed to create rate card:", error);
    return { success: false, error: "Failed to create rate card" };
  }
}

export async function deletePlatformAction(creatorId: string, platformId: string) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    await fetchApi(
      `/creators/${creatorId}/platforms/${platformId}`,
      { method: "DELETE", token }
    );
    revalidatePath("/creator/dashboard/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete platform:", error);
    return { success: false, error: "Failed to delete platform" };
  }
}
