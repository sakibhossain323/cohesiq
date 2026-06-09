"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { shortlistAction, runMatchingAction } from "../../_actions/campaign-actions";
import type { Campaign, AIMatchScore } from "@/lib/types";
import { formatBDT, formatFollowerCount } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NicheBadge } from "@/components/shared/NicheBadge";
import { getAvatarInitials } from "@/lib/avatar";
import { getBrandCategoryLabel } from "@/lib/brand-categories";
import {
  Sparkles,
  Brain,
  Check,
  ChevronLeft,
  Briefcase,
  GitCompareArrows,
  X,
} from "lucide-react";

interface MatchesClientProps {
  campaign: Campaign;
  initialMatches: AIMatchScore[];
}

export function MatchesClient({ campaign, initialMatches }: MatchesClientProps) {
  const [matches, setMatches] = useState<AIMatchScore[]>(initialMatches);
  const [isPending, startTransition] = useTransition();
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [matchingNotice, setMatchingNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shortlistingId, setShortlistingId] = useState<string | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());

  const returnTo = `/brand/dashboard/campaigns/${campaign.id}/matches`;
  const compareHref = `/brand/dashboard/creators/compare?ids=${Array.from(selectedIds).join(",")}&returnTo=${encodeURIComponent(returnTo)}`;

  const toggleSelect = (creatorId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(creatorId)) {
        next.delete(creatorId);
        return next;
      }
      if (next.size >= 3) return prev;
      next.add(creatorId);
      return next;
    });
  };

  const handleRunMatching = () => {
    setMatchingError(null);
    setMatchingNotice(null);
    startTransition(async () => {
      const result = await runMatchingAction(campaign.id);
      if (result.success && result.matches) {
        const sortedMatches = result.matches.sort((a: AIMatchScore, b: AIMatchScore) => (b.score_total || 0) - (a.score_total || 0));
        setMatches(sortedMatches);
        setSelectedIds(new Set());
        setMatchingNotice(
          sortedMatches.length > 0
            ? `Matching completed: ${sortedMatches.length} creators ranked.`
            : "Matching completed, but no creators passed the campaign filters."
        );
      } else {
        setMatchingError(result.error || "Failed to run matching engine.");
      }
    });
  };

  const handleShortlist = (creatorId: string, creatorName: string) => {
    setMatchingError(null);
    setMatchingNotice(null);
    setShortlistingId(creatorId);
    startTransition(async () => {
      const result = await shortlistAction(
        campaign.id,
        creatorId,
        `Shortlisted from AI matches for ${campaign.title}`,
      );
      setShortlistingId(null);
      if (result.success) {
        setShortlistedIds(prev => new Set(prev).add(creatorId));
        setMatchingNotice(`${creatorName} added to the shortlist. Send a contract offer from the campaign pipeline.`);
      } else {
        setMatchingError(result.error || "Failed to add creator to shortlist.");
      }
    });
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 0.8) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400";
    if (score >= 0.6) return "bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400";
    return "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return "Excellent fit";
    if (score >= 0.75) return "Strong fit";
    if (score >= 0.6) return "Worth reviewing";
    return "Needs review";
  };

  const getFitHighlights = (match: AIMatchScore) => {
    const highlights: string[] = [];
    if ((match.score_niche || 0) >= 0.8) highlights.push("Strong content fit");
    if ((match.score_budget || 0) >= 0.8) highlights.push("Budget aligned");
    if ((match.score_platform || 0) >= 0.8) highlights.push("Platform ready");
    if ((match.score_language || 0) >= 0.8) highlights.push("Audience language fit");
    if ((match.score_recency || 0) >= 0.8) highlights.push("Recently active");
    if ((match.score_engagement || 0) >= 0.8) highlights.push("High engagement");
    return highlights.slice(0, 4);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header breadcrumb and controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link 
            href={`/brand/dashboard/campaigns/${campaign.id}`}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Campaign
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            AI Compatibility Matchmaker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View AI-analyzed compatibility scores and insights for your campaign.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleRunMatching} 
            disabled={isPending}
            className="bg-primary hover:bg-primary/95 text-primary-foreground shadow-md transition-all duration-200"
          >
            <Brain className="h-4 w-4 mr-2" />
            {isPending ? "Matching Engine Running..." : "Run AI Matching"}
          </Button>
        </div>
      </div>

      {/* Campaign Summary Card */}
      <Card className="border border-border bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            {campaign.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {campaign.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-2 border-t border-border/50">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Niche</span>
            <div className="mt-1">
              <NicheBadge niche={campaign.primary_niche} size="sm" />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Category</span>
            <div className="mt-1">
              <Badge variant="secondary" className="text-xs">
                {getBrandCategoryLabel(campaign.brand_category)}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Platforms</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {campaign.required_platforms?.map(plat => (
                <Badge key={plat} variant="secondary" className="capitalize text-xs">
                  {plat}
                </Badge>
              )) || <span className="text-sm">-</span>}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget Max</span>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {campaign.budget_per_creator_max ? formatBDT(campaign.budget_per_creator_max) : "-"}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Min Followers</span>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {campaign.creator_min_followers ? formatFollowerCount(campaign.creator_min_followers) : "Any"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Matches Content */}
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Matched Creators
            <Badge variant="outline" className="bg-primary/5 text-primary text-xs font-semibold">
              {matches.length} matches found
            </Badge>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size > 0 && (
              <span className="text-sm font-medium text-muted-foreground">
                {selectedIds.size} selected
              </span>
            )}
            {selectedIds.size >= 2 ? (
              <Button asChild variant="outline">
                <Link href={compareHref}>
                  <GitCompareArrows className="mr-2 h-4 w-4" />
                  Compare Selected
                </Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" disabled>
                <GitCompareArrows className="mr-2 h-4 w-4" />
                Compare Selected
              </Button>
            )}
            {selectedIds.size > 0 && (
              <Button type="button" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {matchingError && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="py-3 text-sm text-red-700 dark:text-red-300">
              {matchingError}
            </CardContent>
          </Card>
        )}

        {matchingNotice && (
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
            <CardContent className="py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {matchingNotice}
            </CardContent>
          </Card>
        )}

        {matches.length === 0 ? (
          <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-foreground">No matches generated yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Run the AI matching engine to analyze all platform creators and generate personalized compatibility scores!
            </p>
            <Button onClick={handleRunMatching} disabled={isPending} className="mt-6">
              <Brain className="h-4 w-4 mr-2" />
              {isPending ? "Running Engine..." : "Analyze & Score Creators"}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {matches.map((match) => {
              const creator = match.creator;
              if (!creator) return null;
              
              const pctScore = Math.round((match.score_total || 0) * 100);
              const fitHighlights = getFitHighlights(match);
              const isSelected = selectedIds.has(creator.id);
              const isShortlisted = shortlistedIds.has(creator.id);
              
              return (
                <Card 
                  key={match.id} 
                  className={`overflow-hidden border bg-card transition-all duration-300 group hover:shadow-md ${isSelected ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                >
                  <div className="grid md:grid-cols-12">
                    {/* Creator Info Column */}
                    <div className="p-6 md:col-span-4 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14 rounded-lg border-2 border-border shadow-sm">
                            <AvatarImage src={creator.profile_photo_url} alt={creator.display_name} />
                            <AvatarFallback className="rounded-lg text-lg font-bold">
                              {getAvatarInitials(creator.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {creator.display_name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {creator.tagline || `@${creator.display_name.toLowerCase().replace(" ", "")}`}
                            </p>
                            <div className="mt-2">
                              <NicheBadge niche={creator.primary_niche} size="sm" />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSelect(creator.id)}
                            className={`ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30 bg-background text-transparent hover:border-primary/60"
                            }`}
                            aria-label={isSelected ? "Remove from comparison" : "Select for comparison"}
                            title={selectedIds.size >= 3 && !isSelected ? "Max 3 creators" : isSelected ? "Remove from comparison" : "Select for comparison"}
                          >
                            {isSelected ? <Check className="h-4 w-4" /> : null}
                          </button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {creator.bio || "No biography provided."}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xxs uppercase tracking-wider font-semibold text-muted-foreground">Min Budget</p>
                          <p className="text-sm font-bold text-foreground">
                            {creator.min_budget ? formatBDT(creator.min_budget) : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xxs uppercase tracking-wider font-semibold text-muted-foreground">Rating</p>
                          <p className="text-sm font-bold text-foreground">
                            {creator.average_rating ? `⭐ ${creator.average_rating}` : "No reviews"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Column */}
                    <div className="p-6 md:col-span-5 border-b md:border-b-0 md:border-r border-border/50 bg-muted/20">
                      <div className="flex h-full flex-col justify-between gap-5">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Why This Creator
                          </h4>
                          <p className="text-sm leading-6 text-foreground">
                            {match.rationale || "No recommendation note generated yet."}
                          </p>
                        </div>

                        {fitHighlights.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {fitHighlights.map((highlight) => (
                              <Badge key={highlight} variant="secondary" className="rounded-md text-xs">
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score & Actions Column */}
                    <div className="p-6 md:col-span-3 flex flex-col justify-between gap-5">
                      <div className="space-y-4">
                        <div className={`rounded-lg border p-4 text-left ${getScoreBgClass(match.score_total || 0)}`}>
                          <p className="text-xs font-semibold uppercase tracking-wider">Recommendation</p>
                          <div className="mt-2 flex items-end justify-between gap-3">
                            <span className="text-lg font-bold">{getScoreLabel(match.score_total || 0)}</span>
                            <span className="text-3xl font-extrabold leading-none">{pctScore}%</span>
                          </div>
                        </div>

                        <div className="rounded-lg border border-border/50 bg-background/60 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Best Use
                          </p>
                          <p className="mt-2 text-sm leading-5 text-muted-foreground">
                            Review their profile and recent content, then shortlist them if their tone fits your campaign creative.
                          </p>
                        </div>
                      </div>

                      <div className="w-full flex gap-2">
                        <Link href={`/brand/dashboard/creators/${creator.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs">
                            View Profile
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          disabled={shortlistingId === creator.id || isShortlisted}
                          onClick={() => handleShortlist(creator.id, creator.display_name)}
                        >
                          {shortlistingId === creator.id ? "Adding..." : isShortlisted ? "Shortlisted" : "Add to Shortlist"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-background px-5 py-3 shadow-xl">
          <GitCompareArrows className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{selectedIds.size} recommended creators selected</span>
          <Button size="sm" asChild>
            <Link href={compareHref}>Compare</Link>
          </Button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear comparison selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
