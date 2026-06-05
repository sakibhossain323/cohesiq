"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { createCampaign, NICHE_MAP } from "@/lib/api/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Megaphone, Globe, Lock, Target, Users, Calendar, Hash } from "lucide-react";
import { BriefAnalyzerCard } from "./_components/BriefAnalyzerCard";
import type { BriefAnalysisResult } from "./_actions/analyze-brief";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Visibility = "public" | "private";

const VISIBILITY_OPTIONS: { value: Visibility; icon: React.ReactNode; title: string; description: string; hint: string }[] = [
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
    application_deadline: "",
    hashtags: "",
    tracking_notes: "",
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
        required_platforms: ["youtube"],
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/brand/dashboard/campaigns"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Megaphone className="h-8 w-8 text-primary" />
          Create New Campaign
        </h1>
        <p className="mt-2 text-muted-foreground">
          Define your brief and find the right creators. You&apos;ll set collaboration terms after accepting someone.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* AI brief analyzer */}
      <BriefAnalyzerCard onResult={handleBriefResult} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Card 1: Brief ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Brief</CardTitle>
            <CardDescription>
              Describe what you need. Creators use this to decide whether to apply.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="primary_niche">Target Niche</Label>
              <Select
                value={formData.primary_niche_id}
                onValueChange={(value) => setFormData({ ...formData, primary_niche_id: value })}
              >
                <SelectTrigger id="primary_niche">
                  <SelectValue placeholder="Select primary niche (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NICHE_MAP).map(([id, name]) => (
                    <SelectItem key={id} value={id} className="capitalize">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 2: Reach strategy ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Reach Strategy</CardTitle>
            <CardDescription>
              Choose how creators will find and join this campaign.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {VISIBILITY_OPTIONS.map((option) => {
              const isSelected = formData.visibility === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: option.value })}
                  className={cn(
                    "w-full text-left rounded-lg border p-4 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-0.5", isSelected ? "text-primary" : "text-muted-foreground")}>
                      {option.icon}
                    </span>
                    <div className="space-y-0.5">
                      <p className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-foreground")}>
                        {option.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{option.hint}</p>
                    </div>
                    <div className="ml-auto shrink-0">
                      <span
                        className={cn(
                          "flex h-4 w-4 rounded-full border-2 mt-0.5",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                        )}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* ── Card 3: Requirements & Budget ────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Creator Requirements & Budget
            </CardTitle>
            <CardDescription>Set the bar for who qualifies and what you&apos;re willing to pay.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <p className="text-xs text-muted-foreground">Exact payment terms are set on the contract, not here.</p>
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
          </CardContent>
        </Card>

        {/* ── Card 4: Goals & Tracking ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Goals & Tracking
            </CardTitle>
            <CardDescription>Optional success metrics and campaign tracking details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label className="mb-3 block">KPI Targets</Label>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kpi_reach" className="text-xs text-muted-foreground">Target Reach</Label>
                  <Input
                    id="kpi_reach"
                    type="number"
                    min="0"
                    value={formData.kpi_reach}
                    onChange={(e) => setFormData({ ...formData, kpi_reach: e.target.value })}
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kpi_engagement_rate" className="text-xs text-muted-foreground">Engagement Rate (%)</Label>
                  <Input
                    id="kpi_engagement_rate"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.kpi_engagement_rate}
                    onChange={(e) => setFormData({ ...formData, kpi_engagement_rate: e.target.value })}
                    placeholder="e.g. 3.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kpi_conversions" className="text-xs text-muted-foreground">Target Conversions</Label>
                  <Input
                    id="kpi_conversions"
                    type="number"
                    min="0"
                    value={formData.kpi_conversions}
                    onChange={(e) => setFormData({ ...formData, kpi_conversions: e.target.value })}
                    placeholder="e.g. 200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kpi_roi_target" className="text-xs text-muted-foreground">ROI Target (%)</Label>
                  <Input
                    id="kpi_roi_target"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.kpi_roi_target}
                    onChange={(e) => setFormData({ ...formData, kpi_roi_target: e.target.value })}
                    placeholder="e.g. 150"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Submission row ────────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedVisibility?.icon}
            <span>{selectedVisibility?.title} · What happens next: {formData.visibility === "public" ? "Creators apply → you review → accept → set contract terms." : "You invite creators → they accept → you set contract terms."}</span>
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
  );
}
