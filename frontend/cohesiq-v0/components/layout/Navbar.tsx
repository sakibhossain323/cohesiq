"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

const navLinks = [
  { href: "/creators", label: "Creators" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/#engine", label: "The Engine" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();

  // Route signed-in users to their dashboard if onboarding is done, else /onboarding
  const onboardingComplete = user?.publicMetadata?.onboardingComplete as boolean | undefined;
  const role = user?.publicMetadata?.role as string | undefined;
  const dashboardHref = onboardingComplete && role ? `/${role}/dashboard` : "/onboarding";

  // On the editorial home hero the bar floats transparently over ink and scrolls
  // away; everywhere else it's a refined sticky paper bar.
  const onHero = pathname === "/";

  const accent = "#d8412a";
  const ink = "#100f0c";
  const paper = "#f4efe4";
  const textBase = onHero ? paper : ink;
  const textMuted = onHero ? "rgba(244,239,228,0.62)" : "#6d6657";
  const hairline = onHero ? "rgba(244,239,228,0.18)" : "rgba(16,15,12,0.12)";

  return (
    <header
      className={cn(
        "z-50 w-full",
        onHero ? "absolute top-0 left-0" : "sticky top-0 backdrop-blur-md"
      )}
      style={
        onHero
          ? undefined
          : { background: "rgba(244,239,228,0.85)", borderBottom: `1px solid ${hairline}` }
      }
    >
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-6 sm:h-20 sm:px-12">
        {/* wordmark */}
        <Link href="/" className="flex items-baseline gap-2" style={{ color: textBase }}>
          <span className="font-serif text-2xl font-light tracking-tight sm:text-[1.7rem]">
            Cohesiq
          </span>
          <span
            className="hidden font-mono text-[9px] tracking-[0.24em] sm:inline"
            style={{ color: textMuted }}
          >
            / MATCHMAKING
          </span>
        </Link>

        {/* center nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group relative font-mono text-[11px] tracking-[0.22em] uppercase transition-colors"
                style={{ color: active ? textBase : textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = active ? textBase : textMuted)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* right cluster */}
        <div className="hidden items-center gap-4 md:flex">
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/onboarding">
              <button
                className="font-mono text-[11px] tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
                style={{ color: textBase }}
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
              <button
                className="font-mono px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase transition-transform hover:-translate-y-0.5"
                style={{ background: accent, color: "#fff" }}
              >
                Get Started
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href={dashboardHref}
              className="font-mono border px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase transition-colors"
              style={{ borderColor: hairline, color: textBase }}
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>

        {/* mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center md:hidden"
          style={{ color: textBase }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* mobile menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{ background: onHero ? ink : paper, borderTop: `1px solid ${hairline}` }}
        >
          <nav className="flex flex-col gap-1 px-6 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono py-3 text-[12px] tracking-[0.22em] uppercase"
                style={{ color: pathname === link.href ? textBase : textMuted }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3 pt-4" style={{ borderTop: `1px solid ${hairline}` }}>
              <Show when="signed-out">
                <SignInButton mode="modal" forceRedirectUrl="/onboarding">
                  <button
                    className="font-mono border py-3 text-[11px] tracking-[0.2em] uppercase"
                    style={{ borderColor: hairline, color: textBase }}
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                  <button
                    className="font-mono py-3 text-[11px] tracking-[0.2em] uppercase text-white"
                    style={{ background: accent }}
                  >
                    Get Started
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href={dashboardHref}
                  className="font-mono border py-3 text-center text-[11px] tracking-[0.2em] uppercase"
                  style={{ borderColor: hairline, color: textBase }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </Show>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
