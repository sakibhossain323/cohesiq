"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getCampaignById, updateCampaign, NICHE_MAP } from "@/lib/api/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Megaphone } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "public",
    campaign_type: "",
    budget_per_creator_max: "",
    creator_min_followers: "",
    number_of_creators: "",
    primary_niche_id: "",
    application_deadline: "",
    hashtags: "",
    tracking_notes: "",
    kpi_reach: "",
    kpi_engagement_rate: "",
    kpi_conversions: "",
    kpi_roi_target: "",
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function loadCampaign() {
      setIsLoading(true);
      try {
        const campaignData = await getCampaignById(id);
        if (campaignData) {
          const kpi = (campaignData as any).kpi_targets;
          setFormData({
            title: campaignData.title,
            description: campaignData.description || "",
            visibility: (campaignData as any).visibility || "public",
            campaign_type: (campaignData as any).campaign_type || "",
            budget_per_creator_max: campaignData.budget_per_creator_max ? campaignData.budget_per_creator_max.toString() : "",
            creator_min_followers: campaignData.creator_min_followers ? campaignData.creator_min_followers.toString() : "",
            number_of_creators: (campaignData as any).number_of_creators ? (campaignData as any).number_of_creators.toString() : "",
            primary_niche_id: (campaignData as any).primary_niche_id ? (campaignData as any).primary_niche_id.toString() : "",
            application_deadline: campaignData.application_deadline ? campaignData.application_deadline.split('T')[0] : "",
            hashtags: ((campaignData as any).hashtags ?? []).join(", "),
            tracking_notes: (campaignData as any).tracking_notes || "",
            kpi_reach: kpi?.reach != null ? String(kpi.reach) : "",
            kpi_engagement_rate: kpi?.engagement_rate != null ? String(kpi.engagement_rate) : "",
            kpi_conversions: kpi?.conversions != null ? String(kpi.conversions) : "",
            kpi_roi_target: kpi?.roi_target != null ? String(kpi.roi_target) : "",
          });
        }
      } catch (err) {
        console.error("Failed to load campaign:", err);
        setError("Failed to load campaign data.");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCampaign();
  }, [id, isLoaded, isSignedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
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
      // Set hours/minutes/seconds/ms to 0 to compare dates only
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

      const kpiTargets = {
        reach: formData.kpi_reach ? parseInt(formData.kpi_reach, 10) : null,
        engagement_rate: formData.kpi_engagement_rate ? parseFloat(formData.kpi_engagement_rate) : null,
        conversions: formData.kpi_conversions ? parseInt(formData.kpi_conversions, 10) : null,
        roi_target: formData.kpi_roi_target ? parseFloat(formData.kpi_roi_target) : null,
      };
      const hasKpi = Object.values(kpiTargets).some(v => v !== null);

      const payload = {
        title: formData.title,
        description: formData.description,
        visibility: formData.visibility,
        campaign_type: formData.campaign_type || null,
        budget_per_creator_max: budget,
        creator_min_followers: minFollowers,
        number_of_creators: numCreators,
        primary_niche_id: formData.primary_niche_id ? parseInt(formData.primary_niche_id, 10) : undefined,
        application_deadline: formData.application_deadline || null,
        hashtags: formData.hashtags
          ? formData.hashtags.split(",").map(h => h.trim()).filter(Boolean)
          : [],
        tracking_notes: formData.tracking_notes || null,
        kpi_targets: hasKpi ? kpiTargets : null,
      };

      const updatedCampaign = await updateCampaign(id, payload, token);
      router.push(`/brand/dashboard/campaigns/${updatedCampaign.id}`);
    } catch (err) {
      console.error("Failed to update campaign", err);
      let errorMessage = "Failed to update campaign. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
        const match = err.message.match(/API error \(\d+\): (\{.*\})/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            if (parsed.detail && Array.isArray(parsed.detail)) {
              errorMessage = parsed.detail.map((d: any) => `${d.loc.slice(1).join(' ')}: ${d.msg}`).join(', ');
            } else if (typeof parsed.detail === "string") {
              errorMessage = parsed.detail;
            }
          } catch (_) {
            // Keep original message if parsing failed
          }
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link 
          href={`/brand/dashboard/campaigns/${id}`} 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaign
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Megaphone className="h-8 w-8 text-primary" />
          Edit Campaign
        </h1>
        <p className="mt-2 text-muted-foreground">
          Update your campaign details and requirements.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
            <CardDescription>Give your campaign a clear title and description.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title</Label>
              <Input 
                id="title" 
                required 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Summer Tech Review 2026"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Campaign Brief</Label>
              <Textarea 
                id="description" 
                required 
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                  {Object.entries(NICHE_MAP).map(([nicheId, name]) => (
                    <SelectItem key={nicheId} value={nicheId} className="capitalize">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select 
                value={formData.visibility} 
                onValueChange={(val) => setFormData({...formData, visibility: val})}
              >
                <SelectTrigger id="visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public (Appears on Discovery Board)</SelectItem>
                  <SelectItem value="private">Private (Invite-Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Campaign Type & Goals</CardTitle>
            <CardDescription>Define the collaboration model, KPI targets, and tracking notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign_type">Campaign Type</Label>
              <Select
                value={formData.campaign_type || "none"}
                onValueChange={(val) => setFormData({ ...formData, campaign_type: val === "none" ? "" : val })}
              >
                <SelectTrigger id="campaign_type">
                  <SelectValue placeholder="Select campaign type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="paid_content">Paid Content</SelectItem>
                  <SelectItem value="product_gifting">Product Gifting</SelectItem>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                  <SelectItem value="brand_ambassador">Brand Ambassador</SelectItem>
                  <SelectItem value="talent_booking">Talent Booking</SelectItem>
                  <SelectItem value="ugc_only">UGC Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hashtags">Campaign Hashtags</Label>
              <Input
                id="hashtags"
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                placeholder="#BrandName, #CampaignTag (comma-separated)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking_notes">Tracking Notes</Label>
              <Textarea
                id="tracking_notes"
                rows={2}
                value={formData.tracking_notes}
                onChange={(e) => setFormData({ ...formData, tracking_notes: e.target.value })}
                placeholder="e.g. Use UTM links, submit content 48 h before publish..."
              />
            </div>

            <div className="space-y-2">
              <Label>KPI Targets <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
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
                <div className="space-y-1">
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
                <div className="space-y-1">
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
                <div className="space-y-1">
                  <Label htmlFor="kpi_roi_target" className="text-xs text-muted-foreground">ROI Target (×)</Label>
                  <Input
                    id="kpi_roi_target"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.kpi_roi_target}
                    onChange={(e) => setFormData({ ...formData, kpi_roi_target: e.target.value })}
                    placeholder="e.g. 2.5"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Requirements & Budget</CardTitle>
            <CardDescription>Set your expectations for creators.</CardDescription>
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
                  onChange={(e) => setFormData({...formData, budget_per_creator_max: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creators">Number of Creators Needed</Label>
                <Input 
                  id="creators" 
                  type="number" 
                  required 
                  min="1"
                  value={formData.number_of_creators}
                  onChange={(e) => setFormData({...formData, number_of_creators: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, creator_min_followers: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input 
                  id="deadline" 
                  type="date" 
                  value={formData.application_deadline}
                  onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
