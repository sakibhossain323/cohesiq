"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Users, Zap, CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/shared/StarRating";
import { getAvatarInitials } from "@/lib/avatar";
import type { Creator } from "@/lib/types";

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube", instagram: "Instagram", facebook: "Facebook",
  tiktok: "TikTok", twitter_x: "Twitter/X", linkedin: "LinkedIn",
};

const DELIVERABLE_LABELS: Record<string, string> = {
  dedicated_video: "Dedicated Video", integrated_mention: "Integrated Mention",
  short_video: "Short Video", photo_post: "Photo Post", story: "Story",
  live_stream: "Live Stream", blog_post: "Blog Post", other: "Other",
};

function formatBDT(n: number) {
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `৳${(n / 1000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function getCreatorTier(creator: Creator): string {
  const max = Math.max(0, ...creator.social_profiles.map(sp => (sp as any).follower_count ?? 0));
  if (max >= 1_000_000) return "Mega";
  if (max >= 100_000)   return "Macro";
  if (max >= 10_000)    return "Micro";
  return "Nano";
}

interface CompareClientProps {
  creators: Creator[];
}

export function CompareClient({ creators }: CompareClientProps) {
  const [brief, setBrief] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRecommend = () => {
    if (!brief.trim()) return;
    startTransition(async () => {
      // Placeholder: N05 Gemini rationale service not yet wired
      // When N05 is ready, replace with a real server action call
      await new Promise(r => setTimeout(r, 800));
      const names = creators.map(c => c.display_name).join(", ");
      setRecommendation(
        `Based on your brief, comparing ${names}: AI recommendation will be available once the Gemini rationale service (N05) is integrated. ` +
        `For now, use the stats below to evaluate niche fit, engagement rate, and budget alignment.`
      );
    });
  };

  if (creators.length < 2) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Select at least 2 creators from the Find Creators page to compare.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/brand/dashboard/creators">Back to Find Creators</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/brand/dashboard/creators"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Find Creators
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Creator Comparison</h1>
        <p className="text-muted-foreground mt-1">Side-by-side stats for {creators.length} creators.</p>
      </div>

      {/* Creator header row */}
      <div className={`grid gap-4 mb-6`} style={{ gridTemplateColumns: `200px repeat(${creators.length}, 1fr)` }}>
        <div />
        {creators.map(creator => {
          const initials = getAvatarInitials(creator.display_name);
          return (
            <Card key={creator.id} className="text-center">
              <CardContent className="pt-6 pb-4 flex flex-col items-center gap-2">
                <Avatar className="h-16 w-16 border-2 border-border">
                  <AvatarImage src={creator.profile_photo_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${creator.display_name}`} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-base leading-tight">{creator.display_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {creator.niches?.[0]?.name?.replace(/_/g, " ") ?? "Creator"}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">{getCreatorTier(creator)}</Badge>
                </div>
                <Button size="sm" variant="outline" asChild className="w-full mt-1">
                  <Link href={`/brand/dashboard/creators/${creator.id}`}>View Profile</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats rows */}
      {[
        {
          label: "Rating",
          render: (c: Creator) => c.average_rating != null
            ? <StarRating rating={Math.round(c.average_rating)} size="sm" showValue />
            : <span className="text-muted-foreground text-sm">No reviews</span>,
        },
        {
          label: "Collaborations",
          render: (c: Creator) => (
            <span className="font-semibold">{c.total_collaborations ?? 0}</span>
          ),
        },
        {
          label: "Available",
          render: (c: Creator) => c.is_available
            ? <CheckCircle className="h-5 w-5 text-green-500" />
            : <XCircle className="h-5 w-5 text-muted-foreground" />,
        },
        {
          label: "Platforms",
          render: (c: Creator) => (
            <div className="space-y-1 text-left">
              {(c.social_profiles as any[]).map((sp: any) => (
                <div key={sp.id ?? sp.platform} className="text-xs">
                  <span className="font-medium">{PLATFORM_LABELS[sp.platform] ?? sp.platform}</span>
                  {sp.follower_count != null && (
                    <span className="text-muted-foreground ml-1">{formatFollowers(sp.follower_count)} followers</span>
                  )}
                  {sp.engagement_rate != null && (
                    <span className="text-green-600 ml-1">{(sp.engagement_rate * 100).toFixed(1)}% ER</span>
                  )}
                </div>
              ))}
            </div>
          ),
        },
        {
          label: "Min Rate",
          render: (c: Creator) => {
            const prices = (c.rate_cards as any[]).filter(rc => rc.is_active).map((rc: any) => rc.price_bdt);
            if (!prices.length) return <span className="text-muted-foreground text-sm">—</span>;
            return <span className="font-semibold">{formatBDT(Math.min(...prices))}</span>;
          },
        },
        {
          label: "Rate Cards",
          render: (c: Creator) => (
            <div className="space-y-1 text-left">
              {(c.rate_cards as any[]).filter(rc => rc.is_active).slice(0, 3).map((rc: any) => (
                <div key={rc.id} className="text-xs">
                  <span className="font-medium">{DELIVERABLE_LABELS[rc.deliverable_type] ?? rc.deliverable_type}</span>
                  <span className="text-muted-foreground ml-1">({PLATFORM_LABELS[rc.platform] ?? rc.platform})</span>
                  <span className="font-semibold ml-1">{formatBDT(rc.price_bdt)}</span>
                </div>
              ))}
              {(c.rate_cards as any[]).filter(rc => rc.is_active).length === 0 && (
                <span className="text-muted-foreground text-sm">No rate cards</span>
              )}
            </div>
          ),
        },
        {
          label: "Niches",
          render: (c: Creator) => (
            <div className="flex flex-wrap gap-1">
              {(c.niches as any[]).slice(0, 3).map((n: any) => (
                <Badge key={n.niche_id ?? n.name} variant="secondary" className="text-xs capitalize">
                  {(n.name ?? "").replace(/_/g, " ")}
                </Badge>
              ))}
              {(c.niches as any[]).length === 0 && <span className="text-muted-foreground text-sm">—</span>}
            </div>
          ),
        },
      ].map(row => (
        <div
          key={row.label}
          className="grid gap-4 mb-3 items-start"
          style={{ gridTemplateColumns: `200px repeat(${creators.length}, 1fr)` }}
        >
          <div className="flex items-start pt-3">
            <span className="text-sm font-semibold text-muted-foreground">{row.label}</span>
          </div>
          {creators.map(creator => (
            <Card key={creator.id}>
              <CardContent className="p-3 flex items-center justify-center">
                {row.render(creator)}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* AI Brief Recommendation */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brief">Describe your campaign brief</Label>
            <Textarea
              id="brief"
              rows={3}
              placeholder="e.g. We're launching a new skincare line targeting young Bangladeshi women. Looking for authentic, lifestyle-focused content..."
              value={brief}
              onChange={e => setBrief(e.target.value)}
            />
          </div>
          <Button
            onClick={handleRecommend}
            disabled={!brief.trim() || isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing...</>
              : <><Sparkles className="mr-2 h-4 w-4" /> Get Recommendation</>
            }
          </Button>
          {recommendation && (
            <div className="bg-muted/40 rounded-lg p-4 text-sm text-foreground border border-border">
              {recommendation}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
