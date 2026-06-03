import { auth } from "@clerk/nextjs/server";
import { getCampaignById, getCampaignMatches } from "@/lib/api/campaigns";
import { getApplicationsByCampaignId } from "@/lib/api/applications";
import { CampaignDetailClient } from "./_components/CampaignDetailClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandCampaignDetailPage({ params }: PageProps) {
  // Await the params first per Next.js 15+ constraints
  const { id } = await params;
  
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return null; // Layout should handle redirect
  }

  // Fetch all necessary data sequentially or in parallel
  const campaign = await getCampaignById(id);

  if (!campaign) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
        <h2 className="text-xl font-bold mb-2">Campaign Not Found</h2>
        <Button variant="outline" asChild><Link href="/brand/dashboard/campaigns">Go Back</Link></Button>
      </div>
    );
  }

  const [applications, matches] = await Promise.all([
    getApplicationsByCampaignId(id, token),
    getCampaignMatches(id, token),
  ]);

  return (
    <div className="flex flex-col min-h-full bg-background">
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CampaignDetailClient 
          campaign={campaign} 
          applications={applications} 
          initialMatches={matches || []} 
        />
      </main>
    </div>
  );
}
