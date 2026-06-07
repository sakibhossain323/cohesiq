"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { CreatorFilters } from "@/components/creator/CreatorFilters";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Users, GitCompareArrows, X } from "lucide-react";
import type { Creator, CreatorFilters as CreatorFiltersType } from "@/lib/types";

interface BrandCreatorsClientProps {
  creators: Creator[];
  activeFilters: CreatorFiltersType;
  pagination: {
    page: number;
    pageSize: number;
    hasNextPage: boolean;
  };
}

export function BrandCreatorsClient({ creators, activeFilters, pagination }: BrandCreatorsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= 3) return prev;
      next.add(id);
      return next;
    });
  };

  const handleFiltersChange = (newFilters: CreatorFiltersType) => {
    const params = new URLSearchParams(searchParams.toString());
    
    params.delete("niche");
    params.delete("platform");
    params.delete("min_followers");
    params.delete("max_followers");
    params.delete("language");
    params.delete("city");
    params.delete("is_available");
    params.delete("page");

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

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <>
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
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing page {pagination.page} · {creators.length} creator{creators.length !== 1 ? "s" : ""}
                  {selectedIds.size > 0 && (
                    <span className="ml-2 text-primary font-medium">· {selectedIds.size} selected</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1 || isPending}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage || isPending}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {creators.map(creator => {
                  const isSelected = selectedIds.has(creator.id);
                  return (
                    <div key={creator.id} className="relative group">
                      <div className={`rounded-xl transition-all ${isSelected ? "ring-2 ring-primary shadow-md" : "ring-1 ring-transparent"}`}>
                        <CreatorCard creator={creator} basePath="/brand/dashboard/creators" />
                      </div>
                      <button
                        onClick={() => toggleSelect(creator.id)}
                        className={`absolute top-3 right-3 z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all text-xs font-bold
                          ${isSelected
                            ? "bg-primary border-primary text-white"
                            : "bg-background/80 border-muted-foreground/40 text-transparent group-hover:border-primary/60"
                          }`}
                        aria-label={isSelected ? "Deselect" : "Select for comparison"}
                        title={selectedIds.size >= 3 && !isSelected ? "Max 3 creators" : isSelected ? "Deselect" : "Select to compare"}
                      >
                        {isSelected ? "✓" : ""}
                      </button>
                    </div>
                  );
                })}
              </div>
              {(pagination.page > 1 || pagination.hasNextPage) && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={pagination.page <= 1 || isPending}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    Previous
                  </Button>
                  <span className="px-3 text-sm font-medium text-muted-foreground">
                    Page {pagination.page}
                  </span>
                  <Button
                    variant="outline"
                    disabled={!pagination.hasNextPage || isPending}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border border-border shadow-xl rounded-full px-5 py-3">
          <GitCompareArrows className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{selectedIds.size} creators selected</span>
          <Button
            size="sm"
            onClick={() => {
              const ids = Array.from(selectedIds).join(",");
              router.push(`/brand/dashboard/creators/compare?ids=${ids}`);
            }}
          >
            Compare
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
