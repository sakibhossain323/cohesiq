import { auth } from "@clerk/nextjs/server";
import { listCreatorContracts } from "@/lib/api/contracts";
import { CreatorContractsClient } from "./_components/CreatorContractsClient";

export default async function CreatorContractsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  const contracts = token ? await listCreatorContracts(token) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Contracts</h1>
        <p className="mt-2 text-muted-foreground">
          Track deliverables, submit content, and manage your active brand deals.
        </p>
      </div>
      <CreatorContractsClient contracts={contracts} />
    </div>
  );
}
