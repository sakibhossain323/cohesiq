"use server";

import { auth } from "@clerk/nextjs/server";
import { respondToInvitation } from "@/lib/api/campaigns";
import { revalidatePath } from "next/cache";

export async function respondToInvitationAction(campaignId: string, applicationId: string, action: "accept" | "decline") {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    await respondToInvitation(campaignId, applicationId, action, undefined, undefined, token);
    revalidatePath("/dashboard/creator/collaborations");
    return { success: true };
  } catch (error) {
    console.error(`Failed to ${action} invitation:`, error);
    return { success: false, error: `Failed to ${action} invitation` };
  }
}
