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
  ChevronRight,
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
import { getAvatarInitials } from "@/lib/avatar";
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

const PIPELINE_COLUMNS = [
  { key: "invited",     label: "Invited",       dot: "bd-kanban-dot-invited",     statuses: ["invited"] as ApplicationStatus[] },
  { key: "pending",     label: "Needs Review",  dot: "bd-kanban-dot-pending",     statuses: ["pending"] as ApplicationStatus[] },
  { key: "shortlisted", label: "Shortlisted",   dot: "bd-kanban-dot-shortlisted", statuses: ["shortlisted"] as ApplicationStatus[] },
  { key: "accepted",    label: "Accepted",      dot: "bd-kanban-dot-accepted",    statuses: ["accepted", "completed"] as ApplicationStatus[] },
] as const;

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

  return (
    <>
      {/* ── Page header ──────────────────────────────────────── */}
      <header className="bd-header" style={{ marginBottom: "var(--space-8)" }}>
        <div className="bd-header-inner">
          <div style={{ flex: 1 }}>
            <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
              <Link href="/brand/dashboard/campaigns">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaigns
              </Link>
            </Button>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <CampaignStatusBadge status={campaign.status} />
              <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded-full px-3 py-1">
                {campaign.visibility === "private"
                  ? <><Lock className="h-3 w-3" /> Private</>
                  : <><Globe className="h-3 w-3" /> Public</>}
              </span>
              {campaign.brand_category && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded-full px-3 py-1">
                  {getBrandCategoryLabel(campaign.brand_category)}
                </span>
              )}
            </div>
            <h1 className="bd-header-title">{campaign.title}</h1>
            {campaign.created_at && (
              <p className="bd-header-sub">Created {formatDate(campaign.created_at)}</p>
            )}
          </div>

          <div className="bd-header-actions">
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
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancel Campaign
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => confirmStatusChange("archived")}
                  className="cursor-pointer text-muted-foreground"
                >
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 bg-surface-subtle border border-border w-full sm:w-auto p-1 h-auto grid grid-cols-4 sm:flex rounded-xl">
          <TabsTrigger value="pipeline" className="py-2 px-4 flex items-center gap-2 rounded-lg">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Pipeline</span>
            <Badge variant="secondary" className="bg-brand-soft text-brand px-1.5 py-0 h-5">
              {activeApps.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="contracts" className="py-2 px-4 flex items-center gap-2 rounded-lg">
            <FileSignature className="h-4 w-4" />
            <span className="hidden sm:inline">Contracts</span>
            {localContracts.length > 0 && (
              <Badge variant="secondary" className="bg-brand-soft text-brand px-1.5 py-0 h-5">
                {localContracts.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="matches" className="py-2 px-4 flex items-center gap-2 rounded-lg">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Matches</span>
            {matches.length > 0 && (
              <Badge variant="secondary" className="bg-brand-soft text-brand px-1.5 py-0 h-5">
                {matches.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="details" className="py-2 px-4 flex items-center gap-2 rounded-lg">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
        </TabsList>

        {/* ──────────── Tab: Pipeline ──────────────────────────── */}
        <TabsContent value="pipeline" className="m-0">
          {activeApps.length === 0 ? (
            <div className="bd-section">
              <div className="bd-empty">
                <div className="bd-empty-icon"><Users className="h-6 w-6" /></div>
                <p className="bd-empty-title">No activity yet</p>
                <p className="bd-empty-desc">
                  {campaign.visibility === "public"
                    ? "Creators will appear here once they apply to your campaign."
                    : "Go to Matches to find and invite specific creators."}
                </p>
                <Button variant="outline" onClick={() => setActiveTab("matches")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Find Creators
                </Button>
              </div>
            </div>
          ) : (
            <div className="bd-kanban">
              {PIPELINE_COLUMNS.map((col) => {
                const colApps = activeApps.filter((a) =>
                  (col.statuses as readonly string[]).includes(a.status)
                );
                return (
                  <div key={col.key} className="bd-kanban-col">
                    <div className="bd-kanban-head">
                      <span className="bd-kanban-label">
                        <span className={cn("bd-kanban-dot", col.dot)} />
                        {col.label}
                      </span>
                      <Badge variant="secondary" className="h-5 px-1.5 py-0 text-xs bg-background">
                        {colApps.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {colApps.map((app) => (
                        <ApplicationCard key={app.id} app={app} onClick={() => setSelectedApp(app)} />
                      ))}
                      {colApps.length === 0 && (
                        <p className="text-xs text-muted-foreground/50 text-center py-6">Empty</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ──────────── Tab: Contracts ─────────────────────────── */}
        <TabsContent value="contracts" className="m-0">
          {localContracts.length === 0 ? (
            <div className="bd-section">
              <div className="bd-empty">
                <div className="bd-empty-icon"><FileSignature className="h-6 w-6" /></div>
                <p className="bd-empty-title">No contracts yet</p>
                <p className="bd-empty-desc">
                  Contracts appear after you accept a creator and define engagement terms.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("pipeline")}>
                  <Users className="mr-2 h-4 w-4" />
                  View Pipeline
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {localContracts.map((c) => (
                <ContractCard key={c.id} contract={c} onContractUpdate={handleContractUpdate} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ──────────── Tab: Matches ───────────────────────────── */}
        <TabsContent value="matches" className="m-0">
          <div className="bd-section">
            <div className="bd-section-head">
              <div>
                <span className="bd-section-title">Best Matches</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Highest-scoring creators based on niche, budget, and platform fit.
                </p>
              </div>
              {matches.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleRunMatching} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Re-run
                </Button>
              )}
            </div>
            <div className="bd-section-body space-y-3">
              {matchingError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {matchingError}
                </div>
              )}
              {matchingNotice && (
                <div className="rounded-xl border border-brand/20 bg-brand-soft/40 px-4 py-3 text-sm text-brand">
                  {matchingNotice}
                </div>
              )}
              {matches.length === 0 ? (
                <div className="bd-empty" style={{ paddingBlock: "var(--space-10)" }}>
                  <div className="bd-empty-icon"><Sparkles className="h-6 w-6" /></div>
                  <p className="bd-empty-title">No recommendations yet</p>
                  <p className="bd-empty-desc">
                    Run AI matching to rank and discover the best creators for this campaign.
                  </p>
                  <Button onClick={handleRunMatching} disabled={isPending}>
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
                        className="flex items-center justify-between gap-4 rounded-xl border border-border p-3 hover:border-brand/30 hover:bg-surface-subtle transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={creator?.profile_photo_url || ""} />
                            <AvatarFallback className="text-xs bg-brand-soft text-brand font-semibold">
                              {getAvatarInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold font-display">{name}</p>
                            {creator?.primary_niche && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {creator.primary_niche.replace(/_/g, " ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bd-status bd-status-active">Score {score}%</span>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/brand/dashboard/creators/${creator?.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-end items-center pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/brand/dashboard/campaigns/${campaign.id}/matches`}>
                        View all {matches.length} matches
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ──────────── Tab: Details ───────────────────────────── */}
        <TabsContent value="details" className="m-0 space-y-4">
          <div className="bd-section">
            <div className="bd-section-head">
              <span className="bd-section-title">Campaign Brief</span>
            </div>
            <div className="bd-section-body space-y-6">
              <div>
                <h4 className="eyebrow mb-3">Description</h4>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {campaign.description}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-border">
                <div>
                  <h4 className="eyebrow mb-2" style={{ fontSize: "var(--text-xs)" }}>Reach Strategy</h4>
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    {campaign.visibility === "private"
                      ? <><Lock className="h-3.5 w-3.5" /> Private</>
                      : <><Globe className="h-3.5 w-3.5" /> Public</>}
                  </div>
                </div>
                <div>
                  <h4 className="eyebrow mb-2" style={{ fontSize: "var(--text-xs)" }}>Target Niche</h4>
                  <span className="bd-status bd-status-active capitalize">
                    {campaign.primary_niche && campaign.primary_niche !== "general"
                      ? campaign.primary_niche.replace("_", " ")
                      : "Any"}
                  </span>
                </div>
                <div>
                  <h4 className="eyebrow mb-2" style={{ fontSize: "var(--text-xs)" }}>Budget / Creator</h4>
                  <p className="text-sm font-semibold">
                    {campaign.budget_per_creator_max ? formatBDT(campaign.budget_per_creator_max) : "Open"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Exact payment set on contract</p>
                </div>
                <div>
                  <h4 className="eyebrow mb-2" style={{ fontSize: "var(--text-xs)" }}>Min Followers</h4>
                  <p className="text-sm font-semibold">
                    {campaign.creator_min_followers ? campaign.creator_min_followers.toLocaleString() : "Any"}
                  </p>
                </div>
              </div>

              {(campaign.application_deadline || campaign.content_deadline) && (
                <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-border">
                  {campaign.application_deadline && (
                    <div>
                      <h4 className="eyebrow mb-2" style={{ fontSize: "var(--text-xs)" }}>Application Deadline</h4>
                      <p className="text-sm font-semibold">{formatDate(campaign.application_deadline)}</p>
                    </div>
                  )}
                  {campaign.content_deadline && (
                    <div>
                      <h4 className="eyebrow mb-2" style={{ fontSize: "var(--text-xs)" }}>Content Deadline</h4>
                      <p className="text-sm font-semibold">{formatDate(campaign.content_deadline)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <CampaignAnalyticsTab campaign={campaign} />

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

      {/* ── Status change confirmation ───────────────────────── */}
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

      {/* ── Application drawer ────────────────────────────────── */}
      <ApplicationDrawer
        application={selectedApp}
        campaignId={campaign.id}
        onClose={() => setSelectedApp(null)}
        onStatusChange={handleAppStatusChange}
        onAcceptAndContract={handleAcceptAndContract}
      />

      {/* ── Contract creation modal ───────────────────────────── */}
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
  const initials = getAvatarInitials(creatorName);

  return (
    <div
      className="bg-surface-elevated rounded-xl border border-border p-3 cursor-pointer hover:border-brand/40 hover:shadow-sm transition-all"
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <Avatar className="h-8 w-8 border border-border shrink-0">
          <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${creatorName}`} />
          <AvatarFallback className="text-xs bg-brand-soft text-brand">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate leading-tight font-display">{creatorName}</p>
          <p className="text-xs text-muted-foreground capitalize">
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
  );
}
