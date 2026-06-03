import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCampaignsByBrandId } from "@/lib/api/campaigns";
import { getMyBrandProfile } from "@/lib/api/brands";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignStatusBadge } from "@/components/campaign/CampaignStatusBadge";
import { formatBDT, formatDate, daysUntil } from "@/lib/utils";
import { Briefcase, Plus } from "lucide-react";

export default async function BrandCampaignsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  const brand = token ? await getMyBrandProfile(token) : null;
  const campaigns = brand ? await getCampaignsByBrandId(brand.id).catch(() => []) : [];

  return (
    <div className="flex flex-col bg-background min-h-full">
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              My Campaigns
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your active campaigns, review applications, and find creators.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/brand/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground border-dashed border-2 m-4 rounded-xl">
                <Briefcase className="mb-4 h-12 w-12 opacity-20" />
                <p className="font-medium text-foreground text-lg mb-2">No campaigns found</p>
                <p className="text-sm max-w-sm mb-6">
                  Create your first campaign to start receiving applications and matching with creators.
                </p>
                <Button asChild>
                  <Link href="/dashboard/brand/campaigns/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Budget Max</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map(campaign => {
                    const daysLeft = campaign.application_deadline
                      ? daysUntil(campaign.application_deadline)
                      : null;

                    return (
                      <TableRow key={campaign.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="font-medium text-foreground">{campaign.title}</div>
                          {campaign.primary_niche && campaign.primary_niche !== "general" && (
                            <div className="text-xs text-muted-foreground mt-1 capitalize">
                              {campaign.primary_niche.replace('_', ' ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <CampaignStatusBadge status={campaign.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">
                            {campaign.budget_per_creator_max
                              ? formatBDT(campaign.budget_per_creator_max)
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {campaign.application_deadline
                              ? formatDate(campaign.application_deadline)
                              : 'No deadline'}
                          </div>
                          {campaign.status === "active" && daysLeft !== null && daysLeft > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {daysLeft} days left
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/brand/campaigns/${campaign.id}`}>
                              Manage
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
