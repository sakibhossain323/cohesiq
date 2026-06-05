import Link from "next/link";

const ink = "#100f0c";
const paper = "#f4efe4";
const accent = "#d8412a";
const muted = "#9b9385";
const hairline = "rgba(244,239,228,0.16)";

const columns = [
  {
    head: "FOR CREATORS",
    links: [
      { href: "/campaigns", label: "Browse Campaigns" },
      { href: "/creator/dashboard", label: "Creator Dashboard" },
    ],
  },
  {
    head: "FOR BRANDS",
    links: [
      { href: "/creators", label: "Find Creators" },
      { href: "/brand/dashboard", label: "Brand Dashboard" },
    ],
  },
  {
    head: "STUDIO",
    links: [
      { href: "/#engine", label: "The Engine" },
      { href: "/", label: "About" },
      { href: "/", label: "Privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: ink, color: paper }}>
      <div className="mx-auto max-w-[1500px] px-6 pt-20 pb-8 sm:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="font-serif text-3xl font-light tracking-tight">
              Cohesiq
            </Link>
            <p
              className="mt-5 max-w-xs text-[15px] leading-relaxed"
              style={{ color: muted, fontFamily: "var(--font-sans)" }}
            >
              A B2B matchmaking studio pairing Bangladeshi brands with authentic
              creators — scored, not guessed.
            </p>
            <div
              className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.24em]"
              style={{ color: muted }}
            >
              <span style={{ color: accent }}>●</span> DHAKA · BANGLADESH
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.head}>
              <h3 className="font-mono text-[10px] tracking-[0.26em]" style={{ color: muted }}>
                {col.head}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="font-serif text-lg font-light transition-colors hover:text-[var(--accent)]"
                      style={{ ["--accent" as string]: accent }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* oversized wordmark flourish */}
        <div
          className="mt-16 select-none overflow-hidden border-t pt-8"
          style={{ borderColor: hairline }}
          aria-hidden
        >
          <div
            className="font-serif font-light leading-[0.8] tracking-[-0.03em]"
            style={{ fontSize: "clamp(4rem,21vw,17rem)", color: "transparent", WebkitTextStroke: `1px ${hairline}` }}
          >
            Cohesiq
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="font-mono text-[10px] tracking-[0.22em]" style={{ color: muted }}>
            © {new Date().getFullYear()} COHESIQ — ALL RIGHTS RESERVED
          </p>
          <p className="font-mono text-[10px] tracking-[0.22em]" style={{ color: muted }}>
            DETERMINISTIC MATH · GUARDED BY SEMANTIC AI
          </p>
        </div>
      </div>
    </footer>
  );
}
