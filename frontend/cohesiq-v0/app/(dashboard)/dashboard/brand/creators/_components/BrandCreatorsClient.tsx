"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { CreatorFilters } from "@/components/creator/CreatorFilters";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";
import type { Creator, CreatorFilters as CreatorFiltersType } from "@/lib/types";

interface BrandCreatorsClientProps {
  creators: Creator[];
  activeFilters: CreatorFiltersType;
}

export function BrandCreatorsClient({ creators, activeFilters }: BrandCreatorsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFiltersChange = (newFilters: CreatorFiltersType) => {
    const params = new URLSearchParams(searchParams.toString());
    
    params.delete("niche");
    params.delete("platform");
    params.delete("min_followers");
    params.delete("max_followers");
    params.delete("language");
    params.delete("city");
    params.delete("is_available");

    if (newFilters.niche && newFilters.niche !== "all") params.set("niche", newFilters.niche);
    if (newFilters.platform) params.set("platform", newFilters.platform);
    if (newFilters.min_followers) params.set("min_followers", newFilters.min_followers.toString());
    if (newFilters.max_followers) params.set("max_followers", newFilters.max_followers.toString());
    if (newFilters.language && newFilters.language !== "all") params.set("language", newFilters.language);
    if (newFilters.city) params.set("city", newFilters.city);
    if (newFilters.is_available) params.set("is_available", "true");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Filters Sidebar */}
      <aside className="w-full shrink-0 lg:w-72">
        <CreatorFilters filters={activeFilters} onFiltersChange={handleFiltersChange} />
      </aside>

      {/* Creator Grid */}
      <div className="flex-1 relative">
        {isPending ? (
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm transition-all" />
        ) : null}

        {isPending && creators.length === 0 ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : creators.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No creators found"
            description="Try adjusting your filters to find more creators"
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Showing {creators.length} creator{creators.length !== 1 ? "s" : ""}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {creators.map(creator => (
                <CreatorCard key={creator.id} creator={creator} basePath="/dashboard/brand/creators" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
