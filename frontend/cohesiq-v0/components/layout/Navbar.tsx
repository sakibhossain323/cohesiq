"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

const navLinks = [
  { href: "/creators", label: "Browse Creators" },
  { href: "/campaigns", label: "Browse Campaigns" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();

  // Route signed-in users to their dashboard if onboarding is done, else /onboarding
  const onboardingComplete = user?.publicMetadata?.onboardingComplete as boolean | undefined;
  const role = user?.publicMetadata?.role as string | undefined;
  const dashboardHref = onboardingComplete && role ? `/${role}/dashboard` : '/onboarding';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-xl font-bold text-foreground">Cohesiq</span>
          </Link>
          
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/onboarding">
              <Button variant="ghost" size="sm">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
              <Button size="sm">Get Started</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Button variant="outline" size="sm" asChild className="mr-2">
              <Link href={dashboardHref}>Dashboard</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border md:hidden">
          <nav className="flex flex-col gap-2 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <Show when="signed-out">
                <SignInButton mode="modal" forceRedirectUrl="/onboarding">
                  <Button variant="outline" size="sm" className="w-full justify-center">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                  <Button size="sm" className="w-full justify-center">Get Started</Button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Button variant="outline" size="sm" asChild className="w-full justify-center">
                  <Link href={dashboardHref}>Dashboard</Link>
                </Button>
              </Show>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
