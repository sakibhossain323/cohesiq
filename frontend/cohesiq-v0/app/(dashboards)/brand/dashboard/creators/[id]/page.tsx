import { CreatorDetailView } from "@/components/creator/CreatorDetailView";
import { InviteModal } from "./_components/InviteModal";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PrivateCreatorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrivateCreatorDetailPage({ params }: PrivateCreatorDetailPageProps) {
  const { id } = await params;
  
  return (
    <div className="flex flex-col bg-background w-full">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8 w-full">
        <Link 
          href="/brand/dashboard/creators" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Find Creators
        </Link>
      </div>
      <CreatorDetailView creatorId={id} actionSlot={<InviteModal creatorId={id} />} />
    </div>
  );
}
