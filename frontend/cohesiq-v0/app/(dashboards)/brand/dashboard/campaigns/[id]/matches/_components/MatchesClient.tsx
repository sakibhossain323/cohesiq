"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { runMatchingAction } from "../../_actions/campaign-actions";
import type { Campaign, AIMatchScore } from "@/lib/types";
import { formatBDT, formatFollowerCount } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NicheBadge } from "@/components/shared/NicheBadge";
import { EstimatedTag } from "@/components/shared/EstimatedTag";
import {
  Sparkles,
  Brain,
  ChevronLeft,
  TrendingUp,
  Target,
  DollarSign,
  Globe2,
  Briefcase,
  MonitorSmartphone,
  Clock,
  Cpu,
} from "lucide-react";

interface MatchesClientProps {
  campaign: Campaign;
  initialMatches: AIMatchScore[];
}

export function MatchesClient({ campaign, initialMatches }: MatchesClientProps) {
  const [matches, setMatches] = useState<AIMatchScore[]>(initialMatches);
  const [isPending, startTransition] = useTransition();

  const handleRunMatching = () => {
    startTransition(async () => {
      const result = await runMatchingAction(campaign.id);
      if (result.success && result.matches) {
        const sortedMatches = result.matches.sort((a: AIMatchScore, b: AIMatchScore) => (b.score_total || 0) - (a.score_total || 0));
        setMatches(sortedMatches);
      }
    });
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 0.8) return "bg-emerald-500";
    if (score >= 0.6) return "bg-indigo-500";
    return "bg-amber-500";
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 0.8) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400";
    if (score >= 0.6) return "bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400";
    return "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400";
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
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2 border-t border-border/50">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Niche</span>
            <div className="mt-1">
              <NicheBadge niche={campaign.primary_niche} size="sm" />
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Matched Creators
            <Badge variant="outline" className="bg-primary/5 text-primary text-xs font-semibold">
              {matches.length} matches found
            </Badge>
          </h2>
        </div>

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
              
              return (
                <Card 
                  key={match.id} 
                  className="overflow-hidden border border-border bg-card hover:shadow-md transition-all duration-300 group"
                >
                  <div className="grid md:grid-cols-12">
                    {/* Creator Info Column */}
                    <div className="p-6 md:col-span-4 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14 rounded-lg border-2 border-border shadow-sm">
                            <AvatarImage src={creator.profile_photo_url} alt={creator.display_name} />
                            <AvatarFallback className="rounded-lg text-lg font-bold">
                              {creator.display_name.slice(0, 2).toUpperCase()}
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

                    {/* AI Scoring Details Column */}
                    <div className="p-6 md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/50 bg-muted/20">
                      <div>
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                          <Brain className="h-4 w-4 text-primary" />
                          Compatibility Breakdown
                        </h4>
                        
                        <div className="space-y-3.5">
                          {/* Niche Alignment */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Target className="h-3.5 w-3.5" /> Niche Alignment
                              </span>
                              <span className="font-semibold">{Math.round((match.score_niche || 0) * 100)}%</span>
                            </div>
                            <Progress value={(match.score_niche || 0) * 100} className="h-1.5" indicatorClassName={getScoreColorClass(match.score_niche || 0)} />
                          </div>

                          {/* Engagement Strength */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="h-3.5 w-3.5" /> Engagement Strength
                                <EstimatedTag variant="estimated" />
                              </span>
                              <span className="font-semibold">{Math.round((match.score_engagement || 0) * 100)}%</span>
                            </div>
                            <Progress value={(match.score_engagement || 0) * 100} className="h-1.5" indicatorClassName={getScoreColorClass(match.score_engagement || 0)} />
                          </div>

                          {/* Budget Fit */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5" /> Budget Fit
                              </span>
                              <span className="font-semibold">{Math.round((match.score_budget || 0) * 100)}%</span>
                            </div>
                            <Progress value={(match.score_budget || 0) * 100} className="h-1.5" indicatorClassName={getScoreColorClass(match.score_budget || 0)} />
                          </div>

                          {/* Language Match */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Globe2 className="h-3.5 w-3.5" /> Language Match
                              </span>
                              <span className="font-semibold">{Math.round((match.score_language || 0) * 100)}%</span>
                            </div>
                            <Progress value={(match.score_language || 0) * 100} className="h-1.5" indicatorClassName={getScoreColorClass(match.score_language || 0)} />
                          </div>

                          {/* Platform Fit */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <MonitorSmartphone className="h-3.5 w-3.5" /> Platform Fit
                              </span>
                              <span className="font-semibold">{Math.round((match.score_platform || 0) * 100)}%</span>
                            </div>
                            <Progress value={(match.score_platform || 0) * 100} className="h-1.5" indicatorClassName={getScoreColorClass(match.score_platform || 0)} />
                          </div>

                          {/* Recency */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> Recency
                              </span>
                              <span className="font-semibold">{Math.round((match.score_recency || 0) * 100)}%</span>
                            </div>
                            <Progress value={(match.score_recency || 0) * 100} className="h-1.5" indicatorClassName={getScoreColorClass(match.score_recency || 0)} />
                          </div>

                          {/* Semantic Similarity */}
                          {(match.score_semantic ?? 0) > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Cpu className="h-3.5 w-3.5" /> Semantic Similarity
                                </span>
                                <span className="font-semibold">{Math.round((match.score_semantic || 0) * 100)}%</span>
                              </div>
                              <Progress value={(match.score_semantic || 0) * 100} className="h-1.5" indicatorClassName={getScoreColorClass(match.score_semantic || 0)} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Overall Score & Rationale Column */}
                    <div className="p-6 md:col-span-3 flex flex-col justify-between items-center text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xxs uppercase tracking-wider font-semibold text-muted-foreground">Overall Match</span>
                          <EstimatedTag variant="ai-scored" />
                        </div>
                        <div className={`h-20 w-20 rounded-full border-4 flex flex-col items-center justify-center shadow-sm ${getScoreBgClass(match.score_total || 0)}`}>
                          <span className="text-2xl font-extrabold">{pctScore}%</span>
                        </div>
                      </div>

                      <div className="w-full mt-4 bg-muted/40 rounded-lg p-3 text-left border border-border/30">
                        <p className="text-xxs font-bold text-primary flex items-center gap-1 uppercase tracking-wider mb-1">
                          <Sparkles className="h-3 w-3" /> AI Insight
                        </p>
                        <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-4">
                          "{match.rationale || "No rationale generated."}"
                        </p>
                      </div>

                      <div className="mt-4 w-full flex gap-2">
                        <Link href={`/creators/${creator.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs">
                            View Profile
                          </Button>
                        </Link>
                        <Button size="sm" className="flex-1 text-xs">
                          Invite
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
    </div>
  );
}
