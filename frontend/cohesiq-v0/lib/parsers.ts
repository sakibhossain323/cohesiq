import type { CampaignFilters, CreatorFilters, CreatorSortBy, PlatformType, CampaignStatus } from "./types";

export type SearchParams = { [key: string]: string | string[] | undefined };

function getString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getNumber(value: string | string[] | undefined): number | undefined {
  const str = getString(value);
  if (!str) return undefined;
  const num = parseInt(str, 10);
  return isNaN(num) ? undefined : num;
}

function getBoundedNumber(
  value: string | string[] | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const num = getNumber(value);
  if (num === undefined) return fallback;
  return Math.min(Math.max(num, min), max);
}

function getBoolean(value: string | string[] | undefined): boolean | undefined {
  const str = getString(value);
  if (str === "true") return true;
  if (str === "false") return false;
  return undefined;
}

export function parseCampaignFilters(searchParams: SearchParams): CampaignFilters {
  const statusStr = getString(searchParams.status);
  const validStatuses: CampaignStatus[] = ["draft", "active", "in_progress", "completed", "cancelled", "archived"];
  const status = validStatuses.includes(statusStr as CampaignStatus) ? (statusStr as CampaignStatus) : undefined;

  const platformStr = getString(searchParams.platform);
  const validPlatforms: PlatformType[] = ["youtube", "instagram", "facebook", "tiktok", "twitter_x", "linkedin", "snapchat", "other"];
  const platform = validPlatforms.includes(platformStr as PlatformType) ? (platformStr as PlatformType) : undefined;

  return {
    niche: getString(searchParams.niche),
    platform,
    min_budget: getNumber(searchParams.min_budget),
    max_budget: getNumber(searchParams.max_budget),
    status,
    search: getString(searchParams.search),
  };
}

export function parseCreatorFilters(searchParams: SearchParams): CreatorFilters {
  const platformStr = getString(searchParams.platform);
  const validPlatforms: PlatformType[] = ["youtube", "instagram", "facebook", "tiktok", "twitter_x", "linkedin", "snapchat", "other"];
  const platform = validPlatforms.includes(platformStr as PlatformType) ? (platformStr as PlatformType) : undefined;
  const sortStr = getString(searchParams.sort_by);
  const validSorts: CreatorSortBy[] = ["followers_desc", "engagement_desc", "avg_views_desc", "rating_desc", "collaborations_desc", "newest", "name_asc"];
  const sort_by = validSorts.includes(sortStr as CreatorSortBy) ? (sortStr as CreatorSortBy) : "followers_desc";

  return {
    search: getString(searchParams.search),
    niche: getString(searchParams.niche),
    platform,
    min_followers: getNumber(searchParams.min_followers),
    max_followers: getNumber(searchParams.max_followers),
    language: getString(searchParams.language),
    city: getString(searchParams.city),
    is_available: getBoolean(searchParams.is_available),
    max_rate: getNumber(searchParams.max_rate),
    sort_by,
    page: getBoundedNumber(searchParams.page, 1, 1, 10_000),
    page_size: getBoundedNumber(searchParams.page_size, 12, 1, 60),
  };
}
