"use client";

import { useState, useEffect } from "react";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { CampaignFilters } from "@/components/campaign/CampaignFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { getCampaigns } from "@/lib/api/campaigns";
import { Briefcase } from "lucide-react";
import type { Campaign, CampaignFilters as CampaignFiltersType } from "@/lib/types";

export default function CreatorDiscoverCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filters, setFilters] = useState<CampaignFiltersType>({ status: "active" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCampaigns() {
      setIsLoading(true);
      const data = await getCampaigns(filters);
      setCampaigns(data);
      setIsLoading(false);
    }
    loadCampaigns();
  }, [filters]);

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

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters Sidebar */}
        <aside className="w-full shrink-0 lg:w-72">
          <CampaignFilters filters={filters} onFiltersChange={setFilters} />
        </aside>

        {/* Campaign List */}
        <div className="flex-1">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No campaigns found"
              description="Try adjusting your filters to find more campaigns"
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Showing {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    basePath="/dashboard/creator/campaigns"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
