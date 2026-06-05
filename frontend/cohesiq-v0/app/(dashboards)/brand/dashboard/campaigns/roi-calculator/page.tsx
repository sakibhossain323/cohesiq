"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Calculator, TrendingUp, Users, Eye, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TIERS = [
  {
    key: "nano",
    label: "Nano",
    range: "1K – 10K followers",
    avgRate: 4000,
    avgReach: 3000,
    engagementRate: 0.06,
    conversionRate: 0.008,
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-400",
  },
  {
    key: "micro",
    label: "Micro",
    range: "10K – 100K followers",
    avgRate: 15000,
    avgReach: 20000,
    engagementRate: 0.04,
    conversionRate: 0.005,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-400",
  },
  {
    key: "macro",
    label: "Macro",
    range: "100K – 1M followers",
    avgRate: 60000,
    avgReach: 150000,
    engagementRate: 0.02,
    conversionRate: 0.003,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    dot: "bg-purple-400",
  },
  {
    key: "mega",
    label: "Mega",
    range: "1M+ followers",
    avgRate: 250000,
    avgReach: 900000,
    engagementRate: 0.01,
    conversionRate: 0.002,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    dot: "bg-orange-400",
  },
] as const;

function formatBDT(n: number) {
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function RoiCalculatorPage() {
  const [budget, setBudget] = useState("");
  const [productValue, setProductValue] = useState("");

  const budgetNum = parseFloat(budget) || 0;
  const productValueNum = parseFloat(productValue) || 0;

  const results = useMemo(() =>
    TIERS.map(tier => {
      const creatorsAffordable = Math.floor(budgetNum / tier.avgRate);
      const totalReach = creatorsAffordable * tier.avgReach;
      const totalEngagements = Math.round(totalReach * tier.engagementRate);
      const estimatedConversions = Math.round(totalReach * tier.conversionRate);
      const estimatedRevenue = estimatedConversions * productValueNum;
      const roi = budgetNum > 0 && productValueNum > 0
        ? ((estimatedRevenue - budgetNum) / budgetNum) * 100
        : null;
      return { ...tier, creatorsAffordable, totalReach, totalEngagements, estimatedConversions, estimatedRevenue, roi };
    }),
    [budgetNum, productValueNum]
  );

  const hasInput = budgetNum > 0;

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
          <Calculator className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budget & ROI Calculator</h1>
            <p className="text-muted-foreground mt-1">
              Estimate creator tiers, reach, and return before committing your budget.
            </p>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Campaign Budget</CardTitle>
          <CardDescription>All figures use Bangladeshi market benchmarks for influencer rates and engagement.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="budget">Total Budget (BDT) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  className="pl-7"
                  placeholder="e.g. 150000"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_value">
                Product / Order Value (BDT)
                <span className="ml-2 text-xs text-muted-foreground font-normal">for ROI projection</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                <Input
                  id="product_value"
                  type="number"
                  min="0"
                  className="pl-7"
                  placeholder="e.g. 2500"
                  value={productValue}
                  onChange={e => setProductValue(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {!hasInput ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Calculator className="h-16 w-16 opacity-20 mb-4" />
          <p className="text-lg font-medium text-foreground">Enter your budget to see projections</p>
          <p className="text-sm mt-1">Results update instantly — no API calls needed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Tier Breakdown</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map(tier => (
              <Card key={tier.key} className={tier.creatorsAffordable === 0 ? "opacity-50" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${tier.dot}`} />
                      <CardTitle className="text-base">{tier.label} Creators</CardTitle>
                    </div>
                    <Badge variant="outline" className={`text-xs ${tier.color}`}>
                      {tier.range}
                    </Badge>
                  </div>
                  <CardDescription>Avg rate {formatBDT(tier.avgRate)} / creator</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/40 rounded-lg p-3 text-center">
                      <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xl font-bold">{tier.creatorsAffordable}</p>
                      <p className="text-xs text-muted-foreground">Creators</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 text-center">
                      <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xl font-bold">{formatNumber(tier.totalReach)}</p>
                      <p className="text-xs text-muted-foreground">Est. Reach</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      Engagements
                    </span>
                    <span className="font-medium">{formatNumber(tier.totalEngagements)}</span>
                  </div>

                  {productValueNum > 0 && tier.creatorsAffordable > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Conversions</span>
                        <span className="font-medium">{formatNumber(tier.estimatedConversions)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Revenue</span>
                        <span className="font-medium">{formatBDT(tier.estimatedRevenue)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          Projected ROI
                        </span>
                        <span className={tier.roi !== null && tier.roi >= 0 ? "text-green-600" : "text-red-500"}>
                          {tier.roi !== null ? `${tier.roi >= 0 ? "+" : ""}${tier.roi.toFixed(0)}%` : "—"}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            * Benchmarks based on Bangladeshi creator market averages. Actual results vary by niche, content quality, and audience.
            Conversion rates assume a direct-response campaign (not brand awareness).
          </p>
        </div>
      )}
    </div>
  );
}
