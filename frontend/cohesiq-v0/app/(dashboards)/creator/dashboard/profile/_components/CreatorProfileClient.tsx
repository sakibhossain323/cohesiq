"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlatformBadge, getPlatformLabel } from "@/components/shared/PlatformBadge";
import { RateCardTable } from "@/components/creator/RateCardTable";
import { FollowerCount } from "@/components/shared/FollowerCount";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Star, Loader2, Share2, RefreshCw, Edit2, Users, Activity, Globe, BadgeCheck, Wand2 } from "lucide-react";
import { DELIVERABLE_DEFINITIONS, getDeliverableLabel, resolveDeliverableCode } from "@/lib/deliverables";
import { formatBDT } from "@/lib/utils";
import type { CreatorRateCard, CreatorSocialProfile, DeliverableCode, DeliverableType, PlatformType } from "@/lib/types";
import { addPlatformAction, updatePlatformAction, deletePlatformAction, updateRateCardAction, createRateCardAction } from "../_actions/profile-actions";

const PLATFORMS: { value: PlatformType; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter_x", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "snapchat", label: "Snapchat" },
  { value: "other", label: "Other" },
];

const GENDERS = [
  { value: "female", label: "Female Majority" },
  { value: "male", label: "Male Majority" },
  { value: "mixed", label: "Mixed/Even" },
];

interface PlatformFormState {
  id?: string;
  platform: PlatformType | "";
  handle: string;
  profile_url: string;
  follower_count: string;
  following_count: string;
  avg_views_per_post: string;
  avg_likes_per_post: string;
  avg_comments_per_post: string;
  avg_shares_per_post: string;
  engagement_rate: string;
  posts_per_month: string;
  audience_country_primary: string;
  audience_city_primary: string;
  audience_age_range_min: string;
  audience_age_range_max: string;
  audience_gender_majority: string;
  audience_gender_pct: string;
  content_languages: string;
  is_monetized: boolean;
  has_verified_badge: boolean;
}

const EMPTY_FORM: PlatformFormState = {
  platform: "",
  handle: "",
  profile_url: "",
  follower_count: "",
  following_count: "",
  avg_views_per_post: "",
  avg_likes_per_post: "",
  avg_comments_per_post: "",
  avg_shares_per_post: "",
  engagement_rate: "",
  posts_per_month: "",
  audience_country_primary: "",
  audience_city_primary: "",
  audience_age_range_min: "",
  audience_age_range_max: "",
  audience_gender_majority: "",
  audience_gender_pct: "",
  content_languages: "en",
  is_monetized: false,
  has_verified_badge: false,
};

function toFormState(p: CreatorSocialProfile): PlatformFormState {
  return {
    id: p.id,
    platform: p.platform,
    handle: p.handle.startsWith('@') ? p.handle.substring(1) : p.handle,
    profile_url: p.profile_url || "",
    follower_count: p.follower_count?.toString() || "",
    following_count: p.following_count?.toString() || "",
    avg_views_per_post: p.avg_views_per_post?.toString() || "",
    avg_likes_per_post: p.avg_likes_per_post?.toString() || "",
    avg_comments_per_post: p.avg_comments_per_post?.toString() || "",
    avg_shares_per_post: p.avg_shares_per_post?.toString() || "",
    engagement_rate: p.engagement_rate?.toString() || "",
    posts_per_month: p.posts_per_month?.toString() || "",
    audience_country_primary: p.audience_country_primary || "",
    audience_city_primary: p.audience_city_primary || "",
    audience_age_range_min: p.audience_age_range_min?.toString() || "",
    audience_age_range_max: p.audience_age_range_max?.toString() || "",
    audience_gender_majority: p.audience_gender_majority || "",
    audience_gender_pct: p.audience_gender_pct?.toString() || "",
    content_languages: p.content_languages?.join(",") || "en",
    is_monetized: p.is_monetized || false,
    has_verified_badge: p.has_verified_badge || false,
  };
}

