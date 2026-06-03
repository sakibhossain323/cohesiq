import { auth } from "@clerk/nextjs/server";
import { CampaignDetailView } from "@/components/campaign/CampaignDetailView";
import { getMyCreatorProfile } from "@/lib/api/creators";
import { getApplicationsByCreatorId } from "@/lib/api/applications";
import type { ApplicationStatus } from "@/lib/types";

interface PrivateCampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrivateCampaignDetailPage({ params }: PrivateCampaignDetailPageProps) {
  const { id } = await params;
  const { getToken } = await auth();
  const token = await getToken();
  
  let existingStatus: ApplicationStatus | undefined;
  
  if (token) {
    const creator = await getMyCreatorProfile(token);
    if (creator) {
      const apps = await getApplicationsByCreatorId(creator.id, token);
      const app = apps.find(a => a.campaign_id === id);
      if (app) {
        existingStatus = app.status;
      }
    }
  }

  return <CampaignDetailView campaignId={id} existingApplicationStatus={existingStatus} />;
}
