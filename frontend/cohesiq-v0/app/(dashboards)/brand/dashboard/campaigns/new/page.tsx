"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { createCampaign, NICHE_MAP } from "@/lib/api/campaigns";
import { BRAND_CATEGORIES } from "@/lib/brand-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Globe, Lock, Target, Users, Calendar, Hash, AlertCircle } from "lucide-react";
import { BriefAnalyzerCard } from "./_components/BriefAnalyzerCard";
import type { BriefAnalysisResult } from "./_actions/analyze-brief";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import type { PlatformType } from "@/lib/types";

type Visibility = "public" | "private";

const CAMPAIGN_PLATFORMS: { value: PlatformType; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
];

const VISIBILITY_OPTIONS: {
  value: Visibility;
  icon: React.ReactNode;
  title: string;
  description: string;
  hint: string;
}[] = [
  {
    value: "public",
    icon: <Globe className="h-5 w-5" />,
    title: "Public Campaign",
    description: "Any qualifying creator can discover and apply.",
    hint: "Best for broad influencer programs. You review applications and select who to work with.",
  },
  {
    value: "private",
    icon: <Lock className="h-5 w-5" />,
    title: "Private Outreach",
    description: "You hand-pick and invite specific creators.",
    hint: "Best for targeted direct deals. Terms stay confidential — only invited creators see this campaign.",
  },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "public" as Visibility,
    budget_per_creator_max: "",
    creator_min_followers: "1000",
    number_of_creators: "1",
    primary_niche_id: "",
    brand_category: "",
    application_deadline: "",
    hashtags: "",
    tracking_notes: "",
    required_platforms: ["youtube"] as PlatformType[],
    kpi_reach: "",
    kpi_engagement_rate: "",
    kpi_conversions: "",
    kpi_roi_target: "",
  });

  const handleBriefResult = (result: BriefAnalysisResult) => {
    setFormData(prev => ({
      ...prev,
      ...(result.title ? { title: result.title } : {}),
      ...(result.description ? { description: result.description } : {}),
      ...(result.suggested_visibility ? { visibility: result.suggested_visibility } : {}),
      ...(result.primary_niche_id ? { primary_niche_id: String(result.primary_niche_id) } : {}),
      ...(result.budget_per_creator_max ? { budget_per_creator_max: String(result.budget_per_creator_max) } : {}),
      ...(result.number_of_creators ? { number_of_creators: String(result.number_of_creators) } : {}),
      ...(result.creator_min_followers ? { creator_min_followers: String(result.creator_min_followers) } : {}),
      ...(result.hashtags?.length ? { hashtags: result.hashtags.join(", ") } : {}),
      ...(result.tracking_notes ? { tracking_notes: result.tracking_notes } : {}),
      ...(result.kpi_targets?.reach ? { kpi_reach: String(result.kpi_targets.reach) } : {}),
      ...(result.kpi_targets?.engagement_rate ? { kpi_engagement_rate: String(result.kpi_targets.engagement_rate) } : {}),
      ...(result.kpi_targets?.conversions ? { kpi_conversions: String(result.kpi_targets.conversions) } : {}),
      ...(result.kpi_targets?.roi_target ? { kpi_roi_target: String(result.kpi_targets.roi_target) } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.title.trim().length < 3) {
      setError("Campaign title must be at least 3 characters long.");
      return;
    }
    if (formData.description.trim().length < 10) {
      setError("Campaign brief must be at least 10 characters long.");
      return;
    }
    const budget = parseInt(formData.budget_per_creator_max, 10);
    if (isNaN(budget) || budget <= 0) {
      setError("Max budget per creator must be a valid number greater than 0.");
      return;
    }
    const numCreators = parseInt(formData.number_of_creators, 10);
    if (isNaN(numCreators) || numCreators < 1) {
      setError("Number of creators needed must be at least 1.");
      return;
    }
    const minFollowers = parseInt(formData.creator_min_followers, 10);
    if (isNaN(minFollowers) || minFollowers < 0) {
      setError("Minimum followers cannot be negative.");
      return;
    }
    if (formData.application_deadline) {
      const deadlineDate = new Date(formData.application_deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        setError("Application deadline cannot be in the past.");
        return;
      }
    }
    if (formData.required_platforms.length === 0) {
      setError("Select at least one required platform.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const kpi_targets =
        formData.kpi_reach || formData.kpi_engagement_rate || formData.kpi_conversions || formData.kpi_roi_target
          ? {
              reach: formData.kpi_reach ? parseInt(formData.kpi_reach, 10) : undefined,
              engagement_rate: formData.kpi_engagement_rate ? parseFloat(formData.kpi_engagement_rate) : undefined,
              conversions: formData.kpi_conversions ? parseInt(formData.kpi_conversions, 10) : undefined,
              roi_target: formData.kpi_roi_target ? parseFloat(formData.kpi_roi_target) : undefined,
            }
          : undefined;

      const hashtags = formData.hashtags
        ? formData.hashtags.split(",").map((h) => h.trim().replace(/^#/, "")).filter(Boolean)
        : [];

      const payload = {
        title: formData.title,
        description: formData.description,
        visibility: formData.visibility,
        budget_per_creator_max: budget,
        creator_min_followers: minFollowers,
        number_of_creators: numCreators,
        primary_niche_id: formData.primary_niche_id ? parseInt(formData.primary_niche_id, 10) : undefined,
        brand_category: formData.brand_category || undefined,
        required_platforms: formData.required_platforms,
        application_deadline: formData.application_deadline || null,
        hashtags,
        tracking_notes: formData.tracking_notes || undefined,
        kpi_targets,
      };

      const newCampaign = await createCampaign(payload, token);
      router.push(`/brand/dashboard/campaigns/${newCampaign.id}`);
    } catch (err) {
      console.error("Failed to create campaign", err);
      let errorMessage = "Failed to create campaign. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
        const match = err.message.match(/API error \(\d+\): (\{.*\})/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            if (parsed.detail && Array.isArray(parsed.detail)) {
              errorMessage = parsed.detail.map((d: any) => `${d.loc.slice(1).join(" ")}: ${d.msg}`).join(", ");
            } else if (typeof parsed.detail === "string") {
              errorMessage = parsed.detail;
            }
          } catch (_) {}
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVisibility = VISIBILITY_OPTIONS.find((o) => o.value === formData.visibility);

  const togglePlatform = (platform: PlatformType) => {
    setFormData(prev => {
      const selected = prev.required_platforms.includes(platform);
      return {
        ...prev,
        required_platforms: selected
          ? prev.required_platforms.filter(item => item !== platform)
          : [...prev.required_platforms, platform],
      };
    });
  };

  return (
    <div className="bd-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bd-header">
        <div className="bd-header-inner">
          <div>
            <Link
              href="/brand/dashboard/campaigns"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Campaigns
            </Link>
            <span className="eyebrow mb-3 block">Campaigns</span>
            <h1 className="bd-header-title">Create Campaign</h1>
            <p className="bd-header-sub">
              Define your brief and find the right creators. Set collaboration terms after accepting someone.
            </p>
          </div>
        </div>
      </header>

      <div className="bd-body" style={{ maxWidth: "760px" }}>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* AI brief analyzer */}
        <BriefAnalyzerCard onResult={handleBriefResult} />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

          {/* ── 01 · Brief ──────────────────────────────────── */}
          <div className="bd-form-card">
            <div className="bd-form-header">
              <span className="bd-form-num">01</span>
              <div>
                <p className="bd-form-title">Campaign Brief</p>
                <p className="bd-form-desc">
                  Describe what you need. Creators use this to decide whether to apply.
                </p>
              </div>
            </div>
            <div className="bd-form-body">
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Summer Tech Review 2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Brief</Label>
                <Textarea
                  id="description"
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the product, the goal, and what you expect the creator to do."
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_niche">Target Niche</Label>
                  <Select
                    value={formData.primary_niche_id}
                    onValueChange={(value) => setFormData({ ...formData, primary_niche_id: value })}
                  >
                    <SelectTrigger id="primary_niche">
                      <SelectValue placeholder="Select niche (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(NICHE_MAP).map(([id, name]) => (
                        <SelectItem key={id} value={id} className="capitalize">{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand_category">Product Category</Label>
                  <Select
                    value={formData.brand_category}
                    onValueChange={(value) => setFormData({ ...formData, brand_category: value })}
                  >
                    <SelectTrigger id="brand_category">
                      <SelectValue placeholder="Use brand default" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAND_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Used for competitor conflict checks.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 02 · Reach Strategy ─────────────────────────── */}
          <div className="bd-form-card">
            <div className="bd-form-header">
              <span className="bd-form-num">02</span>
              <div>
                <p className="bd-form-title">Reach Strategy</p>
                <p className="bd-form-desc">Choose how creators will find and join this campaign.</p>
              </div>
            </div>
            <div className="bd-form-body">
              <div className="space-y-3">
                {VISIBILITY_OPTIONS.map((option) => {
                  const isSelected = formData.visibility === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, visibility: option.value })}
                      className={cn(
                        "w-full text-left rounded-xl border p-4 transition-all",
                        isSelected
                          ? "border-primary bg-brand-soft/60 ring-1 ring-primary"
                          : "border-border hover:border-muted-foreground/40 hover:bg-surface-subtle"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn("mt-0.5", isSelected ? "text-primary" : "text-muted-foreground")}>
                          {option.icon}
                        </span>
                        <div className="space-y-0.5 flex-1">
                          <p className={cn("font-semibold text-sm font-display", isSelected ? "text-primary" : "text-foreground")}>
                            {option.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">{option.hint}</p>
                        </div>
                        <span className={cn(
                          "flex h-4 w-4 rounded-full border-2 mt-0.5 shrink-0",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                        )} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 03 · Requirements & Budget ──────────────────── */}
          <div className="bd-form-card">
            <div className="bd-form-header">
              <span className="bd-form-num">03</span>
              <div>
                <p className="bd-form-title">Creator Requirements & Budget</p>
                <p className="bd-form-desc">Set the bar for who qualifies and what you&apos;re willing to pay.</p>
              </div>
            </div>
            <div className="bd-form-body">
              <div className="space-y-2">
                <Label>Required Platforms</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {CAMPAIGN_PLATFORMS.map(platform => {
                    const isSelected = formData.required_platforms.includes(platform.value);
                    return (
                      <button
                        key={platform.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => togglePlatform(platform.value)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-3 text-left transition-all",
                          isSelected
                            ? "border-primary bg-brand-soft/60 ring-1 ring-primary"
                            : "border-border hover:border-muted-foreground/40 hover:bg-surface-subtle"
                        )}
                      >
                        <PlatformBadge platform={platform.value} />
                        <span className="text-sm font-semibold">{platform.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Matching only considers creators with at least one selected platform.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Max Budget per Creator (BDT)</Label>
                  <Input
                    id="budget"
                    type="number"
                    required
                    min="0"
                    value={formData.budget_per_creator_max}
                    onChange={(e) => setFormData({ ...formData, budget_per_creator_max: e.target.value })}
                    placeholder="e.g. 15000"
                  />
                  <p className="text-xs text-muted-foreground">Exact payment terms are set on the contract.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creators">Number of Creators</Label>
                  <Input
                    id="creators"
                    type="number"
                    required
                    min="1"
                    value={formData.number_of_creators}
                    onChange={(e) => setFormData({ ...formData, number_of_creators: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="followers">Minimum Followers</Label>
                  <Input
                    id="followers"
                    type="number"
                    required
                    min="0"
                    value={formData.creator_min_followers}
                    onChange={(e) => setFormData({ ...formData, creator_min_followers: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Application Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── 04 · Goals & Tracking ───────────────────────── */}
          <div className="bd-form-card">
            <div className="bd-form-header">
              <span className="bd-form-num">04</span>
              <div>
                <p className="bd-form-title">Goals & Tracking</p>
                <p className="bd-form-desc">Optional success metrics and campaign tracking details.</p>
              </div>
            </div>
            <div className="bd-form-body">
              <div className="space-y-2">
                <Label htmlFor="hashtags" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Hashtags
                </Label>
                <Input
                  id="hashtags"
                  value={formData.hashtags}
                  onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                  placeholder="#brandname, #campaign2026 (comma-separated)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking_notes">Tracking Notes</Label>
                <Textarea
                  id="tracking_notes"
                  rows={2}
                  value={formData.tracking_notes}
                  onChange={(e) => setFormData({ ...formData, tracking_notes: e.target.value })}
                  placeholder="UTM parameters, promo codes, or other tracking instructions..."
                />
              </div>
              <div>
                <Label className="mb-3 block flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  KPI Targets
                </Label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="kpi_reach" className="text-xs text-muted-foreground">Target Reach</Label>
                    <Input id="kpi_reach" type="number" min="0" value={formData.kpi_reach} onChange={(e) => setFormData({ ...formData, kpi_reach: e.target.value })} placeholder="e.g. 50000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kpi_engagement_rate" className="text-xs text-muted-foreground">Engagement Rate (%)</Label>
                    <Input id="kpi_engagement_rate" type="number" min="0" step="0.1" value={formData.kpi_engagement_rate} onChange={(e) => setFormData({ ...formData, kpi_engagement_rate: e.target.value })} placeholder="e.g. 3.5" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kpi_conversions" className="text-xs text-muted-foreground">Target Conversions</Label>
                    <Input id="kpi_conversions" type="number" min="0" value={formData.kpi_conversions} onChange={(e) => setFormData({ ...formData, kpi_conversions: e.target.value })} placeholder="e.g. 200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kpi_roi_target" className="text-xs text-muted-foreground">ROI Target (%)</Label>
                    <Input id="kpi_roi_target" type="number" min="0" step="0.1" value={formData.kpi_roi_target} onChange={(e) => setFormData({ ...formData, kpi_roi_target: e.target.value })} placeholder="e.g. 150" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Submit row ───────────────────────────────────── */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-subtle px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedVisibility?.icon}
              <span className="hidden sm:inline">
                {selectedVisibility?.title} ·{" "}
                {formData.visibility === "public"
                  ? "Creators apply → you review → accept → set contract."
                  : "You invite creators → they accept → you set contract."}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Campaign
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
