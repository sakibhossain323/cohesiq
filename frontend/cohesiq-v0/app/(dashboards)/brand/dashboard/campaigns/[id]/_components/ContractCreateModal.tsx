"use client";

import { useState } from "react";
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
import { createContract } from "@/lib/api/contracts";
import { useAuth } from "@clerk/nextjs";
import type { Application, Contract } from "@/lib/types";
import {
  FileVideo, Package, Mic2, ArrowLeft, ArrowRight,
  Loader2, AlertCircle, CheckCircle2, DollarSign, ShieldCheck,
} from "lucide-react";

// ── Fee locked at contract creation ────────────────────────────────────────
const FEE_MAP: Record<string, number> = {
  content_collaboration: 15,
  product_seeding: 10,
  talent_engagement: 18,
};

const CONTRACT_TYPES = [
  {
    value: "content_collaboration",
    Icon: FileVideo,
    label: "Content Collaboration",
    description: "Creator publishes branded content on their own channels.",
    hint: "YouTube reviews, Instagram posts, TikToks, blog posts…",
  },
  {
    value: "product_seeding",
    Icon: Package,
    label: "Product Seeding",
    description: "You send a product; the creator engages with it authentically.",
    hint: "Unboxing, honest reviews, lifestyle integration",
  },
  {
    value: "talent_engagement",
    Icon: Mic2,
    label: "Talent Engagement",
    description: "Creator appears at or hosts a live event or activation.",
    hint: "Launch events, brand activations, live streams",
  },
];

interface ClauseState {
  paymentStructure: "flat_fee" | "none";
  paymentAmountBdt: string;
  paymentSchedule: string;
  productDisposition: string;
  deliverableNotes: string;
  exclusivityDays: string;
  usageRightsDays: string;
  maxRevisionRounds: string;
  killFeePercentage: string;
}

const DEFAULT_CLAUSES: ClauseState = {
  paymentStructure: "none",
  paymentAmountBdt: "",
  paymentSchedule: "on_delivery",
  productDisposition: "keep",
  deliverableNotes: "",
  exclusivityDays: "",
  usageRightsDays: "",
  maxRevisionRounds: "2",
  killFeePercentage: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  application: Application;
  onContractCreated: (contract: Contract) => void;
}

