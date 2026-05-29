import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge, getPlatformLabel } from "@/components/shared/PlatformBadge";
import { FollowerCount } from "@/components/shared/FollowerCount";
import { ExternalLink, TrendingUp, Eye } from "lucide-react";
import { formatFollowerCount } from "@/lib/utils";
import type { CreatorSocialProfile } from "@/lib/types";

interface SocialProfileCardProps {
  profile: CreatorSocialProfile;
}

export function SocialProfileCard({ profile }: SocialProfileCardProps) {
  return (
    <Card className={profile.is_primary_platform ? "border-primary/50 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <PlatformBadge platform={profile.platform} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {getPlatformLabel(profile.platform)}
                </span>
                {profile.is_primary_platform && (
                  <Badge variant="secondary" className="text-xs">
                    Primary
                  </Badge>
                )}
              </div>
              <a
                href={profile.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {profile.handle}
              </a>
            </div>
          </div>
          
          <a
            href={profile.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {profile.follower_count && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Followers</p>
              <p className="text-lg font-semibold text-foreground">
                {formatFollowerCount(profile.follower_count)}
              </p>
            </div>
          )}
          
          {profile.engagement_rate && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Engagement</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {profile.engagement_rate}%
              </p>
            </div>
          )}
          
          {profile.avg_views_per_post && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>Avg Views</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {formatFollowerCount(profile.avg_views_per_post)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
