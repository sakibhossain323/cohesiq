"use client";

import { useState, useTransition } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatBDT } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { sendOfferAction } from "../_actions/campaign-actions";
import type { OfferPayload } from "@/lib/api/campaigns";
import type { Application, Campaign, CampaignDeliverable } from "@/lib/types";

type IdentifiedDeliverable = CampaignDeliverable & { id: string };
import {
  FileVideo, Package, ArrowLeft, ArrowRight,
  Loader2, AlertCircle, Send, DollarSign, ShieldCheck, ListChecks,
} from "lucide-react";

// Fee locked at contract creation — talent_engagement is intentionally not offered
// here because a "live engagement" type conflicts with content deliverables.
const FEE_MAP: Record<string, number> = {
  content_collaboration: 15,
  product_seeding: 10,
};

const OFFER_TYPES = [
  {
    value: "content_collaboration",
    Icon: FileVideo,
    label: "Branded promotion",
    description: "The creator promotes your brand within their own content.",
    hint: "YouTube integrations, Instagram posts, TikToks, sponsored mentions",
  },
  {
    value: "product_seeding",
    Icon: Package,
    label: "Product review",
    description: "The creator reviews or features your product authentically.",
    hint: "Unboxings, honest reviews, lifestyle integration",
  },
];

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube", instagram: "Instagram", facebook: "Facebook",
  tiktok: "TikTok", twitter_x: "Twitter/X", linkedin: "LinkedIn",
  snapchat: "Snapchat", other: "Other",
};

function deliverableLabel(d: CampaignDeliverable): string {
  const platform = PLATFORM_LABELS[d.platform] || d.platform;
  const type = (d.deliverable_code || d.deliverable_type || "deliverable").replace(/_/g, " ");
  return `${platform} · ${type}`;
}

interface SelectedDeliverable {
  checked: boolean;
  quantity: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
  application: Application;
  onOffered: (application: Application) => void;
}

