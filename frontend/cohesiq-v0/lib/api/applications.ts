import type { Application, ApplicationStatus } from "@/lib/types";
import { fetchApi } from "./client";
import { getCampaignById } from "./campaigns";
import { getCreatorById } from "./creators";

async function mapApplicationResponse(a: any): Promise<Application> {
  const campaign = await getCampaignById(a.campaign_id);
  const creator = await getCreatorById(a.creator_id);

  return {
    id: a.id,
    campaign_id: a.campaign_id,
    campaign: campaign as any, // We populate the campaign info for the UI
    creator: creator as any,   // We populate the creator info for the UI
    proposed_rate: a.proposed_rate,
    status: a.status as ApplicationStatus,
    applied_at: a.applied_at ? new Date(a.applied_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

export async function getApplications(): Promise<Application[]> {
  return [];
}

export async function getApplicationById(id: string): Promise<Application | null> {
  return null;
}

export async function getApplicationsByCreatorId(creatorId: string): Promise<Application[]> {
  try {
    const data = await fetchApi<any[]>(`/creators/${creatorId}/applications`);
    return await Promise.all(data.map(mapApplicationResponse));
  } catch {
    return [];
  }
}

export async function getApplicationsByCampaignId(campaignId: string): Promise<Application[]> {
  try {
    const data = await fetchApi<any[]>(`/campaigns/${campaignId}/applications`);
    return await Promise.all(data.map(mapApplicationResponse));
  } catch {
    return [];
  }
}

export async function getApplicationsByBrandId(brandId: string): Promise<Application[]> {
  try {
    const data = await fetchApi<any[]>(`/brands/${brandId}/applications`);
    return await Promise.all(data.map(mapApplicationResponse));
  } catch {
    return [];
  }
}

export async function updateApplicationStatus(
  applicationId: string, 
  newStatus: ApplicationStatus,
  campaignId: string
): Promise<Application | null> {
  try {
    const data = await fetchApi<any>(`/campaigns/${campaignId}/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    return await mapApplicationResponse(data);
  } catch {
    return null;
  }
}
