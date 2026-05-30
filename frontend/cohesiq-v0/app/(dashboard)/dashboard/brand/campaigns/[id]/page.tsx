"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getCampaignById, updateCampaignStatus } from "@/lib/api/campaigns";
import { getApplicationsByCampaignId } from "@/lib/api/applications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApplicationStatusBadge } from "@/components/application/ApplicationStatusBadge";
import { CampaignStatusBadge } from "@/components/campaign/CampaignStatusBadge";
import { ArrowLeft, Users, Sparkles, Settings, Loader2, CheckCircle2, XCircle, Edit, Archive, PlayCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { formatBDT, formatDate } from "@/lib/utils";
import type { Campaign, Application, ApplicationStatus } from "@/lib/types";

export default function BrandCampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"active" | "cancelled" | "completed" | "archived" | null>(null);
  const [statusDialogMessage, setStatusDialogMessage] = useState("");

  const handleStatusChange = async () => {
    if (!pendingStatus || !campaign) return;
    setIsUpdatingStatus(true);
    try {
      const token = await getToken();
      if (!token) return;
      
      const updated = await updateCampaignStatus(campaign.id, pendingStatus, token);
      setCampaign(updated);
    } catch (err) {
      console.error("Failed to update campaign status", err);
    } finally {
      setIsUpdatingStatus(false);
      setShowStatusDialog(false);
      setPendingStatus(null);
    }
  };

  const confirmStatusChange = (status: "active" | "cancelled" | "completed" | "archived") => {
    setPendingStatus(status);
    if (status === "archived") {
      setStatusDialogMessage("Are you sure you want to archive this campaign? It will be hidden from the active campaigns list.");
    } else if (status === "cancelled") {
      setStatusDialogMessage("Are you sure you want to cancel this campaign? Creators will no longer be able to apply or interact with it.");
    } else if (status === "completed") {
      setStatusDialogMessage("Are you sure you want to mark this campaign as completed?");
    } else if (status === "active") {
      setStatusDialogMessage("Are you sure you want to reactivate this campaign?");
    }
    setShowStatusDialog(true);
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const campaignData = await getCampaignById(id);
        if (campaignData) {
          setCampaign(campaignData);
          const apps = await getApplicationsByCampaignId(id, token);
          setApplications(apps);
        }
      } catch (err) {
        console.error("Failed to load campaign details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, isLoaded, isSignedIn, getToken]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
        <h2 className="text-xl font-bold mb-2">Campaign Not Found</h2>
        <Button variant="outline" asChild><Link href="/dashboard/brand/campaigns">Go Back</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
            <Link href="/dashboard/brand/campaigns">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{campaign.title}</h1>
                <CampaignStatusBadge status={campaign.status} />
              </div>
              {campaign.created_at && (
                <p className="text-muted-foreground flex items-center gap-2">
                  Created on {formatDate(campaign.created_at)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/brand/campaigns/${campaign.id}/edit`} className="cursor-pointer flex items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Campaign
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {campaign.status !== "active" ? (
                    <DropdownMenuItem onClick={() => confirmStatusChange("active")} className="cursor-pointer flex items-center">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Reactivate Campaign
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => confirmStatusChange("completed")} className="cursor-pointer flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </DropdownMenuItem>
                  )}
                  {campaign.status !== "cancelled" && campaign.status !== "archived" && (
                    <DropdownMenuItem onClick={() => confirmStatusChange("cancelled")} className="cursor-pointer flex items-center text-yellow-600 focus:bg-yellow-50 focus:text-yellow-700">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Campaign
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => confirmStatusChange("archived")} className="cursor-pointer flex items-center text-red-600 focus:bg-red-50 focus:text-red-700">
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Campaign
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="mb-8 bg-muted/50 w-full sm:w-auto p-1 h-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="applications" className="py-2 px-6 flex gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Applications</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary px-1.5 py-0 h-5">
                {applications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="matches" className="py-2 px-6 flex gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="hidden sm:inline">AI Matches</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="py-2 px-6">
              Details
            </TabsTrigger>
          </TabsList>

          {/* CRM View */}
          <TabsContent value="applications" className="m-0">
            {applications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                  <Users className="mb-4 h-12 w-12 opacity-20" />
                  <p className="font-medium text-foreground text-lg mb-1">No applications yet</p>
                  <p className="text-sm max-w-sm mb-6">Creators will appear here once they apply to your campaign.</p>
                  <Button variant="outline" onClick={() => document.querySelector<HTMLButtonElement>('[value="matches"]')?.click()}>
                    <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                    Find AI Matches
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-start">
                {/* Invited Column */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      Invited
                    </h3>
                    <Badge variant="secondary">{applications.filter(a => a.status === 'invited').length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {applications.filter(a => a.status === 'invited').map(app => (
                      <ApplicationCard key={app.id} app={app} />
                    ))}
                  </div>
                </div>

                {/* Pending Column */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      Needs Review
                    </h3>
                    <Badge variant="secondary">{applications.filter(a => a.status === 'pending').length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {applications.filter(a => a.status === 'pending').map(app => (
                      <ApplicationCard key={app.id} app={app} />
                    ))}
                  </div>
                </div>

                {/* Shortlisted Column */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Shortlisted
                    </h3>
                    <Badge variant="secondary">{applications.filter(a => a.status === 'shortlisted').length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {applications.filter(a => a.status === 'shortlisted').map(app => (
                      <ApplicationCard key={app.id} app={app} />
                    ))}
                  </div>
                </div>

                {/* Accepted/Completed Column */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      Accepted
                    </h3>
                    <Badge variant="secondary">{applications.filter(a => a.status === 'accepted' || a.status === 'completed').length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {applications.filter(a => a.status === 'accepted' || a.status === 'completed').map(app => (
                      <ApplicationCard key={app.id} app={app} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches" className="m-0">
            <Card className="border-dashed bg-purple-50/50 dark:bg-purple-950/10 border-purple-200 dark:border-purple-900/30">
              <CardContent className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                <Sparkles className="mb-4 h-12 w-12 text-purple-500 opacity-50" />
                <p className="font-medium text-foreground text-lg mb-2">AI Matching Engine</p>
                <p className="text-sm max-w-md">
                  Our AI analyzes your campaign brief and matches it against creator audience demographics, semantic niche, and engagement metrics.
                </p>
                <p className="text-xs text-muted-foreground mt-4 font-mono bg-muted px-2 py-1 rounded">
                  [Module Integration Pending]
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Brief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-foreground whitespace-pre-wrap">{campaign.description}</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-border">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Target Niche</h4>
                    <Badge variant="secondary" className="capitalize">
                      {campaign.primary_niche && campaign.primary_niche !== "general" ? campaign.primary_niche.replace('_', ' ') : 'Any'}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Budget (Max)</h4>
                    <p className="font-medium">
                      {campaign.budget_per_creator_max ? formatBDT(campaign.budget_per_creator_max) : 'Open'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Min Followers</h4>
                    <p className="font-medium">
                      {campaign.creator_min_followers ? campaign.creator_min_followers.toLocaleString() : 'Any'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.preventDefault();
              handleStatusChange();
            }} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ApplicationCard({ app }: { app: Application }) {
  // We mock a generic creator interface here since CreatorProfile isn't fully typed for brand view yet
  const creatorName = app.creator?.display_name || "Unknown Creator";
  const initials = creatorName.slice(0, 2).toUpperCase();
  
  return (
    <Card className="shadow-sm overflow-hidden hover:border-primary/50 transition-colors">
      <div className="p-4 bg-card">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${creatorName}`} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm line-clamp-1">{creatorName}</p>
              <p className="text-xs text-muted-foreground">{formatDate(app.applied_at)}</p>
            </div>
          </div>
        </div>
        
        {app.proposed_rate && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Proposed Rate</span>
            <span className="text-sm font-semibold">{formatBDT(app.proposed_rate)}</span>
          </div>
        )}
      </div>
      <div className="bg-muted/40 p-3 border-t border-border flex justify-between gap-2">
        <Button variant="outline" size="sm" className="w-full text-xs h-8" asChild>
          <Link href={`/dashboard/brand/creators/${app.creator_id || 'unknown'}`}>
            View Profile
          </Link>
        </Button>
      </div>
    </Card>
  );
}
