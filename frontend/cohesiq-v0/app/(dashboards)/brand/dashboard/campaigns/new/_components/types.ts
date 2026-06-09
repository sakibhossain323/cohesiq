import type { DeliverableCode } from "@/lib/types";

export type Visibility = "public" | "private";

export type DeliverableEntry = { selected: boolean; quantity: string; notes: string };
export type DeliverableFormState = Partial<Record<DeliverableCode, DeliverableEntry>>;

export type CampaignFormData = {
  title: string;
  description: string;
  visibility: Visibility;
  budget_per_creator_max: string;
  creator_min_followers: string;
  number_of_creators: string;
  primary_niche_id: string;
  brand_category: string;
  application_deadline: string;
  hashtags: string;
  tracking_notes: string;
  required_platforms: import("@/lib/types").PlatformType[];
  kpi_reach: string;
  kpi_engagement_rate: string;
  kpi_conversions: string;
  kpi_roi_target: string;
};
