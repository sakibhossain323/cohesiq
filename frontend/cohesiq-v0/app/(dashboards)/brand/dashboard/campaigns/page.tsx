import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCampaignsByBrandId } from "@/lib/api/campaigns";
import { getMyBrandProfile } from "@/lib/api/brands";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CampaignStatusBadge } from "./_components/CampaignStatusBadge";
import { formatBDT, formatDate, daysUntil } from "@/lib/utils";
import { getBrandCategoryLabel } from "@/lib/brand-categories";
import { Briefcase, Plus, Calculator, BarChart3, ArrowRight } from "lucide-react";

export default async function BrandCampaignsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  const brand = token ? await getMyBrandProfile(token) : null;
  const campaigns = brand ? await getCampaignsByBrandId(brand.id).catch(() => []) : [];

  return (
    <div className="bd-page">
      {/* ── Editorial header ───────────────────────────────── */}
      <header className="bd-header">
        <div className="bd-header-inner">
          <div>
            <span className="eyebrow mb-3 block">Brand Hub</span>
            <h1 className="bd-header-title">My Campaigns</h1>
            <p className="bd-header-sub">
              Manage campaigns, review applications, and find creators.
            </p>
          </div>
          <div className="bd-header-actions">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/brand/dashboard/campaigns/rate-benchmark">
                <BarChart3 className="mr-2 h-4 w-4" />
                Rate Benchmarks
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/brand/dashboard/campaigns/roi-calculator">
                <Calculator className="mr-2 h-4 w-4" />
                ROI Calculator
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
        <div className="bd-section">
          {campaigns.length === 0 ? (
            <div className="bd-empty">
              <div className="bd-empty-icon"><Briefcase className="h-6 w-6" /></div>
              <p className="bd-empty-title">No campaigns found</p>
              <p className="bd-empty-desc">
                Create your first campaign to start matching with creators.
              </p>
              <Button asChild>
                <Link href="/brand/dashboard/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead className="font-semibold text-text-secondary uppercase tracking-wide text-xs">
                    Campaign
                  </TableHead>
                  <TableHead className="font-semibold text-text-secondary uppercase tracking-wide text-xs">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-semibold text-text-secondary uppercase tracking-wide text-xs">
                    Budget / Creator
                  </TableHead>
                  <TableHead className="font-semibold text-text-secondary uppercase tracking-wide text-xs">
                    Deadline
                  </TableHead>
                  <TableHead className="text-right font-semibold text-text-secondary uppercase tracking-wide text-xs">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(campaign => {
                  const daysLeft = campaign.application_deadline
                    ? daysUntil(campaign.application_deadline)
                    : null;

                  return (
                    <TableRow
                      key={campaign.id}
                      className="hover:bg-surface-subtle transition-colors"
                    >
                      <TableCell>
                        <div className="font-semibold text-sm text-foreground font-display">
                          {campaign.title}
                        </div>
                        {campaign.primary_niche && campaign.primary_niche !== "general" && (
                          <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {campaign.primary_niche.replace("_", " ")}
                          </div>
                        )}
                        {campaign.brand_category && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {getBrandCategoryLabel(campaign.brand_category)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <CampaignStatusBadge status={campaign.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-sm">
                          {campaign.budget_per_creator_max
                            ? formatBDT(campaign.budget_per_creator_max)
                            : <span className="text-muted-foreground">Open</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          {campaign.application_deadline
                            ? formatDate(campaign.application_deadline)
                            : <span className="text-muted-foreground">No deadline</span>}
                        </div>
                        {campaign.status === "active" && daysLeft !== null && daysLeft > 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {daysLeft}d remaining
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/brand/dashboard/campaigns/${campaign.id}`}
                            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          >
                            Manage <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
