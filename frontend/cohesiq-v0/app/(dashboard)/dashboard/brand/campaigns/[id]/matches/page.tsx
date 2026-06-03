import { auth } from "@clerk/nextjs/server";
import { getCampaignById, getCampaignMatches } from "@/lib/api/campaigns";
import { MatchesClient } from "./_components/MatchesClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignMatchesPage({ params }: PageProps) {
  const { id } = await params;
  
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return null; // Layout handles redirect
  }

  const campaign = await getCampaignById(id);

  if (!campaign) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-red-800 dark:text-red-300">
              <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg">Unable to load campaign</h3>
                <p className="mt-1 text-sm">Campaign not found</p>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" size="sm" asChild className="bg-background">
                    <Link href={`/dashboard/brand/campaigns`}>
                      <ChevronLeft className="mr-1 h-4 w-4" /> Go Back
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const matchesData = await getCampaignMatches(id, token);
  const sortedMatches = (matchesData || []).sort((a, b) => (b.score_total || 0) - (a.score_total || 0));

  return <MatchesClient campaign={campaign} initialMatches={sortedMatches} />;
}
