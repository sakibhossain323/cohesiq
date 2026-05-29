"use client";

import { useState, useEffect } from "react";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { CreatorFilters } from "@/components/creator/CreatorFilters";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { getCreators } from "@/lib/api/creators";
import { Users } from "lucide-react";
import type { Creator, CreatorFilters as CreatorFiltersType } from "@/lib/types";

export default function BrowseCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filters, setFilters] = useState<CreatorFiltersType>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCreators() {
      setIsLoading(true);
      const data = await getCreators(filters);
      setCreators(data);
      setIsLoading(false);
    }
    loadCreators();
  }, [filters]);

  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Browse Creators
            </h1>
            <p className="mt-2 text-muted-foreground">
              Discover talented creators for your next campaign
            </p>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Filters Sidebar */}
            <aside className="w-full shrink-0 lg:w-72">
              <CreatorFilters filters={filters} onFiltersChange={setFilters} />
            </aside>

            {/* Creator Grid */}
            <div className="flex-1">
              {isLoading ? (
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
                      <CreatorCard key={creator.id} creator={creator} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
