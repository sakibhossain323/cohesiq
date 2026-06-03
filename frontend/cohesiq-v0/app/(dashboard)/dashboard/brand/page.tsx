import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCampaignsByBrandId } from "@/lib/api/campaigns";
import { getMyBrandProfile } from "@/lib/api/brands";
import { ResetOnboardingButton } from "@/components/onboarding/ResetOnboardingButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, MessageSquare, Plus, Search } from "lucide-react";
import type { Campaign } from "@/lib/types";

export default async function BrandDashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center bg-background">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">Please log in to access your dashboard.</p>
        <Button asChild><Link href="/sign-in">Log In</Link></Button>
      </div>
    );
  }

  const brand = await getMyBrandProfile(token);

  if (!brand) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center bg-background">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Profile not found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t find a brand profile for your account. Please complete the onboarding process.
        </p>
        <ResetOnboardingButton />
      </div>
    );
  }

  const campaigns: Campaign[] = await getCampaignsByBrandId(brand.id).catch(() => []);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  return (
    <div className="flex flex-col bg-background min-h-full">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Welcome back, {brand.brand_name}
              </h1>
              <p className="mt-2 text-muted-foreground">
                Here&apos;s what&apos;s happening with your influencer campaigns today.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard/brand/creators">
                  <Search className="mr-2 h-4 w-4" />
                  Find Creators
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/brand/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCampaigns}</div>
                <p className="text-xs text-muted-foreground">Out of {campaigns.length} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Apps</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Waiting for review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">From active creators</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <Briefcase className="mb-2 h-8 w-8 opacity-20" />
                    <p>No campaigns yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.slice(0, 3).map(campaign => (
                      <div key={campaign.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-sm">{campaign.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{campaign.status}</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/brand/campaigns/${campaign.id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                    {campaigns.length > 3 && (
                      <Button variant="outline" className="w-full mt-4" asChild>
                        <Link href="/dashboard/brand/campaigns">View All Campaigns</Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
