"use server";

import { auth } from "@clerk/nextjs/server";
import {
  inviteCreatorToCampaign, updateCampaignStatus, runCampaignMatching, updateApplicationStatus,
  addToShortlist, sendOffer, counterOffer, acceptOffer, declineOffer,
  type OfferPayload, type CounterPayload,
} from "@/lib/api/campaigns";
import { revalidatePath } from "next/cache";

type MutableCampaignStatus = "active" | "in_progress" | "completed" | "cancelled" | "archived";

export async function updateCampaignStatusAction(campaignId: string, status: MutableCampaignStatus) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    return { success: false, error: "Unauthorized. Please sign in again." };
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

export async function updateApplicationStatusAction(
  applicationId: string,
  status: string,
  campaignId: string,
  rejectionReason?: string,
) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const updated = await updateApplicationStatus(campaignId, applicationId, status, token, rejectionReason);
    revalidatePath(`/brand/dashboard/campaigns/${campaignId}`);
    return { success: true, application: updated };
  } catch (error) {
    console.error("Failed to update application status:", error);
    return { success: false, error: "Failed to update application status" };
  }
}

export async function runMatchingAction(campaignId: string) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    return { success: false, error: "Unauthorized. Please sign in again." };
  }

  try {
    const matches = await runCampaignMatching(campaignId, token);
    revalidatePath(`/brand/dashboard/campaigns/${campaignId}`);
    revalidatePath(`/brand/dashboard/campaigns/${campaignId}/matches`);
    return { success: true, matches };
  } catch (error) {
    console.error("Failed to run matching:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to run matching engine",
    };
  }
}

export async function inviteCreatorAction(campaignId: string, creatorId: string, brandNotes?: string) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return { success: false, error: "Unauthorized. Please sign in again." };
  }

  try {
    const application = await inviteCreatorToCampaign(campaignId, creatorId, brandNotes, token);
    revalidatePath(`/brand/dashboard/campaigns/${campaignId}`);
    revalidatePath(`/brand/dashboard/campaigns/${campaignId}/matches`);
    return { success: true, application };
  } catch (error) {
    console.error("Failed to invite creator:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to invite creator",
    };
  }
}

// ── Shortlist / Offer / Negotiation (brand side) ────────────────────────────

function friendlyError(error: unknown, fallback: string): string {
  const msg = error instanceof Error ? error.message : "";
  // fetchApi throws "API error (409): {detail}" — surface the detail when present.
  const match = msg.match(/API error \(\d+\):\s*(\{.*\}|.*)$/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed?.detail) return String(parsed.detail);
    } catch {
      if (match[1]) return match[1];
    }
  }
  return fallback;
}

function revalidateCampaign(campaignId: string) {
  revalidatePath(`/brand/dashboard/campaigns/${campaignId}`);
  revalidatePath(`/brand/dashboard/campaigns/${campaignId}/matches`);
}

export async function shortlistAction(campaignId: string, creatorId: string, note?: string) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return { success: false, error: "Unauthorized. Please sign in again." };

  try {
    const application = await addToShortlist(campaignId, creatorId, note, token);
    revalidateCampaign(campaignId);
    return { success: true, application };
  } catch (error) {
    console.error("Failed to shortlist creator:", error);
    return { success: false, error: friendlyError(error, "Failed to add creator to shortlist") };
  }
}

export async function sendOfferAction(
  campaignId: string,
  applicationId: string,
  payload: OfferPayload,
) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return { success: false, error: "Unauthorized. Please sign in again." };

  try {
    const application = await sendOffer(campaignId, applicationId, payload, token);
    revalidateCampaign(campaignId);
    return { success: true, application };
  } catch (error) {
    console.error("Failed to send offer:", error);
    return { success: false, error: friendlyError(error, "Failed to send offer") };
  }
}

export async function negotiateAction(
  campaignId: string,
  applicationId: string,
  payload: CounterPayload,
) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return { success: false, error: "Unauthorized. Please sign in again." };

  try {
    const application = await counterOffer(campaignId, applicationId, payload, token);
    revalidateCampaign(campaignId);
    return { success: true, application };
  } catch (error) {
    console.error("Failed to send counter-offer:", error);
    return { success: false, error: friendlyError(error, "Failed to send counter-offer") };
  }
}

export async function acceptOfferAction(campaignId: string, applicationId: string, message?: string) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return { success: false, error: "Unauthorized. Please sign in again." };

  try {
    const application = await acceptOffer(campaignId, applicationId, message, token);
    revalidateCampaign(campaignId);
    return { success: true, application };
  } catch (error) {
    console.error("Failed to accept offer:", error);
    return { success: false, error: friendlyError(error, "Failed to accept offer") };
  }
}

export async function declineOfferAction(campaignId: string, applicationId: string, reason?: string) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return { success: false, error: "Unauthorized. Please sign in again." };

  try {
    const application = await declineOffer(campaignId, applicationId, reason, token);
    revalidateCampaign(campaignId);
    return { success: true, application };
  } catch (error) {
    console.error("Failed to decline offer:", error);
    return { success: false, error: friendlyError(error, "Failed to decline offer") };
  }
}
