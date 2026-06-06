"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn, formatBDT } from "@/lib/utils";
import {
  approveContent, closeContract, requestRevision,
} from "@/lib/api/contracts";
import { useAuth } from "@clerk/nextjs";
import type { Contract } from "@/lib/types";
import {
  ChevronDown, ChevronUp, CheckCircle2, RotateCcw, XCircle,
  ExternalLink, AlertCircle, Loader2, FileVideo, Package, Mic2,
  Clock, Eye,
} from "lucide-react";

// ── Status display ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  drafted:          { label: "Draft",            color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",           dot: "bg-gray-400" },
  active:           { label: "Active",           color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",        dot: "bg-blue-500" },
  in_production:    { label: "In Production",    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",    dot: "bg-amber-500" },
  content_submitted:{ label: "Draft Submitted",  color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",dot: "bg-orange-500" },
  content_approved: { label: "Content Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",    dot: "bg-green-500" },
  published:        { label: "Published",        color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  closed:           { label: "Closed",           color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",           dot: "bg-gray-400" },
  disputed:         { label: "Disputed",         color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",            dot: "bg-red-500" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  content_collaboration: <FileVideo className="h-3.5 w-3.5" />,
  product_seeding:       <Package className="h-3.5 w-3.5" />,
  talent_engagement:     <Mic2 className="h-3.5 w-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  content_collaboration: "Content Collab",
  product_seeding:       "Product Seeding",
  talent_engagement:     "Talent Engagement",
};

// State machine steps (in order) — disputed is an off-rail state
const SM_STEPS = ["active", "in_production", "content_submitted", "content_approved", "published", "closed"];

// ── Clause summary helper ───────────────────────────────────────────────────

function clauseSummary(c: Contract): string {
  const parts: string[] = [];
  if (c.payment_structure === "flat_fee" && c.payment_amount_bdt) {
    parts.push(formatBDT(c.payment_amount_bdt));
  } else if (c.has_product_transfer) {
    parts.push(c.product_disposition === "keep" ? "Product: keep" : "Product: return");
  } else {
    parts.push("No payment");
  }
  parts.push(`${c.max_revision_rounds} revision${c.max_revision_rounds !== 1 ? "s" : ""}`);
  if (c.exclusivity_days) parts.push(`${c.exclusivity_days}d exclusivity`);
  return parts.join(" · ");
}

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  contract: Contract;
  onContractUpdate: (updated: Contract) => void;
}

export function ContractCard({ contract, onContractUpdate }: Props) {
  const { getToken } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.active;
  const currentStepIdx = SM_STEPS.indexOf(contract.status);

  const doAction = async (fn: (id: string, token: string) => Promise<Contract>) => {
    setError(null);
    setIsPending(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const updated = await fn(contract.id, token);
      onContractUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsPending(false);
    }
  };

  // Creator name from nested application data isn't available here,
  // so we show contract.creator_id as fallback. Parent should enrich if needed.
  const creatorLabel = `Creator ${contract.creator_id.slice(0, 6)}…`;

  return (
    <Card
      className={cn(
        "transition-shadow",
        contract.status === "content_submitted" && "ring-2 ring-orange-400/50 border-orange-200 dark:border-orange-800"
      )}
    >
      <CardContent className="p-0">
        {/* ── Card header ──────────────────────────────────────────── */}
        <div
          className="flex items-start gap-3 p-4 cursor-pointer select-none"
          onClick={() => setExpanded((v) => !v)}
        >
          <Avatar className="h-10 w-10 border border-border shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs bg-muted">
              {creatorLabel.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-foreground truncate">{creatorLabel}</p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                  status.color
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
                {TYPE_ICONS[contract.contract_type]}
                {TYPE_LABELS[contract.contract_type] ?? contract.contract_type}
              </span>
              <span className="text-xs text-muted-foreground">{clauseSummary(contract)}</span>
            </div>
          </div>

          <button className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* ── State machine progress bar ───────────────────────────── */}
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
                <p
                  className={cn(
                    "text-[9px] leading-tight",
                    idx === currentStepIdx
                      ? "text-primary font-semibold"
                      : idx < currentStepIdx
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40"
                  )}
                >
                  {step === "content_submitted" ? "Submitted" :
                   step === "content_approved"  ? "Approved"  :
                   step === "in_production"     ? "Working"   :
                   step.charAt(0).toUpperCase() + step.slice(1)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Inline action (visible without expanding) ──────────────── */}
        {!expanded && (
          <div className="px-4 pb-4">
            {contract.status === "content_submitted" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={isPending}
                  onClick={(e) => { e.stopPropagation(); doAction(approveContent); }}
                >
                  {isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                  Approve Draft
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending || contract.revisions_used >= contract.max_revision_rounds}
                  onClick={(e) => { e.stopPropagation(); doAction(requestRevision); }}
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  <span className="ml-1.5 text-xs">
                    Revise ({contract.revisions_used}/{contract.max_revision_rounds})
                  </span>
                </Button>
              </div>
            )}
            {contract.status === "published" && (
              <Button
                size="sm"
                className="w-full"
                variant="outline"
                disabled={isPending}
                onClick={(e) => { e.stopPropagation(); doAction(closeContract); }}
              >
                {isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-green-600" />}
                Close Contract
              </Button>
            )}
            {(contract.status === "active" || contract.status === "in_production") && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                <Clock className="h-3.5 w-3.5" />
                {contract.status === "active"
                  ? "Waiting for creator to start production"
                  : "Creator is working on the deliverables"}
              </div>
            )}
            {contract.status === "content_approved" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                <Clock className="h-3.5 w-3.5" />
                Content approved — waiting for creator to publish
              </div>
            )}
            {contract.status === "closed" && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-950/20 rounded-md px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Contract completed
              </div>
            )}
          </div>
        )}

        {/* ── Expanded detail ─────────────────────────────────────── */}
        {expanded && (
          <>
            <Separator />
            <div className="p-4 space-y-4">
              {/* Clause breakdown */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <ClauseItem label="Payment">
                  {contract.payment_structure === "flat_fee" && contract.payment_amount_bdt
                    ? `${formatBDT(contract.payment_amount_bdt)} · ${contract.payment_schedule?.replace(/_/g, " ") ?? ""}`
                    : "No payment"}
                </ClauseItem>

                {contract.has_product_transfer && (
                  <ClauseItem label="Product">
                    {contract.product_disposition === "keep" ? "Creator keeps it" : "Return to brand"}
                  </ClauseItem>
                )}

                <ClauseItem label="Revisions">
                  {contract.revisions_used} / {contract.max_revision_rounds} used
                </ClauseItem>

                {contract.exclusivity_days && (
                  <ClauseItem label="Exclusivity">{contract.exclusivity_days} days</ClauseItem>
                )}

                {contract.usage_rights_days && (
                  <ClauseItem label="Usage rights">{contract.usage_rights_days} days</ClauseItem>
                )}

                {contract.kill_fee_percentage && (
                  <ClauseItem label="Kill fee">{contract.kill_fee_percentage}%</ClauseItem>
                )}

                {contract.platform_fee_percentage && (
                  <ClauseItem label="Platform fee">{contract.platform_fee_percentage}%</ClauseItem>
                )}
              </div>

              {contract.deliverable_notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deliverables</p>
                  <p className="text-sm bg-muted/40 rounded p-2">{contract.deliverable_notes}</p>
                </div>
              )}

              {/* Content section */}
              {contract.draft_content_url && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Draft Submitted</p>
                  <a
                    href={contract.draft_content_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View draft content
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {contract.live_post_url && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Live Post</p>
                  <a
                    href={contract.live_post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View published content
                  </a>
                </div>
              )}

              {/* Actions in expanded state */}
              {contract.status === "content_submitted" && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => doAction(approveContent)}
                  >
                    {isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending || contract.revisions_used >= contract.max_revision_rounds}
                    onClick={() => doAction(requestRevision)}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Request Revision ({contract.revisions_used}/{contract.max_revision_rounds})
                  </Button>
                </div>
              )}

              {contract.status === "published" && (
                <Button
                  size="sm"
                  className="w-full"
                  disabled={isPending}
                  onClick={() => doAction(closeContract)}
                >
                  {isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                  Close Contract
                </Button>
              )}

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ClauseItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className="font-medium">{children}</p>
    </div>
  );
}
