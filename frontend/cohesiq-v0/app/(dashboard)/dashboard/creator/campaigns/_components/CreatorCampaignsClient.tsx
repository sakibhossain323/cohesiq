"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { CampaignFilters } from "@/components/campaign/CampaignFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { Briefcase } from "lucide-react";
import type { Campaign, CampaignFilters as CampaignFiltersType } from "@/lib/types";

interface CreatorCampaignsClientProps {
  campaigns: Campaign[];
  activeFilters: CampaignFiltersType;
}

export function CreatorCampaignsClient({ campaigns, activeFilters }: CreatorCampaignsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFiltersChange = (newFilters: CampaignFiltersType) => {
    const params = new URLSearchParams(searchParams.toString());
    
    params.delete("niche");
    params.delete("platform");
    params.delete("min_budget");
    params.delete("max_budget");
    params.delete("status");

    if (newFilters.niche && newFilters.niche !== "all") params.set("niche", newFilters.niche);
    if (newFilters.platform) params.set("platform", newFilters.platform);
    if (newFilters.min_budget) params.set("min_budget", newFilters.min_budget.toString());
    if (newFilters.max_budget) params.set("max_budget", newFilters.max_budget.toString());
    if (newFilters.status && (newFilters.status as string) !== "all") params.set("status", newFilters.status);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-72">
        <CampaignFilters filters={activeFilters} onFiltersChange={handleFiltersChange} />
      </aside>

      <div className="flex-1 relative">
        {isPending ? (
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm transition-all" />
        ) : null}

        {isPending && campaigns.length === 0 ? (
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
  );
}
