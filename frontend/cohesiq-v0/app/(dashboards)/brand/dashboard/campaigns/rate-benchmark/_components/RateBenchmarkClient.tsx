"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getDeliverableLabel } from "@/lib/deliverables";

export interface BenchmarkRow {
  platform: string;
  deliverable_type: string;
  tier: string;
  median_bdt: number;
  min_bdt: number;
  max_bdt: number;
  sample_count: number;
}

const TIER_CONFIG: Record<string, { label: string; dot: string; order: number }> = {
  nano:  { label: "Nano (1K–10K)",    dot: "bg-emerald-400", order: 0 },
  micro: { label: "Micro (10K–100K)", dot: "bg-blue-400",    order: 1 },
  macro: { label: "Macro (100K–1M)",  dot: "bg-purple-400",  order: 2 },
  mega:  { label: "Mega (1M+)",       dot: "bg-orange-400",  order: 3 },
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube", instagram: "Instagram", facebook: "Facebook",
  tiktok: "TikTok", twitter_x: "Twitter/X", linkedin: "LinkedIn", other: "Other",
};

function formatBDT(n: number) {
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `৳${(n / 1000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

export function RateBenchmarkClient({ rows }: { rows: BenchmarkRow[] }) {
  const platforms = ["all", ...Array.from(new Set(rows.map(r => r.platform))).sort()];
  const deliverables = ["all", ...Array.from(new Set(rows.map(r => r.deliverable_type))).sort()];

  const [platform, setPlatform] = useState("all");
  const [deliverable, setDeliverable] = useState("all");

  const filtered = rows
    .filter(r => platform === "all" || r.platform === platform)
    .filter(r => deliverable === "all" || r.deliverable_type === deliverable)
    .sort((a, b) =>
      (TIER_CONFIG[a.tier]?.order ?? 9) - (TIER_CONFIG[b.tier]?.order ?? 9) ||
      a.platform.localeCompare(b.platform) ||
      a.deliverable_type.localeCompare(b.deliverable_type)
    );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/brand/dashboard/campaigns"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Link>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rate Card Benchmarks</h1>
            <p className="text-muted-foreground mt-1">
              Median creator rates by tier, platform, and deliverable type — from live rate cards.
            </p>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
            <BarChart3 className="mb-4 h-12 w-12 opacity-20" />
            <p className="font-medium text-foreground text-lg">No rate card data yet</p>
            <p className="text-sm mt-2 max-w-sm">
              Benchmarks will appear once creators add rate cards to their profiles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {platforms.map(p => (
                        <SelectItem key={p} value={p}>
                          {p === "all" ? "All Platforms" : (PLATFORM_LABELS[p] ?? p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deliverable Type</Label>
                  <Select value={deliverable} onValueChange={setDeliverable}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {deliverables.map(d => (
                        <SelectItem key={d} value={d}>
                          {d === "all" ? "All Types" : getDeliverableLabel(undefined, d, d as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No data for this combination.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((row, i) => {
                const tier = TIER_CONFIG[row.tier];
                return (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tier?.dot ?? "bg-gray-400"}`} />
                          <div>
                            <p className="font-semibold text-sm">
                              {PLATFORM_LABELS[row.platform] ?? row.platform}
                              {" · "}
                              {getDeliverableLabel(row.platform as any, row.deliverable_type, row.deliverable_type as any)}
                            </p>
                            <p className="text-xs text-muted-foreground">{tier?.label ?? row.tier}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Range</p>
                            <p className="text-sm font-medium">
                              {formatBDT(row.min_bdt)} – {formatBDT(row.max_bdt)}
                            </p>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="text-xs text-muted-foreground">Median</p>
                            <p className="text-lg font-bold text-primary">{formatBDT(row.median_bdt)}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {row.sample_count} creator{row.sample_count !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Based on {rows.reduce((s, r) => s + r.sample_count, 0)} rate cards from active creator profiles.
            Tiers derived from highest follower count across all platforms.
          </p>
        </>
      )}
    </div>
  );
}
