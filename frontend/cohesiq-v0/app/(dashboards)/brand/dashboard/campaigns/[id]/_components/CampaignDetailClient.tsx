"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronRight, RefreshCw, BookmarkPlus,
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
import type { Campaign, Application, AIMatchScore, ApplicationStatus, Contract, CampaignLiveAnalytics } from "@/lib/types";
import {
  updateCampaignStatusAction, runMatchingAction,
  acceptOfferAction, negotiateAction, declineOfferAction,
  shortlistAction, updateApplicationStatusAction,
} from "../_actions/campaign-actions";
import { useToast } from "@/hooks/use-toast";
import { ApplicationDrawer } from "./ApplicationDrawer";
import { CampaignAnalyticsTab } from "./CampaignAnalyticsTab";
import { OfferModal } from "./OfferModal";
import { ContractCard } from "./ContractCard";
import { NegotiationDrawer, type NegotiationActions } from "@/components/negotiation/NegotiationDrawer";

interface CampaignDetailClientProps {
  campaign: Campaign;
  applications: Application[];
  initialMatches: AIMatchScore[];
  initialContracts: Contract[];
  initialLiveAnalytics: CampaignLiveAnalytics | null;
}

const PIPELINE_COLUMNS = [
  { key: "shortlist",   label: "Shortlist",   dot: "bd-kanban-dot-shortlisted", statuses: ["shortlisted"] as ApplicationStatus[],                       muted: false },
  { key: "offered",     label: "Offered",     dot: "bd-kanban-dot-invited",     statuses: ["invited"] as ApplicationStatus[],                            muted: false },
  { key: "negotiating", label: "Negotiating", dot: "bd-kanban-dot-pending",     statuses: ["pending_agreement"] as ApplicationStatus[],                  muted: false },
  { key: "declined",    label: "Declined",    dot: "bd-kanban-dot-declined",    statuses: ["rejected", "declined", "withdrawn"] as ApplicationStatus[],  muted: true },
];

// Lanes where clicking a card opens the negotiation thread rather than the shortlist/declined drawer.
const NEGOTIATION_STATUSES: ApplicationStatus[] = ["invited", "pending_agreement"];

