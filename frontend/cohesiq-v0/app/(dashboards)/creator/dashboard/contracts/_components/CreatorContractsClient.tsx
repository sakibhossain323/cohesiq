"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatBDT } from "@/lib/utils";
import { submitContentDraft, publishContent } from "@/lib/api/contracts";
import { useAuth } from "@clerk/nextjs";
import type { Contract, Creator, CreatorSocialProfile } from "@/lib/types";
import {
  FileSignature, CheckCircle2, Clock, ExternalLink,
  Upload, Send, AlertCircle, Loader2, FileVideo, Package, Mic2, Eye, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { listCreatorContracts } from "@/lib/api/contracts";
import { usePolling } from "@/hooks/use-polling";
import { formatDistanceToNow } from "date-fns";

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  drafted:           { label: "Draft",            color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",           dot: "bg-gray-400" },
  active:            { label: "Active",            color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",        dot: "bg-blue-500" },
  in_production:     { label: "In Production",    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",    dot: "bg-amber-500" },
  content_submitted: { label: "Draft Submitted",  color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",dot: "bg-orange-500" },
  content_approved:  { label: "Content Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",    dot: "bg-green-500" },
  published:         { label: "Published",        color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  closed:            { label: "Closed",           color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",           dot: "bg-gray-400" },
  disputed:          { label: "Disputed",         color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",            dot: "bg-red-500" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  content_collaboration: <FileVideo className="h-3.5 w-3.5" />,
  product_seeding:       <Package className="h-3.5 w-3.5" />,
  talent_engagement:     <Mic2 className="h-3.5 w-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  content_collaboration: "Content Collaboration",
  product_seeding:       "Product Seeding",
  talent_engagement:     "Talent Engagement",
};

const SM_STEPS = ["active", "in_production", "content_submitted", "content_approved", "published", "closed"];

const ACTIVE_STATUSES = new Set(["active", "in_production", "content_submitted", "content_approved", "published"]);
const MANUAL_LIVE_URL_VALUE = "__manual__";

// ── Next-action helper (creator POV) ─────────────────────────────────────────

function nextAction(c: Contract): { label: string; urgent: boolean } | null {
  switch (c.status) {
    case "active":
    case "in_production":
      return { label: "Submit your draft content", urgent: false };
    case "content_submitted":
      return { label: "Awaiting brand review", urgent: false };
    case "content_approved":
      return { label: "Submit your live post URL", urgent: true };
    case "published":
      return { label: "Waiting for brand to close contract", urgent: false };
    case "closed":
      return { label: "Contract complete — leave a review", urgent: false };
    default:
      return null;
  }
}

function normalizeUrlForCompare(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return `${parsed.hostname.toLowerCase().replace(/^www\./, "")}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
}

function cleanHandle(handle?: string) {
  return (handle ?? "").trim().replace(/^@/, "").replace(/\/$/, "").toLowerCase();
}

function pathParts(url: string) {
  try {
    return new URL(url.trim()).pathname.split("/").filter(Boolean);
  } catch {
    return [];
  }
}

function matchesProfileUrl(liveUrl: string, profile: CreatorSocialProfile) {
  const live = normalizeUrlForCompare(liveUrl);
  const profileUrl = normalizeUrlForCompare(profile.profile_url);
  return Boolean(live && profileUrl && live.startsWith(`${profileUrl}/`));
}

function matchesConnectedProfile(liveUrl: string, profile: CreatorSocialProfile) {
  let host = "";
  try {
    host = new URL(liveUrl.trim()).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return false;
  }
  const parts = pathParts(liveUrl);
  const handle = cleanHandle(profile.handle);

  if (matchesProfileUrl(liveUrl, profile)) return true;
  if (profile.platform === "youtube") {
    if (host.includes("youtu.be") || !host.includes("youtube.com")) return false;
    return Boolean(parts[0]?.startsWith("@") && cleanHandle(parts[0]) === handle);
  }
  if (profile.platform === "instagram") {
    if (!host.includes("instagram.com")) return false;
    return Boolean(parts[0] && cleanHandle(parts[0]) === handle);
  }
  if (profile.platform === "tiktok") {
    if (!host.includes("tiktok.com")) return false;
    return Boolean(parts[0] && cleanHandle(parts[0]) === handle);
  }
  return matchesProfileUrl(liveUrl, profile);
}

function verifyLiveUrlForCreator(liveUrl: string, creator: Creator | null) {
  const normalized = normalizeUrlForCompare(liveUrl);
  if (!normalized) return "Enter a valid http(s) live post URL.";
  if (!creator) return "Could not load your creator profile. Refresh and try again.";

  if (creator.portfolio_items.some(item => normalizeUrlForCompare(item.content_url) === normalized)) {
    return null;
  }
  if (creator.social_profiles.some(profile => matchesConnectedProfile(liveUrl, profile))) {
    return null;
  }
  return "This link does not match your synced content or connected platform profiles.";
}

// ── Contract card (creator POV) ──────────────────────────────────────────────

function CreatorContractCard({
  contract,
  creator,
  onUpdate,
}: {
  contract: Contract;
  creator: Creator | null;
  onUpdate: (c: Contract) => void;
}) {
  const { getToken } = useAuth();
  const [draftUrl, setDraftUrl] = useState(contract.draft_content_url ?? "");
  const [liveUrl, setLiveUrl] = useState(contract.live_post_url ?? "");
  const [selectedContentUrl, setSelectedContentUrl] = useState<string>(MANUAL_LIVE_URL_VALUE);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const status = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.active;
  const currentStepIdx = SM_STEPS.indexOf(contract.status);
  const action = nextAction(contract);

  const doAction = async (fn: () => Promise<Contract>) => {
    setError(null);
    setIsPending(true);
    try {
      const updated = await fn();
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!draftUrl.trim()) { setError("Please enter the draft content URL."); return; }
    const token = await getToken();
    if (!token) return;
    doAction(() => submitContentDraft(contract.id, draftUrl.trim(), token));
  };

  const handlePublish = async () => {
    if (!liveUrl.trim()) { setError("Please enter the live post URL."); return; }
    const verificationError = verifyLiveUrlForCreator(liveUrl.trim(), creator);
    if (verificationError) { setError(verificationError); return; }
    const token = await getToken();
    if (!token) return;
    doAction(() => publishContent(contract.id, liveUrl.trim(), token));
  };

  const canSubmitDraft = contract.status === "active" || contract.status === "in_production";
  const canPublish = contract.status === "content_approved";
  const syncedContent = creator?.portfolio_items ?? [];

  return (
    <Card
      className={cn(
        "transition-shadow",
        (canSubmitDraft || canPublish) && "ring-2 ring-primary/20 border-primary/30"
      )}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div
          className="p-4 cursor-pointer select-none"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {/* Brand + campaign line */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                    status.color
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                  {status.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
                  {TYPE_ICONS[contract.contract_type]}
                  {TYPE_LABELS[contract.contract_type] ?? contract.contract_type}
                </span>
              </div>

              {/* What to do next */}
              {action && (
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm mt-1.5",
                    action.urgent ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {action.urgent
                    ? <Send className="h-3.5 w-3.5 shrink-0" />
                    : <Clock className="h-3.5 w-3.5 shrink-0" />}
                  {action.label}
                </div>
              )}

              {/* Clause summary */}
              <p className="text-xs text-muted-foreground mt-1">
                {contract.payment_structure === "flat_fee" && contract.payment_amount_bdt
                  ? `${formatBDT(contract.payment_amount_bdt)} · ${contract.max_revision_rounds} revisions`
                  : `No payment · ${contract.max_revision_rounds} revision${contract.max_revision_rounds !== 1 ? "s" : ""}`}
                {contract.exclusivity_days ? ` · ${contract.exclusivity_days}d exclusivity` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* State machine progress */}
        <div className="px-4 pb-3">
          <div className="relative flex items-center">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-border" />
            {SM_STEPS.map((step, idx) => {
              const done = idx < currentStepIdx;
              const current = idx === currentStepIdx;
              return (
                <div key={step} className="relative flex-1 flex justify-center">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full border-2 z-10 transition-colors",
                      done    ? "bg-primary border-primary" :
                      current ? "bg-background border-primary ring-2 ring-primary/30" :
                                "bg-background border-border"
                    )}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex mt-1">
            {SM_STEPS.map((step, idx) => (
              <div key={step} className="flex-1 text-center">
                <p className={cn(
                  "text-[9px] leading-tight",
                  idx === currentStepIdx ? "text-primary font-semibold" :
                  idx < currentStepIdx  ? "text-muted-foreground" :
                                         "text-muted-foreground/40"
                )}>
                  {step === "content_submitted" ? "Submitted" :
                   step === "content_approved"  ? "Approved"  :
                   step === "in_production"     ? "Working"   :
                   step.charAt(0).toUpperCase() + step.slice(1)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Primary action area (always visible) */}
        <div className="px-4 pb-4 space-y-2">
          {canSubmitDraft && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Submit Draft Content
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://drive.google.com/... or YouTube draft link"
                  value={draftUrl}
                  onChange={(e) => setDraftUrl(e.target.value)}
                  className="flex-1 h-8 text-sm"
                />
                <Button size="sm" className="h-8 shrink-0" onClick={handleSubmitDraft} disabled={isPending}>
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          )}

          {canPublish && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Select verified live content
              </Label>
              {syncedContent.length > 0 && (
                <Select
                  value={selectedContentUrl}
                  onValueChange={(value) => {
                    setSelectedContentUrl(value);
                    if (value !== MANUAL_LIVE_URL_VALUE) {
                      setLiveUrl(value);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 bg-background text-sm">
                    <SelectValue placeholder="Choose synced content" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MANUAL_LIVE_URL_VALUE}>Paste a verified link manually</SelectItem>
                    {syncedContent.map(item => (
                      <SelectItem key={item.id} value={item.content_url}>
                        {item.title || item.content_url}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Use synced content, or paste a URL from your connected profile"
                  value={liveUrl}
                  onChange={(e) => {
                    setSelectedContentUrl(MANUAL_LIVE_URL_VALUE);
                    setLiveUrl(e.target.value);
                  }}
                  className="flex-1 h-8 text-sm"
                />
                <Button size="sm" className="h-8 shrink-0" onClick={handlePublish} disabled={isPending}>
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] leading-4 text-muted-foreground">
                Manual links must match your connected profile URL or handle. Short links are accepted only when already synced as content.
              </p>
            </div>
          )}

          {contract.status === "content_submitted" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Draft submitted — the brand is reviewing your content
              {contract.draft_content_url && (
                <a href={contract.draft_content_url} target="_blank" rel="noreferrer" className="ml-auto text-primary hover:underline flex items-center gap-1">
                  <Eye className="h-3 w-3" /> View
                </a>
              )}
            </div>
          )}

          {contract.status === "published" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Content published — waiting for brand to close the contract
              {contract.live_post_url && (
                <a href={contract.live_post_url} target="_blank" rel="noreferrer" className="ml-auto text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> View post
                </a>
              )}
            </div>
          )}

          {contract.status === "closed" && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/20 rounded-md px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Contract completed
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Expandable clause detail */}
        {expanded && (
          <>
            <Separator />
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Payment</p>
                <p className="font-medium">
                  {contract.payment_structure === "flat_fee" && contract.payment_amount_bdt
                    ? `${formatBDT(contract.payment_amount_bdt)} · ${contract.payment_schedule?.replace(/_/g, " ") ?? ""}`
                    : "No payment"}
                </p>
              </div>
              {contract.platform_fee_percentage && contract.payment_amount_bdt && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">You receive</p>
                  <p className="font-medium text-green-600">
                    {formatBDT(Math.round(contract.payment_amount_bdt * (1 - contract.platform_fee_percentage / 100)))}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Revisions used</p>
                <p className="font-medium">{contract.revisions_used} / {contract.max_revision_rounds}</p>
              </div>
              {contract.exclusivity_days && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Exclusivity</p>
                  <p className="font-medium">{contract.exclusivity_days} days</p>
                </div>
              )}
              {contract.has_product_transfer && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Product</p>
                  <p className="font-medium">{contract.product_disposition === "keep" ? "Yours to keep" : "Return to brand"}</p>
                </div>
              )}
              {contract.deliverable_notes && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Deliverables</p>
                  <p className="text-sm bg-muted/40 rounded p-2">{contract.deliverable_notes}</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page client ──────────────────────────────────────────────────────────────

export function CreatorContractsClient({ contracts, creator }: { contracts: Contract[]; creator: Creator | null }) {
  const { getToken } = useAuth();
  const [localContracts, setLocalContracts] = useState<Contract[]>(contracts);

  const fetchContracts = async () => {
    const token = await getToken();
    if (!token) return;
    const data = await listCreatorContracts(token);
    setLocalContracts(data);
  };

  const { lastUpdated, isRefreshing, refresh } = usePolling(fetchContracts, 30_000);

  const handleUpdate = (updated: Contract) => {
    setLocalContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const active = localContracts.filter((c) => ACTIVE_STATUSES.has(c.status));
  const completed = localContracts.filter((c) => c.status === "closed");

  if (localContracts.length === 0) {
    return (
      <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <FileSignature className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium text-foreground text-lg">No contracts yet</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs text-balance">
            Contracts appear here once a brand accepts your application and sets the engagement terms.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/creator/dashboard/collaborations">View Applications</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            title="Refresh"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 h-auto w-full sm:w-auto">
        <TabsTrigger value="active" className="py-2 px-5 flex items-center gap-2">
          Active
          {active.length > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary h-5 px-1.5 py-0 text-xs">
              {active.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed" className="py-2 px-5 flex items-center gap-2">
          Completed
          {completed.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 py-0 text-xs">
              {completed.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="m-0">
        {active.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-medium text-foreground">No active contracts</p>
              <p className="mt-1 text-sm text-muted-foreground">All your contracts are completed.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {active.map((c) => (
              <CreatorContractCard key={c.id} contract={c} creator={creator} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed" className="m-0">
        {completed.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-sm text-muted-foreground">No completed contracts yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {completed.map((c) => (
              <CreatorContractCard key={c.id} contract={c} creator={creator} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
    </div>
  );
}
