import { getCampaigns } from "@/lib/api/campaigns";
import { CampaignsClient } from "./_components/CampaignsClient";
import { parseCampaignFilters } from "@/lib/parsers";
import type { SearchParams } from "@/lib/parsers";

interface BrowseCampaignsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BrowseCampaignsPage({ searchParams }: BrowseCampaignsPageProps) {
  // Await searchParams (required in Next.js 15+)
  const rawParams = await searchParams;
  
  // Parse string params into strongly typed filter object
  // Default to active status if no status is provided
  const filters = parseCampaignFilters(rawParams);
  if (!filters.status) {
    filters.status = "active";
  }

  // Fetch data server-side using the parsed filters
  const campaigns = await getCampaigns(filters).catch(() => []);

  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Browse Campaigns
            </h1>
            <p className="mt-2 text-muted-foreground">
              Find exciting brand campaigns to collaborate on
            </p>
          </div>

          <CampaignsClient campaigns={campaigns} activeFilters={filters} />
        </div>
      </main>
    </div>
  );
}
