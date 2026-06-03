import type { CampaignFilters, CreatorFilters, PlatformType, CampaignStatus } from "./types";

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

  return {
    niche: getString(searchParams.niche),
    platform,
    min_followers: getNumber(searchParams.min_followers),
    max_followers: getNumber(searchParams.max_followers),
    language: getString(searchParams.language),
    city: getString(searchParams.city),
    is_available: getBoolean(searchParams.is_available),
  };
}
