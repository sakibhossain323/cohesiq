import { fetchApi } from "./client";

export interface AdminStats {
  total_users: number;
  total_creators: number;
  total_brands: number;
  total_admins: number;
  total_campaigns: number;
  active_campaigns: number;
  total_applications: number;
  recent_signups_7d: number;
  recent_applications_7d: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUser {
  id: string;
  email: string;
  clerk_id: string | null;
  role: string;
  is_active: boolean;
  has_profile: boolean;
  created_at: string;
}

export interface AdminCampaign {
  id: string;
  title: string;
  status: string;
  visibility: string;
  brand_id: string;
  budget_per_creator_max: number;
  created_at: string;
}

export interface AdminReview {
  id: string;
  application_id: string;
  rating: number;
  review_text: string | null;
  is_public: boolean;
  reviewer_brand_id: string | null;
  reviewer_creator_id: string | null;
  reviewee_brand_id: string | null;
  reviewee_creator_id: string | null;
  created_at: string;
}

export const getAdminStats = (token: string) =>
  fetchApi<AdminStats>("/admin/stats", { token });

export const getAdminUsers = (
  token: string,
  params?: { role?: string; is_active?: string; search?: string; page?: number }
) => {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    )
  ).toString();
  return fetchApi<Paginated<AdminUser>>(`/admin/users${qs ? `?${qs}` : ""}`, { token });
};

export const getAdminCampaigns = (
  token: string,
  params?: { status?: string; visibility?: string; page?: number }
) => {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    )
  ).toString();
  return fetchApi<Paginated<AdminCampaign>>(`/admin/campaigns${qs ? `?${qs}` : ""}`, { token });
};

export const getAdminReviews = (token: string, params?: { page?: number }) => {
  const qs = params?.page ? `?page=${params.page}` : "";
  return fetchApi<Paginated<AdminReview>>(`/admin/reviews${qs}`, { token });
};
