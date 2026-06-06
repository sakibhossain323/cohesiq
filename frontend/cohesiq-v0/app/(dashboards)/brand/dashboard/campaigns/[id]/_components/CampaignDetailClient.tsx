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
import {
  ArrowLeft, Users, Sparkles, Settings, Loader2, CheckCircle2, XCircle,
  Edit, Archive, PlayCircle, FileSignature, BarChart2, Globe, Lock,
  Send, ChevronRight,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatBDT, formatDate, cn } from "@/lib/utils";
import { getBrandCategoryLabel } from "@/lib/brand-categories";
import type { Campaign, Application, AIMatchScore, ApplicationStatus, Contract } from "@/lib/types";
import { updateCampaignStatusAction, runMatchingAction } from "../_actions/campaign-actions";
import { ApplicationDrawer } from "./ApplicationDrawer";
import { CampaignAnalyticsTab } from "./CampaignAnalyticsTab";
import { ContractCreateModal } from "./ContractCreateModal";
import { ContractCard } from "./ContractCard";

interface CampaignDetailClientProps {
  campaign: Campaign;
  applications: Application[];
  initialMatches: AIMatchScore[];
  initialContracts: Contract[];
}

// ── Kanban column config ────────────────────────────────────────────────────
const PIPELINE_COLUMNS = [
  { key: "invited",     label: "Invited",      dot: "bg-purple-400",  statuses: ["invited"] as ApplicationStatus[] },
  { key: "pending",     label: "Needs Review",  dot: "bg-yellow-400",  statuses: ["pending"] as ApplicationStatus[] },
  { key: "shortlisted", label: "Shortlisted",   dot: "bg-blue-400",    statuses: ["shortlisted"] as ApplicationStatus[] },
  { key: "accepted",    label: "Accepted",      dot: "bg-green-400",   statuses: ["accepted", "completed"] as ApplicationStatus[] },
] as const;

// ── Main component ──────────────────────────────────────────────────────────