export function ContractCreateModal({
  open, onClose, campaignId, application, onContractCreated,
}: Props) {
  const { getToken } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contractType, setContractType] = useState("");
  const [clauses, setClauses] = useState<ClauseState>(DEFAULT_CLAUSES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatorName = application.creator?.display_name ?? "this creator";
  const isProductSeeding = contractType === "product_seeding";
  const feePercent = FEE_MAP[contractType] ?? 0;
  const paymentAmount = parseInt(clauses.paymentAmountBdt, 10) || 0;
  const feeAmount = Math.round((paymentAmount * feePercent) / 100);
  const netPayout = paymentAmount - feeAmount;

  const setClause = (key: keyof ClauseState) => (val: string) =>
    setClauses((prev) => ({ ...prev, [key]: val }));

  const reset = () => {
    setStep(1);
    setContractType("");
    setClauses(DEFAULT_CLAUSES);
    setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const contract = await createContract(campaignId, application.id, {
        contract_type: contractType,
        payment_structure: clauses.paymentStructure,
        payment_amount_bdt:
          clauses.paymentStructure === "flat_fee" && clauses.paymentAmountBdt
            ? parseInt(clauses.paymentAmountBdt, 10)
            : undefined,
        payment_schedule:
          clauses.paymentStructure === "flat_fee"
            ? clauses.paymentSchedule || undefined
            : undefined,
        has_product_transfer: isProductSeeding,
        product_disposition: isProductSeeding ? (clauses.productDisposition || undefined) : undefined,
        deliverable_notes: clauses.deliverableNotes || undefined,
        exclusivity_days: clauses.exclusivityDays ? parseInt(clauses.exclusivityDays, 10) : undefined,
        usage_rights_days: clauses.usageRightsDays ? parseInt(clauses.usageRightsDays, 10) : undefined,
        max_revision_rounds: parseInt(clauses.maxRevisionRounds, 10) || 2,
        kill_fee_percentage: clauses.killFeePercentage
          ? parseInt(clauses.killFeePercentage, 10)
          : undefined,
      }, token);

      onContractCreated(contract);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create contract. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Create Contract</DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">with {creatorName}</p>
          <div className="flex gap-1 mt-3">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── Step 1: Choose engagement type ─────────────────────── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                What kind of collaboration is this?
              </p>
              {CONTRACT_TYPES.map(({ value, Icon, label, description, hint }) => {
                const selected = contractType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setContractType(value)}
                    className={cn(
                      "w-full text-left rounded-lg border p-4 transition-colors",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={cn(
                          "h-5 w-5 mt-0.5 shrink-0",
                          selected ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <div className="space-y-0.5">
                        <p className={cn("font-medium text-sm", selected ? "text-primary" : "text-foreground")}>
                          {label}
                        </p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{hint}</p>
                      </div>
                      <div
                        className={cn(
                          "ml-auto shrink-0 mt-0.5 h-4 w-4 rounded-full border-2 transition-colors",
                          selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step 2: Configure clauses ───────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Payment — all types except product_seeding default to none */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Payment
                </Label>
                <div className="flex gap-2">
                  {[
                    { value: "none", label: "No payment" },
                    { value: "flat_fee", label: "Flat fee" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setClause("paymentStructure")(opt.value as "flat_fee" | "none")}
                      className={cn(
                        "flex-1 rounded-md border py-2 px-3 text-sm font-medium transition-colors",
                        clauses.paymentStructure === opt.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/40"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {clauses.paymentStructure === "flat_fee" && (
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Amount (BDT)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g. 15000"
                        value={clauses.paymentAmountBdt}
                        onChange={(e) => setClause("paymentAmountBdt")(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">When</Label>
                      <Select value={clauses.paymentSchedule} onValueChange={setClause("paymentSchedule")}>
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
              </div>

              {/* Product disposition (product seeding) */}
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
                        onClick={() => setClause("productDisposition")(opt.value)}
                        className={cn(
                          "flex-1 rounded-md border py-2 px-3 text-sm font-medium transition-colors",
                          clauses.productDisposition === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-muted-foreground/40"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliverable notes */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Deliverable notes
                </Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. 1 × 10-min YouTube review + 2 × Instagram stories mentioning #BrandName"
                  value={clauses.deliverableNotes}
                  onChange={(e) => setClause("deliverableNotes")(e.target.value)}
                />
              </div>

              {/* Max revisions + exclusivity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Max revisions</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={clauses.maxRevisionRounds}
                    onChange={(e) => setClause("maxRevisionRounds")(e.target.value)}
                  />
                </div>
                {!isProductSeeding && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Exclusivity (days)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 30"
                      value={clauses.exclusivityDays}
                      onChange={(e) => setClause("exclusivityDays")(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Usage rights + kill fee */}
              {!isProductSeeding && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Usage rights (days)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 365"
                      value={clauses.usageRightsDays}
                      onChange={(e) => setClause("usageRightsDays")(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Kill fee (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g. 10"
                      value={clauses.killFeePercentage}
                      onChange={(e) => setClause("killFeePercentage")(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Summary ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {CONTRACT_TYPES.find((t) => t.value === contractType)?.label}
                  </p>
                  <Badge variant="outline" className="text-xs">Active on confirm</Badge>
                </div>

                <div className="space-y-2 text-sm divide-y divide-border/50">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-medium">
                      {clauses.paymentStructure === "flat_fee" && clauses.paymentAmountBdt
                        ? `${formatBDT(parseInt(clauses.paymentAmountBdt, 10))} · ${clauses.paymentSchedule?.replace(/_/g, " ")}`
                        : "No payment"}
                    </span>
                  </div>
                  {isProductSeeding && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Product</span>
                      <span className="font-medium">
                        {clauses.productDisposition === "keep" ? "Creator keeps it" : "Return to brand"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-muted-foreground">Revisions</span>
                    <span className="font-medium">
                      {clauses.maxRevisionRounds} round{clauses.maxRevisionRounds !== "1" ? "s" : ""}
                    </span>
                  </div>
                  {clauses.exclusivityDays && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Exclusivity</span>
                      <span className="font-medium">{clauses.exclusivityDays} days</span>
                    </div>
                  )}
                  {clauses.usageRightsDays && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Usage rights</span>
                      <span className="font-medium">{clauses.usageRightsDays} days</span>
                    </div>
                  )}
                  {clauses.killFeePercentage && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Kill fee</span>
                      <span className="font-medium">{clauses.killFeePercentage}%</span>
                    </div>
                  )}
                  {clauses.deliverableNotes && (
                    <div className="py-1.5">
                      <p className="text-muted-foreground mb-1">Deliverables</p>
                      <p className="text-sm">{clauses.deliverableNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Platform fee */}
              {clauses.paymentStructure === "flat_fee" && paymentAmount > 0 && (
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
                      <p className="font-bold text-sm mt-0.5">{formatBDT(paymentAmount)}</p>
                    </div>
                    <div className="rounded-md bg-amber-100/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2">
                      <p className="text-xs text-muted-foreground">Platform ({feePercent}%)</p>
                      <p className="font-bold text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                        −{formatBDT(feeAmount)}
                      </p>
                    </div>
                    <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-2">
                      <p className="text-xs text-muted-foreground">Creator gets</p>
                      <p className="font-bold text-sm text-green-700 dark:text-green-400 mt-0.5">
                        {formatBDT(netPayout)}
                      </p>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={step === 1 ? handleClose : () => setStep((s) => (s - 1) as 1 | 2 | 3)}
            disabled={isSubmitting}
          >
            {step === 1 ? "Cancel" : <><ArrowLeft className="mr-1 h-4 w-4" /> Back</>}
          </Button>

          {step < 3 ? (
            <Button
              size="sm"
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              disabled={step === 1 && !contractType}
            >
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Confirm Contract
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
