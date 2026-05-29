import Link from "next/link";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { ApplicationStatusBadge } from "@/components/application/ApplicationStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { StarRating } from "@/components/shared/StarRating";
import { NicheBadge } from "@/components/shared/NicheBadge";
import { getApplicationsByCreatorId } from "@/lib/api/applications";
import { getSuggestedCampaigns } from "@/lib/api/campaigns";
import { getCreatorById } from "@/lib/api/creators";
import { formatBDT, formatDate } from "@/lib/utils";
import { ExternalLink, FileText, MapPin } from "lucide-react";

// Hardcode current creator as mockCreators[0]
const CURRENT_CREATOR_ID = "creator-1";

export default async function CreatorDashboardPage() {
  const [creator, applications, suggestedCampaigns] = await Promise.all([
    getCreatorById(CURRENT_CREATOR_ID),
    getApplicationsByCreatorId(CURRENT_CREATOR_ID),
    getSuggestedCampaigns("Food", 3),
  ]);

  if (!creator) {
    return <div>Creator not found</div>;
  }

  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Creator Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your applications and discover new opportunities
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-8 lg:col-span-2">
              {/* My Applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    My Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No applications yet"
                      description="Browse campaigns and apply to get started"
                      action={
                        <Button asChild>
                          <Link href="/campaigns">Browse Campaigns</Link>
                        </Button>
                      }
                    />
                  ) : (
                    <div className="rounded-lg border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Campaign</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Applied</TableHead>
                            <TableHead className="text-right">Proposed Rate</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {applications.map(app => (
                            <TableRow key={app.id}>
                              <TableCell>
                                <Link 
                                  href={`/campaigns/${app.campaign_id}`}
                                  className="font-medium text-foreground hover:text-primary hover:underline"
                                >
                                  {app.campaign.title}
                                </Link>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {app.campaign.brand.brand_name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(app.applied_at)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {app.proposed_rate ? formatBDT(app.proposed_rate) : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                <ApplicationStatusBadge status={app.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Suggested Campaigns */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Suggested Campaigns
                </h2>
                <div className="space-y-4">
                  {suggestedCampaigns.map(campaign => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Profile Summary */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 border-4 border-border">
                      <AvatarImage src={creator.profile_photo_url} alt={creator.display_name} />
                      <AvatarFallback className="text-xl font-bold">
                        {creator.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                      {creator.display_name}
                    </h3>
                    
                    {creator.tagline && (
                      <p className="mt-1 text-sm text-muted-foreground">{creator.tagline}</p>
                    )}

                    {creator.city && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{creator.city}</span>
                      </div>
                    )}

                    {creator.average_rating && (
                      <div className="mt-3">
                        <StarRating rating={creator.average_rating} size="sm" />
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <NicheBadge niche={creator.primary_niche} size="sm" />
                    </div>

                    <div className="mt-6 grid w-full grid-cols-2 gap-4 border-t border-border pt-6">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {creator.total_collaborations}
                        </p>
                        <p className="text-xs text-muted-foreground">Collaborations</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {applications.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Applications</p>
                      </div>
                    </div>

                    <Button variant="outline" className="mt-6 w-full" asChild>
                      <Link href={`/creators/${creator.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Public Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
