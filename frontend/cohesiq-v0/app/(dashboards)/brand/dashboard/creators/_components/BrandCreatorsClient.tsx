"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { CreatorFilters } from "@/components/creator/CreatorFilters";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight, GitCompareArrows, Search, SlidersHorizontal, Users, X } from "lucide-react";
import type { Creator, CreatorFilters as CreatorFiltersType, CreatorSortBy } from "@/lib/types";

interface BrandCreatorsClientProps {
  creators: Creator[];
  activeFilters: CreatorFiltersType;
  pagination: {
    page: number;
    pageSize: number;
    hasNextPage: boolean;
  };
}

const SORT_OPTIONS: { value: CreatorSortBy; label: string }[] = [
  { value: "followers_desc", label: "Followers: high to low" },
  { value: "engagement_desc", label: "Engagement: high to low" },
  { value: "avg_views_desc", label: "Avg views: high to low" },
  { value: "rating_desc", label: "Rating: high to low" },
  { value: "collaborations_desc", label: "Collaborations: high to low" },
  { value: "newest", label: "Newest profiles" },
  { value: "name_asc", label: "Name: A to Z" },
];

function activeFilterCount(filters: CreatorFiltersType) {
  return [
    filters.search,
    filters.niche,
    filters.platform,
    filters.min_followers,
    filters.max_followers,
    filters.language,
    filters.city,
    filters.is_available,
    filters.max_rate,
  ].filter(Boolean).length;
}

export function BrandCreatorsClient({ creators, activeFilters, pagination }: BrandCreatorsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(activeFilters.search ?? "");

  const activeCount = activeFilterCount(activeFilters);

  useEffect(() => {
    setSearchValue(activeFilters.search ?? "");
  }, [activeFilters.search]);

  const pushParams = (params: URLSearchParams) => {
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  };

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
    
    params.delete("search");
    params.delete("niche");
    params.delete("platform");
    params.delete("min_followers");
    params.delete("max_followers");
    params.delete("language");
    params.delete("city");
    params.delete("is_available");
    params.delete("max_rate");
    params.delete("page");

    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.niche && newFilters.niche !== "all") params.set("niche", newFilters.niche);
    if (newFilters.platform) params.set("platform", newFilters.platform);
    if (newFilters.min_followers) params.set("min_followers", newFilters.min_followers.toString());
    if (newFilters.max_followers) params.set("max_followers", newFilters.max_followers.toString());
    if (newFilters.language && newFilters.language !== "all") params.set("language", newFilters.language);
    if (newFilters.city) params.set("city", newFilters.city);
    if (newFilters.is_available) params.set("is_available", "true");
    if (newFilters.max_rate) params.set("max_rate", newFilters.max_rate.toString());

    pushParams(params);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const query = searchValue.trim();
    params.delete("page");
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    pushParams(params);
  };

  const handleSortChange = (sortBy: CreatorSortBy) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("sort_by", sortBy);
    pushParams(params);
  };

  const clearAll = () => {
    setSearchValue("");
    pushParams(new URLSearchParams());
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }

    pushParams(params);
  };

  return (
    <>
      <div className="space-y-6">
        <section className="bd-section">
          <div className="bd-section-body">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={event => setSearchValue(event.target.value)}
                  placeholder="Search creators by name, handle, niche, bio, or city"
                  className="pl-9"
                />
              </form>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={activeFilters.sort_by ?? "followers_desc"} onValueChange={value => handleSortChange(value as CreatorSortBy)}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Sort creators" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setFiltersOpen(value => !value)}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                  {activeCount > 0 && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {activeCount}
                    </span>
                  )}
                </Button>
                {activeCount > 0 && (
                  <Button type="button" variant="ghost" onClick={clearAll}>
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {filtersOpen && (
              <div className="mt-4">
                <CreatorFilters filters={activeFilters} onFiltersChange={handleFiltersChange} />
              </div>
            )}
          </div>
        </section>

        <div className="relative">
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
                  Showing {creators.length} creator{creators.length !== 1 ? "s" : ""} on page {pagination.page}
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
              <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {creators.map(creator => {
                  const isSelected = selectedIds.has(creator.id);
                  return (
                    <div key={creator.id} className="group relative h-full">
                      <div className={`h-full rounded-xl transition-all ${isSelected ? "ring-2 ring-primary shadow-md" : "ring-1 ring-transparent"}`}>
                        <CreatorCard creator={creator} basePath="/brand/dashboard/creators" />
                      </div>
                      <button
                        onClick={() => toggleSelect(creator.id)}
                        className={`absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all
                          ${isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background/80 border-muted-foreground/40 text-transparent group-hover:border-primary/60"
                          }`}
                        aria-label={isSelected ? "Deselect" : "Select for comparison"}
                        title={selectedIds.size >= 3 && !isSelected ? "Max 3 creators" : isSelected ? "Deselect" : "Select to compare"}
                      >
                        {isSelected ? <Check className="h-3.5 w-3.5" /> : ""}
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