export function CampaignDetailClient({
  campaign,
  applications,
  initialMatches,
  initialContracts,
}: CampaignDetailClientProps) {
  const [matches, setMatches] = useState<AIMatchScore[]>(initialMatches);
  const [localApplications, setLocalApplications] = useState<Application[]>(applications);
  const [localContracts, setLocalContracts] = useState<Contract[]>(initialContracts);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [contractModalApp, setContractModalApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [isPending, startTransition] = useTransition();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"active" | "cancelled" | "completed" | "archived" | null>(null);
  const [statusDialogMessage, setStatusDialogMessage] = useState("");
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [matchingNotice, setMatchingNotice] = useState<string | null>(null);

  const handleAppStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
    setLocalApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
    );
    setSelectedApp((prev) =>
      prev?.id === applicationId ? { ...prev, status: newStatus } : prev
    );
  };

  const handleAcceptAndContract = (app: Application) => {
    setSelectedApp(null);
    setContractModalApp(app);
  };

  const handleContractCreated = (contract: Contract) => {
    setLocalContracts((prev) => [contract, ...prev]);
    setActiveTab("contracts");
  };

  const handleContractUpdate = (updated: Contract) => {
    setLocalContracts((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const confirmStatusChange = (status: "active" | "cancelled" | "completed" | "archived") => {
    const messages: Record<string, string> = {
      archived:  "Archive this campaign? It will be hidden from your active list.",
      cancelled: "Cancel this campaign? Creators will no longer be able to apply.",
      completed: "Mark this campaign as completed?",
      active:    "Reactivate this campaign?",
    };
    setPendingStatus(status);
    setStatusDialogMessage(messages[status]);
    setShowStatusDialog(true);
  };

  const handleStatusChange = () => {
    if (!pendingStatus) return;
    startTransition(async () => {
      await updateCampaignStatusAction(campaign.id, pendingStatus);
      setShowStatusDialog(false);
      setPendingStatus(null);
    });
  };

  const handleRunMatching = () => {
    setMatchingError(null);
    setMatchingNotice(null);
    startTransition(async () => {
      const result = await runMatchingAction(campaign.id);
      if (result.success && result.matches) {
        setMatches(result.matches);
        setMatchingNotice(
          result.matches.length > 0
            ? `Matching completed: ${result.matches.length} creators ranked.`
            : "Matching completed, but no creators passed the campaign filters."
        );
        setActiveTab("matches");
      } else {
        setMatchingError(result.error || "Failed to run matching engine.");
        setActiveTab("matches");
      }
    });
  };

  const activeApps = localApplications.filter(
    (a) => !["rejected", "withdrawn", "declined"].includes(a.status)
  );

  const visibilityBadge = campaign.visibility === "private"
    ? <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-2 py-0.5"><Lock className="h-3 w-3" /> Private</span>
    : <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-2 py-0.5"><Globe className="h-3 w-3" /> Public</span>;

  return (
    <>
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link href="/brand/dashboard/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {campaign.title}
              </h1>
              <CampaignStatusBadge status={campaign.status} />
              {visibilityBadge}
              {campaign.brand_category && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-2 py-0.5">
                  {getBrandCategoryLabel(campaign.brand_category)}
                </span>
              )}
            </div>
            {campaign.created_at && (
              <p className="text-sm text-muted-foreground">
                Created {formatDate(campaign.created_at)}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isPending}>
                {isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Settings className="mr-2 h-4 w-4" />}
                Manage
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href={`/brand/dashboard/campaigns/${campaign.id}/edit`} className="cursor-pointer flex items-center">
                  <Edit className="mr-2 h-4 w-4" /> Edit Campaign
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {campaign.status !== "active" ? (
                <DropdownMenuItem onClick={() => confirmStatusChange("active")} className="cursor-pointer">
                  <PlayCircle className="mr-2 h-4 w-4" /> Reactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => confirmStatusChange("completed")} className="cursor-pointer">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Completed
                </DropdownMenuItem>
              )}
              {!["cancelled", "archived"].includes(campaign.status) && (
                <DropdownMenuItem
                  onClick={() => confirmStatusChange("cancelled")}
                  className="cursor-pointer text-yellow-600 focus:bg-yellow-50 focus:text-yellow-700"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel Campaign
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => confirmStatusChange("archived")}
                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <Archive className="mr-2 h-4 w-4" /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 bg-muted/50 w-full sm:w-auto p-1 h-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="pipeline" className="py-2 px-5 flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Pipeline</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary px-1.5 py-0 h-5">
              {activeApps.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="contracts" className="py-2 px-5 flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            <span className="hidden sm:inline">Contracts</span>
            {localContracts.length > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary px-1.5 py-0 h-5">
                {localContracts.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="matches" className="py-2 px-5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="hidden sm:inline">Matches</span>
            {matches.length > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary px-1.5 py-0 h-5">
                {matches.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="details" className="py-2 px-5 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
        </TabsList>

        {/* ──────────── Tab: Pipeline ──────────────────────────────── */}
        <TabsContent value="pipeline" className="m-0">
          {activeApps.length === 0 ? (
            <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="font-medium text-foreground text-lg">No activity yet</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs text-balance">
                  {campaign.visibility === "public"
                    ? "Creators will appear here once they apply to your campaign."
                    : "Go to Matches to find and invite specific creators."}
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setActiveTab("matches")}
                >
                  <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                  Find Creators
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 items-start">
              {PIPELINE_COLUMNS.map((col) => {
                const colApps = activeApps.filter((a) =>
                  (col.statuses as readonly string[]).includes(a.status)
                );
                return (
                  <div
                    key={col.key}
                    className="bg-muted/30 rounded-xl p-4 border border-border min-h-[200px]"
                  >
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", col.dot)} />
                        {col.label}
                      </h3>
                      <Badge variant="secondary" className="h-5 px-1.5 py-0 text-xs">
                        {colApps.length}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {colApps.map((app) => (
                        <ApplicationCard
                          key={app.id}
                          app={app}
                          onClick={() => setSelectedApp(app)}
                        />
                      ))}
                      {colApps.length === 0 && (
                        <p className="text-xs text-muted-foreground/50 text-center py-6">
                          Empty
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ──────────── Tab: Contracts ─────────────────────────────── */}
        <TabsContent value="contracts" className="m-0">
          {localContracts.length === 0 ? (
            <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileSignature className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="font-medium text-foreground text-lg">No contracts yet</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs text-balance">
                  Contracts appear here after you accept a creator and define the engagement terms.
                  Go to the Pipeline tab to review applications.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setActiveTab("pipeline")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  View Pipeline
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {localContracts.map((c) => (
                <ContractCard
                  key={c.id}
                  contract={c}
                  onContractUpdate={handleContractUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ──────────── Tab: Matches ───────────────────────────────── */}
        <TabsContent value="matches" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Best Matches For This Campaign</CardTitle>
              <CardDescription>Your highest-scoring creators based on niche, budget, and platform fit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {matchingError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {matchingError}
                </div>
              )}
              {matchingNotice && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {matchingNotice}
                </div>
              )}
              {matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Sparkles className="mb-4 h-10 w-10 text-purple-400 opacity-50" />
                  <p className="font-medium text-foreground text-lg mb-1">No recommendations yet</p>
                  <p className="text-sm max-w-sm mb-6">
                    Run AI matching to rank and discover the best creators for this campaign.
                  </p>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleRunMatching}
                    disabled={isPending}
                  >
                    {isPending
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…</>
                      : <><Sparkles className="mr-2 h-4 w-4" /> Run AI Matching</>}
                  </Button>
                </div>
              ) : (
                <>
                  {matches.slice(0, 5).map((match) => {
                    const creator = match.creator;
                    const name = creator?.display_name || "Unknown Creator";
                    const score = match.score_total ? Math.round(match.score_total * 100) : 0;
                    return (
                      <div
                        key={match.id}
                        className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={creator?.profile_photo_url || ""} />
                            <AvatarFallback className="text-xs">
                              {name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{name}</p>
                            {creator?.primary_niche && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {creator.primary_niche.replace(/_/g, " ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Score {score}%</Badge>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/brand/dashboard/creators/${creator?.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center pt-2">
                    <Button variant="ghost" size="sm" onClick={handleRunMatching} disabled={isPending}>
                      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Re-run matching
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/brand/dashboard/campaigns/${campaign.id}/matches`}>
                        View all {matches.length} matches
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────── Tab: Details ───────────────────────────────── */}
        <TabsContent value="details" className="m-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Brief</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Description
                </h4>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {campaign.description}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-border">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Reach strategy
                  </h4>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {campaign.visibility === "private"
                      ? <><Lock className="h-3.5 w-3.5" /> Private outreach</>
                      : <><Globe className="h-3.5 w-3.5" /> Public campaign</>}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Target Niche
                  </h4>
                  <Badge variant="secondary" className="capitalize">
                    {campaign.primary_niche && campaign.primary_niche !== "general"
                      ? campaign.primary_niche.replace("_", " ")
                      : "Any"}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Budget (max / creator)
                  </h4>
                  <p className="text-sm font-medium">
                    {campaign.budget_per_creator_max
                      ? formatBDT(campaign.budget_per_creator_max)
                      : "Open"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Exact payment set on contract
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Min Followers
                  </h4>
                  <p className="text-sm font-medium">
                    {campaign.creator_min_followers
                      ? campaign.creator_min_followers.toLocaleString()
                      : "Any"}
                  </p>
                </div>
              </div>

              {(campaign.application_deadline || campaign.content_deadline) && (
                <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-border">
                  {campaign.application_deadline && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Application Deadline
                      </h4>
                      <p className="text-sm font-medium">{formatDate(campaign.application_deadline)}</p>
                    </div>
                  )}
                  {campaign.content_deadline && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Content Deadline
                      </h4>
                      <p className="text-sm font-medium">{formatDate(campaign.content_deadline)}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground px-1">
            Payment terms, engagement type, and clauses are defined per creator on each{" "}
            <button
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() => setActiveTab("contracts")}
            >
              Contract
            </button>
            , not on the campaign.
          </p>
        </TabsContent>
      </Tabs>

      {/* ── Status change confirmation ───────────────────────────── */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>{statusDialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleStatusChange(); }}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Application drawer ────────────────────────────────────── */}
      <ApplicationDrawer
        application={selectedApp}
        campaignId={campaign.id}
        onClose={() => setSelectedApp(null)}
        onStatusChange={handleAppStatusChange}
        onAcceptAndContract={handleAcceptAndContract}
      />

      {/* ── Contract creation modal ───────────────────────────────── */}
      {contractModalApp && (
        <ContractCreateModal
          open={!!contractModalApp}
          onClose={() => setContractModalApp(null)}
          campaignId={campaign.id}
          application={contractModalApp}
          onContractCreated={handleContractCreated}
        />
      )}
    </>
  );
}

// ── Application card (kanban cell) ──────────────────────────────────────────

function ApplicationCard({ app, onClick }: { app: Application; onClick: () => void }) {
  const creatorName = app.creator?.display_name || "Unknown Creator";
  const initials = creatorName.slice(0, 2).toUpperCase();

  return (
    <Card
      className="shadow-none hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <Avatar className="h-8 w-8 border border-border shrink-0">
            <AvatarImage
              src={`https://api.dicebear.com/9.x/initials/svg?seed=${creatorName}`}
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate leading-tight">{creatorName}</p>
            <p className="text-xs text-muted-foreground">
              {app.creator?.primary_niche?.replace(/_/g, " ") || "Creator"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <ApplicationStatusBadge status={app.status as ApplicationStatus} />
          {app.proposed_rate && (
            <span className="text-xs font-semibold text-muted-foreground">
              {formatBDT(app.proposed_rate)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
