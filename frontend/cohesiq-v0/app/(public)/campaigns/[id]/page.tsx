"use client";

import { use } from "react";
import { CampaignDetailView } from "@/components/campaign/CampaignDetailView";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params);
  return <CampaignDetailView campaignId={id} />;
}
