import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ResetOnboardingButton } from "@/components/onboarding/ResetOnboardingButton";
import { Button } from "@/components/ui/button";
import { getApplicationsByCreatorId } from "@/lib/api/applications";
import { getSuggestedCampaigns } from "@/lib/api/campaigns";
import { getMyCreatorProfile } from "@/lib/api/creators";
import { BarChart3 } from "lucide-react";
import { CreatorHomeClient } from "./_components/CreatorHomeClient";

export default async function CreatorDashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return (
      <div className="bd-empty">
        <div className="bd-empty-icon"><BarChart3 className="h-6 w-6" /></div>
        <p className="bd-empty-title">Access Denied</p>
        <p className="bd-empty-desc">Please log in to access your dashboard.</p>
        <Button asChild><Link href="/sign-in">Log In</Link></Button>
      </div>
    );
  }

  const creator = await getMyCreatorProfile(token);

  if (!creator) {
    return (
      <div className="bd-empty">
        <div className="bd-empty-icon"><BarChart3 className="h-6 w-6" /></div>
        <p className="bd-empty-title">Profile not found</p>
        <p className="bd-empty-desc">We couldn&apos;t find a creator profile for your account. Please complete onboarding.</p>
        <ResetOnboardingButton />
      </div>
    );
  }

  const [applications, suggestedCampaigns] = await Promise.all([
    getApplicationsByCreatorId(creator.id, token).catch(() => []),
    getSuggestedCampaigns(creator.primary_niche || "Food", 4).catch(() => []),
  ]);

  return (
    <CreatorHomeClient
      creator={creator}
      applications={applications}
      suggestedCampaigns={suggestedCampaigns}
    />
  );
}