function fromFormState(f: PlatformFormState): any {
  return {
    platform: f.platform,
    handle: f.handle,
    profile_url: f.profile_url || undefined,
    follower_count: f.follower_count ? parseInt(f.follower_count) : undefined,
    following_count: f.following_count ? parseInt(f.following_count) : undefined,
    avg_views_per_post: f.avg_views_per_post ? parseInt(f.avg_views_per_post) : undefined,
    avg_likes_per_post: f.avg_likes_per_post ? parseInt(f.avg_likes_per_post) : undefined,
    avg_comments_per_post: f.avg_comments_per_post ? parseInt(f.avg_comments_per_post) : undefined,
    avg_shares_per_post: f.avg_shares_per_post ? parseInt(f.avg_shares_per_post) : undefined,
    engagement_rate: f.engagement_rate ? parseFloat(f.engagement_rate) : undefined,
    posts_per_month: f.posts_per_month ? parseFloat(f.posts_per_month) : undefined,
    audience_country_primary: f.audience_country_primary || undefined,
    audience_city_primary: f.audience_city_primary || undefined,
    audience_age_range_min: f.audience_age_range_min ? parseInt(f.audience_age_range_min) : undefined,
    audience_age_range_max: f.audience_age_range_max ? parseInt(f.audience_age_range_max) : undefined,
    audience_gender_majority: f.audience_gender_majority || undefined,
    audience_gender_pct: f.audience_gender_pct ? parseInt(f.audience_gender_pct) : undefined,
    content_languages: f.content_languages ? f.content_languages.split(",").map(s => s.trim()) : ["en"],
    is_monetized: f.is_monetized,
    has_verified_badge: f.has_verified_badge,
  };
}

interface CreatorProfileClientProps {
  creatorId: string;
  initialProfiles: CreatorSocialProfile[];
  initialRateCards: CreatorRateCard[];
}

type RateCardEditState = {
  price: string;
  isNegotiable: boolean;
};

type SuggestedRateCard = {
  platform: PlatformType;
  deliverable_code: DeliverableCode;
  deliverable_type: DeliverableType;
  price_bdt: number;
  suggested_price_bdt: number;
  includes: string;
  turnaround_days: number;
  is_negotiable: boolean;
};

