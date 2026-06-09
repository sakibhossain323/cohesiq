import { fetchApi } from "./client";

export interface AdminStats {
  total_users: number;
  total_creators: number;
  total_brands: number;
  total_admins: number;
  total_campaigns: number;
  total_applications: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
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

export const getAdminStats = (token: string) =>
  fetchApi<AdminStats>("/admin/stats", { token });

export const getAdminUsers = (token: string) =>
  fetchApi<AdminUser[]>("/admin/users", { token });

export const getAdminCampaigns = (token: string) =>
  fetchApi<AdminCampaign[]>("/admin/campaigns", { token });
