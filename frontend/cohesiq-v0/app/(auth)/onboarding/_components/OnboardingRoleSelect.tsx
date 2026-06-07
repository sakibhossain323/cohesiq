"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Megaphone, User } from "lucide-react";
import { useOnboarding } from "@/components/providers/OnboardingProvider";
import { OnboardingLogo } from "./OnboardingShell";

export function OnboardingRoleSelect() {
  const router = useRouter();
  const { setRole } = useOnboarding();

  const handleSelectRole = (role: "creator" | "brand") => {
    setRole(role);
    if (role === "creator") {
      router.push("/onboarding/creator/personal-info");
    } else {
      router.push("/onboarding/brand/profile");
    }
  };

  return (
    <div className="ob-root">
      <div className="ob-shell">
        <header className="ob-topbar">
          <OnboardingLogo />
          <div className="ob-topbar-note">
            <strong>Bangladesh&apos;s</strong> creator marketplace
          </div>
        </header>

        <div className="ob-fork">
          <span className="eyebrow ob-rise">Welcome to Cohesiq</span>
          <h1 className="ob-title ob-rise" style={{ "--i": 1 } as React.CSSProperties}>
            How will you use <span className="ob-grad">Cohesiq</span>?
          </h1>
          <p className="ob-lead ob-rise" style={{ "--i": 2 } as React.CSSProperties}>
            One platform, two doors. Choose the path that fits — it shapes your profile and the
            tools you&apos;ll see next.
          </p>

          <div className="ob-pick">
            <button
              type="button"
              className="ob-pick-card brand ob-rise"
              style={{ "--i": 3 } as React.CSSProperties}
              onClick={() => handleSelectRole("brand")}
            >
              <span className="ob-pick-ico">
                <Megaphone />
              </span>
              <span className="ob-pick-kicker">For brands</span>
              <span className="ob-pick-title">I represent a brand</span>
              <span className="ob-pick-desc">
                Post a campaign and get matched with verified creators — ranked by niche, audience,
                and real engagement.
              </span>
              <ul className="ob-pick-list">
                <li>
                  <span className="ck"><Check /></span> AI-ranked creator matches
                </li>
                <li>
                  <span className="ck"><Check /></span> Brief-to-payment workspace
                </li>
                <li>
                  <span className="ck"><Check /></span> ROI tracking per collaboration
                </li>
              </ul>
              <span className="ob-pick-go">
                Continue as a brand <ArrowRight className="ico" />
              </span>
            </button>

            <button
              type="button"
              className="ob-pick-card creator ob-rise"
              style={{ "--i": 4 } as React.CSSProperties}
              onClick={() => handleSelectRole("creator")}
            >
              <span className="ob-pick-ico">
                <User />
              </span>
              <span className="ob-pick-kicker">For creators</span>
              <span className="ob-pick-title">I&apos;m a creator</span>
              <span className="ob-pick-desc">
                Build a verified profile and let brands come to you — no cold DMs, just offers with
                budgets attached.
              </span>
              <ul className="ob-pick-list">
                <li>
                  <span className="ck"><Check /></span> Verified, discoverable profile
                </li>
                <li>
                  <span className="ck"><Check /></span> Inbound brand offers
                </li>
                <li>
                  <span className="ck"><Check /></span> Transparent rate cards
                </li>
              </ul>
              <span className="ob-pick-go">
                Continue as a creator <ArrowRight className="ico" />
              </span>
            </button>
          </div>

          <p className="ob-fork-foot ob-rise" style={{ "--i": 5 } as React.CSSProperties}>
            Not ready yet? <Link href="/">Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
