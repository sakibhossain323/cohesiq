export type PlatformType = "youtube" | "instagram" | "facebook" | "tiktok" | "twitter_x" | "linkedin" | "snapchat" | "other";
export type CampaignStatus = "draft" | "active" | "in_progress" | "completed" | "cancelled" | "archived";
export type ApplicationStatus = "invited" | "declined" | "pending" | "shortlisted" | "pending_agreement" | "accepted" | "rejected" | "withdrawn" | "completed";
export type DeliverableType = "dedicated_video" | "integrated_mention" | "short_video" | "photo_post" | "story" | "live_stream" | "blog_post" | "other";
export type DeliverableCode =
  | "youtube_live"
  | "youtube_short"
  | "youtube_video"
  | "instagram_live"
  | "instagram_feed"
  | "instagram_reel"
  | "instagram_story"
  | "tiktok_live"
  | "tiktok_story"
  | "tiktok_video";

// Contract types — engagement type lives here, NOT on Campaign
export type ContractType = "content_collaboration" | "product_seeding" | "talent_engagement";
export type ContractStatus =
  | "drafted" | "active" | "in_production" | "content_submitted"
  | "content_approved" | "published" | "closed" | "disputed";
export type PaymentSchedule = "upfront" | "on_delivery" | "milestone";
export type ProductDisposition = "keep" | "return";

export interface Contract {
  id: string;
  application_id: string;
  brand_id: string;
  creator_id: string;
  contract_type: ContractType;
  status: ContractStatus;
  // Payment clause
  payment_structure: "flat_fee" | "none";
  payment_amount_bdt?: number;
  payment_schedule?: PaymentSchedule;
  // Product transfer clause
  has_product_transfer: boolean;
  product_disposition?: ProductDisposition;
  // Other clauses
  deliverable_notes?: string;
  exclusivity_days?: number;
  usage_rights_days?: number;
  max_revision_rounds: number;
  revisions_used: number;
  kill_fee_percentage?: number;
  // Content submission
  draft_content_url?: string;
  live_post_url?: string;
  // Fee
  platform_fee_percentage?: number;
  // Timestamps
  contracted_at: string;
  in_production_at?: string;
  submitted_at?: string;
  approved_at?: string;
  published_at?: string;
  closed_at?: string;
  updated_at: string;
}

export interface LiveMetricSnapshot {
  id: string;
  contract_id: string;
  platform?: PlatformType;
  captured_at: string;
  views: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  estimated_revenue_bdt: number;
  revenue_basis?: string;
  source: string;
  created_at: string;
}

export interface LiveContractAnalytics {
  contract_id: string;
  creator_id: string;
  live_post_url?: string;
  status: ContractStatus;
  latest?: LiveMetricSnapshot;
  snapshots: LiveMetricSnapshot[];
  total_views_delta: number;
  total_engagement_delta: number;
  revenue_delta_bdt: number;
}

export interface CampaignLiveAnalytics {
  campaign_id: string;
  totals: {
    published_contracts: number;
    views: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagements: number;
    estimated_revenue_bdt: number;
    engagement_rate: number;
  };
  contracts: LiveContractAnalytics[];
  timeline: Array<{
    captured_at: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagements: number;
    estimated_revenue_bdt: number;
  }>;
}

export interface CreatorSocialProfile {
  id: string;
  platform: PlatformType;
  handle: string;
  profile_url: string;
  display_name_on_platform?: string;
  follower_count?: number;
  following_count?: number;
  avg_views_per_post?: number;
  avg_likes_per_post?: number;
  avg_comments_per_post?: number;
  avg_shares_per_post?: number;
  engagement_rate?: number;
  posts_per_month?: number;
  is_primary_platform: boolean;
  is_monetized: boolean;
  has_verified_badge: boolean;
  is_api_verified?: boolean;
  api_verified_at?: string;
  data_source?: string;
  audience_country_primary?: string;
  audience_city_primary?: string;
  audience_age_range_min?: number;
  audience_age_range_max?: number;
  audience_gender_majority?: string;
  audience_gender_pct?: number;
  content_languages: string[];
  notes?: string;
  stats_reported_at?: string;
  stats_reported_for_period?: string;
}

