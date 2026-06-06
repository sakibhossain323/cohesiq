"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-provider";

const navLinks = [
  { href: "/#how", label: "How it Works" },
  { href: "/#brands", label: "For Brands" },
  { href: "/#creators", label: "For Creators" },
  { href: "/#pricing", label: "Pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();

  const onboardingComplete = user?.publicMetadata?.onboardingComplete as boolean | undefined;
  const role = user?.publicMetadata?.role as string | undefined;
  const dashboardHref = onboardingComplete && role ? `/${role}/dashboard` : "/onboarding";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      id="nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 80,
        transition: "background .35s ease, border-color .35s ease, box-shadow .35s ease",
        borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
        background: scrolled
          ? "color-mix(in oklab, var(--color-surface) 80%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(140%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(140%)" : "none",
        boxShadow: scrolled ? "var(--shadow-sm)" : "none",
      }}
    >
      <div
        className="container-cohesiq"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 76 }}
      >
        {/* Logo */}
        <Link href="/" className="logo" aria-label="Cohesiq home">
          <svg className="logo-mark" viewBox="0 0 32 32" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="4" fill="var(--brand-primary)" />
            <circle cx="24" cy="9" r="3" fill="var(--brand-secondary)" />
            <circle cx="22" cy="24" r="4.5" fill="var(--brand-primary)" />
            <line x1="8" y1="8" x2="24" y2="9" stroke="var(--brand-primary)" strokeWidth="1.6" opacity="0.55" />
            <line x1="8" y1="8" x2="22" y2="24" stroke="var(--brand-primary)" strokeWidth="1.6" opacity="0.55" />
            <line x1="24" y1="9" x2="22" y2="24" stroke="var(--brand-secondary)" strokeWidth="1.6" opacity="0.55" />
          </svg>
          Cohesiq
          {pathname === "/design-system" && (
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              &nbsp;/ Design System
            </span>
          )}
        </Link>

        {/* Nav links */}
        {pathname !== "/design-system" && (
          <nav
          style={{ display: "flex", gap: "var(--space-8)" }}
          className="hidden md:flex"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontWeight: 500,
                fontSize: "var(--text-base)",
                color: "var(--color-text-secondary)",
                transition: "color .2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        )}

        {/* Actions */}
        {pathname === "/design-system" ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Link href="/" className="btn btn-ghost btn-sm">
              View landing &rarr;
            </Link>
            <ThemeToggle />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <ThemeToggle />
            {!isSignedIn && (
              <>
                <SignInButton mode="modal" forceRedirectUrl="/onboarding">
                  <button className="btn btn-ghost btn-sm">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                  <button className="btn btn-primary btn-sm">Get Started</button>
                </SignUpButton>
              </>
            )}
            {isSignedIn && (
              <>
                <Link href={dashboardHref} className="btn btn-ghost btn-sm">
                  Dashboard
                </Link>
                <UserButton />
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
