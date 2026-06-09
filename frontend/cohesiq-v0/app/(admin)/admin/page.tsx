import { auth } from "@clerk/nextjs/server";
import { getAdminStats } from "@/lib/api/admin";

export default async function AdminDashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return <p className="text-muted-foreground">Not authorized.</p>;

  const stats = await getAdminStats(token);
  const cards = [
    { label: "Total Users", value: stats.total_users },
    { label: "Creators", value: stats.total_creators },
    { label: "Brands", value: stats.total_brands },
    { label: "Admins", value: stats.total_admins },
    { label: "Campaigns", value: stats.total_campaigns },
    { label: "Applications", value: stats.total_applications },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Platform Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="border rounded-lg p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="text-3xl font-semibold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
