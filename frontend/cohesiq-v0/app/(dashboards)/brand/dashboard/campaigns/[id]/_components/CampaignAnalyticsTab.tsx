"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@clerk/nextjs";
import {
  BarChart2,
  CircleDollarSign,
  ExternalLink,
  Eye,
  ImageIcon,
  Loader2,
  MessageCircle,
  RefreshCw,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstimatedTag } from "@/components/shared/EstimatedTag";
import { cn, formatBDT } from "@/lib/utils";
import { getCampaignLiveAnalytics, syncContractMetrics } from "@/lib/api/contracts";
import type { Campaign, CampaignLiveAnalytics, Contract } from "@/lib/types";
import { usePolling } from "@/hooks/use-polling";

interface Props {
  campaign: Campaign;
  contracts: Contract[];
  initialAnalytics: CampaignLiveAnalytics | null;
  onAnalyticsUpdate: (analytics: CampaignLiveAnalytics | null) => void;
}

const chartConfig = {
  views: { label: "Views", color: "var(--brand-primary)" },
  estimated_revenue_bdt: { label: "Revenue", color: "var(--brand-secondary)" },
  likes: { label: "Likes", color: "var(--brand-primary)" },
  comments: { label: "Comments", color: "var(--brand-secondary)" },
  shares: { label: "Shares", color: "var(--color-chart-3)" },
  saves: { label: "Saves", color: "var(--color-chart-4)" },
} satisfies ChartConfig;

function formatCompact(value: number) {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric" }).format(new Date(value));
}

function inferPlatformFromUrl(url?: string) {
  if (!url) return "content";
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("facebook.com")) return "facebook";
  } catch {
    return "content";
  }
  return "content";
}

function youtubeVideoId(url?: string) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtu.be")) return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    if (!host.includes("youtube.com")) return null;
    const watchId = parsed.searchParams.get("v");
    if (watchId) return watchId;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((part) => ["shorts", "embed", "live"].includes(part));
    return marker >= 0 ? parts[marker + 1] ?? null : null;
  } catch {
    return null;
  }
}

