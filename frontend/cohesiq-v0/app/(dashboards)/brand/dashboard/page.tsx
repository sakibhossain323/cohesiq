import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCampaignsByBrandId } from "@/lib/api/campaigns";
import { getMyBrandProfile } from "@/lib/api/brands";
import { ResetOnboardingButton } from "@/components/onboarding/ResetOnboardingButton";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, MessageSquare, Plus, Search, ArrowRight } from "lucide-react";
import type { Campaign } from "@/lib/types";

export default async function BrandDashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return (
      <div className="bd-empty">
        <div className="bd-empty-icon"><Briefcase className="h-6 w-6" /></div>
        <p className="bd-empty-title">Access Denied</p>
        <p className="bd-empty-desc">Please log in to access your dashboard.</p>
        <Button asChild><Link href="/sign-in">Log In</Link></Button>
      </div>
    );
  }

  const brand = await getMyBrandProfile(token);

  if (!brand) {
    return (
      <div className="bd-empty">
        <div className="bd-empty-icon"><Briefcase className="h-6 w-6" /></div>
        <p className="bd-empty-title">Profile not found</p>
        <p className="bd-empty-desc">
          We couldn&apos;t find a brand profile. Please complete onboarding.
        </p>
        <ResetOnboardingButton />
      </div>
    );
  }

  const campaigns: Campaign[] = await getCampaignsByBrandId(brand.id).catch(() => []);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const pendingApps = 0;
  const unreadMessages = 2;

  return (
    <div className="bd-page">
      {/* ── Editorial header ───────────────────────────────── */}
      <header className="bd-header">
        <div className="bd-header-inner">
          <div>
            <span className="eyebrow mb-3 block">Brand Dashboard</span>
            <h1 className="bd-header-title">
              Welcome back,<br />{brand.brand_name}
            </h1>
            <p className="bd-header-sub">
              Here&apos;s what&apos;s happening with your influencer campaigns today.
            </p>
          </div>
          <div className="bd-header-actions">
            <Button variant="outline" asChild>
              <Link href="/brand/dashboard/creators">
                <Search className="mr-2 h-4 w-4" />
                Find Creators
              </Link>
            </Button>
            <Button asChild>
              <Link href="/brand/dashboard/campaigns/new">
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="bd-body">
        {/* ── Stats ──────────────────────────────────────── */}
        <div className="bd-stats">
          <div className="bd-stat">
            <div className="bd-stat-icon">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="bd-stat-num">{activeCampaigns}</div>
            <div className="bd-stat-label">Active Campaigns</div>
            <div className="bd-stat-sub">out of {campaigns.length} total</div>
          </div>

          <div className="bd-stat">
            <div className="bd-stat-icon warm">
              <Users className="h-5 w-5" />
            </div>
            <div className="bd-stat-num">{pendingApps}</div>
            <div className="bd-stat-label">Pending Applications</div>
            <div className="bd-stat-sub">waiting for review</div>
          </div>

          <div className="bd-stat">
            <div className="bd-stat-icon">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="bd-stat-num">{unreadMessages}</div>
            <div className="bd-stat-label">Unread Messages</div>
            <div className="bd-stat-sub">from active creators</div>
          </div>
        </div>

        {/* ── Recent Campaigns ───────────────────────────── */}
        <div className="bd-section">
          <div className="bd-section-head">
            <span className="bd-section-title">Recent Campaigns</span>
            {campaigns.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/brand/dashboard/campaigns" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>

          <div className="bd-section-body">
            {campaigns.length === 0 ? (
              <div className="bd-empty" style={{ paddingBlock: "var(--space-10)" }}>
                <div className="bd-empty-icon"><Briefcase className="h-6 w-6" /></div>
                <p className="bd-empty-title">No campaigns yet</p>
                <p className="bd-empty-desc">
                  Create your first campaign to start connecting with creators.
                </p>
                <Button asChild>
                  <Link href="/brand/dashboard/campaigns/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Link>
                </Button>
              </div>
            ) : (
              <div>
                {campaigns.slice(0, 5).map(campaign => (
                  <div key={campaign.id} className="bd-campaign-row">
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">{campaign.title}</p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5 capitalize">
                        {campaign.status.replace("_", " ")}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/brand/dashboard/campaigns/${campaign.id}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs">
                        Manage <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
