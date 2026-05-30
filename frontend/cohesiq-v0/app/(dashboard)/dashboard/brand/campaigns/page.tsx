"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getCampaignsByBrandId } from "@/lib/api/campaigns";
import { getMyBrandProfile } from "@/lib/api/brands";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Campaign } from "@/lib/types";

export default function BrandCampaignsPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          const campaignsData = await getCampaignsByBrandId(brandData.id);
          setCampaigns(campaignsData);
        }
      } catch (err) {
        console.error("Error loading campaigns:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isLoaded, isSignedIn]);

  if (isLoading) {
    return (
      <div className="flex flex-col p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your brand's campaigns and track their performance.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map(campaign => (
          <CampaignCard 
            key={campaign.id} 
            campaign={campaign} 
            basePath="/dashboard/brand/campaigns" 
          />
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            You haven't created any campaigns yet.
          </div>
        )}
      </div>
    </div>
  );
}
