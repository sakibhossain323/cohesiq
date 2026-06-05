import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMyCreatorProfile } from "@/lib/api/creators";
import { getMyBrandProfile } from "@/lib/api/brands";
import { OnboardingRoleSelect } from "./_components/OnboardingRoleSelect";

export default async function OnboardingPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (token) {
    const [creator, brand] = await Promise.all([
      getMyCreatorProfile(token).catch(() => null),
      getMyBrandProfile(token).catch(() => null),
    ]);

    if (brand) redirect("/brand/dashboard");
    if (creator) redirect("/creator/dashboard");
  }

  return <OnboardingRoleSelect />;
}
