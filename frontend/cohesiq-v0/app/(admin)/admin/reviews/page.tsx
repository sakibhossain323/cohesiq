import { auth } from "@clerk/nextjs/server";
import { getAdminReviews } from "@/lib/api/admin";
import { ReviewsClient } from "./_components/ReviewsClient";
import { AdminPaginationBar } from "../_components/AdminPaginationBar";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminReviewsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return <p className="text-muted-foreground">Not authorized.</p>;

  const data = await getAdminReviews(token, { page });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">
        Reviews ({data.total})
      </h1>
      <ReviewsClient reviews={data.items} />
      <AdminPaginationBar
        page={page}
        total={data.total}
        limit={data.limit}
        basePath="/admin/reviews"
      />
    </div>
  );
}
