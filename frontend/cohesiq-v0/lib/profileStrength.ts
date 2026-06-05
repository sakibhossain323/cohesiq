import type { Creator } from "@/lib/types";

export interface StrengthItem {
  label: string;
  done: boolean;
  points: number;
  tip: string;
}

export interface ProfileStrength {
  score: number;
  items: StrengthItem[];
  level: "Starter" | "Rising" | "Pro" | "Elite";
  levelColor: string;
}

export function computeProfileStrength(creator: Creator): ProfileStrength {
  const items: StrengthItem[] = [
    {
      label: "Profile photo",
      done: !!creator.profile_photo_url,
      points: 10,
      tip: "Add a profile photo so brands can recognise you",
    },
    {
      label: "Bio written",
      done: (creator.bio?.trim().length ?? 0) >= 20,
      points: 15,
      tip: "Write at least 20 characters in your bio — it powers AI matching",
    },
    {
      label: "Tagline set",
      done: !!creator.tagline?.trim(),
      points: 10,
      tip: "A short tagline helps your card stand out in search",
    },
    {
      label: "City added",
      done: !!creator.city?.trim(),
      points: 5,
      tip: "Adding your city improves local campaign matching",
    },
    {
      label: "Niche selected",
      done: Array.isArray(creator.niches) && creator.niches.length > 0,
      points: 15,
      tip: "Select at least one niche to appear in niche-filtered searches",
    },
    {
      label: "Language added",
      done: Array.isArray(creator.languages) && creator.languages.length > 0,
      points: 5,
      tip: "Add your content language(s) for language-targeted campaigns",
    },
    {
      label: "Social profile linked",
      done: Array.isArray(creator.social_profiles) && creator.social_profiles.length > 0,
      points: 20,
      tip: "Link at least one social platform — required for matching",
    },
    {
      label: "Follower stats filled",
      done: Array.isArray(creator.social_profiles) &&
        creator.social_profiles.some((sp: any) => sp.follower_count != null && sp.follower_count > 0),
      points: 10,
      tip: "Add follower count on your platform to unlock tier-based matching",
    },
    {
      label: "Rate card added",
      done: Array.isArray(creator.rate_cards) &&
        creator.rate_cards.some((rc: any) => rc.is_active !== false),
      points: 10,
      tip: "Add at least one active rate card so brands know your pricing",
    },
  ];

  const score = items.reduce((sum, item) => sum + (item.done ? item.points : 0), 0);

  let level: ProfileStrength["level"];
  let levelColor: string;
  if (score >= 85) { level = "Elite";   levelColor = "text-purple-600"; }
  else if (score >= 65) { level = "Pro";     levelColor = "text-blue-600"; }
  else if (score >= 40) { level = "Rising";  levelColor = "text-amber-600"; }
  else                  { level = "Starter"; levelColor = "text-muted-foreground"; }

  return { score, items, level, levelColor };
}
