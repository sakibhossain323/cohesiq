"use client";

import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApplicationStatusBadge } from "@/components/application/ApplicationStatusBadge";
import { useToast } from "@/hooks/use-toast";
import { getNegotiationThread } from "@/lib/api/campaigns";
import { formatBDT, formatDate, cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, Repeat, MessageSquare } from "lucide-react";
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
    if (!open) return;
    setShowCounter(false);
    setError(null);
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getNegotiationThread(campaignId, application.id, token);
        if (!cancelled) setTurns(data as NegotiationTurn[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, application.id, campaignId]);

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

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col">
        <SheetHeader className="pb-2">
          <SheetTitle>Negotiation</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <span>{counterpartyName}</span>
            <ApplicationStatusBadge status={status} />
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-4" />

        {/* Thread */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : turns.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No offer history yet.
            </div>
          ) : (
            turns.map((t) => {
              const mine = t.author_role === viewerRole;
              return (
                <div key={t.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl border p-3 text-sm",
                      t.status === "accepted"
                        ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                        : t.status === "superseded"
                          ? "border-border bg-muted/40 opacity-70"
                          : mine
                            ? "border-primary/40 bg-primary/5"
                            : "border-border bg-surface-subtle",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs">{authorLabel(t)}</span>
                      {t.status === "accepted" && (
                        <span className="text-xs text-green-600 font-medium">· Accepted</span>
                      )}
                      {t.status === "superseded" && (
                        <span className="text-xs text-muted-foreground">· Superseded</span>
                      )}
                    </div>
                    {t.proposed_rate != null && (
                      <p className="font-semibold">{formatBDT(t.proposed_rate)}</p>
                    )}
                    {t.message && <p className="text-foreground/90 mt-0.5 whitespace-pre-wrap">{t.message}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">{formatDate(t.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-3 py-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-border">
          {status === "accepted" && (
            <p className="text-sm text-green-600 font-medium text-center">
              Offer accepted — contract is active.
            </p>
          )}
          {(status === "rejected" || status === "declined") && (
            <p className="text-sm text-muted-foreground text-center">This offer is closed.</p>
          )}

          {awaiting && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Waiting for {counterpartyName} to respond to your latest offer.
              </p>
              <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" disabled={isPending} onClick={handleDecline}>
                <XCircle className="mr-2 h-4 w-4" />
                {viewerRole === "brand" ? "Withdraw offer" : "Decline"}
              </Button>
            </div>
          )}

          {myTurn && !showCounter && (
            <div className="flex flex-col gap-2">
              <Button className="w-full" disabled={isPending} onClick={handleAccept}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Accept {latestProposed?.proposed_rate != null ? formatBDT(latestProposed.proposed_rate) : "offer"}
              </Button>
              <Button variant="outline" className="w-full" disabled={isPending} onClick={() => setShowCounter(true)}>
                <Repeat className="mr-2 h-4 w-4" /> Counter-offer
              </Button>
              <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10" disabled={isPending} onClick={handleDecline}>
                <XCircle className="mr-2 h-4 w-4" /> Decline
              </Button>
            </div>
          )}

          {myTurn && showCounter && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Your proposed rate (BDT)</Label>
                <Input type="number" min="0" placeholder="e.g. 18000" value={counterRate} onChange={(e) => setCounterRate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Message (optional)</Label>
                <Textarea rows={2} placeholder="Explain your counter…" value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => setShowCounter(false)}>Back</Button>
                <Button size="sm" className="flex-1" disabled={isPending} onClick={handleCounter}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
                  Send counter-offer
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