export function OfferModal({ open, onClose, campaign, application, onOffered }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contractType, setContractType] = useState("");
  const [error, setError] = useState<string | null>(null);

  const campaignDeliverables = (campaign.deliverables ?? []).filter(
    (d): d is IdentifiedDeliverable => !!d.id,
  );
  const [selected, setSelected] = useState<Record<string, SelectedDeliverable>>(() =>
    Object.fromEntries(
      campaignDeliverables.map((d) => [d.id, { checked: true, quantity: String(d.quantity || 1) }]),
    ),
  );

  const [paymentStructure, setPaymentStructure] = useState<"flat_fee" | "non_cash" | "none">("none");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSchedule, setPaymentSchedule] = useState("on_delivery");
  const [nonCashCompensation, setNonCashCompensation] = useState("");
  const [productDisposition, setProductDisposition] = useState("keep");
  const [deliverableNotes, setDeliverableNotes] = useState("");
  const [exclusivityDays, setExclusivityDays] = useState("");
  const [usageRightsDays, setUsageRightsDays] = useState("");
  const [maxRevisions, setMaxRevisions] = useState("2");
  const [killFee, setKillFee] = useState("");
  const [message, setMessage] = useState("");

  const creatorName = application.creator?.display_name ?? "this creator";
  const isProductSeeding = contractType === "product_seeding";
  const feePercent = FEE_MAP[contractType] ?? 0;
  const amount = parseInt(paymentAmount, 10) || 0;
  const feeAmount = Math.round((amount * feePercent) / 100);
  const netPayout = amount - feeAmount;
  const selectedCount = Object.values(selected).filter((s) => s.checked).length;

  const toggleDeliverable = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id].checked } }));
  const setDeliverableQty = (id: string, quantity: string) =>
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], quantity } }));

  const handleClose = () => {
    setStep(1);
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    setError(null);
    const deliverables = campaignDeliverables
      .filter((d) => selected[d.id]?.checked)
      .map((d) => ({
        requirement_id: d.id,
        quantity: parseInt(selected[d.id]?.quantity, 10) || 1,
      }));

    const payload: OfferPayload = {
      contract_type: contractType,
      payment_structure: paymentStructure,
      payment_amount_bdt:
        paymentStructure === "flat_fee" && paymentAmount ? parseInt(paymentAmount, 10) : undefined,
      payment_schedule: paymentStructure === "flat_fee" ? paymentSchedule : undefined,
      non_cash_compensation:
        paymentStructure === "non_cash" ? nonCashCompensation || undefined : undefined,
      has_product_transfer: isProductSeeding,
      product_disposition: isProductSeeding ? productDisposition : undefined,
      deliverable_notes: deliverableNotes || undefined,
      deliverables,
      exclusivity_days: exclusivityDays ? parseInt(exclusivityDays, 10) : undefined,
      usage_rights_days: usageRightsDays ? parseInt(usageRightsDays, 10) : undefined,
      max_revision_rounds: parseInt(maxRevisions, 10) || 2,
      kill_fee_percentage: killFee ? parseInt(killFee, 10) : undefined,
      message: message || undefined,
    };

    startTransition(async () => {
      const result = await sendOfferAction(campaign.id, application.id, payload);
      if (result.success && result.application) {
        toast({ title: "Offer sent", description: `${creatorName} can now review your terms.` });
        onOffered(result.application as Application);
        handleClose();
      } else {
        setError(result.error || "Failed to send offer. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Send Contract Offer</DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">to {creatorName}</p>
          <div className="flex gap-1 mt-3">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  s <= step ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Step 1 — engagement type */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                What kind of collaboration is this?
              </p>
              {OFFER_TYPES.map(({ value, Icon, label, description, hint }) => {
                const isSelected = contractType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setContractType(value)}
                    className={cn(
                      "w-full text-left rounded-lg border p-4 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-muted-foreground/40 hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <div className="space-y-0.5">
                        <p className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-foreground")}>{label}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{hint}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2 — deliverables for this creator */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  Deliverables for {creatorName}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Pick the portion of this campaign’s deliverables this creator is responsible for.
                </p>
              </div>
              {campaignDeliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-4 text-center">
                  This campaign has no defined deliverables — describe them in the notes below.
                </p>
              ) : (
                <div className="space-y-2">
                  {campaignDeliverables.map((d) => {
                    const s = selected[d.id];
                    return (
                      <div
                        key={d.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                          s?.checked ? "border-primary/40 bg-primary/5" : "border-border",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--brand-primary)]"
                          checked={!!s?.checked}
                          onChange={() => toggleDeliverable(d.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium capitalize truncate">{deliverableLabel(d)}</p>
                          {d.notes && <p className="text-xs text-muted-foreground truncate">{d.notes}</p>}
                        </div>
                        <Input
                          type="number"
                          min="1"
                          className="w-16 h-8"
                          value={s?.quantity ?? "1"}
                          disabled={!s?.checked}
                          onChange={(e) => setDeliverableQty(d.id, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Additional notes</Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. mention #BrandName in the first 30 seconds"
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3 — compensation + clauses + message */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Compensation
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "flat_fee", label: "Flat fee" },
                    { value: "non_cash", label: "Non-cash" },
                    { value: "none", label: "None" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentStructure(opt.value as typeof paymentStructure)}
                      className={cn(
                        "rounded-md border py-2 px-2 text-sm font-medium transition-colors",
                        paymentStructure === opt.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/40",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {paymentStructure === "flat_fee" && (
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Amount (BDT)</Label>
                      <Input
                        type="number" min="0" placeholder="e.g. 15000"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">When</Label>
                      <Select value={paymentSchedule} onValueChange={setPaymentSchedule}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upfront">Upfront</SelectItem>
                          <SelectItem value="on_delivery">On delivery</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {paymentStructure === "non_cash" && (
                  <div className="space-y-1.5 mt-1">
                    <Label className="text-xs text-muted-foreground">What the creator receives</Label>
                    <Textarea
                      rows={2}
                      placeholder="e.g. 1-year Pro plan access, free product to keep, 20% affiliate commission"
                      value={nonCashCompensation}
                      onChange={(e) => setNonCashCompensation(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {isProductSeeding && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Product after campaign
                  </Label>
                  <div className="flex gap-2">
                    {[
                      { value: "keep", label: "Creator keeps it" },
                      { value: "return", label: "Return to brand" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setProductDisposition(opt.value)}
                        className={cn(
                          "flex-1 rounded-md border py-2 px-3 text-sm font-medium transition-colors",
                          productDisposition === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-muted-foreground/40",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Max revisions</Label>
                  <Input type="number" min="0" max="10" value={maxRevisions} onChange={(e) => setMaxRevisions(e.target.value)} />
                </div>
                {!isProductSeeding && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Exclusivity (days)</Label>
                    <Input type="number" min="0" placeholder="e.g. 30" value={exclusivityDays} onChange={(e) => setExclusivityDays(e.target.value)} />
                  </div>
                )}
              </div>

              {!isProductSeeding && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Usage rights (days)</Label>
                    <Input type="number" min="0" placeholder="e.g. 365" value={usageRightsDays} onChange={(e) => setUsageRightsDays(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Kill fee (%)</Label>
                    <Input type="number" min="0" max="50" placeholder="e.g. 10" value={killFee} onChange={(e) => setKillFee(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Message to creator</Label>
                <Textarea
                  rows={2}
                  placeholder="Add a short note with your offer…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {paymentStructure === "flat_fee" && amount > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Platform Fee</p>
                    <Badge variant="outline" className="ml-auto text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                      Simulated · No real payment
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-background border border-border p-2">
                      <p className="text-xs text-muted-foreground">Contract value</p>
                      <p className="font-bold text-sm mt-0.5">{formatBDT(amount)}</p>
                    </div>
                    <div className="rounded-md bg-amber-100/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2">
                      <p className="text-xs text-muted-foreground">Platform ({feePercent}%)</p>
                      <p className="font-bold text-sm text-amber-700 dark:text-amber-400 mt-0.5">−{formatBDT(feeAmount)}</p>
                    </div>
                    <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-2">
                      <p className="text-xs text-muted-foreground">Creator gets</p>
                      <p className="font-bold text-sm text-green-700 dark:text-green-400 mt-0.5">{formatBDT(netPayout)}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={step === 1 ? handleClose : () => setStep((s) => (s - 1) as 1 | 2 | 3)}
            disabled={isPending}
          >
            {step === 1 ? "Cancel" : <><ArrowLeft className="mr-1 h-4 w-4" /> Back</>}
          </Button>

          {step < 3 ? (
            <Button
              size="sm"
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              disabled={(step === 1 && !contractType) || (step === 2 && campaignDeliverables.length > 0 && selectedCount === 0)}
            >
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Offer
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
