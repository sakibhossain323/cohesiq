"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ApplicationStatusBadge } from "@/components/application/ApplicationStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { StarRating } from "@/components/shared/StarRating";
import { NicheBadge } from "@/components/shared/NicheBadge";
import { getCampaignsByBrandId } from "@/lib/api/campaigns";
import { getApplicationsByCampaignId } from "@/lib/api/applications";
import { getBrandById } from "@/lib/api/brands";
import { formatBDT, formatDate, daysUntil, formatFollowerCount } from "@/lib/utils";
import { Building2, Briefcase, MapPin, Settings } from "lucide-react";
import type { Campaign, Application, Brand, ApplicationStatus } from "@/lib/types";

// Hardcode current brand as mockBrands[0]
const CURRENT_BRAND_ID = "brand-1";

export default function BrandDashboardPage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignApplications, setCampaignApplications] = useState<Application[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [applicationStatuses, setApplicationStatuses] = useState<Record<string, ApplicationStatus>>({});

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [brandData, campaignsData] = await Promise.all([
        getBrandById(CURRENT_BRAND_ID),
        getCampaignsByBrandId(CURRENT_BRAND_ID),
      ]);
      setBrand(brandData);
      setCampaigns(campaignsData);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleManageCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    const apps = await getApplicationsByCampaignId(campaign.id);
    setCampaignApplications(apps);
    // Initialize local status state
    const statuses: Record<string, ApplicationStatus> = {};
    apps.forEach(app => {
      statuses[app.id] = app.status;
    });
    setApplicationStatuses(statuses);
    setSheetOpen(true);
  };

  const handleStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
    setApplicationStatuses(prev => ({
      ...prev,
      [applicationId]: newStatus,
    }));
    console.log(`Application ${applicationId} status changed to: ${newStatus}`);
  };

  if (isLoading || !brand) {
    return (
      <div className="flex flex-col bg-background">
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 rounded bg-muted" />
              <div className="h-4 w-64 rounded bg-muted" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background">

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Brand Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your campaigns and review creator applications
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-8 lg:col-span-2">
              {/* My Campaigns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    My Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <EmptyState
                      icon={Briefcase}
                      title="No campaigns yet"
                      description="Create your first campaign to start finding creators"
                      action={<Button>Create Campaign</Button>}
                    />
                  ) : (
                    <div className="rounded-lg border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Title</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Applications</TableHead>
                            <TableHead className="text-right">Budget Max</TableHead>
                            <TableHead>Deadline</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {campaigns.map(campaign => {
                            const daysLeft = campaign.application_deadline 
                              ? daysUntil(campaign.application_deadline)
                              : null;
                            
                            return (
                              <TableRow key={campaign.id}>
                                <TableCell>
                                  <Link 
                                    href={`/campaigns/${campaign.id}`}
                                    className="font-medium text-foreground hover:text-primary hover:underline"
                                  >
                                    {campaign.title}
                                  </Link>
                                </TableCell>
                                <TableCell className="text-center">
                                  <CampaignStatusBadge status={campaign.status} />
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {campaign.application_count}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatBDT(campaign.budget_per_creator_max)}
                                </TableCell>
                                <TableCell>
                                  {campaign.application_deadline ? (
                                    <span className={daysLeft && daysLeft <= 7 ? "text-red-600" : "text-muted-foreground"}>
                                      {formatDate(campaign.application_deadline)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleManageCampaign(campaign)}
                                  >
                                    <Settings className="mr-1 h-3.5 w-3.5" />
                                    Manage
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Brand Profile */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 rounded-lg border-4 border-border">
                      <AvatarImage src={brand.logo_url} alt={brand.brand_name} />
                      <AvatarFallback className="rounded-lg text-xl font-bold">
                        {brand.brand_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {brand.brand_name}
                      </h3>
                      {brand.is_verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>

                    {brand.city && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{brand.city}</span>
                      </div>
                    )}

                    {brand.average_rating && (
                      <div className="mt-3">
                        <StarRating rating={brand.average_rating} size="sm" />
                      </div>
                    )}

                    <div className="mt-4">
                      <NicheBadge niche={brand.niche} size="sm" />
                    </div>

                    <div className="mt-6 grid w-full grid-cols-2 gap-4 border-t border-border pt-6">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {brand.total_campaigns}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Campaigns</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {campaigns.filter(c => c.status === "active").length}
                        </p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Campaign Management Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Manage Applications</SheetTitle>
            <SheetDescription>
              {selectedCampaign?.title}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {campaignApplications.length === 0 ? (
              <EmptyState
                title="No applications yet"
                description="Applications will appear here when creators apply"
              />
            ) : (
              campaignApplications.map(app => (
                <Card key={app.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={app.creator.profile_photo_url} alt={app.creator.display_name} />
                        <AvatarFallback className="text-xs">
                          {app.creator.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{app.creator.display_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <NicheBadge niche={app.creator.primary_niche} size="sm" />
                              {app.creator.follower_count && (
                                <span>{formatFollowerCount(app.creator.follower_count)} followers</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Proposed Rate</p>
                            <p className="font-semibold text-foreground">
                              {app.proposed_rate ? formatBDT(app.proposed_rate) : "-"}
                            </p>
                          </div>
                          
                          <Select
                            value={applicationStatuses[app.id] || app.status}
                            onValueChange={(value) => handleStatusChange(app.id, value as ApplicationStatus)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {app.proposal_text && (
                          <div className="mt-3 rounded-md bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground">Proposal</p>
                            <p className="mt-1 text-sm text-foreground">{app.proposal_text}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: Campaign["status"] }) {
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
