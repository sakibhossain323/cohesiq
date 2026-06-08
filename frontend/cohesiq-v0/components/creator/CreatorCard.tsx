import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/StarRating";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NicheBadge } from "@/components/shared/NicheBadge";
import { FollowerCount } from "@/components/shared/FollowerCount";
import { MapPin } from "lucide-react";
import { EstimatedTag } from "@/components/shared/EstimatedTag";
import { AuthenticityBadge } from "@/components/creator/AuthenticityBadge";
import { getAvatarInitials } from "@/lib/avatar";
import { sanitizeImageUrl } from "@/lib/utils";
import type { Creator } from "@/lib/types";

interface CreatorCardProps {
  creator: Creator;
  basePath?: string;
}

export function CreatorCard({ creator, basePath = "/brand/dashboard/creators" }: CreatorCardProps) {
  const primaryProfile = creator.social_profiles.find(sp => sp.is_primary_platform) ?? creator.social_profiles[0];
  const initials = getAvatarInitials(creator.display_name);

  return (
    <Link href={`${basePath}/${creator.id}`} className="block h-full">
      <Card className="group h-full min-h-80 transition-all duration-200 hover:border-primary/50 hover:shadow-md">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border-2 border-border">
              <AvatarImage src={sanitizeImageUrl(creator.profile_photo_url)} alt={creator.display_name} />
              <AvatarFallback className="bg-muted text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
                  {creator.display_name}
                </h3>
                {creator.is_available ? (
                  <Badge variant="outline" className="shrink-0 border-green-200 bg-green-50 text-green-700">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 border-amber-200 bg-amber-50 text-amber-700">
                    Busy
                  </Badge>
                )}
              </div>
              
              {creator.city && (
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{creator.city}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex min-h-7 flex-wrap gap-2">
            <NicheBadge niche={creator.primary_niche} size="sm" />
            {creator.niches
              .filter(n => n !== creator.primary_niche)
              .slice(0, 1)
              .map(niche => (
                <NicheBadge key={niche} niche={niche} size="sm" variant="outline" />
              ))}
          </div>

          <div className="mt-4 min-h-6">
            {primaryProfile && (
              <div className="flex items-center gap-3">
                <PlatformBadge platform={primaryProfile.platform} showLabel />
                {primaryProfile.follower_count && (
                  <FollowerCount count={primaryProfile.follower_count} />
                )}
              </div>
            )}
          </div>

          <div className="mt-2 min-h-6">
            {primaryProfile?.engagement_rate && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {primaryProfile.engagement_rate}%
                </span>{" "}
                engagement rate
                <EstimatedTag variant="self-reported" />
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
            <AuthenticityBadge score={creator.trust_score} size="sm" />
          </div>

          <div className="mt-3 min-h-9 border-t border-border pt-3">
            {creator.average_rating && (
              <StarRating rating={creator.average_rating} size="sm" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
