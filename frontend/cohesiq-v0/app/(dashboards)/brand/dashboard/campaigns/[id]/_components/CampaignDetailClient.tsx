"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApplicationStatusBadge } from "@/components/application/ApplicationStatusBadge";
import { CampaignStatusBadge } from "../../_components/CampaignStatusBadge";
import { ArrowLeft, Users, Sparkles, Settings, Loader2, CheckCircle2, XCircle, Edit, Archive, PlayCircle, Handshake, Send, FileSignature } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatBDT, formatDate } from "@/lib/utils";
import type { Campaign, Application, AIMatchScore } from "@/lib/types";
import { updateCampaignStatusAction, runMatchingAction } from "../_actions/campaign-actions";

interface CampaignDetailClientProps {
  campaign: Campaign;
  applications: Application[];
  initialMatches: AIMatchScore[];
}

export function CampaignDetailClient({ campaign, applications, initialMatches }: CampaignDetailClientProps) {
  const [matches, setMatches] = useState<AIMatchScore[]>(initialMatches);
  const [isPending, startTransition] = useTransition();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"active" | "cancelled" | "completed" | "archived" | null>(null);
  const [statusDialogMessage, setStatusDialogMessage] = useState("");

  const handleStatusChange = () => {
    if (!pendingStatus) return;
    
    startTransition(async () => {
      await updateCampaignStatusAction(campaign.id, pendingStatus);
      setShowStatusDialog(false);
      setPendingStatus(null);
    });
  };

  const handleRunMatching = () => {
    startTransition(async () => {
      const result = await runMatchingAction(campaign.id);
      if (result.success && result.matches) {
        setMatches(result.matches);
      }
    });
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

  return (
    <>
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link href="/brand/dashboard/campaigns">
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
                <Button variant="outline" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href={`/brand/dashboard/campaigns/${campaign.id}/edit`} className="cursor-pointer flex items-center">
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

      <Tabs defaultValue="collaborations" className="w-full">
        <TabsList className="mb-8 bg-muted/50 w-full sm:w-auto p-1 h-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="collaborations" className="py-2 px-6 flex gap-2">
            <Handshake className="h-4 w-4" />
            <span className="hidden sm:inline">Collaborations</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary px-1.5 py-0 h-5">
              {applications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="py-2 px-6 flex gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="hidden sm:inline">Recommendations</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary px-1.5 py-0 h-5">
              {matches.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="details" className="py-2 px-6">
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collaborations" className="m-0 space-y-6">
          <p className="text-sm text-muted-foreground">
            Invitations, contracts, and applications in one place
          </p>
          <Tabs defaultValue="invitations" className="w-full">
            <TabsList className="mb-6 w-full sm:w-auto h-auto p-1 bg-muted/50">
              <TabsTrigger value="invitations" className="py-2 px-4 flex gap-2">
                Sent Invitations
                <Badge variant="secondary" className="px-1.5 py-0 h-5">0</Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="py-2 px-4 flex gap-2">
                Active Contracts
                <Badge variant="secondary" className="px-1.5 py-0 h-5">0</Badge>
              </TabsTrigger>
              <TabsTrigger value="applications" className="py-2 px-4 flex gap-2">
                Applications
                <Badge variant="secondary" className="px-1.5 py-0 h-5">{applications.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invitations" className="space-y-6">
              <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <Send className="mb-4 h-12 w-12 opacity-20" />
                  <p className="font-medium text-foreground text-lg">No sent invitations</p>
                  <p className="mt-2 text-sm max-w-sm text-balance">
                    When you invite a creator to a campaign from the Find Creators page, it will appear here.
                  </p>
                  <Button variant="outline" className="mt-6" asChild>
                    <Link href={`/brand/dashboard/campaigns/${campaign.id}/matches`}>
                      Open Recommendations
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active" className="space-y-6">
              <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <FileSignature className="mb-4 h-12 w-12 opacity-20" />
                  <p className="font-medium text-foreground text-lg">No active contracts</p>
                  <p className="mt-2 text-sm max-w-sm text-balance">
                    When you accept a creator's application, it will move here so you can track deliverables.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="m-0">
              {applications.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                    <Users className="mb-4 h-12 w-12 opacity-20" />
                    <p className="font-medium text-foreground text-lg mb-1">No applications yet</p>
                    <p className="text-sm max-w-sm">Creators will appear here once they apply to your campaign.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-start">
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
          </Tabs>
        </TabsContent>

        <TabsContent value="recommendations" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Best Matches For This Campaign</CardTitle>
              <CardDescription>Quick preview of your highest-scoring creators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <Sparkles className="mb-4 h-10 w-10 text-purple-500 opacity-50" />
                  <p className="font-medium text-foreground text-lg mb-1">No recommendations yet</p>
                  <p className="text-sm max-w-sm mb-6">Run AI Matching to generate creator recommendations.</p>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleRunMatching}
                    disabled={isPending}
                  >
                    {isPending ? "Running..." : "Run AI Matching"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 3).map(match => {
                    const creator = match.creator;
                    const creatorName = creator?.display_name || "Unknown Creator";
                    const initials = creatorName.slice(0, 2).toUpperCase();
                    const niche = creator?.primary_niche ? creator.primary_niche.replace(/_/g, " ") : "";
                    const scoreValue = match.score_total ? Math.round(match.score_total * 100) : 0;

                    return (
                      <div key={match.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={creator?.profile_photo_url || ""} alt={creatorName} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{creatorName}</p>
                            {niche && (
                              <p className="text-xs text-muted-foreground capitalize">{niche}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">Score {scoreValue}%</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <div className="flex justify-end px-6 pb-6">
              <Button variant="outline" asChild>
                <Link href={`/brand/dashboard/campaigns/${campaign.id}/matches`}>
                  View All Recommendations
                </Link>
              </Button>
            </div>
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

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.preventDefault();
              handleStatusChange();
            }} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ApplicationCard({ app }: { app: Application }) {
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
          <Link href={`/brand/dashboard/creators/${app.creator_id || 'unknown'}`}>
            View Profile
          </Link>
        </Button>
      </div>
    </Card>
  );
}
