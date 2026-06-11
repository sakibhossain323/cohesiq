import type { DeliverableCode, DeliverableType, PlatformType } from "./types";

export const DELIVERABLE_DEFINITIONS: Record<DeliverableCode, {
  code: DeliverableCode;
  platform: PlatformType;
  legacyType: DeliverableType;
  label: string;
}> = {
  youtube_live: { code: "youtube_live", platform: "youtube", legacyType: "live_stream", label: "YouTube Live" },
  youtube_short: { code: "youtube_short", platform: "youtube", legacyType: "short_video", label: "YouTube Shorts" },
  youtube_video: { code: "youtube_video", platform: "youtube", legacyType: "dedicated_video", label: "YouTube Video" },
  instagram_live: { code: "instagram_live", platform: "instagram", legacyType: "live_stream", label: "Instagram Live" },
  instagram_feed: { code: "instagram_feed", platform: "instagram", legacyType: "photo_post", label: "Instagram Feed" },
  instagram_reel: { code: "instagram_reel", platform: "instagram", legacyType: "short_video", label: "Instagram Reel" },
  instagram_story: { code: "instagram_story", platform: "instagram", legacyType: "story", label: "Instagram Story" },
  tiktok_live: { code: "tiktok_live", platform: "tiktok", legacyType: "live_stream", label: "TikTok Live" },
  tiktok_story: { code: "tiktok_story", platform: "tiktok", legacyType: "story", label: "TikTok Story" },
  tiktok_video: { code: "tiktok_video", platform: "tiktok", legacyType: "short_video", label: "TikTok Video" },
};

const LEGACY_TO_CANONICAL: Partial<Record<`${PlatformType}:${DeliverableType}`, DeliverableCode>> = {
  "youtube:live_stream": "youtube_live",
  "youtube:short_video": "youtube_short",
  "youtube:dedicated_video": "youtube_video",
  "youtube:integrated_mention": "youtube_video",
  "instagram:live_stream": "instagram_live",
  "instagram:photo_post": "instagram_feed",
  "instagram:short_video": "instagram_reel",
  "instagram:story": "instagram_story",
  "tiktok:live_stream": "tiktok_live",
  "tiktok:story": "tiktok_story",
  "tiktok:short_video": "tiktok_video",
};

const LEGACY_LABELS: Record<DeliverableType, string> = {
  dedicated_video: "Dedicated Video",
  integrated_mention: "Integrated Mention",
  short_video: "Short Video",
  photo_post: "Photo Post",
  story: "Story",
  live_stream: "Live Stream",
  blog_post: "Blog Post",
  other: "Other",
};

export function resolveDeliverableCode(
  platform?: PlatformType,
  deliverableCode?: string | null,
  deliverableType?: DeliverableType | null,
): DeliverableCode | undefined {
  if (deliverableCode && deliverableCode in DELIVERABLE_DEFINITIONS) {
    return deliverableCode as DeliverableCode;
  }
  if (platform && deliverableType) {
    return LEGACY_TO_CANONICAL[`${platform}:${deliverableType}`];
  }
  return undefined;
}

export function getDeliverableLabel(
  platform?: PlatformType,
  deliverableCode?: string | null,
  deliverableType?: DeliverableType | null,
): string {
  const canonical = resolveDeliverableCode(platform, deliverableCode, deliverableType);
  if (canonical) {
    return DELIVERABLE_DEFINITIONS[canonical].label;
  }
  if (deliverableType) {
    return LEGACY_LABELS[deliverableType] ?? deliverableType;
  }
  return "Deliverable";
}
