import { auth } from "@clerk/nextjs/server";
import { getMyCreatorProfile } from "@/lib/api/creators";
import { getApplicationsByCreatorId } from "@/lib/api/applications";
import { CollaborationsClient } from "./_components/CollaborationsClient";
import { ResetOnboardingButton } from "@/components/onboarding/ResetOnboardingButton";

export default async function CreatorCollaborationsPage() {
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

  const apps = await getApplicationsByCreatorId(creator.id, token);
  const sorted = apps.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
  
  const invitations = sorted.filter(a => a.status === 'invited');
  const myApplications = sorted.filter(a => a.status !== 'accepted' && a.status !== 'completed' && a.status !== 'invited');
  const activeContracts = sorted.filter(a => a.status === 'accepted' || a.status === 'completed');

  return (
    <CollaborationsClient 
      invitations={invitations}
      myApplications={myApplications}
      activeContracts={activeContracts}
    />
  );
}
