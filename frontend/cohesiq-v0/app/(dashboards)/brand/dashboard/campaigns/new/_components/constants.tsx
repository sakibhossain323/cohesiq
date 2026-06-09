import type { DeliverableCode, PlatformType } from "@/lib/types";
import { Globe, Lock } from "lucide-react";

export const CAMPAIGN_PLATFORMS: { value: PlatformType; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  // { value: "facebook",  label: "Facebook"  },
  // { value: "linkedin",  label: "LinkedIn"  },
];

export const CAMPAIGN_DELIVERABLES_BY_PLATFORM: Partial<Record<PlatformType, DeliverableCode[]>> = {
  youtube: ["youtube_live", "youtube_short", "youtube_video"],
  instagram: ["instagram_live", "instagram_feed", "instagram_reel", "instagram_story"],
  tiktok: ["tiktok_live", "tiktok_story", "tiktok_video"],
};

export const VISIBILITY_OPTIONS: {
  value: "public" | "private";
  icon: React.ReactNode;
  title: string;
  description: string;
  hint: string;
}[] = [
    {
      value: "public",
      icon: <Globe className="h-5 w-5" />,
      title: "Public Campaign",
      description: "Any qualifying creator can discover and apply.",
      hint: "Best for broad influencer programs. You review applications and select who to work with.",
    },
    {
      value: "private",
      icon: <Lock className="h-5 w-5" />,
      title: "Private Outreach",
      description: "You hand-pick and invite specific creators.",
      hint: "Best for targeted direct deals. Terms stay confidential — only invited creators see this campaign.",
    },
  ];

export const STEPS = [
  { id: 1, label: "Brief" },
  { id: 2, label: "Requirements" },
];
