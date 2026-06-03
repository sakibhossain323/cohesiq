import { auth } from "@clerk/nextjs/server";
import { getMyCreatorProfile } from "@/lib/api/creators";
import { CreatorProfileClient } from "./_components/CreatorProfileClient";
import { ResetOnboardingButton } from "@/components/onboarding/ResetOnboardingButton";

export default async function CreatorPlatformsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return null; // layout handles redirect
  }

  const creator = await getMyCreatorProfile(token);

  if (!creator) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center bg-background">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Profile not found</h2>
        <p className="text-muted-foreground mb-6">We couldn't find a creator profile for your account. Please complete onboarding.</p>
        <ResetOnboardingButton />
      </div>
    );
  }

  return <CreatorProfileClient creatorId={creator.id} initialProfiles={creator.social_profiles || []} />;
}