const RATE_SPECS: Partial<Record<PlatformType, Array<{
  code: DeliverableCode;
  minimum: number;
  maximum: number;
  turnaroundDays: number;
}>>> = {
  youtube: [
    { code: "youtube_short", minimum: 1_000, maximum: 10_000, turnaroundDays: 3 },
    { code: "youtube_video", minimum: 5_000, maximum: 20_000, turnaroundDays: 7 },
    { code: "youtube_live", minimum: 10_000, maximum: 50_000, turnaroundDays: 5 },
  ],
  instagram: [
    { code: "instagram_story", minimum: 1_000, maximum: 6_000, turnaroundDays: 2 },
    { code: "instagram_feed", minimum: 1_500, maximum: 8_000, turnaroundDays: 3 },
    { code: "instagram_reel", minimum: 2_000, maximum: 15_000, turnaroundDays: 4 },
    { code: "instagram_live", minimum: 10_000, maximum: 50_000, turnaroundDays: 5 },
  ],
  tiktok: [
    { code: "tiktok_story", minimum: 1_000, maximum: 6_000, turnaroundDays: 2 },
    { code: "tiktok_video", minimum: 2_000, maximum: 14_000, turnaroundDays: 4 },
    { code: "tiktok_live", minimum: 10_000, maximum: 50_000, turnaroundDays: 5 },
  ],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundToNearest(value: number, nearest = 500) {
  return Math.max(nearest, Math.round(value / nearest) * nearest);
}

function priceRatio(followers: number | undefined) {
  const value = Math.max(followers ?? 0, 1);
  const normalized = (Math.log10(value) - Math.log10(5_000)) / (Math.log10(10_000_000) - Math.log10(5_000));
  return clamp(normalized, 0, 1);
}

function suggestedPrice(followers: number | undefined, minimum: number, maximum: number) {
  const ratio = priceRatio(followers);
  return roundToNearest(minimum + ((maximum - minimum) * ratio));
}

function buildSuggestedRateCards(profiles: CreatorSocialProfile[], existingCards: CreatorRateCard[]): SuggestedRateCard[] {
  const existingCodes = new Set(
    existingCards
      .map(card => resolveDeliverableCode(card.platform, card.deliverable_code, card.deliverable_type))
      .filter(Boolean),
  );

  return profiles.flatMap(profile => {
    const specs = RATE_SPECS[profile.platform] ?? [];
    return specs
      .filter(spec => !existingCodes.has(spec.code))
      .map(spec => {
        const definition = DELIVERABLE_DEFINITIONS[spec.code];
        const price = suggestedPrice(profile.follower_count, spec.minimum, spec.maximum);
        return {
          platform: definition.platform,
          deliverable_code: definition.code,
          deliverable_type: definition.legacyType,
          price_bdt: price,
          suggested_price_bdt: price,
          includes: `1 ${definition.label}`,
          turnaround_days: spec.turnaroundDays,
          is_negotiable: true,
        };
      });
  });
}

export function CreatorProfileClient({ creatorId, initialProfiles, initialRateCards }: CreatorProfileClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [profiles, setProfiles] = useState<CreatorSocialProfile[]>(initialProfiles);
  const [rateCards, setRateCards] = useState<CreatorRateCard[]>(initialRateCards);
  
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<PlatformFormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [showRateCardDialog, setShowRateCardDialog] = useState(false);
  const [selectedRateCard, setSelectedRateCard] = useState<CreatorRateCard | null>(null);
  const [rateCardEditState, setRateCardEditState] = useState<RateCardEditState>({ price: "", isNegotiable: false });
  const suggestedRateCards = buildSuggestedRateCards(profiles, rateCards);

  const handleOpenAdd = () => {
    setDialogMode("add");
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const handleOpenEdit = (profile: CreatorSocialProfile) => {
    setDialogMode("edit");
    setForm(toFormState(profile));
    setShowDialog(true);
  };

  const handleConnectTikTok = () => {
    setShowDialog(false);
    router.push("/creator/dashboard/connect-tiktok?autoStart=true");
  };

  const handleConnectYouTube = () => {
    setShowDialog(false);
    router.push("/creator/dashboard/connect-youtube?autoStart=true");
  };

  const handleOpenRateCardEdit = (rateCard: CreatorRateCard) => {
    setSelectedRateCard(rateCard);
    setRateCardEditState({
      price: rateCard.price_bdt.toString(),
      isNegotiable: rateCard.is_negotiable,
    });
    setShowRateCardDialog(true);
  };

  const handleCloseRateCardDialog = () => {
    setShowRateCardDialog(false);
    setSelectedRateCard(null);
  };

  const handleSaveRateCard = () => {
    if (!selectedRateCard) return;
    const price = parseInt(rateCardEditState.price, 10);
    if (Number.isNaN(price) || price <= 0) {
      toast({ title: "Invalid price", description: "Please enter a valid BDT price.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const payload = {
        price_bdt: price,
        is_negotiable: rateCardEditState.isNegotiable,
      };

      const result = await updateRateCardAction(creatorId, selectedRateCard.id, payload);
      if (result.success && result.rateCard) {
        setRateCards(prev => prev.map(card => card.id === selectedRateCard.id ? result.rateCard : card));
        toast({ title: "Rate card updated", description: "Your pricing has been saved." });
        handleCloseRateCardDialog();
      } else {
        toast({ title: "Failed to update rate card", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleCreateSuggestedRateCards = () => {
    if (suggestedRateCards.length === 0) return;

    startTransition(async () => {
      const created: CreatorRateCard[] = [];
      for (const suggestion of suggestedRateCards) {
        const result = await createRateCardAction(creatorId, suggestion);
        if (result.success && result.rateCard) {
          created.push(result.rateCard);
        } else {
          toast({ title: "Failed to create rate cards", description: result.error, variant: "destructive" });
          return;
        }
      }

      setRateCards(prev => [...prev, ...created]);
      toast({
        title: "Suggested rate cards created",
        description: "Review and adjust the prices anytime from your profile.",
      });
    });
  };

  const handleSave = () => {
    if (!form.platform || !form.handle) return;
    
    startTransition(async () => {
      const payload = fromFormState(form);

      if (dialogMode === "add") {
        payload.is_primary_platform = profiles.length === 0;
        const result = await addPlatformAction(creatorId, payload);
        if (result.success && result.platform) {
          setProfiles(prev => [...prev, result.platform]);
          toast({ title: "Platform added", description: `${getPlatformLabel(form.platform as PlatformType)} connected successfully.` });
          setShowDialog(false);
        } else {
          toast({ title: "Failed to add platform", description: result.error, variant: "destructive" });
        }
      } else if (dialogMode === "edit" && form.id) {
        const result = await updatePlatformAction(creatorId, form.id, payload);
        if (result.success && result.platform) {
          setProfiles(prev => prev.map(p => p.id === form.id ? result.platform : p));
          toast({ title: "Platform updated", description: `${getPlatformLabel(form.platform as PlatformType)} details saved.` });
          setShowDialog(false);
        } else {
          toast({ title: "Failed to update platform", description: result.error, variant: "destructive" });
        }
      }
    });
  };

  const handleDelete = (platformId: string, platformName: PlatformType) => {
    setDeletingId(platformId);
    startTransition(async () => {
      const result = await deletePlatformAction(creatorId, platformId);
      if (result.success) {
        setProfiles(prev => prev.filter(p => p.id !== platformId));
        toast({ title: "Platform removed", description: `${getPlatformLabel(platformName)} has been disconnected.` });
      } else {
        toast({ title: "Failed to remove platform", description: result.error, variant: "destructive" });
      }
      setDeletingId(null);
    });
  };

  const handleSync = async (platformId: string, platformName: PlatformType) => {
    if (platformName === "youtube") {
      router.push("/creator/dashboard/connect-youtube?autoStart=true");
      return;
    }
    if (platformName === "tiktok") {
      router.push("/creator/dashboard/connect-tiktok?autoStart=true");
      return;
    }

    setSyncingId(platformId);
    try {
      await new Promise(res => setTimeout(res, 1000));
      toast({ 
        title: "Sync Coming Soon", 
        description: `Automated sync for ${getPlatformLabel(platformName)} is currently in development. You can update metrics manually by clicking Edit.`,
      });
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Platforms</h1>
          </div>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            This acts as your Media Kit. Keep your metrics up to date—brands filter campaigns based on these exact numbers.
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Platform
        </Button>
      </div>

      {/* Platform Cards */}
      {profiles.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <Share2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium text-foreground text-lg">No platforms connected</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              Add your social media profiles to start receiving brand invitations and matching with campaigns.
            </p>
            <Button className="mt-6" onClick={handleOpenAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Platform
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {profiles
            .sort((a, b) => (b.is_primary_platform ? 1 : 0) - (a.is_primary_platform ? 1 : 0))
            .map(profile => (
              <Card key={profile.id} className={`overflow-hidden ${profile.is_primary_platform ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
                <div className="flex flex-col md:flex-row">
                  {/* Left Column */}
                  <div className="md:w-1/3 bg-muted/20 p-6 border-b md:border-b-0 md:border-r border-border flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={profile.platform} showLabel />
                        {profile.is_primary_platform && (
                          <Badge variant="default" className="text-xs h-5 px-1.5 py-0">
                            <Star className="mr-1 h-3 w-3" />
                            Primary
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Handle</p>
                      <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        {profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`}
                        {(profile.has_verified_badge || profile.is_api_verified) && (
                          <BadgeCheck className="h-5 w-5 text-primary" />
                        )}
                      </h3>
                      {profile.is_api_verified && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          API verified
                        </Badge>
                      )}
                      {profile.profile_url && (
                        <a href={profile.profile_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block truncate max-w-[250px]">
                          {profile.profile_url}
                        </a>
                      )}
                    </div>

                    <div className="mt-auto pt-6 flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(profile)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleSync(profile.id, profile.platform)}
                        disabled={syncingId === profile.id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${syncingId === profile.id ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDelete(profile.id, profile.platform)}
                        disabled={deletingId === profile.id || isPending}
                      >
                        {deletingId === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="md:w-2/3 p-6 flex flex-col gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Performance Metrics</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-muted/10 rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Followers</p>
                          <FollowerCount count={profile.follower_count ?? 0} className="font-bold text-lg" />
                        </div>
                        <div className="bg-muted/10 rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                          <p className="font-bold text-lg">{profile.engagement_rate ?? 0}%</p>
                        </div>
                        <div className="bg-muted/10 rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Avg Views</p>
                          <FollowerCount count={profile.avg_views_per_post ?? 0} className="font-bold text-lg" />
                        </div>
                        <div className="bg-muted/10 rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Posts/Month</p>
                          <p className="font-bold text-lg">{profile.posts_per_month ?? 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-border">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Audience</h4>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Age Range:</span>
                            <span className="font-medium">{profile.audience_age_range_min || '?'} - {profile.audience_age_range_max || '?'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Gender:</span>
                            <span className="font-medium capitalize">{profile.audience_gender_majority || 'Unknown'} {profile.audience_gender_pct ? `(${profile.audience_gender_pct}%)` : ''}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Top Location:</span>
                            <span className="font-medium">{profile.audience_country_primary || 'Global'} {profile.audience_city_primary ? `(${profile.audience_city_primary})` : ''}</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Profile Details</h4>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Languages:</span>
                            <span className="font-medium uppercase">{profile.content_languages.join(', ')}</span>
                          </li>
                          <li className="flex justify-between items-center mt-1">
                            <span className="text-muted-foreground">Monetized:</span>
                            {profile.is_monetized ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 py-0 h-5">Yes</Badge>
                            ) : (
                              <span className="font-medium text-muted-foreground">No</span>
                            )}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Rate Cards</h2>
            <p className="text-sm text-muted-foreground">
              Update your pricing directly from your creator profile. Suggested rates are based on your connected platform followers.
            </p>
          </div>
          {suggestedRateCards.length > 0 && (
            <Button onClick={handleCreateSuggestedRateCards} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Create Suggested Rates
            </Button>
          )}
        </div>
        <RateCardTable rateCards={rateCards} onEdit={handleOpenRateCardEdit} />
        {suggestedRateCards.length > 0 && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
            <div className="mb-3 flex items-start gap-3">
              <Wand2 className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Suggested missing rate cards</p>
                <p className="text-xs text-muted-foreground">
                  These are editable starting prices. We use them during campaign matching to calculate package cost.
                </p>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {suggestedRateCards.map(card => (
                <div key={card.deliverable_code} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {getDeliverableLabel(card.platform, card.deliverable_code, card.deliverable_type)}
                    </p>
                    <p className="text-xs text-muted-foreground">{getPlatformLabel(card.platform)} · {card.turnaround_days} days</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-foreground">{formatBDT(card.price_bdt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Dialog open={showRateCardDialog} onOpenChange={handleCloseRateCardDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Rate Card</DialogTitle>
            <DialogDescription>
              Adjust your current price and negotiable status for this rate card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <p className="text-sm text-muted-foreground">Platform</p>
              <p className="mt-1 text-base font-semibold">{selectedRateCard ? getPlatformLabel(selectedRateCard.platform) : "-"}</p>
              <p className="text-sm text-muted-foreground">{selectedRateCard ? getDeliverableLabel(selectedRateCard.platform, selectedRateCard.deliverable_code, selectedRateCard.deliverable_type) : "-"}</p>
              {selectedRateCard?.suggested_price_bdt && (
                <p className="mt-2 text-xs text-muted-foreground">Suggested: {formatBDT(selectedRateCard.suggested_price_bdt)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate_price">Price (BDT)</Label>
              <Input
                id="rate_price"
                type="number"
                value={rateCardEditState.price}
                onChange={e => setRateCardEditState(prev => ({ ...prev, price: e.target.value }))}
                placeholder="12000"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">Negotiable</p>
                <p className="text-xs text-muted-foreground">Allow brands to negotiate this rate.</p>
              </div>
              <Switch
                checked={rateCardEditState.isNegotiable}
                onCheckedChange={value => setRateCardEditState(prev => ({ ...prev, isNegotiable: value }))}
              />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={handleCloseRateCardDialog} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveRateCard} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Rate Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Form */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Connect Platform" : "Edit Platform Details"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "add" ? "Add your profile details." : "Update your metrics to stay competitive."}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="stats">Performance</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-1 py-4">
              <TabsContent value="basic" className="space-y-4 m-0">
                {dialogMode === "add" && (
                  <div className="space-y-3 mb-6">
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <PlatformBadge platform="youtube" />
                          <div>
                            <p className="font-medium text-foreground">Sync with YouTube</p>
                            <p className="text-sm text-muted-foreground">
                              Securely connect your channel to import stats and live metrics.
                            </p>
                          </div>
                        </div>
                        <Button type="button" variant="secondary" onClick={handleConnectYouTube} className="shrink-0">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync YouTube
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <PlatformBadge platform="tiktok" />
                          <div>
                            <p className="font-medium text-foreground">Sync with TikTok</p>
                            <p className="text-sm text-muted-foreground">
                              Verify your TikTok account and import profile metrics automatically.
                            </p>
                          </div>
                        </div>
                        <Button type="button" variant="secondary" onClick={handleConnectTikTok} className="shrink-0">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync TikTok
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative pt-4 pb-2">
                      <div className="absolute inset-0 flex items-center pt-2">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or add manually</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Platform *</Label>
                  <Select
                    value={form.platform}
                    onValueChange={v => setForm(f => ({ ...f, platform: v as PlatformType }))}
                    disabled={dialogMode === "edit"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handle">Handle / Username *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                    <Input
                      id="handle"
                      placeholder="yourhandle"
                      value={form.handle}
                      onChange={e => {
                        let val = e.target.value;
                        if (val.startsWith('@')) val = val.substring(1);
                        setForm(f => ({ ...f, handle: val }));
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_url">Profile URL</Label>
                  <Input
                    id="profile_url"
                    placeholder="https://platform.com/@handle"
                    value={form.profile_url}
                    onChange={e => setForm(f => ({ ...f, profile_url: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Verified Badge</Label>
                      <p className="text-[10px] text-muted-foreground">Official verification</p>
                    </div>
                    <Switch
                      checked={form.has_verified_badge}
                      onCheckedChange={(c) => setForm(f => ({ ...f, has_verified_badge: c }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Monetized</Label>
                      <p className="text-[10px] text-muted-foreground">Earning ad revenue</p>
                    </div>
                    <Switch
                      checked={form.is_monetized}
                      onCheckedChange={(c) => setForm(f => ({ ...f, is_monetized: c }))}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4 m-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Followers / Subs</Label>
                    <Input type="number" value={form.follower_count} onChange={e => setForm(f => ({ ...f, follower_count: e.target.value }))} placeholder="10000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Following</Label>
                    <Input type="number" value={form.following_count} onChange={e => setForm(f => ({ ...f, following_count: e.target.value }))} placeholder="500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Engagement Rate (%)</Label>
                    <Input type="number" step="0.1" value={form.engagement_rate} onChange={e => setForm(f => ({ ...f, engagement_rate: e.target.value }))} placeholder="4.5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Avg Views / Post</Label>
                    <Input type="number" value={form.avg_views_per_post} onChange={e => setForm(f => ({ ...f, avg_views_per_post: e.target.value }))} placeholder="2500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Avg Likes / Post</Label>
                    <Input type="number" value={form.avg_likes_per_post} onChange={e => setForm(f => ({ ...f, avg_likes_per_post: e.target.value }))} placeholder="800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Avg Comments / Post</Label>
                    <Input type="number" value={form.avg_comments_per_post} onChange={e => setForm(f => ({ ...f, avg_comments_per_post: e.target.value }))} placeholder="45" />
                  </div>
                  <div className="space-y-2">
                    <Label>Posts per Month</Label>
                    <Input type="number" step="0.1" value={form.posts_per_month} onChange={e => setForm(f => ({ ...f, posts_per_month: e.target.value }))} placeholder="12" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="audience" className="space-y-4 m-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Top Country (Code)</Label>
                    <Input value={form.audience_country_primary} onChange={e => setForm(f => ({ ...f, audience_country_primary: e.target.value.toUpperCase() }))} placeholder="BD" maxLength={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Top City</Label>
                    <Input value={form.audience_city_primary} onChange={e => setForm(f => ({ ...f, audience_city_primary: e.target.value }))} placeholder="Dhaka" />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Age (Majority)</Label>
                    <Input type="number" value={form.audience_age_range_min} onChange={e => setForm(f => ({ ...f, audience_age_range_min: e.target.value }))} placeholder="18" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Age (Majority)</Label>
                    <Input type="number" value={form.audience_age_range_max} onChange={e => setForm(f => ({ ...f, audience_age_range_max: e.target.value }))} placeholder="24" />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender Majority</Label>
                    <Select value={form.audience_gender_majority} onValueChange={v => setForm(f => ({ ...f, audience_gender_majority: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender Majority %</Label>
                    <Input type="number" value={form.audience_gender_pct} onChange={e => setForm(f => ({ ...f, audience_gender_pct: e.target.value }))} placeholder="65" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Content Languages (comma separated)</Label>
                    <Input value={form.content_languages} onChange={e => setForm(f => ({ ...f, content_languages: e.target.value }))} placeholder="en, bn" />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.platform || !form.handle || isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "add" ? "Add Platform" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
