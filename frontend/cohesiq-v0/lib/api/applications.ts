import type { Application, ApplicationStatus } from "@/lib/types";
import { mockApplications } from "@/lib/mock-data/applications";
import { sleep } from "@/lib/utils";

export async function getApplications(): Promise<Application[]> {
  await sleep(300);
  return [...mockApplications];
}

export async function getApplicationById(id: string): Promise<Application | null> {
  await sleep(300);
  return mockApplications.find(a => a.id === id) ?? null;
}

export async function getApplicationsByCreatorId(creatorId: string): Promise<Application[]> {
  await sleep(300);
  return mockApplications.filter(a => a.creator.id === creatorId);
}

export async function getApplicationsByCampaignId(campaignId: string): Promise<Application[]> {
  await sleep(300);
  return mockApplications.filter(a => a.campaign_id === campaignId);
}

export async function getApplicationsByBrandId(brandId: string): Promise<Application[]> {
  await sleep(300);
  return mockApplications.filter(a => a.campaign.brand.id === brandId);
}

export async function updateApplicationStatus(
  applicationId: string, 
  newStatus: ApplicationStatus
): Promise<Application | null> {
  await sleep(300);
  const app = mockApplications.find(a => a.id === applicationId);
  if (app) {
    // In real implementation, this would update the database
    // For mock, we just return the application with updated status
    return { ...app, status: newStatus };
  }
  return null;
}
