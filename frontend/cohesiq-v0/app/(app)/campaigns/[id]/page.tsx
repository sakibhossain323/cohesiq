"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { ApplyModal } from "@/components/campaign/ApplyModal";
import { DeliverableTable } from "@/components/campaign/DeliverableTable";
import { BrandCard } from "@/components/brand/BrandCard";
import { NicheBadge } from "@/components/shared/NicheBadge";
import { PlatformBadge, getPlatformLabel } from "@/components/shared/PlatformBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCampaignById } from "@/lib/api/campaigns";
import { getBrandById } from "@/lib/api/brands";
import { formatBDT, formatDate, daysUntil, formatFollowerCount } from "@/lib/utils";
import { BadgeCheck, Calendar, Users, Send } from "lucide-react";
import type { Campaign, Brand } from "@/lib/types";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const campaignData = await getCampaignById(id);
      if (campaignData) {
        setCampaign(campaignData);
        const brandData = await getBrandById(campaignData.brand_id);
        setBrand(brandData);
      }
      setIsLoading(false);
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col bg-background">
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <LoadingSkeleton variant="profile" />
          </div>
        </main>
      </div>
    );
  }

  if (!campaign) {
    notFound();
  }

  const daysLeft = campaign.application_deadline 
    ? daysUntil(campaign.application_deadline)
    : null;

  const budgetRange = campaign.budget_per_creator_min
    ? `${formatBDT(campaign.budget_per_creator_min)} - ${formatBDT(campaign.budget_per_creator_max)}`
    : `Up to ${formatBDT(campaign.budget_per_creator_max)}`;

  const requiredPlatforms = campaign.required_platforms ?? campaign.platforms ?? [];
  const minFollowers = campaign.creator_min_followers ?? campaign.min_followers ?? 0;

  return (
    <div className="flex flex-col bg-background">

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 rounded-lg border border-border">
                      <AvatarImage src={campaign.brand.logo_url} alt={campaign.brand.brand_name} />
                      <AvatarFallback className="rounded-lg bg-muted text-sm font-medium">
                        {campaign.brand.brand_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {campaign.brand.brand_name}
                        </span>
                        {campaign.brand.is_verified && (
                          <BadgeCheck className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <h1 className="mt-1 text-2xl font-bold text-foreground">{campaign.title}</h1>
                    </div>

                    <StatusBadge status={campaign.status} />
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Budget per Creator</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{budgetRange}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">Applications</p>
                      <div className="mt-1 flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-semibold text-foreground">
                          {campaign.application_count}
                        </span>
                      </div>
                    </div>

                    {campaign.application_deadline && (
                      <div>
                        <p className="text-xs text-muted-foreground">Deadline</p>
                        <div className="mt-1 flex items-center gap-1">
                          <Calendar className={daysLeft && daysLeft <= 7 ? "h-4 w-4 text-red-500" : "h-4 w-4 text-muted-foreground"} />
                          <span className={daysLeft && daysLeft <= 7 ? "text-lg font-semibold text-red-600" : "text-lg font-semibold text-foreground"}>
                            {formatDate(campaign.application_deadline)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {campaign.status === "active" && (
                    <div className="mt-6">
                      <Button size="lg" className="w-full sm:w-auto" onClick={() => setApplyModalOpen(true)}>
                        <Send className="mr-2 h-4 w-4" />
                        Apply to Campaign
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Brief</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">{campaign.description}</p>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Niche</p>
                    <div className="mt-2">
                      <NicheBadge niche={campaign.primary_niche} />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">Required Platforms</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {requiredPlatforms.map(platform => (
                        <Badge key={platform} variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                          <PlatformBadge platform={platform} size="sm" />
                          <span>{getPlatformLabel(platform)}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">Minimum Followers</p>
                    <p className="mt-1 text-muted-foreground">
                      {formatFollowerCount(minFollowers)}+ followers on primary platform
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Deliverables */}
              {campaign.deliverables && campaign.deliverables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Required Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DeliverableTable deliverables={campaign.deliverables} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <aside className="w-full shrink-0 lg:w-80">
              {brand && (
                <div className="sticky top-24">
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">About the Brand</h3>
                  <BrandCard brand={brand} />
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <ApplyModal
        campaign={campaign}
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const config = {
    draft: { label: "Draft", className: "border-gray-200 bg-gray-50 text-gray-700" },
    active: { label: "Active", className: "border-green-200 bg-green-50 text-green-700" },
    in_progress: { label: "In Progress", className: "border-blue-200 bg-blue-50 text-blue-700" },
    completed: { label: "Completed", className: "border-muted bg-muted/50 text-muted-foreground" },
    cancelled: { label: "Cancelled", className: "border-red-200 bg-red-50 text-red-700" },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
