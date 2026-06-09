import { auth } from "@clerk/nextjs/server";
import { getAdminUsers } from "@/lib/api/admin";

export default async function AdminUsersPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return <p className="text-muted-foreground">Not authorized.</p>;

  const users = await getAdminUsers(token);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Users ({users.length})</h1>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b text-left">
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Active</th>
              <th className="py-3 px-4 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-3 px-4">{u.email}</td>
                <td className="py-3 px-4 capitalize">{u.role}</td>
                <td className="py-3 px-4">{u.is_active ? "Yes" : "No"}</td>
                <td className="py-3 px-4">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
