"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlatformBadge, getPlatformLabel } from "@/components/shared/PlatformBadge";
import { NicheBadge } from "@/components/shared/NicheBadge";
import { StarRating } from "@/components/shared/StarRating";
import { RateCardTable } from "@/components/creator/RateCardTable";
import { getAvatarInitials } from "@/lib/avatar";
import { formatBDT, formatDate, formatFollowerCount } from "@/lib/utils";
import type { Creator, CreatorPortfolioItem, CreatorSocialProfile, PlatformType, Review } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  Eye,
  Heart,
  ImageIcon,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";

interface BrandCreatorMediaKitProps {
  creator: Creator;
  reviews: Review[];
  actionSlot?: React.ReactNode;
}

const PLATFORM_ORDER: PlatformType[] = ["youtube", "instagram", "tiktok", "facebook", "linkedin", "twitter_x", "snapchat", "other"];

function numberOrZero(value: number | undefined) {
  return value ?? 0;
}

function formatMetric(value: number | undefined) {
  return formatFollowerCount(numberOrZero(value));
}

function primaryPlatform(profiles: CreatorSocialProfile[]) {
  return [...profiles].sort((a, b) => {
    if (a.is_primary_platform !== b.is_primary_platform) return a.is_primary_platform ? -1 : 1;
    return PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform);
  })[0];
}

function topContent(items: CreatorPortfolioItem[], platform?: PlatformType) {
  return [...items]
    .filter(item => !platform || item.platform === platform)
    .sort((a, b) => {
      const scoreA = (a.views ?? 0) * 3 + (a.likes ?? 0) + (a.comments ?? 0) * 2;
      const scoreB = (b.views ?? 0) * 3 + (b.likes ?? 0) + (b.comments ?? 0) * 2;
      if (scoreA !== scoreB) return scoreB - scoreA;
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return a.sort_order - b.sort_order;
    })
    .slice(0, 5);
}

function coverImage(items: CreatorPortfolioItem[], platform?: PlatformType) {
  return topContent(items, platform).find(item => item.thumbnail_url)?.thumbnail_url;
}

function platformBio(creator: Creator, profile?: CreatorSocialProfile) {
  if (profile?.notes) return profile.notes;
  return creator.bio || creator.tagline || "This creator has not added a profile bio yet.";
}

