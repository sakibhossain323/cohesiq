import { getCampaigns } from "@/lib/api/campaigns";
import { CreatorCampaignsClient } from "./_components/CreatorCampaignsClient";
import { parseCampaignFilters } from "@/lib/parsers";
import type { SearchParams } from "@/lib/parsers";

interface CreatorDiscoverCampaignsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function CreatorDiscoverCampaignsPage({ searchParams }: CreatorDiscoverCampaignsPageProps) {
  const rawParams = await searchParams;
  const filters = parseCampaignFilters(rawParams);
  
  if (!filters.status) {
    filters.status = "active";
  }

  const campaigns = await getCampaigns(filters).catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Discover Campaigns
        </h1>
        <p className="mt-2 text-muted-foreground">
          Find exciting brand campaigns that match your niche and audience
        </p>
      </div>

      <CreatorCampaignsClient campaigns={campaigns} activeFilters={filters} />
    </div>
  );
}