export function CampaignDetailClient({
  campaign,
  applications,
  initialMatches,
  initialContracts,
  initialLiveAnalytics,
}: CampaignDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [matches, setMatches] = useState<AIMatchScore[]>(initialMatches);
  const [localApplications, setLocalApplications] = useState<Application[]>(applications);
  const [localContracts, setLocalContracts] = useState<Contract[]>(initialContracts);
  const [liveAnalytics, setLiveAnalytics] = useState<CampaignLiveAnalytics | null>(initialLiveAnalytics);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [offerModalApp, setOfferModalApp] = useState<Application | null>(null);
  const [negotiationApp, setNegotiationApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [isPending, startTransition] = useTransition();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"active" | "cancelled" | "completed" | "archived" | null>(null);
  const [statusDialogMessage, setStatusDialogMessage] = useState("");
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [matchingNotice, setMatchingNotice] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const setProcessing = (id: string, on: boolean) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const campaignActive = campaign.status === "active";
  const isDraft = campaign.status === "draft";

  const upsertApplication = (updated: Application) => {
    setLocalApplications((prev) =>
      prev.some((a) => a.id === updated.id)
        ? prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
        : [updated, ...prev]
    );
  };

  const handleAppStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
    setLocalApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
    );
    setSelectedApp((prev) =>
      prev?.id === applicationId ? { ...prev, status: newStatus } : prev
    );
  };

  const handleCardClick = (app: Application) => {
    if (NEGOTIATION_STATUSES.includes(app.status)) {
      setNegotiationApp(app);
    } else {
      setSelectedApp(app);
    }
  };

  const handleSendOffer = (app: Application) => {
    setSelectedApp(null);
    setOfferModalApp(app);
  };

  const handleOffered = (updated: Application) => {
    upsertApplication(updated);
    setOfferModalApp(null);
  };

  const handleNegotiationResult = (updated: Application) => {
    upsertApplication(updated);
    setNegotiationApp(null);
    // A freshly accepted offer produces a new active contract — pull it in.
    if (updated.status === "accepted") router.refresh();
  };

  const brandNegotiationActions: NegotiationActions = {
    accept: acceptOfferAction,
    counter: negotiateAction,
    decline: declineOfferAction,
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
      active:    isDraft
        ? "Launch this campaign? It goes live — creators can apply and you can start sending offers."
        : "Reactivate this campaign?",
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

  // Candidates kanban: brand-curated pipeline only (excludes public applicants and accepted/completed).
  const candidateApps = localApplications.filter(
    (a) => !["pending", "accepted", "completed"].includes(a.status)
  );
  // Active pipeline count (excludes declined/rejected/withdrawn) for tab badge.
  const activeCandidateCount = candidateApps.filter(
    (a) => !["rejected", "declined", "withdrawn"].includes(a.status)
  ).length;
  // Discover tab: creator-initiated applications awaiting brand review.
  const applicantApps = localApplications.filter((a) => a.status === "pending");

  const handleShortlistApplicant = (app: Application) => {
    if (!app.creator?.id) return;
    setProcessing(app.id, true);
    shortlistAction(campaign.id, app.creator.id).then((result) => {
      setProcessing(app.id, false);
      if (result.success && result.application) {
        upsertApplication(result.application);
        toast({ title: "Added to Shortlist" });
      } else {
        toast({ title: "Failed to shortlist", description: (result as any).error, variant: "destructive" });
      }
    });
  };

  const handleDeclineApplicant = (app: Application) => {
    setProcessing(app.id, true);
    updateApplicationStatusAction(app.id, "rejected", campaign.id).then((result) => {
      setProcessing(app.id, false);
      if (result.success) {
        handleAppStatusChange(app.id, "rejected");
        toast({ title: "Applicant declined" });
      } else {
        toast({ title: "Failed to decline", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleReShortlist = (app: Application) => {
    if (!app.creator?.id) return;
    startTransition(async () => {
      const result = await shortlistAction(campaign.id, app.creator!.id);
      if (result.success && result.application) {
        upsertApplication(result.application);
        setSelectedApp(null);
        toast({ title: "Re-added to Shortlist" });
      } else {
        toast({ title: "Failed to re-shortlist", description: (result as any).error, variant: "destructive" });
      }
    });
  };

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
            {isDraft && (
              <Button onClick={() => confirmStatusChange("active")} disabled={isPending}>
                {isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <PlayCircle className="mr-2 h-4 w-4" />}
                Launch Campaign
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              title="Refresh"
              onClick={() => router.refresh()}
              disabled={isPending}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
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
                {campaign.status === "active" && (
                  <DropdownMenuItem onClick={() => confirmStatusChange("completed")} className="cursor-pointer">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Completed
                  </DropdownMenuItem>
                )}
                {!isDraft && campaign.status !== "active" && (
                  <DropdownMenuItem onClick={() => confirmStatusChange("active")} className="cursor-pointer">
                    <PlayCircle className="mr-2 h-4 w-4" /> Reactivate
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
            <span className="hidden sm:inline">Candidates</span>
            {activeCandidateCount > 0 && (
              <Badge variant="secondary" className="bg-brand-soft text-brand px-1.5 py-0 h-5">
                {activeCandidateCount}
              </Badge>
            )}
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
            <span className="hidden sm:inline">Discover</span>
            {(matches.length > 0 || applicantApps.length > 0) && (
              <Badge variant="secondary" className="bg-brand-soft text-brand px-1.5 py-0 h-5">
                {matches.length + applicantApps.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="details" className="py-2 px-4 flex items-center gap-2 rounded-lg">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* ──────────── Tab: Candidates ────────────────────────── */}
        <TabsContent value="pipeline" className="m-0">
          {candidateApps.length === 0 ? (
            <div className="bd-section">
              <div className="bd-empty">
                <div className="bd-empty-icon"><Users className="h-6 w-6" /></div>
                <p className="bd-empty-title">No candidates yet</p>
                <p className="bd-empty-desc">
                  Shortlist creators from the Discover tab or the Find Creators page
                  {campaign.visibility === "public" ? ". Public applicants appear in Discover for review." : "."}{" "}
                  Then send a contract offer once the campaign is launched.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("matches")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Go to Discover
                </Button>
              </div>
            </div>
          ) : (
            <div className="bd-kanban">
              {PIPELINE_COLUMNS.map((col) => {
                const colApps = candidateApps.filter((a) =>
                  (col.statuses as string[]).includes(a.status)
                );
                return (
                  <div key={col.key} className={cn("bd-kanban-col", col.muted && "opacity-60")}>
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
                        <ApplicationCard key={app.id} app={app} onClick={() => handleCardClick(app)} />
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
                  View Candidates
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

        {/* ──────────── Tab: Discover ──────────────────────────── */}
        <TabsContent value="matches" className="m-0 space-y-6">
          <div className="bd-section">
            <div className="bd-section-head">
              <div>
                <span className="bd-section-title">AI Matches</span>
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

          {/* Applicants review queue — only for public campaigns with pending apps */}
          {campaign.visibility === "public" && applicantApps.length > 0 && (
            <div className="bd-section">
              <div className="bd-section-head">
                <div>
                  <span className="bd-section-title">Applications ({applicantApps.length})</span>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Creators who applied to your campaign. Shortlist promising ones or decline the rest.
                  </p>
                </div>
              </div>
              <div className="bd-section-body space-y-2">
                {applicantApps.map((app) => {
                  const name = app.creator?.display_name || "Unknown Creator";
                  const isProcessing = processingIds.has(app.id);
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border p-3 hover:border-brand/20 hover:bg-surface-subtle transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${name}`} />
                          <AvatarFallback className="text-xs bg-brand-soft text-brand font-semibold">
                            {getAvatarInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold font-display truncate">{name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {app.creator?.primary_niche?.replace(/_/g, " ") || "Creator"}
                            {app.proposed_rate ? ` · ${formatBDT(app.proposed_rate)}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isProcessing}
                          onClick={() => handleShortlistApplicant(app)}
                        >
                          {isProcessing
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <BookmarkPlus className="h-3.5 w-3.5" />}
                          <span className="ml-1.5 hidden sm:inline">Shortlist</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={isProcessing}
                          onClick={() => handleDeclineApplicant(app)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span className="ml-1.5 hidden sm:inline">Decline</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

          <CampaignAnalyticsTab
            campaign={campaign}
            contracts={localContracts}
            initialAnalytics={liveAnalytics}
            onAnalyticsUpdate={setLiveAnalytics}
          />

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

      {/* ── Shortlist / applicant drawer ──────────────────────── */}
      <ApplicationDrawer
        application={selectedApp}
        campaignId={campaign.id}
        campaignActive={campaignActive}
        onClose={() => setSelectedApp(null)}
        onStatusChange={handleAppStatusChange}
        onSendOffer={handleSendOffer}
        onReShortlist={handleReShortlist}
      />

      {/* ── Offer modal (contract terms sent with the offer) ──── */}
      {offerModalApp && (
        <OfferModal
          open={!!offerModalApp}
          onClose={() => setOfferModalApp(null)}
          campaign={campaign}
          application={offerModalApp}
          onOffered={handleOffered}
        />
      )}

      {/* ── Negotiation drawer (offered / negotiating / accepted) ─ */}
      {negotiationApp && (
        <NegotiationDrawer
          open={!!negotiationApp}
          onClose={() => setNegotiationApp(null)}
          campaignId={campaign.id}
          application={negotiationApp}
          viewerRole="brand"
          counterpartyName={negotiationApp.creator?.display_name || "Creator"}
          actions={brandNegotiationActions}
          onResult={handleNegotiationResult}
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
        <div className="min-w-0 flex-1">
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
