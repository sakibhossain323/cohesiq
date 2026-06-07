"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/shared/StarRating";
import { NicheBadge } from "@/components/shared/NicheBadge";
import { MapPin, MessageCircle } from "lucide-react";
import { AuthenticityBadge } from "@/components/creator/AuthenticityBadge";
import { getAvatarInitials } from "@/lib/avatar";
import type { Creator } from "@/lib/types";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface CreatorProfileHeaderProps {
  creator: Creator;
  actionSlot?: React.ReactNode;
}

export function CreatorProfileHeader({ creator, actionSlot }: CreatorProfileHeaderProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const initials = getAvatarInitials(creator.display_name);

  const handleContact = () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    // Handle contact logic for authenticated users
    alert("Messaging feature coming soon!");
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar className="h-24 w-24 border-4 border-border">
          <AvatarImage src={creator.profile_photo_url} alt={creator.display_name} />
          <AvatarFallback className="bg-muted text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {creator.display_name}
                </h1>
                {creator.is_available ? (
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    Busy
                  </Badge>
                )}
              </div>

              {creator.tagline && (
                <p className="mt-1 text-muted-foreground">{creator.tagline}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {creator.city && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{creator.city}</span>
                  </div>
                )}
                {creator.average_rating && (
                  <StarRating rating={creator.average_rating} size="sm" />
                )}
                <AuthenticityBadge score={creator.trust_score} size="md" />
                <span className="text-sm text-muted-foreground">
                  {creator.total_collaborations} collaborations
                </span>
              </div>
            </div>

            {actionSlot || (
              <Button className="shrink-0" onClick={handleContact}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact
              </Button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <NicheBadge niche={creator.primary_niche} />
            {creator.niches
              .filter(n => n !== creator.primary_niche)
              .map(niche => (
                <NicheBadge key={niche} niche={niche} variant="outline" />
              ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {creator.languages.map(lang => (
              <Badge key={lang} variant="secondary" className="text-xs">
                {lang}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
