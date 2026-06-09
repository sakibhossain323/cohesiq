"use client";

import { useState } from "react";
import { useSession } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { resetOnboarding } from "@/app/(auth)/onboarding/_actions/onboarding";

export function ResetOnboardingButton() {
  const { session } = useSession();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await resetOnboarding();
      if (res.success) {
        // Reload the Clerk session so the JWT reflects the cleared metadata
        // before the middleware runs — otherwise the onboardingComplete guard
        // redirects back here on a stale token.
        await session?.reload();
        window.location.href = "/onboarding";
      } else {
        alert(res.error || "Failed to reset onboarding.");
        setIsResetting(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error resetting onboarding.");
      setIsResetting(false);
    }
  };

  return (
    <Button onClick={handleReset} disabled={isResetting}>
      {isResetting ? "Resetting..." : "Go to Onboarding"}
    </Button>
  );
}
