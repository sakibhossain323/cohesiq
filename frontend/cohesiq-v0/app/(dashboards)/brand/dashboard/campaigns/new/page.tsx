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
import { ArrowLeft, Loader2, Megaphone } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function NewCampaignPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "public",
    budget_per_creator_max: "",
    creator_min_followers: "1000",
    number_of_creators: "1",
    primary_niche_id: "",
    application_deadline: "",
  });

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

      const payload = {
        ...formData,
        budget_per_creator_max: budget,
        creator_min_followers: minFollowers,
        number_of_creators: numCreators,
        primary_niche_id: formData.primary_niche_id ? parseInt(formData.primary_niche_id, 10) : undefined,
        required_platforms: ["youtube"], // Simplified for now
        application_deadline: formData.application_deadline || null,
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
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
          Define your campaign brief to start finding the perfect creators.
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
                  {Object.entries(NICHE_MAP).map(([id, name]) => (
                    <SelectItem key={id} value={id} className="capitalize">
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
            Create Campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