export function BrandCreatorMediaKit({ creator, reviews, actionSlot }: BrandCreatorMediaKitProps) {
  const profiles = useMemo(
    () => [...creator.social_profiles].sort((a, b) => PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform)),
    [creator.social_profiles],
  );
  const firstProfile = primaryPlatform(profiles);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | undefined>(firstProfile?.platform);
  const [bioMode, setBioMode] = useState<"profile" | "platform">("profile");
  const selectedProfile = profiles.find(profile => profile.platform === selectedPlatform) ?? firstProfile;
  const selectedContent = topContent(creator.portfolio_items, selectedProfile?.platform);
  const fallbackContent = topContent(creator.portfolio_items);
  const heroImage = coverImage(creator.portfolio_items, selectedProfile?.platform) || coverImage(creator.portfolio_items) || creator.profile_photo_url;
  const displayBio = bioMode === "platform" ? platformBio(creator, selectedProfile) : (creator.bio || platformBio(creator, selectedProfile));
  const totalReach = profiles.reduce((sum, profile) => sum + numberOrZero(profile.follower_count), 0);
  const avgViews = profiles.length
    ? Math.round(profiles.reduce((sum, profile) => sum + numberOrZero(profile.avg_views_per_post), 0) / profiles.length)
    : 0;
  const avgEngagement = profiles.length
    ? profiles.reduce((sum, profile) => sum + numberOrZero(profile.engagement_rate), 0) / profiles.length
    : 0;
  const minRate = creator.rate_cards.length
    ? Math.min(...creator.rate_cards.map(rate => rate.price_bdt))
    : creator.min_budget;

  return (
    <div className="bd-page">
      <header
        className="bd-header"
        style={heroImage ? { backgroundImage: `linear-gradient(to right, color-mix(in oklab, var(--color-surface) 92%, transparent), color-mix(in oklab, var(--color-surface) 54%, transparent)), url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <div className="bd-header-inner">
          <div className="flex max-w-3xl items-end gap-5">
            <Avatar className="h-20 w-20 border-4 border-background shadow-md">
              <AvatarImage src={creator.profile_photo_url} alt={creator.display_name} />
              <AvatarFallback className="text-xl font-bold">{getAvatarInitials(creator.display_name)}</AvatarFallback>
            </Avatar>
            <div>
              <Link href="/brand/dashboard/creators" className="mb-4 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Find Creators
              </Link>
              <span className="eyebrow mb-3 block">Creator Media Kit</span>
              <h1 className="bd-header-title">{creator.display_name}</h1>
              <p className="bd-header-sub max-w-2xl">{displayBio}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <NicheBadge niche={creator.primary_niche} size="sm" />
                {creator.niches.filter(niche => niche !== creator.primary_niche).slice(0, 3).map(niche => (
                  <NicheBadge key={niche} niche={niche} variant="outline" size="sm" />
                ))}
                {selectedProfile?.is_api_verified && (
                  <span className="bd-status bd-status-active">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    API verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="bd-header-actions">
            {actionSlot}
            {selectedProfile && (
              <Button variant="outline" asChild>
                <Link href={selectedProfile.profile_url} target="_blank">
                  Open Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="bd-body">
        <div className="bd-stats">
          <div className="bd-stat">
            <div className="bd-stat-icon"><Users className="h-5 w-5" /></div>
            <div className="bd-stat-num">{formatMetric(totalReach)}</div>
            <div className="bd-stat-label">Total Reach</div>
            <div className="bd-stat-sub">across {profiles.length} platform{profiles.length === 1 ? "" : "s"}</div>
          </div>
          <div className="bd-stat">
            <div className="bd-stat-icon warm"><Eye className="h-5 w-5" /></div>
            <div className="bd-stat-num">{avgViews ? formatMetric(avgViews) : "-"}</div>
            <div className="bd-stat-label">Avg Views</div>
            <div className="bd-stat-sub">stored synced metric</div>
          </div>
          <div className="bd-stat">
            <div className="bd-stat-icon"><BarChart3 className="h-5 w-5" /></div>
            <div className="bd-stat-num">{avgEngagement ? `${avgEngagement.toFixed(1)}%` : "-"}</div>
            <div className="bd-stat-label">Engagement</div>
            <div className="bd-stat-sub">average across connected profiles</div>
          </div>
          <div className="bd-stat">
            <div className="bd-stat-icon warm"><Briefcase className="h-5 w-5" /></div>
            <div className="bd-stat-num">{minRate ? formatBDT(minRate) : "-"}</div>
            <div className="bd-stat-label">Starting Rate</div>
            <div className="bd-stat-sub">{creator.total_collaborations} collaborations</div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="bd-section">
            <div className="bd-section-head">
              <span className="bd-section-title">Platform Analytics</span>
              <div className="flex flex-wrap gap-2">
                {profiles.map(profile => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setSelectedPlatform(profile.platform)}
                    className={`bd-status ${selectedProfile?.platform === profile.platform ? "bd-status-active" : "bd-status-draft"}`}
                  >
                    <PlatformBadge platform={profile.platform} />
                    {getPlatformLabel(profile.platform)}
                  </button>
                ))}
              </div>
            </div>
            <div className="bd-section-body space-y-6">
              {selectedProfile ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric label={selectedProfile.platform === "youtube" ? "Subscribers" : "Followers"} value={formatMetric(selectedProfile.follower_count)} />
                    <Metric label="Avg Views" value={formatMetric(selectedProfile.avg_views_per_post)} />
                    <Metric label="Avg Likes" value={formatMetric(selectedProfile.avg_likes_per_post)} />
                    <Metric label="Engagement" value={selectedProfile.engagement_rate ? `${selectedProfile.engagement_rate}%` : "-"} />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">@{selectedProfile.handle}</p>
                        <p className="text-xs text-muted-foreground">
                          Last synced {selectedProfile.stats_reported_at ? formatDate(selectedProfile.stats_reported_at) : "manually"} · {selectedProfile.stats_reported_for_period || "stored profile metrics"}
                        </p>
                      </div>
                      {selectedProfile.has_verified_badge && (
                        <span className="bd-status bd-status-active">
                          <Sparkles className="h-3.5 w-3.5" />
                          Platform verified
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <EmptyPanel title="No connected platform" description="This creator has not connected a social profile yet." />
              )}
            </div>
          </section>

          <section className="bd-section">
            <div className="bd-section-head">
              <span className="bd-section-title">Brand Fit Notes</span>
            </div>
            <div className="bd-section-body space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={bioMode === "profile" ? "default" : "outline"} onClick={() => setBioMode("profile")}>Saved Bio</Button>
                <Button type="button" variant={bioMode === "platform" ? "default" : "outline"} onClick={() => setBioMode("platform")}>Platform Bio</Button>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{displayBio}</p>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Languages" value={creator.languages.slice(0, 2).join(", ").toUpperCase() || "-"} />
                <Metric label="Rating" value={creator.average_rating ? creator.average_rating.toFixed(1) : "-"} />
              </div>
              <Button className="w-full" asChild>
                <Link href="/brand/dashboard/campaigns/new">Create Campaign</Link>
              </Button>
            </div>
          </section>
        </div>

        <section className="bd-section">
          <div className="bd-section-head">
            <span className="bd-section-title">Top Content</span>
            <span className="text-xs text-muted-foreground">Stored from creator syncs</span>
          </div>
          <div className="bd-section-body">
            {(selectedContent.length ? selectedContent : fallbackContent).length === 0 ? (
              <EmptyPanel title="No stored content yet" description="Top posts appear after the creator syncs YouTube, TikTok, or Instagram." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {(selectedContent.length ? selectedContent : fallbackContent).map(item => (
                  <TopContentCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="bd-section">
            <div className="bd-section-head">
              <span className="bd-section-title">Rate Card</span>
            </div>
            <div className="bd-section-body">
              <RateCardTable rateCards={creator.rate_cards} />
            </div>
          </section>

          <section className="bd-section">
            <div className="bd-section-head">
              <span className="bd-section-title">Reviews</span>
            </div>
            <div className="bd-section-body">
              {reviews.length === 0 ? (
                <EmptyPanel title="No public reviews yet" description="Completed collaborations will add public proof here." />
              ) : reviews.map(review => (
                <div key={review.id} className="bd-campaign-row">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {review.reviewer_brand_id ? "Verified Brand" : "Verified Creator"}
                    </p>
                    {review.review_text && <p className="mt-1 text-sm text-muted-foreground">{review.review_text}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                  </div>
                  <StarRating rating={review.rating} size="sm" showValue={false} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
      <ImageIcon className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TopContentCard({ item }: { item: CreatorPortfolioItem }) {
  return (
    <Link href={item.content_url} target="_blank" className="group overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-primary/50">
      <div className="aspect-video bg-muted">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title || "Creator content"} className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <PlatformBadge platform={item.platform} showLabel size="sm" />
          {item.published_at && <span className="text-[11px] text-muted-foreground">{formatDate(item.published_at)}</span>}
        </div>
        <p className="line-clamp-2 min-h-10 text-sm font-semibold text-foreground">{item.title || "Untitled content"}</p>
        <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatMetric(item.views)}</span>
          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatMetric(item.likes)}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatMetric(item.comments)}</span>
        </div>
      </div>
    </Link>
  );
}
