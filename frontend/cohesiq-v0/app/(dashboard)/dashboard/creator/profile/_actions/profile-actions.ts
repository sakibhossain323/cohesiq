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
    revalidatePath("/dashboard/creator/profile");
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
    revalidatePath("/dashboard/creator/profile");
    return { success: true, platform: data };
  } catch (error) {
    console.error("Failed to update platform:", error);
    return { success: false, error: "Failed to update platform" };
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
    revalidatePath("/dashboard/creator/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete platform:", error);
    return { success: false, error: "Failed to delete platform" };
  }
}
