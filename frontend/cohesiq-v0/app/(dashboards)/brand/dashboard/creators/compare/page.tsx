import { getCreatorById } from "@/lib/api/creators";
import { CompareClient } from "./_components/CompareClient";
import type { Creator } from "@/lib/types";

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function CreatorComparePage({ searchParams }: ComparePageProps) {
  const { ids } = await searchParams;
  const idList = (ids ?? "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 3);

  const creators = (
    await Promise.all(idList.map(id => getCreatorById(id).catch(() => null)))
  ).filter((c): c is Creator => c !== null);

  return <CompareClient creators={creators} />;
}