export interface CreatorRateCard {
  id: string;
  platform: PlatformType;
  deliverable_type: DeliverableType;
  deliverable_code?: DeliverableCode;
  price_bdt: number;
  suggested_price_bdt?: number;
  is_negotiable: boolean;
}

export interface CreatorPortfolioItem {
  id: string;
  platform: PlatformType;
  content_url: string;
  title?: string;
  thumbnail_url?: string;
  views?: number;
  likes?: number;
  comments?: number;
  published_at?: string;
  is_featured: boolean;
  sort_order: number;
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
  portfolio_items: CreatorPortfolioItem[];
  is_available: boolean;
  total_collaborations: number;
  average_rating?: number;
  min_budget?: number;
  trust_score?: number;
}

export interface Brand {
  id: string;
  brand_name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  city?: string;
  niche: string;
  brand_category?: string;
  is_verified: boolean;
  total_campaigns: number;
  average_rating?: number;
}

export interface Campaign {
  id: string;
  brand_id: string;
  brand: Pick<Brand, "id" | "brand_name" | "logo_url" | "is_verified">;
  title: string;
  description: string;
  primary_niche_id?: number;
  brand_category?: string;
  primary_niche: string;
  required_platforms?: PlatformType[];
  budget_per_creator_min?: number;
  budget_per_creator_max: number;
  creator_min_followers?: number;
  creator_max_followers?: number;
  number_of_creators?: number;
  kpi_targets?: {
    reach?: number;
    engagement_rate?: number;
    conversions?: number;
    roi_target?: number;
  };
  visibility?: string;
  application_deadline?: string;
  content_deadline?: string;
  status: CampaignStatus;
  application_count: number;
  deliverables?: CampaignDeliverable[];
  created_at?: string;
}

export interface CampaignDeliverable {
  id?: string;
  platform: PlatformType;
  deliverable_type: DeliverableType;
  deliverable_code?: DeliverableCode;
  quantity: number;
  notes?: string;
}

export interface Application {
  id: string;
  campaign_id: string;
  campaign: Pick<Campaign, "id" | "title" | "brand">;
  creator_id: string;
  creator: Pick<Creator, "id" | "display_name" | "profile_photo_url" | "primary_niche"> & {
    follower_count?: number;
  };
  initiated_by: string; // 'creator' or 'brand'
  proposed_rate?: number;
  proposal_text?: string;
  status: ApplicationStatus;
  rejection_reason?: string;
  agreed_rate?: number;
  agreed_deliverables?: string;
  applied_at: string;
  responded_at?: string;
}

export interface Review {
  id: string;
  application_id: string;
  reviewer_brand_id?: string;
  reviewer_creator_id?: string;
  reviewee_brand_id?: string;
  reviewee_creator_id?: string;
  rating: number;
  review_text?: string;
  is_public: boolean;
  created_at: string;
}

export interface CreatorFilters {
  search?: string;
  niche?: string;
  platform?: PlatformType;
  min_followers?: number;
  max_followers?: number;
  language?: string;
  city?: string;
  is_available?: boolean;
  max_rate?: number;
  sort_by?: CreatorSortBy;
  page?: number;
  page_size?: number;
}

export type CreatorSortBy =
  | "followers_desc"
  | "engagement_desc"
  | "avg_views_desc"
  | "rating_desc"
  | "collaborations_desc"
  | "newest"
  | "name_asc";

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

export interface AIMatchScore {
  id: string;
  campaign_id: string;
  creator_id: string;
  score_niche?: number;
  score_engagement?: number;
  score_budget?: number;
  score_language?: number;
  score_platform?: number;
  score_recency?: number;
  score_semantic?: number;
  score_total?: number;
  rationale?: string;
  generated_at: string;
  creator?: Creator;
}
