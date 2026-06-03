"use server";

import { auth } from "@clerk/nextjs/server";
import { updateCampaignStatus, runCampaignMatching } from "@/lib/api/campaigns";
import { revalidatePath } from "next/cache";

export async function updateCampaignStatusAction(campaignId: string, status: string) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const updated = await updateCampaignStatus(campaignId, status, token);
    revalidatePath(`/brand/dashboard/campaigns/${campaignId}`);
    return { success: true, campaign: updated };
  } catch (error) {
    console.error("Failed to update campaign status:", error);
    return { success: false, error: "Failed to update campaign status" };
  }
}

export async function runMatchingAction(campaignId: string) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const matches = await runCampaignMatching(campaignId, token);
    revalidatePath(`/brand/dashboard/campaigns/${campaignId}`);
    revalidatePath(`/brand/dashboard/campaigns/${campaignId}/matches`);
    return { success: true, matches };
  } catch (error) {
    console.error("Failed to run matching:", error);
    return { success: false, error: "Failed to run matching engine" };
  }
}
