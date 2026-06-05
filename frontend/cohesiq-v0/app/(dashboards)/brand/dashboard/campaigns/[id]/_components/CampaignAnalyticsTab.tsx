"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EstimatedTag } from "@/components/shared/EstimatedTag";
import { formatBDT } from "@/lib/utils";
import { TrendingUp, Eye, Users, BarChart2, CalendarClock, Info } from "lucide-react";
import type { Campaign } from "@/lib/types";

interface Props {
  campaign: Campaign;
}

function estimateSnapshot(baseReach: number, engagementRate: number, dayFraction: number) {
  const reach = Math.round(baseReach * dayFraction);
  const views = Math.round(reach * 0.55);
  const engagements = Math.round(views * (engagementRate / 100));
  return { reach, views, engagements };
}

export function CampaignAnalyticsTab({ campaign }: Props) {
  const numCreators = campaign.number_of_creators ?? 1;
  const minFollowers = campaign.creator_min_followers ?? 5000;
  const baseReach = numCreators * minFollowers;
  const engagementRate = campaign.kpi_targets?.engagement_rate ?? 3.5;

  const snapshots = [
    { label: "Day 7", fraction: 0.3, description: "Early traction" },
    { label: "Day 14", fraction: 0.6, description: "Growth phase" },
    { label: "Day 30", fraction: 0.95, description: "Full reach" },
  ].map((s) => ({ ...s, ...estimateSnapshot(baseReach, engagementRate, s.fraction) }));

  const kpiReach = campaign.kpi_targets?.reach;
  const kpiRoi = campaign.kpi_targets?.roi_target;

  return (
    <div className="space-y-6">
      {/* Placeholder notice */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Real engagement data will populate once YouTube ingestion is live. All figures below are
          estimated from campaign parameters — treat them as planning benchmarks, not actuals.
        </p>
      </div>

      {/* KPI targets row (if set) */}
      {(kpiReach || kpiRoi || campaign.kpi_targets?.conversions) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              KPI Targets
            </CardTitle>
            <CardDescription>Goals set at campaign creation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {kpiReach && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Target Reach</p>
                  <p className="text-lg font-semibold">{kpiReach.toLocaleString()}</p>
                </div>
              )}
              {campaign.kpi_targets?.engagement_rate && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Engagement Rate</p>
                  <p className="text-lg font-semibold">{campaign.kpi_targets.engagement_rate}%</p>
                </div>
              )}
              {campaign.kpi_targets?.conversions && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Target Conversions</p>
                  <p className="text-lg font-semibold">{campaign.kpi_targets.conversions.toLocaleString()}</p>
                </div>
              )}
              {kpiRoi && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ROI Target</p>
                  <p className="text-lg font-semibold">{kpiRoi}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement snapshots */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Engagement Snapshots</h3>
          <EstimatedTag variant="estimated" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {snapshots.map((snap) => (
            <Card key={snap.label}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{snap.label}</CardTitle>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {snap.description}
                  </Badge>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-muted mt-2">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all"
                    style={{ width: `${snap.fraction * 100}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Reach
                  </span>
                  <span className="text-sm font-semibold">{snap.reach.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    Views
                  </span>
                  <span className="text-sm font-semibold">{snap.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Engagements
                  </span>
                  <span className="text-sm font-semibold">{snap.engagements.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Budget efficiency */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Budget Efficiency <EstimatedTag variant="estimated" />
          </CardTitle>
          <CardDescription>Projected cost-per-engagement at full reach (Day 30)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Budget</p>
              <p className="text-lg font-semibold">
                {formatBDT((campaign.budget_per_creator_max ?? 0) * numCreators)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cost per 1K Reach</p>
              <p className="text-lg font-semibold">
                {snapshots[2].reach > 0
                  ? formatBDT(Math.round(((campaign.budget_per_creator_max ?? 0) * numCreators) / (snapshots[2].reach / 1000)))
                  : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cost per Engagement</p>
              <p className="text-lg font-semibold">
                {snapshots[2].engagements > 0
                  ? formatBDT(Math.round(((campaign.budget_per_creator_max ?? 0) * numCreators) / snapshots[2].engagements))
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
