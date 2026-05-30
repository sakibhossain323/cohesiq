"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetOnboarding } from "@/app/actions/onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { getCampaignsByBrandId } from "@/lib/api/campaigns";
import { getMyBrandProfile } from "@/lib/api/brands";
import { Briefcase, Users, MessageSquare, Plus, Search, Loader2 } from "lucide-react";
import type { Campaign, Brand } from "@/lib/types";

export default function BrandDashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    async function loadData() {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const brandData = await getMyBrandProfile(token);
        if (brandData) {
          setBrand(brandData);
          const campaignsData = await getCampaignsByBrandId(brandData.id);
          setCampaigns(campaignsData);
        }
      } catch (err) {
        console.error("Error loading brand dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isLoaded, isSignedIn]);

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    try {
      const res = await resetOnboarding();
      if (res.success) {
        router.push("/onboarding");
      } else {
        alert(res.error || "Failed to reset onboarding.");
      }
    } catch (err) {
      console.error(err);
      alert("Error resetting onboarding.");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col bg-background h-[calc(100vh-4rem)]">
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center bg-background">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Profile not found</h2>
        <p className="text-muted-foreground mb-6">We couldn't find a brand profile for your account. Please complete the onboarding process.</p>
        <Button onClick={handleResetOnboarding} disabled={isResetting}>
          {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isResetting ? "Resetting..." : "Go to Onboarding"}
        </Button>
      </div>
    );
  }

  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  // A simple placeholder for mock data until we load applications properly in this view
  const pendingApplications = 0; 

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
                Here's what's happening with your influencer campaigns today.
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
                <p className="text-xs text-muted-foreground">
                  Out of {campaigns.length} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Apps</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingApplications}</div>
                <p className="text-xs text-muted-foreground">
                  Waiting for review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  From active creators
                </p>
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
