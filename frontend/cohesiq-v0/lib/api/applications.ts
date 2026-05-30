import type { Application, ApplicationStatus } from "@/lib/types";
import { fetchApi } from "./client";
import { getCampaignById } from "./campaigns";
import { getCreatorById } from "./creators";

async function mapApplicationResponse(a: any): Promise<Application> {
  const campaign = await getCampaignById(a.campaign_id);
  const creator = a.creator_id ? await getCreatorById(a.creator_id) : null;

  return {
    id: a.id,
    campaign_id: a.campaign_id,
    campaign: campaign as any,
    creator_id: a.creator_id,
    creator: creator as any,
    initiated_by: a.initiated_by,
    proposed_rate: a.proposed_rate,
    proposal_text: a.proposal_text,
    status: a.status as ApplicationStatus,
    rejection_reason: a.rejection_reason,
    agreed_rate: a.agreed_rate,
    agreed_deliverables: a.agreed_deliverables,
    applied_at: a.applied_at
      ? new Date(a.applied_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    responded_at: a.responded_at ? new Date(a.responded_at).toISOString().split("T")[0] : undefined,
  };
}

export async function withdrawApplication(
  applicationId: string,
  campaignId: string,
  token: string
): Promise<Application | null> {
  return updateApplicationStatus(applicationId, "withdrawn", campaignId, token);
}

// ── Real submission ──────────────────────────────────────────────────
export interface SubmitApplicationPayload {
  proposal_text: string;
  proposed_rate?: number;
}

export async function submitApplication(
  campaignId: string,
  token: string,
  payload: SubmitApplicationPayload
): Promise<Application> {
  const data = await fetchApi<any>(`/campaigns/${campaignId}/apply`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  return mapApplicationResponse(data);
}

// ── Reads ────────────────────────────────────────────────────────────
export async function getApplicationsByCreatorId(
  creatorId: string,
  token?: string
): Promise<Application[]> {
  try {
    const data = await fetchApi<any[]>(`/creators/${creatorId}/applications`, { token });
    return await Promise.all(data.map(mapApplicationResponse));
  } catch {
    return [];
  }
}

export async function getApplicationsByCampaignId(
  campaignId: string,
  token?: string
): Promise<Application[]> {
  try {
    const data = await fetchApi<any[]>(`/campaigns/${campaignId}/applications`, { token });
    return await Promise.all(data.map(mapApplicationResponse));
  } catch {
    return [];
  }
}

export async function getApplicationsByBrandId(
  brandId: string,
  token?: string
): Promise<Application[]> {
  try {
    const data = await fetchApi<any[]>(`/brands/${brandId}/applications`, { token });
    return await Promise.all(data.map(mapApplicationResponse));
  } catch {
    return [];
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  campaignId: string,
  token?: string
): Promise<Application | null> {
  try {
    const data = await fetchApi<any>(
      `/campaigns/${campaignId}/applications/${applicationId}/status`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: newStatus }),
      }
    );
    return await mapApplicationResponse(data);
  } catch {
    return null;
  }
}
