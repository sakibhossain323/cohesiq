import { notFound } from "next/navigation";
import { getCreatorById } from "@/lib/api/creators";
import { getCreatorReviews } from "@/lib/api/reviews";
import { BrandCreatorMediaKit } from "./_components/BrandCreatorMediaKit";
import { InviteModal } from "./_components/InviteModal";

interface PrivateCreatorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrivateCreatorDetailPage({ params }: PrivateCreatorDetailPageProps) {
  const { id } = await params;

  const creator = await getCreatorById(id);

  if (!creator) {
    notFound();
  }

  const creatorReviews = (await getCreatorReviews(id))
    .filter(review => review.is_public)
    .slice(0, 4);

  return (
    <BrandCreatorMediaKit
      creator={creator}
      reviews={creatorReviews}
      actionSlot={<InviteModal creatorId={id} />}
    />
  );
}
