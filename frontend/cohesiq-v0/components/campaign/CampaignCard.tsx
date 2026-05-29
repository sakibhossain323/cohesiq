import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NicheBadge } from "@/components/shared/NicheBadge";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { formatBDT, daysUntil } from "@/lib/utils";
import { BadgeCheck, Calendar, Users } from "lucide-react";
import type { Campaign } from "@/lib/types";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const daysLeft = campaign.application_deadline 
    ? daysUntil(campaign.application_deadline)
    : null;
  
  const budgetRange = campaign.budget_per_creator_min
    ? `${formatBDT(campaign.budget_per_creator_min)} - ${formatBDT(campaign.budget_per_creator_max)}`
    : `Up to ${formatBDT(campaign.budget_per_creator_max)}`;

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <Card className="group transition-all duration-200 hover:border-primary/50 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 rounded-lg border border-border">
              <AvatarImage src={campaign.brand.logo_url} alt={campaign.brand.brand_name} />
              <AvatarFallback className="rounded-lg bg-muted text-sm font-medium">
                {campaign.brand.brand_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {campaign.brand.brand_name}
                </span>
                {campaign.brand.is_verified && (
                  <BadgeCheck className="h-4 w-4 text-primary" />
                )}
              </div>
              <h3 className="mt-1 font-semibold text-foreground group-hover:text-primary">
                {campaign.title}
              </h3>
            </div>

            <StatusBadge status={campaign.status} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <NicheBadge niche={campaign.primary_niche} size="sm" />
            {campaign.required_platforms && campaign.required_platforms.slice(0, 3).map(platform => (
              <Badge key={platform} variant="outline" className="flex items-center gap-1">
                <PlatformBadge platform={platform} size="sm" />
              </Badge>
            ))}
            {campaign.required_platforms && campaign.required_platforms.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{campaign.required_platforms.length - 3} more
              </Badge>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{budgetRange}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground">Applications</p>
              <div className="mt-0.5 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {campaign.application_count}
                </span>
              </div>
            </div>

            {daysLeft !== null && campaign.status === "active" && (
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <Calendar className={daysLeft <= 7 ? "h-3.5 w-3.5 text-red-500" : "h-3.5 w-3.5 text-muted-foreground"} />
                  <span className={daysLeft <= 7 ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-foreground"}>
                    {daysLeft > 0 ? `${daysLeft} days left` : "Ending soon"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const config = {
    draft: { label: "Draft", className: "border-gray-200 bg-gray-50 text-gray-700" },
    active: { label: "Active", className: "border-green-200 bg-green-50 text-green-700" },
    in_progress: { label: "In Progress", className: "border-blue-200 bg-blue-50 text-blue-700" },
    completed: { label: "Completed", className: "border-muted bg-muted/50 text-muted-foreground" },
    cancelled: { label: "Cancelled", className: "border-red-200 bg-red-50 text-red-700" },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
