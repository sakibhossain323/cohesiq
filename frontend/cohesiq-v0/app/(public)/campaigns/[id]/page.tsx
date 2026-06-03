import { CampaignDetailView } from "@/components/campaign/CampaignDetailView";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params;
  return <CampaignDetailView campaignId={id} />;
}
