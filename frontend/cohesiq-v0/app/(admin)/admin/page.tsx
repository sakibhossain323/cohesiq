import { auth } from "@clerk/nextjs/server";
import { getAdminStats } from "@/lib/api/admin";

export default async function AdminDashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return <p className="text-muted-foreground">Not authorized.</p>;

  const s = await getAdminStats(token);

  const overview = [
    { label: "Total Users", value: s.total_users },
    { label: "Creators", value: s.total_creators },
    { label: "Brands", value: s.total_brands },
    { label: "Total Campaigns", value: s.total_campaigns },
    { label: "Active Campaigns", value: s.active_campaigns },
    { label: "Total Applications", value: s.total_applications },
  ];

  const activity = [
    { label: "New signups (7d)", value: s.recent_signups_7d },
    { label: "New applications (7d)", value: s.recent_applications_7d },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-6">Platform Overview</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {overview.map((c) => (
            <div key={c.label} className="border rounded-lg p-5">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-3xl font-semibold mt-1">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="grid grid-cols-2 gap-4">
          {activity.map((c) => (
            <div key={c.label} className="border rounded-lg p-5 bg-muted/30">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-3xl font-semibold mt-1">{c.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
