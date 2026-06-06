"use client";

import Link from "next/link";

const columns = [
  {
    head: "Product",
    links: [
      { href: "/#brands", label: "For Brands" },
      { href: "/#creators", label: "For Creators" },
      { href: "/#how", label: "How it Works" },
      { href: "/#pricing", label: "Pricing" },
    ],
  },
  {
    head: "Company",
    links: [
      { href: "/", label: "About" },
      { href: "/", label: "Careers" },
      { href: "/", label: "Blog" },
      { href: "/", label: "Contact" },
    ],
  },
  {
    head: "Legal",
    links: [
      { href: "/", label: "Privacy" },
      { href: "/", label: "Terms" },
      { href: "/", label: "Security" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: "#14110D", color: "#C9C1B3", marginTop: "var(--space-24)" }}>
      <div className="container-cohesiq" style={{ paddingBlock: "var(--space-20) var(--space-8)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
            gap: "var(--space-12)",
          }}
          className="foot-grid-responsive"
        >
          {/* Brand col */}
          <div>
            <Link
              href="/"
              className="logo"
              style={{ color: "#fff" }}
              aria-label="Cohesiq home"
            >
              <svg
                style={{ width: 30, height: 30, flex: "none" }}
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden
              >
                <circle cx="8" cy="8" r="4" fill="#8B5CFF" />
                <circle cx="24" cy="9" r="3" fill="#FF7A6E" />
                <circle cx="22" cy="24" r="4.5" fill="#8B5CFF" />
                <line x1="8" y1="8" x2="24" y2="9" stroke="#8B5CFF" strokeWidth="1.6" opacity="0.55" />
                <line x1="8" y1="8" x2="22" y2="24" stroke="#8B5CFF" strokeWidth="1.6" opacity="0.55" />
                <line x1="24" y1="9" x2="22" y2="24" stroke="#FF7A6E" strokeWidth="1.6" opacity="0.55" />
              </svg>
              Cohesiq
            </Link>
            <p
              style={{
                marginTop: "var(--space-4)",
                maxWidth: "30ch",
                color: "#8B8170",
                fontSize: "var(--text-sm)",
              }}
            >
              The creator economy, structured. Trusted matching between Bangladesh&apos;s brands and talent.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.head}>
              <h4
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-sm)",
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  color: "#fff",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {col.head}
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "var(--space-4) 0 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      style={{
                        color: "#8B8170",
                        fontSize: "var(--text-sm)",
                        transition: "color .2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#8B8170")}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "var(--space-16)",
            paddingTop: "var(--space-6)",
            borderTop: "1px solid #2D281F",
            fontSize: "var(--text-sm)",
            color: "#6A6253",
          }}
        >
          <span>© 2026 Cohesiq. Built for Bangladesh.</span>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            {/* Instagram */}
            <a
              href="#"
              aria-label="Instagram"
              style={{
                width: 36, height: 36, borderRadius: 9, border: "1px solid #2D281F",
                display: "grid", placeItems: "center", color: "#8B8170", transition: "all .2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--brand-primary)";
                (e.currentTarget as HTMLElement).style.background = "var(--brand-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#8B8170";
                (e.currentTarget as HTMLElement).style.borderColor = "#2D281F";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
              </svg>
            </a>
            {/* YouTube */}
            <a
              href="#"
              aria-label="YouTube"
              style={{
                width: 36, height: 36, borderRadius: 9, border: "1px solid #2D281F",
                display: "grid", placeItems: "center", color: "#8B8170", transition: "all .2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--brand-primary)";
                (e.currentTarget as HTMLElement).style.background = "var(--brand-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#8B8170";
                (e.currentTarget as HTMLElement).style.borderColor = "#2D281F";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="6" width="18" height="12" rx="3"/>
                <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a
              href="#"
              aria-label="LinkedIn"
              style={{
                width: 36, height: 36, borderRadius: 9, border: "1px solid #2D281F",
                display: "grid", placeItems: "center", color: "#8B8170", transition: "all .2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--brand-primary)";
                (e.currentTarget as HTMLElement).style.background = "var(--brand-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#8B8170";
                (e.currentTarget as HTMLElement).style.borderColor = "#2D281F";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M7 10v7M7 7v.01M12 17v-4a2 2 0 0 1 4 0v4" strokeLinecap="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 940px) {
          .foot-grid-responsive { grid-template-columns: 1fr 1fr !important; gap: var(--space-10) !important; }
        }
        @media (max-width: 540px) {
          .foot-grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
