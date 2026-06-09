import { auth } from "@clerk/nextjs/server";
import { getAdminUsers } from "@/lib/api/admin";
import { UsersClient } from "./_components/UsersClient";
import { UserFilterBar } from "./_components/UserFilterBar";
import { AdminPaginationBar } from "../_components/AdminPaginationBar";

interface Props {
  searchParams: Promise<{ role?: string; is_active?: string; search?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return <p className="text-muted-foreground">Not authorized.</p>;

  const data = await getAdminUsers(token, {
    role: params.role,
    is_active: params.is_active,
    search: params.search,
    page,
  });

  const filterParams: Record<string, string> = {};
  if (params.role) filterParams.role = params.role;
  if (params.is_active) filterParams.is_active = params.is_active;
  if (params.search) filterParams.search = params.search;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">
        Users ({data.total})
      </h1>
      <UserFilterBar />
      <UsersClient users={data.items} />
      <AdminPaginationBar
        page={page}
        total={data.total}
        limit={data.limit}
        basePath="/admin/users"
        filterParams={filterParams}
      />
    </div>
  );
}
