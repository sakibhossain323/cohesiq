"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resetOnboarding } from "@/app/actions/onboarding";

export function ResetOnboardingButton() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await resetOnboarding();
      if (res.success) {
        // Force refresh the router to clear any middleware cache/redirect state
        router.push("/onboarding");
        router.refresh();
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
