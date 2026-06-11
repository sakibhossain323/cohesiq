"use server";

import { auth } from "@clerk/nextjs/server";
import {
  respondToInvitation, acceptOffer, counterOffer, declineOffer,
  type CounterPayload,
} from "@/lib/api/campaigns";
import { revalidatePath } from "next/cache";

const COLLAB_PATH = "/creator/dashboard/collaborations";

function offerError(error: unknown, fallback: string): string {
  const msg = error instanceof Error ? error.message : "";
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

export async function respondToInvitationAction(campaignId: string, applicationId: string, action: "accept" | "decline") {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) throw new Error("Unauthorized");

  try {
    await respondToInvitation(campaignId, applicationId, action, undefined, undefined, token);
    revalidatePath(COLLAB_PATH);
    return { success: true };
  } catch (error) {
    console.error(`Failed to ${action} invitation:`, error);
    return { success: false, error: `Failed to ${action} invitation` };
  }
}

// ── Offer negotiation (creator side) ────────────────────────────────────────

export async function acceptOfferAction(campaignId: string, applicationId: string, message?: string) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return { success: false, error: "Unauthorized. Please sign in again." };

  try {
    const application = await acceptOffer(campaignId, applicationId, message, token);
    revalidatePath(COLLAB_PATH);
    revalidatePath("/creator/dashboard/contracts");
    return { success: true, application };
  } catch (error) {
    console.error("Failed to accept offer:", error);
    return { success: false, error: offerError(error, "Failed to accept offer") };
  }
}

export async function negotiateAction(campaignId: string, applicationId: string, payload: CounterPayload) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return { success: false, error: "Unauthorized. Please sign in again." };

  try {
    const application = await counterOffer(campaignId, applicationId, payload, token);
    revalidatePath(COLLAB_PATH);
    return { success: true, application };
  } catch (error) {
    console.error("Failed to send counter-offer:", error);
    return { success: false, error: offerError(error, "Failed to send counter-offer") };
  }
}

export async function declineOfferAction(campaignId: string, applicationId: string, reason?: string) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return { success: false, error: "Unauthorized. Please sign in again." };

  try {
    const application = await declineOffer(campaignId, applicationId, reason, token);
    revalidatePath(COLLAB_PATH);
    return { success: true, application };
  } catch (error) {
    console.error("Failed to decline offer:", error);
    return { success: false, error: offerError(error, "Failed to decline offer") };
  }
}
