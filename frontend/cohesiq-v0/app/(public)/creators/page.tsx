import { getCreators } from "@/lib/api/creators";
import { CreatorsClient } from "./_components/CreatorsClient";
import { parseCreatorFilters } from "@/lib/parsers";
import type { SearchParams } from "@/lib/parsers";

interface BrowseCreatorsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BrowseCreatorsPage({ searchParams }: BrowseCreatorsPageProps) {
  // Await searchParams (required in Next.js 15+)
  const rawParams = await searchParams;
  
  // Parse string params into strongly typed filter object
  const filters = parseCreatorFilters(rawParams);

  // Fetch data server-side using the parsed filters
  const creators = await getCreators(filters).catch(() => []);

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

          <CreatorsClient creators={creators} activeFilters={filters} />
        </div>
      </main>
    </div>
  );
}
