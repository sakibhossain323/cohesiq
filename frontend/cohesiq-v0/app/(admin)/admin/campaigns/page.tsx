import { auth } from "@clerk/nextjs/server";
import { getAdminCampaigns } from "@/lib/api/admin";

export default async function AdminCampaignsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return <p className="text-muted-foreground">Not authorized.</p>;

  const campaigns = await getAdminCampaigns(token);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Campaigns ({campaigns.length})</h1>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b text-left">
              <th className="py-3 px-4 font-medium">Title</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Visibility</th>
              <th className="py-3 px-4 font-medium">Max Budget</th>
              <th className="py-3 px-4 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-3 px-4">{c.title}</td>
                <td className="py-3 px-4 capitalize">{c.status}</td>
                <td className="py-3 px-4 capitalize">{c.visibility}</td>
                <td className="py-3 px-4">{c.budget_per_creator_max.toLocaleString()}</td>
                <td className="py-3 px-4">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
