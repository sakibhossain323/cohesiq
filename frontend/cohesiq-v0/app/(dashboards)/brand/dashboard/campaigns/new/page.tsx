"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { fetchApi } from "@/lib/api/client";
import { createCampaign } from "@/lib/api/campaigns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DELIVERABLE_DEFINITIONS } from "@/lib/deliverables";
import type { DeliverableCode, PlatformType } from "@/lib/types";
import { analyzeBriefAction, type BriefAnalysisResult } from "./_actions/analyze-brief";
import { STEPS, CAMPAIGN_DELIVERABLES_BY_PLATFORM, CAMPAIGN_PLATFORMS } from "./_components/constants";
import type { CampaignFormData, DeliverableFormState } from "./_components/types";
import { StepIntro } from "./_components/StepIntro";
import { StepBrief } from "./_components/StepBrief";
import { StepRequirements } from "./_components/StepRequirements";
import { StepGoals } from "./_components/StepGoals";
import { StepNav } from "./_components/StepNav";

// ── initial state ─────────────────────────────────────────────
const INITIAL_FORM: CampaignFormData = {
  title: "", description: "", visibility: "public",
  budget_per_creator_max: "", creator_min_followers: "1000", number_of_creators: "1",
  primary_niche_id: "", brand_category: "", application_deadline: "",
  hashtags: "", tracking_notes: "", required_platforms: ["youtube"],
  kpi_reach: "", kpi_engagement_rate: "", kpi_conversions: "", kpi_roi_target: "",
};

function initialDeliverableState(): DeliverableFormState {
  return { youtube_video: { selected: true, quantity: "1", notes: "" } };
}

const STEP_TITLES = ["", "Campaign Brief", "Requirements"];
const STEP_SUBS = ["", "Title, brief, niche, and reach.", "Platforms, deliverables, and budget."];

