import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingRoleSelect } from "./_components/OnboardingRoleSelect";

export default async function OnboardingPage() {
  const { sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as
    | { role?: string; onboardingComplete?: boolean }
    | undefined;

  if (metadata?.onboardingComplete) {
    const role = metadata.role === "brand" ? "brand" : "creator";
    redirect(`/${role}/dashboard`);
  }

  return <OnboardingRoleSelect />;
}
