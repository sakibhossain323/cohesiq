import { CampaignDetailView } from "@/components/campaign/CampaignDetailView";

interface PrivateCampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandCampaignDetailPage({ params }: PrivateCampaignDetailPageProps) {
  const { id } = await params;
  return <CampaignDetailView campaignId={id} hideApplyButton={true} />;
}
