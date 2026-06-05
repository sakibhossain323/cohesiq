import { auth } from "@clerk/nextjs/server";
import { getMyBrandProfile } from "@/lib/api/brands";
import { ProfileForm } from "./_components/ProfileForm";
import { Building2 } from "lucide-react";
import { ResetOnboardingButton } from "@/components/onboarding/ResetOnboardingButton";

export default async function BrandProfilePage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    return null; // Layout should handle redirect
  }

  const brand = await getMyBrandProfile(token);

  if (!brand) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center bg-background">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Profile not found</h2>
        <p className="text-muted-foreground mb-6">We couldn't find a brand profile for your account. Please complete onboarding.</p>
        <ResetOnboardingButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Brand Profile
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your company details and public presence on Cohesiq.
        </p>
      </div>

      <div className="grid gap-8">
        <ProfileForm initialBrand={brand} />
      </div>
    </div>
  );
}
