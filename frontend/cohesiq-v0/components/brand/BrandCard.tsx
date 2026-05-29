import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/shared/StarRating";
import { BadgeCheck, Building2, MapPin } from "lucide-react";
import type { Brand } from "@/lib/types";

interface BrandCardProps {
  brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 rounded-lg border border-border">
            <AvatarImage src={brand.logo_url} alt={brand.brand_name} />
            <AvatarFallback className="rounded-lg bg-muted text-sm font-medium">
              {brand.brand_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{brand.brand_name}</h3>
              {brand.is_verified && (
                <BadgeCheck className="h-4 w-4 text-primary" />
              )}
            </div>

            {brand.city && (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{brand.city}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Campaigns</p>
            <div className="mt-0.5 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {brand.total_campaigns}
              </span>
            </div>
          </div>

          {brand.average_rating && (
            <div>
              <p className="text-xs text-muted-foreground">Rating</p>
              <div className="mt-0.5">
                <StarRating rating={brand.average_rating} size="sm" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
