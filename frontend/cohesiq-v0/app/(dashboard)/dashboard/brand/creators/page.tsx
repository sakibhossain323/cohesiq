import { getCreators } from "@/lib/api/creators";
import { CreatorCard } from "@/components/creator/CreatorCard";

export default async function BrandFindCreatorsPage() {
  const creators = await getCreators();

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Creators</h1>
          <p className="text-muted-foreground">
            Discover and partner with top creators for your next campaign.
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map(creator => (
          <CreatorCard 
            key={creator.id} 
            creator={creator} 
            basePath="/dashboard/brand/creators" 
          />
        ))}
        {creators.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No creators found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
