"use client";

import { useRouter } from "next/navigation";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, User } from "lucide-react";
import { useOnboarding } from "@/components/providers/OnboardingProvider";

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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="mx-auto max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to Cohesiq</h1>
        <p className="text-muted-foreground mb-8">
          To get started, tell us how you want to use the platform.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
            onClick={() => handleSelectRole("creator")}
          >
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>I am a Creator</CardTitle>
              <CardDescription>
                I want to showcase my portfolio and apply to brand campaigns.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" variant="outline">Select Creator</Button>
            </CardFooter>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
            onClick={() => handleSelectRole("brand")}
          >
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>I represent a Brand</CardTitle>
              <CardDescription>
                I want to discover creators and post campaigns.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" variant="outline">Select Brand</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
