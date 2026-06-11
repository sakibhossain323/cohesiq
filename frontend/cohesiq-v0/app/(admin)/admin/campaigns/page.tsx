import { auth } from "@clerk/nextjs/server";
import { getAdminCampaigns } from "@/lib/api/admin";
import { CampaignsClient } from "./_components/CampaignsClient";
import { CampaignFilterBar } from "./_components/CampaignFilterBar";
import { AdminPaginationBar } from "../_components/AdminPaginationBar";

interface Props {
  searchParams: Promise<{ status?: string; visibility?: string; page?: string }>;
}

export default async function AdminCampaignsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return <p className="text-muted-foreground">Not authorized.</p>;

  const data = await getAdminCampaigns(token, {
    status: params.status,
    visibility: params.visibility,
    page,
  });

  const filterParams: Record<string, string> = {};
  if (params.status) filterParams.status = params.status;
  if (params.visibility) filterParams.visibility = params.visibility;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">
        Campaigns ({data.total})
      </h1>
      <CampaignFilterBar />
      <CampaignsClient campaigns={data.items} />
      <AdminPaginationBar
        page={page}
        total={data.total}
        limit={data.limit}
        basePath="/admin/campaigns"
        filterParams={filterParams}
      />
    </div>
  );
}
