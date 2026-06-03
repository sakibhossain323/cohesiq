"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { CampaignFilters } from "@/components/campaign/CampaignFilters";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Briefcase } from "lucide-react";
import type { Campaign, CampaignFilters as CampaignFiltersType } from "@/lib/types";

interface CampaignsClientProps {
  campaigns: Campaign[];
  activeFilters: CampaignFiltersType;
}

/**
 * Client island for campaigns browse page.
 * Manages URL query parameters to drive server-side data fetching.
 */
export function CampaignsClient({ campaigns, activeFilters }: CampaignsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFiltersChange = (newFilters: CampaignFiltersType) => {
    // Construct new URLSearchParams based on current ones, then update
    const params = new URLSearchParams(searchParams.toString());
    
    // Clear existing known filter keys so we don't hold onto stale values
    params.delete("niche");
    params.delete("platform");
    params.delete("min_budget");
    params.delete("max_budget");
    params.delete("status");

    // Set new values
    if (newFilters.niche && newFilters.niche !== "all") params.set("niche", newFilters.niche);
    if (newFilters.platform) params.set("platform", newFilters.platform);
    if (newFilters.min_budget) params.set("min_budget", newFilters.min_budget.toString());
    if (newFilters.max_budget) params.set("max_budget", newFilters.max_budget.toString());
    if (newFilters.status && newFilters.status !== "all") params.set("status", newFilters.status);

    // Push the new URL, triggering a server-side re-render
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Filters Sidebar */}
      <aside className="w-full shrink-0 lg:w-72">
        <CampaignFilters filters={activeFilters} onFiltersChange={handleFiltersChange} />
      </aside>

      {/* Campaign List */}
      <div className="flex-1 relative">
        {isPending ? (
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm transition-all" />
        ) : null}

        {isPending && campaigns.length === 0 ? (
          <LoadingSkeleton variant="card" count={4} />
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
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
