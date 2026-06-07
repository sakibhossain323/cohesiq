import { getCreatorSearchPage } from "@/lib/api/creators";
import { BrandCreatorsClient } from "./_components/BrandCreatorsClient";
import { parseCreatorFilters } from "@/lib/parsers";
import type { SearchParams } from "@/lib/parsers";
import { Search } from "lucide-react";

interface BrandFindCreatorsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BrandFindCreatorsPage({ searchParams }: BrandFindCreatorsPageProps) {
  const rawParams = await searchParams;
  const filters = parseCreatorFilters(rawParams);
  
  // Note: we don't strictly need auth token here since getCreators is public
  // but if it ever becomes private we'd await auth().getToken() and pass it.
  const creatorPage = await getCreatorSearchPage(filters).catch(() => ({
    creators: [],
    page: filters.page ?? 1,
    pageSize: filters.page_size ?? 12,
    hasNextPage: false,
  }));

  return (
    <div className="flex flex-col bg-background min-h-full">
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Search className="h-8 w-8 text-primary" />
            Find Creators
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse our network of vetted creators to invite to your campaigns.
          </p>
        </div>

        <BrandCreatorsClient
          creators={creatorPage.creators}
          activeFilters={filters}
          pagination={{
            page: creatorPage.page,
            pageSize: creatorPage.pageSize,
            hasNextPage: creatorPage.hasNextPage,
          }}
        />
      </main>
    </div>
  );
}
