import Link from "next/link";
import { ReactNode } from "react";

/* Distinctive Cohesiq mark — two interlocking links on a gradient tile */
export function CohesiqMark() {
  return (
    <span className="ob-logo-mark" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M9.5 8.2A4.4 4.4 0 0 0 8 16.6" strokeLinecap="round" />
        <path d="M14.5 15.8A4.4 4.4 0 0 0 16 7.4" strokeLinecap="round" />
        <circle cx="9" cy="12.4" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="11.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

export function OnboardingLogo() {
  return (
    <Link href="/" className="ob-logo">
      <CohesiqMark />
      Cohesiq
    </Link>
  );
}

interface OnboardingShellProps {
  accent?: "brand" | "warm";
  eyebrow: string;
  title: ReactNode;
  lead: string;
  /** Stepper, proof points, or other rail content rendered under the lead. */
  rail?: ReactNode;
  /** Top-bar right-aligned note (e.g. step counter). */
  note?: ReactNode;
  /** Right-hand form stage. */
  children: ReactNode;
}

export function OnboardingShell({
  accent = "brand",
  eyebrow,
  title,
  lead,
  rail,
  note,
  children,
}: OnboardingShellProps) {
  const warm = accent === "warm";
  return (
    <div className="ob-root">
      <div className="ob-shell">
        <header className="ob-topbar">
          <OnboardingLogo />
          {note ? <div className="ob-topbar-note">{note}</div> : null}
        </header>

        <div className="ob-split">
          <aside className={`ob-rail${warm ? " warm" : ""}`}>
            <span className={`eyebrow${warm ? " warm" : ""} ob-rise`}>{eyebrow}</span>
            <h1 className="ob-title ob-rise" style={{ "--i": 1 } as React.CSSProperties}>
              {title}
            </h1>
            <p className="ob-lead ob-rise" style={{ "--i": 2 } as React.CSSProperties}>
              {lead}
            </p>
            {rail ? (
              <div className="ob-rise" style={{ "--i": 3 } as React.CSSProperties}>
                {rail}
              </div>
            ) : null}
          </aside>

          <main className="ob-stage ob-rise" style={{ "--i": 2 } as React.CSSProperties}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
