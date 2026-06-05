import { fetchApi } from "@/lib/api/client";
import { RateBenchmarkClient, type BenchmarkRow } from "./_components/RateBenchmarkClient";

interface SocialProfile { follower_count?: number | null }
interface RateCard { platform: string; deliverable_type: string; price_bdt: number; is_active: boolean }
interface Creator { social_profiles: SocialProfile[]; rate_cards: RateCard[] }

function getCreatorTier(creator: Creator): string {
  const maxFollowers = Math.max(
    0,
    ...creator.social_profiles.map(sp => sp.follower_count ?? 0),
  );
  if (maxFollowers >= 1_000_000) return "mega";
  if (maxFollowers >= 100_000)   return "macro";
  if (maxFollowers >= 10_000)    return "micro";
  return "nano";
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

async function computeBenchmarks(): Promise<BenchmarkRow[]> {
  try {
    const creators = await fetchApi<Creator[]>("/creators/?limit=200");
    const groups = new Map<string, number[]>();

    for (const creator of creators) {
      const tier = getCreatorTier(creator);
      for (const card of creator.rate_cards) {
        if (!card.is_active || card.price_bdt <= 0) continue;
        const key = `${card.platform}||${card.deliverable_type}||${tier}`;
        const existing = groups.get(key) ?? [];
        existing.push(card.price_bdt);
        groups.set(key, existing);
      }
    }

    const rows: BenchmarkRow[] = [];
    for (const [key, prices] of groups) {
      const [platform, deliverable_type, tier] = key.split("||");
      rows.push({
        platform,
        deliverable_type,
        tier,
        median_bdt: median(prices),
        min_bdt: Math.min(...prices),
        max_bdt: Math.max(...prices),
        sample_count: prices.length,
      });
    }

    return rows;
  } catch {
    return [];
  }
}

export default async function RateBenchmarkPage() {
  const rows = await computeBenchmarks();
  return <RateBenchmarkClient rows={rows} />;
}
