"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { usePolling } from "@/hooks/use-polling";
import {
  Sheet, SheetContent, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApplicationStatusBadge } from "@/components/application/ApplicationStatusBadge";
import { useToast } from "@/hooks/use-toast";
import { getNegotiationThread } from "@/lib/api/campaigns";
import { formatBDT, formatDate, cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, Repeat, MessageSquare, Clock } from "lucide-react";
import type { Application, NegotiationTurn } from "@/lib/types";

type ActionResult = { success: boolean; application?: unknown; error?: string };

export interface NegotiationActions {
  accept: (campaignId: string, applicationId: string, message?: string) => Promise<ActionResult>;
  counter: (
    campaignId: string,
    applicationId: string,
    payload: { message?: string; proposed_rate?: number; proposed_terms?: Record<string, unknown> },
  ) => Promise<ActionResult>;
  decline: (campaignId: string, applicationId: string, reason?: string) => Promise<ActionResult>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  application: Application;
  viewerRole: "brand" | "creator";
  counterpartyName: string;
  actions: NegotiationActions;
  onResult: (application: Application) => void;
}

export function NegotiationDrawer({
  open, onClose, campaignId, application, viewerRole, counterpartyName, actions, onResult,
}: Props) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [turns, setTurns] = useState<NegotiationTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCounter, setShowCounter] = useState(false);
  const [counterRate, setCounterRate] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  const status = application.status;

  useEffect(() => {
    if (!open) {
      setShowCounter(false);
      setError(null);
    }
  }, [open]);

  const fetchTurns = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getNegotiationThread(campaignId, application.id, token);
      setTurns(data as NegotiationTurn[]);
    } finally {
      setLoading(false);
    }
  }, [getToken, campaignId, application.id]);

  const { lastUpdated } = usePolling(fetchTurns, 4000, { enabled: open });

  const proposedTurns = turns.filter((t) => t.status === "proposed");
  const latestProposed = proposedTurns.length
    ? proposedTurns.reduce((a, b) => (a.created_at > b.created_at ? a : b))
    : null;
  const isOpenOffer = status === "invited" || status === "pending_agreement";
  const myTurn = isOpenOffer && latestProposed != null && latestProposed.author_role !== viewerRole;
  const awaiting = isOpenOffer && latestProposed != null && latestProposed.author_role === viewerRole;

  const run = (fn: () => Promise<ActionResult>, successMsg: string) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.success && result.application) {
        toast({ title: successMsg });
        onResult(result.application as Application);
        onClose();
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    });
  };

  const handleAccept = () => run(() => actions.accept(campaignId, application.id), "Offer accepted");
  const handleDecline = () =>
    run(() => actions.decline(campaignId, application.id), viewerRole === "brand" ? "Offer withdrawn" : "Offer declined");
  const handleCounter = () => {
    const rate = counterRate ? parseInt(counterRate, 10) : undefined;
    run(
      () => actions.counter(campaignId, application.id, {
        message: counterMessage || undefined,
        proposed_rate: rate,
        proposed_terms: rate != null ? { payment_amount_bdt: rate } : undefined,
      }),
      "Counter-offer sent",
    );
  };

  const authorLabel = (t: NegotiationTurn) =>
    t.author_role === viewerRole ? "You" : t.author_role === "brand" ? "Brand" : counterpartyName;

  const cpInitials = counterpartyName.slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden gap-0">
        <SheetTitle className="sr-only">Negotiation with {counterpartyName}</SheetTitle>

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {cpInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground leading-tight truncate">{counterpartyName}</p>
              <div className="mt-1 flex items-center gap-3">
                <ApplicationStatusBadge status={status} />
                {lastUpdated && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live • {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {latestProposed != null && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-background border border-border px-4 py-3">
              <span className="text-xs text-muted-foreground font-medium">Current offer</span>
              {latestProposed.proposed_rate != null ? (
                <span className="font-bold text-foreground text-xl tabular-nums">
                  {formatBDT(latestProposed.proposed_rate)}
                </span>
              ) : (() => {
                const terms = latestProposed.proposed_terms as Record<string, unknown> | null | undefined;
                const structure = terms?.payment_structure as string | undefined;
                const nonCash = terms?.non_cash_compensation as string | undefined;
                if (structure === "non_cash") {
                  return <span className="text-sm font-medium text-foreground">{nonCash ?? "Non-cash"}</span>;
                }
                return <span className="text-sm text-muted-foreground italic">No cash compensation</span>;
              })()}
            </div>
          )}
        </div>

        {/* ── Thread ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading thread…</span>
            </div>
          ) : turns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No offers yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Offer history will appear here.</p>
              </div>
            </div>
          ) : (
            turns.map((t) => {
              const mine = t.author_role === viewerRole;
              const label = authorLabel(t);
              const initials = label === "You" ? "YO" : label.slice(0, 2).toUpperCase();
              const isAccepted = t.status === "accepted";
              const isSuperseded = t.status === "superseded";

              return (
                <div key={t.id} className={cn("flex gap-2.5", mine ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-1",
                    mine
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground border border-border",
                  )}>
                    {initials}
                  </div>

                  <div className={cn("flex flex-col max-w-[76%]", mine ? "items-end" : "items-start")}>
                    <span className="text-[11px] text-muted-foreground mb-1 px-1">{label}</span>

                    <div className={cn(
                      "rounded-2xl px-4 py-3 space-y-1",
                      isAccepted
                        ? "bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800"
                        : isSuperseded
                          ? "bg-muted/40 border border-border opacity-55"
                          : mine
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted border border-border",
                    )}>
                      {t.proposed_rate != null ? (
                        <p className={cn(
                          "font-bold text-lg tabular-nums leading-tight",
                          isAccepted ? "text-green-700 dark:text-green-400" : "text-foreground",
                        )}>
                          {formatBDT(t.proposed_rate)}
                        </p>
                      ) : (() => {
                        const terms = t.proposed_terms as Record<string, unknown> | null | undefined;
                        const structure = terms?.payment_structure as string | undefined;
                        const nonCash = terms?.non_cash_compensation as string | undefined;
                        if (structure === "non_cash") {
                          return (
                            <p className="text-sm font-medium text-foreground">
                              {nonCash ?? "Non-cash compensation"}
                            </p>
                          );
                        }
                        if (structure === "none") {
                          return (
                            <p className="text-sm italic text-muted-foreground">No monetary compensation</p>
                          );
                        }
                        return null;
                      })()}
                      {t.message && (
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                          {t.message}
                        </p>
                      )}
                      {isAccepted && (
                        <div className="flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs text-green-700 font-medium dark:text-green-400">Accepted</span>
                        </div>
                      )}
                      {isSuperseded && (
                        <span className="text-xs text-muted-foreground">Superseded</span>
                      )}
                    </div>

                    <span className="text-[10px] text-muted-foreground mt-1 px-1">{formatDate(t.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Actions ── */}
        <div className="shrink-0 border-t border-border bg-background px-5 py-4 space-y-3">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {status === "accepted" && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 font-medium dark:text-green-400">Contract is active</p>
            </div>
          )}

          {(status === "rejected" || status === "declined") && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted border border-border">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">This offer is closed</p>
            </div>
          )}

          {awaiting && !showCounter && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/60 border border-border">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Waiting for{" "}
                  <span className="font-medium text-foreground">{counterpartyName}</span>
                  {" "}to respond.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={isPending}
                onClick={handleDecline}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {viewerRole === "brand" ? "Withdraw offer" : "Decline"}
              </Button>
            </div>
          )}

          {myTurn && !showCounter && (
            <div className="space-y-2">
              <Button className="w-full" disabled={isPending} onClick={handleAccept}>
                {isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Accept{latestProposed?.proposed_rate != null ? ` ${formatBDT(latestProposed.proposed_rate)}` : " offer"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" disabled={isPending} onClick={() => setShowCounter(true)}>
                  <Repeat className="mr-2 h-4 w-4" /> Counter
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  disabled={isPending}
                  onClick={handleDecline}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Decline
                </Button>
              </div>
            </div>
          )}

          {(myTurn || awaiting) && showCounter && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Send a counter-offer</p>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Proposed rate (BDT)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 18000"
                  value={counterRate}
                  onChange={(e) => setCounterRate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Message (optional)</Label>
                <Textarea
                  rows={2}
                  placeholder="Explain your counter…"
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" disabled={isPending} onClick={() => setShowCounter(false)}>
                  Back
                </Button>
                <Button size="sm" className="flex-1" disabled={isPending} onClick={handleCounter}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
                  Send counter
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