function contentThumbnailUrl(url?: string) {
  const videoId = youtubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="bd-stat-icon">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold font-display truncate">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignAnalyticsTab({
  campaign,
  contracts,
  initialAnalytics,
  onAnalyticsUpdate,
}: Props) {
  const { getToken } = useAuth();
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const sessionSynced = useRef(false);

  const publishedContracts = contracts.filter((contract) =>
    ["published", "closed"].includes(contract.status)
  );

  const totals = analytics?.totals;
  const timeline = useMemo(
    () => (analytics?.timeline ?? []).map((point) => ({
      ...point,
      label: formatChartDate(point.captured_at),
    })),
    [analytics]
  );
  const latestEngagement = totals
    ? [
        { type: "Likes", likes: totals.likes },
        { type: "Comments", comments: totals.comments },
        { type: "Shares", shares: totals.shares },
        { type: "Saves", saves: totals.saves },
      ]
    : [];

  const refreshAnalytics = async () => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    const fresh = await getCampaignLiveAnalytics(campaign.id, token);
    setAnalytics(fresh);
    onAnalyticsUpdate(fresh);
    return fresh;
  };

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      const token = await getToken();
      if (!token) return;
      
      // Force sync from YouTube API for all published contracts
      if (publishedContracts.length > 0) {
        await Promise.all(
          publishedContracts.map(c => syncContractMetrics(c.id, token).catch(e => console.error(e)))
        );
      }
      
      await refreshAnalytics();
      refresh(); // Reset polling interval and update timestamp
    } catch (err) {
      console.error("Failed to manually refresh analytics", err);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const pollAction = async () => {
    const token = await getToken();
    if (!token) return;
    
    if (!sessionSynced.current && publishedContracts.length > 0) {
      sessionSynced.current = true;
      try {
        await syncContractMetrics(publishedContracts[0].id, token);
      } catch (err) {
        console.error("Initial session sync failed:", err);
      }
    }
    
    await refreshAnalytics();
  };

  const { lastUpdated, isRefreshing, refresh } = usePolling(pollAction, 90_000);



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold font-display">Live Performance Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Time-based views, engagement, and estimated revenue from published creator content.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          )}
          <Badge variant="outline" className="w-fit">
            {totals?.published_contracts ?? publishedContracts.length} live content items
          </Badge>
          <Button type="button" variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefreshing || isManualRefreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", (isRefreshing || isManualRefreshing) && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Views"
          value={formatCompact(totals?.views ?? 0)}
          hint={`${formatCompact(totals?.impressions ?? 0)} impressions`}
          icon={<Eye className="h-5 w-5" />}
        />
        <StatCard
          label="Engagement Rate"
          value={`${totals?.engagement_rate ?? 0}%`}
          hint={`${formatCompact(totals?.engagements ?? 0)} total actions`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Estimated Revenue"
          value={formatBDT(totals?.estimated_revenue_bdt ?? 0)}
          hint="Media value estimate"
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Comments"
          value={formatCompact(totals?.comments ?? 0)}
          hint="Useful for sentiment review"
          icon={<MessageCircle className="h-5 w-5" />}
        />
      </div>

      {timeline.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Views and Revenue Over Time
              </CardTitle>
              <CardDescription>Each point is a stored snapshot from the live post.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[300px]">
                <LineChart data={timeline} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={48} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="var(--color-views)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="estimated_revenue_bdt"
                    stroke="var(--color-estimated_revenue_bdt)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Engagement Mix
              </CardTitle>
              <CardDescription>Latest totals across tracked live videos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[300px]">
                <BarChart data={latestEngagement} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="likes" fill="var(--color-likes)" radius={4} />
                  <Bar dataKey="comments" fill="var(--color-comments)" radius={4} />
                  <Bar dataKey="shares" fill="var(--color-shares)" radius={4} />
                  <Bar dataKey="saves" fill="var(--color-saves)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="bd-empty" style={{ paddingBlock: "var(--space-6)" }}>
              <div className="bd-empty-icon"><BarChart2 className="h-6 w-6" /></div>
              <p className="bd-empty-title">No live snapshots yet</p>
              <p className="bd-empty-desc">
                Publish a creator post, then record snapshots over time to build the graph.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracked Live Content</CardTitle>
          <CardDescription>Open the live post and inspect the latest stored performance snapshot.</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.contracts?.some((contract) => contract.live_post_url) ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {analytics.contracts
                .filter((contract) => contract.live_post_url)
                .map((contract) => {
                  const thumb = contentThumbnailUrl(contract.live_post_url);
                  const platform = inferPlatformFromUrl(contract.live_post_url);
                  return (
                    <a
                      key={contract.contract_id}
                      href={contract.live_post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex gap-3 rounded-lg border border-border bg-surface-elevated p-space-3 transition-colors hover:border-brand-primary"
                    >
                      <div className="relative flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-subtle">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-text-muted" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-space-1 flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">{platform}</Badge>
                          <ExternalLink className="h-3.5 w-3.5 text-text-muted transition-colors group-hover:text-brand-primary" />
                        </div>
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {contract.live_post_url}
                        </p>
                        <div className="mt-space-2 grid grid-cols-3 gap-2 text-xs text-text-secondary">
                          <span>{formatCompact(contract.latest?.views ?? 0)} views</span>
                          <span>{formatCompact(contract.latest?.likes ?? 0)} likes</span>
                          <span>{formatCompact(contract.latest?.comments ?? 0)} comments</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              Live post links will appear here after creators publish approved content.
            </p>
          )}
        </CardContent>
      </Card>

      {(campaign.kpi_targets?.reach || campaign.kpi_targets?.engagement_rate || campaign.kpi_targets?.conversions) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              KPI Targets <EstimatedTag variant="estimated" />
            </CardTitle>
            <CardDescription>Goals set at campaign creation for comparison.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {campaign.kpi_targets?.reach && <Kpi label="Target Reach" value={campaign.kpi_targets.reach.toLocaleString()} />}
              {campaign.kpi_targets?.engagement_rate && <Kpi label="Target ER" value={`${campaign.kpi_targets.engagement_rate}%`} />}
              {campaign.kpi_targets?.conversions && <Kpi label="Conversions" value={campaign.kpi_targets.conversions.toLocaleString()} />}
              {campaign.kpi_targets?.roi_target && <Kpi label="ROI Target" value={`${campaign.kpi_targets.roi_target}%`} />}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
