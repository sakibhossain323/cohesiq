export type PlatformType = "youtube" | "instagram" | "facebook" | "tiktok" | "twitter_x" | "linkedin" | "snapchat" | "other";
export type CampaignStatus = "draft" | "active" | "in_progress" | "completed" | "cancelled";
export type ApplicationStatus = "pending" | "shortlisted" | "accepted" | "rejected" | "withdrawn" | "completed";
export type DeliverableType = "dedicated_video" | "integrated_mention" | "short_video" | "photo_post" | "story" | "live_stream" | "blog_post" | "other";

export interface CreatorSocialProfile {
  id: string;
  platform: PlatformType;
  handle: string;
  profile_url: string;
  follower_count?: number;
  engagement_rate?: number;
  avg_views_per_post?: number;
  is_primary_platform: boolean;
}

export interface CreatorRateCard {
  id: string;
  platform: PlatformType;
  deliverable_type: DeliverableType;
  price_bdt: number;
  is_negotiable: boolean;
}

export interface Creator {
  id: string;
  display_name: string;
  tagline?: string;
  bio?: string;
  profile_photo_url?: string;
  city?: string;
  primary_niche: string;
  niches: string[];
  languages: string[];
  social_profiles: CreatorSocialProfile[];
  rate_cards: CreatorRateCard[];
  is_available: boolean;
  total_collaborations: number;
  average_rating?: number;
}

export interface Brand {
  id: string;
  brand_name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  city?: string;
  niche: string;
  is_verified: boolean;
  total_campaigns: number;
  average_rating?: number;
}

export interface Campaign {
  id: string;
  brand_id: string;
  brand: Pick<Brand, "id" | "brand_name" | "logo_url" | "is_verified">;
  title: string;
  name?: string;
  description: string;
  primary_niche: string;
  required_niche?: string;
  required_niches?: string[];
  required_platforms?: PlatformType[];
  platforms?: PlatformType[];
  budget_per_creator_min?: number;
  budget_per_creator_max: number;
  creator_min_followers?: number;
  min_followers?: number;
  engagement_rate_min?: number;
  application_deadline?: string;
  start_date?: string;
  status: CampaignStatus;
  application_count: number;
  applications_count?: number;
  spots_available?: number;
  deliverables?: CampaignDeliverable[];
}

export interface CampaignDeliverable {
  platform: PlatformType;
  deliverable_type: DeliverableType;
  quantity: number;
}

export interface Application {
  id: string;
  campaign_id: string;
  campaign: Pick<Campaign, "id" | "title" | "brand">;
  creator: Pick<Creator, "id" | "display_name" | "profile_photo_url" | "primary_niche"> & {
    follower_count?: number;
  };
  proposed_rate?: number;
  proposal_text?: string;
  status: ApplicationStatus;
  applied_at: string;
}

export interface Review {
  id: string;
  rating: number;
  review_text?: string;
  is_public: boolean;
  created_at: string;
  reviewer_name: string;
  reviewer_photo?: string;
}

export interface CreatorFilters {
  niche?: string;
  platform?: PlatformType;
  min_followers?: number;
  max_followers?: number;
  language?: string;
  city?: string;
  is_available?: boolean;
}

export interface CampaignFilters {
  search?: string;
  niche?: string;
  niches?: string[];
  platform?: PlatformType;
  platforms?: PlatformType[];
  min_budget?: number;
  max_budget?: number;
  budgetRange?: [number, number];
  status?: CampaignStatus;
}
