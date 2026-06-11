import { getCreatorSearchPage } from "@/lib/api/creators";
import { BrandCreatorsClient } from "./_components/BrandCreatorsClient";
import { parseCreatorFilters } from "@/lib/parsers";
import type { SearchParams } from "@/lib/parsers";

interface BrandFindCreatorsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BrandFindCreatorsPage({ searchParams }: BrandFindCreatorsPageProps) {
  const rawParams = await searchParams;
  const filters = parseCreatorFilters(rawParams);

  const creatorPage = await getCreatorSearchPage(filters).catch(() => ({
    creators: [],
    page: filters.page ?? 1,
    pageSize: filters.page_size ?? 12,
    hasNextPage: false,
  }));

  return (
    <div className="bd-page">
      {/* ── Editorial header ───────────────────────────────── */}
      <header className="bd-header">
        <div className="bd-header-inner">
          <div>
            <span className="eyebrow mb-3 block">Creator Network</span>
            <h1 className="bd-header-title">Find Creators</h1>
            <p className="bd-header-sub">
              Browse our network of vetted creators to invite to your campaigns.
            </p>
          </div>
        </div>
      </header>

      <div className="bd-body">
        <BrandCreatorsClient
          creators={creatorPage.creators}
          activeFilters={filters}
          pagination={{
            page: creatorPage.page,
            pageSize: creatorPage.pageSize,
            hasNextPage: creatorPage.hasNextPage,
          }}
        />
      </div>
    </div>
  );
}
