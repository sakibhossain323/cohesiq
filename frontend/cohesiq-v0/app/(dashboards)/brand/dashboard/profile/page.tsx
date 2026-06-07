import { auth } from "@clerk/nextjs/server";
import { getMyBrandProfile } from "@/lib/api/brands";
import { ProfileForm } from "./_components/ProfileForm";
import { Building2 } from "lucide-react";
import { ResetOnboardingButton } from "@/components/onboarding/ResetOnboardingButton";

export default async function BrandProfilePage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return null;
  }

  const brand = await getMyBrandProfile(token);

  if (!brand) {
    return (
      <div className="bd-empty" style={{ minHeight: "50vh" }}>
        <div className="bd-empty-icon"><Building2 className="h-6 w-6" /></div>
        <p className="bd-empty-title">Profile not found</p>
        <p className="bd-empty-desc">
          We couldn&apos;t find a brand profile. Please complete onboarding.
        </p>
        <ResetOnboardingButton />
      </div>
    );
  }

  return (
    <div className="bd-page">
      {/* ── Editorial header ───────────────────────────────── */}
      <header className="bd-header">
        <div className="bd-header-inner">
          <div>
            <span className="eyebrow mb-3 block">Settings</span>
            <h1 className="bd-header-title">Brand Profile</h1>
            <p className="bd-header-sub">
              Manage your company details and public presence on Cohesiq.
            </p>
          </div>
        </div>
      </header>

      <div className="bd-body" style={{ maxWidth: "760px" }}>
        <ProfileForm initialBrand={brand} />
      </div>
    </div>
  );
}
