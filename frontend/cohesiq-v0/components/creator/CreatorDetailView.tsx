import { notFound } from "next/navigation";
import { CreatorProfileHeader } from "@/components/creator/CreatorProfileHeader";
import { SocialProfileCard } from "@/components/creator/SocialProfileCard";
import { RateCardTable } from "@/components/creator/RateCardTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/StarRating";
import { getCreatorById } from "@/lib/api/creators";
import { getPublicReviews } from "@/lib/api/reviews";
import { formatDate } from "@/lib/utils";

interface CreatorDetailViewProps {
  creatorId: string;
  actionSlot?: React.ReactNode;
}

export async function CreatorDetailView({ creatorId, actionSlot }: CreatorDetailViewProps) {
  const creator = await getCreatorById(creatorId);
  
  if (!creator) {
    notFound();
  }

  const reviews = await getPublicReviews();
  // Filter reviews that mention the creator's name (simulated)
  const creatorReviews = reviews.filter(r => 
    r.reviewer_name.toLowerCase().includes(creator.display_name.split(" ")[0].toLowerCase()) ||
    r.review_text?.toLowerCase().includes(creator.display_name.split(" ")[0].toLowerCase())
  ).slice(0, 4);

  return (
    <div className="flex flex-col bg-background w-full">
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full">
          {/* Profile Header */}
          <CreatorProfileHeader creator={creator} actionSlot={actionSlot} />

          {/* About Section */}
          {creator.bio && (
            <section className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{creator.bio}</p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Social Platforms */}
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Social Platforms</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {creator.social_profiles
                .sort((a, b) => (b.is_primary_platform ? 1 : 0) - (a.is_primary_platform ? 1 : 0))
                .map(profile => (
                  <SocialProfileCard key={profile.id} profile={profile} />
                ))}
            </div>
          </section>

          {/* Rate Cards */}
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Rate Card</h2>
            <RateCardTable rateCards={creator.rate_cards} />
          </section>

          {/* Reviews */}
          {creatorReviews.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Reviews</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {creatorReviews.map(review => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.reviewer_photo} alt={review.reviewer_name} />
                          <AvatarFallback className="text-xs">
                            {review.reviewer_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{review.reviewer_name}</p>
                            <StarRating rating={review.rating} size="sm" showValue={false} />
                          </div>
                          {review.review_text && (
                            <p className="mt-2 text-sm text-muted-foreground">{review.review_text}</p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
