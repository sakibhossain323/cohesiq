import { CreatorDetailView } from "@/components/creator/CreatorDetailView";

interface PrivateCreatorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrivateCreatorDetailPage({ params }: PrivateCreatorDetailPageProps) {
  const { id } = await params;
  return <CreatorDetailView creatorId={id} />;
}