// ── page ──────────────────────────────────────────────────────
export default function NewCampaignPage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleReady, setRoleReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiMode, setAiMode] = useState<"idle" | "writing" | "done">("idle");
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const [formData, setFormData] = useState<CampaignFormData>(INITIAL_FORM);
  const [deliverableState, setDeliverableState] = useState<DeliverableFormState>(initialDeliverableState);

  const updateForm = (updates: Partial<CampaignFormData>) =>
    setFormData(prev => ({ ...prev, ...updates }));

  // ── auth guard ────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    async function check() {
      if (!isSignedIn) { router.replace("/onboarding"); return; }
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const me = await fetchApi<{ role?: string }>("/auth/me", { token });
        if (cancelled) return;
        if (me.role !== "brand") {
          setError("Campaigns can only be created from a brand account.");
          router.replace(me.role === "creator" ? "/creator/dashboard" : "/onboarding");
          return;
        }
        setRoleReady(true);
      } catch {
        if (!cancelled) setError("Could not verify your brand account. Please refresh and try again.");
      }
    }
    void check();
    return () => { cancelled = true; };
  }, [getToken, isLoaded, isSignedIn, router]);

  // ── AI brief ──────────────────────────────────────────────
  const handleAnalyzeBrief = async () => {
    setAiError(null);
    setAiSummary(null);
    setAiLoading(true);
    try {
      const result = await analyzeBriefAction(aiInput);
      setAiSummary(result.summary ?? "Analysis complete — fields pre-filled.");
      applyBriefResult(result);
      setAiMode("done");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Analysis failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const applyBriefResult = (result: BriefAnalysisResult) => {
    setFormData(prev => ({
      ...prev,
      ...(result.title && { title: result.title }),
      ...(result.description && { description: result.description }),
      ...(result.suggested_visibility && { visibility: result.suggested_visibility }),
      ...(result.primary_niche_id && { primary_niche_id: String(result.primary_niche_id) }),
      ...(result.budget_per_creator_max && { budget_per_creator_max: String(result.budget_per_creator_max) }),
      ...(result.number_of_creators && { number_of_creators: String(result.number_of_creators) }),
      ...(result.creator_min_followers && { creator_min_followers: String(result.creator_min_followers) }),
      ...(result.hashtags?.length && { hashtags: result.hashtags.join(", ") }),
      ...(result.tracking_notes && { tracking_notes: result.tracking_notes }),
      ...(result.kpi_targets?.reach && { kpi_reach: String(result.kpi_targets.reach) }),
      ...(result.kpi_targets?.engagement_rate && { kpi_engagement_rate: String(result.kpi_targets.engagement_rate) }),
      ...(result.kpi_targets?.conversions && { kpi_conversions: String(result.kpi_targets.conversions) }),
      ...(result.kpi_targets?.roi_target && { kpi_roi_target: String(result.kpi_targets.roi_target) }),
    }));
  };

  // ── step navigation ───────────────────────────────────────
  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (formData.title.trim().length < 3) return "Campaign title must be at least 3 characters.";
      if (formData.description.trim().length < 10) return "Brief must be at least 10 characters.";
    }
    if (step === 2) {
      if (isNaN(parseInt(formData.budget_per_creator_max)) || parseInt(formData.budget_per_creator_max) <= 0)
        return "Max budget must be a number greater than 0.";
      if (isNaN(parseInt(formData.number_of_creators)) || parseInt(formData.number_of_creators) < 1)
        return "Number of creators must be at least 1.";
      if (formData.required_platforms.length === 0) return "Select at least one platform.";
    }
    return null;
  };

  const goNext = () => {
    setError(null);
    const err = validateStep(currentStep);
    if (err) { setError(err); return; }
    setCurrentStep(s => s + 1);
    setCarouselIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (step: number) => {
    setError(null);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── platform / deliverable handlers ──────────────────────
  const togglePlatform = (platform: PlatformType) => {
    setFormData(prev => {
      const selected = prev.required_platforms.includes(platform);
      const next = selected
        ? prev.required_platforms.filter(p => p !== platform)
        : [...prev.required_platforms, platform];
      if (!selected) {
        const codes = CAMPAIGN_DELIVERABLES_BY_PLATFORM[platform] || [];
        if (codes[0] && !codes.some(c => deliverableState[c]?.selected)) {
          setDeliverableState(curr => ({
            ...curr,
            [codes[0]]: { selected: true, quantity: curr[codes[0]]?.quantity || "1", notes: curr[codes[0]]?.notes || "" },
          }));
        }
      }
      return { ...prev, required_platforms: next };
    });
  };

  const toggleDeliverable = (code: DeliverableCode) =>
    setDeliverableState(prev => {
      const cur = prev[code] || { selected: false, quantity: "1", notes: "" };
      return { ...prev, [code]: { ...cur, selected: !cur.selected } };
    });

  const updateDeliverable = (code: DeliverableCode, updates: Partial<{ quantity: string; notes: string }>) =>
    setDeliverableState(prev => ({ ...prev, [code]: { ...(prev[code] || { selected: false, quantity: "1", notes: "" }), ...updates } }));

  // ── submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!roleReady) { setError("Please wait while we verify brand access."); return; }

    const budget = parseInt(formData.budget_per_creator_max, 10);
    const numCreators = parseInt(formData.number_of_creators, 10);
    const minFollowers = parseInt(formData.creator_min_followers, 10);

    if (formData.title.trim().length < 3) { setError("Campaign title must be at least 3 characters long."); return; }
    if (formData.description.trim().length < 10) { setError("Campaign brief must be at least 10 characters long."); return; }
    if (isNaN(budget) || budget <= 0) { setError("Max budget per creator must be a valid number greater than 0."); return; }
    if (isNaN(numCreators) || numCreators < 1) { setError("Number of creators needed must be at least 1."); return; }
    if (isNaN(minFollowers) || minFollowers < 0) { setError("Minimum followers cannot be negative."); return; }
    if (formData.application_deadline) {
      const deadline = new Date(formData.application_deadline);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (deadline < today) { setError("Application deadline cannot be in the past."); return; }
    }
    if (formData.required_platforms.length === 0) { setError("Select at least one required platform."); return; }

    const selectedDeliverables = Object.entries(deliverableState)
      .filter(([, v]) => v?.selected)
      .map(([code, v]) => ({
        code: code as DeliverableCode,
        definition: DELIVERABLE_DEFINITIONS[code as DeliverableCode],
        quantity: parseInt(v?.quantity || "1", 10),
        notes: v?.notes.trim() ?? "",
      }))
      .filter(item => item.definition && formData.required_platforms.includes(item.definition.platform));

    const supportedPlatforms = formData.required_platforms.filter(p => CAMPAIGN_DELIVERABLES_BY_PLATFORM[p]?.length);
    const missing = supportedPlatforms.find(p => !selectedDeliverables.some(d => d.definition.platform === p));
    if (missing) {
      setError(`Select at least one ${CAMPAIGN_PLATFORMS.find(p => p.value === missing)?.label || missing} deliverable.`);
      return;
    }
    if (selectedDeliverables.some(d => isNaN(d.quantity) || d.quantity < 1)) {
      setError("Deliverable quantities must be at least 1."); return;
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
        ? formData.hashtags.split(",").map(h => h.trim().replace(/^#/, "")).filter(Boolean)
        : [];
      const newCampaign = await createCampaign({
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
        deliverable_requirements: selectedDeliverables.map(d => ({
          platform: d.definition.platform,
          deliverable_type: d.definition.legacyType,
          deliverable_code: d.code,
          quantity: d.quantity,
          notes: d.notes || undefined,
        })),
      }, token);
      router.push(`/brand/dashboard/campaigns/${newCampaign.id}`);
    } catch (err) {
      let msg = "Failed to create campaign. Please try again.";
      if (err instanceof Error) {
        msg = err.message;
        const match = err.message.match(/API error \(\d+\): (\{.*\})/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            if (Array.isArray(parsed.detail))
              msg = parsed.detail.map((d: { loc: string[]; msg: string }) => `${d.loc.slice(1).join(" ")}: ${d.msg}`).join(", ");
            else if (typeof parsed.detail === "string") msg = parsed.detail;
          } catch (_) { }
        }
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── shared outer shell (all steps) ───────────────────────
  return (
    <div className="bd-page relative overflow-hidden">
      {/* Gradient wash — same on every step */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 via-primary/5 to-transparent -z-10" />

      {/* Back to Campaigns — same position on every step */}
      <div className="absolute top-6 left-6 md:left-12 lg:left-16 z-20">
        <Link
          href="/brand/dashboard/campaigns"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>
      </div>

      {/* ── Step 0: intro ──────────────────────────────────── */}
      {currentStep === 0 && (
        <StepIntro
          aiInput={aiInput}
          aiMode={aiMode}
          aiLoading={aiLoading}
          aiError={aiError}
          aiSummary={aiSummary}
          error={error}
          onAiInputChange={setAiInput}
          onAnalyze={handleAnalyzeBrief}
          onRestart={() => { setAiMode("writing"); setAiSummary(null); setAiInput(""); }}
          onProceed={() => setCurrentStep(1)}
          onStartFromScratch={() => setCurrentStep(1)}
        />
      )}

      {/* ── Steps 1–3: horizontal stepper + canvas ─────────── */}
      {currentStep > 0 && (
        <div className="cc-shell">
          {/* Horizontal step progress */}
          <div className="cc-hstepper">
            {STEPS.map((step, idx) => {
              const state = step.id === currentStep ? "active" : step.id < currentStep ? "done" : "";
              return (
                <Fragment key={step.id}>
                  <button
                    type="button"
                    disabled={step.id > currentStep}
                    onClick={() => { if (step.id < currentStep) goToStep(step.id); }}
                    className={cn("cc-hstep", state)}
                  >
                    <span className="cc-node">
                      {step.id < currentStep ? <Check className="h-4 w-4" /> : String(step.id).padStart(2, "0")}
                    </span>
                    <span className="cc-hstep-label">{step.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={cn("cc-hstep-line", step.id < currentStep ? "done" : "")} />
                  )}
                </Fragment>
              );
            })}
          </div>

          {/* Canvas */}
          <div className="cc-canvas" key={currentStep}>
            <div className="cc-eyebrow">Step {currentStep} of 2</div>
            <h1 className="cc-title">{STEP_TITLES[currentStep]}</h1>


            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!roleReady && !error && (
              <div className="mt-6 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Checking brand access…
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div className="cc-fields">
                {currentStep === 1 && (
                  <StepBrief
                    title={formData.title} description={formData.description}
                    hashtags={formData.hashtags}
                    primary_niche_id={formData.primary_niche_id} brand_category={formData.brand_category}
                    visibility={formData.visibility}
                    onChange={updateForm}
                  />
                )}
                {currentStep === 2 && (
                  <StepRequirements
                    required_platforms={formData.required_platforms}
                    budget_per_creator_max={formData.budget_per_creator_max}
                    number_of_creators={formData.number_of_creators}
                    creator_min_followers={formData.creator_min_followers}
                    application_deadline={formData.application_deadline}
                    deliverableState={deliverableState}
                    carouselIdx={carouselIdx}
                    onCarouselChange={setCarouselIdx}
                    onPlatformToggle={togglePlatform}
                    onToggleDeliverable={toggleDeliverable}
                    onUpdateDeliverable={updateDeliverable}
                    onChange={updateForm}
                  />
                )}
              </div>
              <StepNav
                currentStep={currentStep} isSubmitting={isSubmitting} roleReady={roleReady}
                visibility={formData.visibility} onNext={goNext}
                onBack={() => goToStep(currentStep - 1)}
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
