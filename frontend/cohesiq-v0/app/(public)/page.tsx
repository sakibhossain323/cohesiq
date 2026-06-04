import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";

/* ──────────────────────────────────────────────────────────────────────────
   COHESIQ — "The Creator Index"
   An editorial casting-magazine landing page. High-contrast serif (Fraunces)
   for the human/creative voice; monospace (Geist Mono) for the data/engine
   voice — match scores, index labels, the six-signal spec sheet. Warm paper +
   ink, single vermilion accent, alternating dark/light bands.
   Server Component — CSS-only motion, Clerk buttons are the only client islands.
   ──────────────────────────────────────────────────────────────────────── */

const INK = "#100f0c";
const PAPER = "#f4efe4";

const portrait = (id: string, w = 800, h = 1000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

// Curated editorial portraits — stand in for the creator roster.
const FACES = {
  a: "1500648767791-00dcc994a43e",
  b: "1494790108377-be9c29b29330",
  c: "1507003211169-0a1dd7228f2d",
  d: "1438761681033-6461ffad8d80",
  e: "1506794778202-cad84cf45f1d",
  f: "1517841905240-472988babdf9",
  g: "1539571696357-5a69c17a67c6",
  h: "1524504388940-b1c1722653e1",
  i: "1463453091185-61582044d556",
  j: "1531746020798-e6953c6e8e04",
  k: "1534528741775-53994a69daeb",
  l: "1488426862026-3ee34a7d66df",
};

const NICHES = ["FASHION", "TECH", "FOOD", "BEAUTY", "GAMING", "TRAVEL"];

const SIGNALS = [
  { name: "NICHE", weight: 35, note: "content relevance" },
  { name: "BUDGET", weight: 30, note: "tier × BDT fit" },
  { name: "PLATFORM", weight: 15, note: "channel coverage" },
  { name: "ENGAGEMENT", weight: 10, note: "audience pulse" },
  { name: "LANGUAGE", weight: 8, note: "bn / en reach" },
  { name: "RECENCY", weight: 2, note: "still posting" },
];

const FIGURES = [
  { n: "500", plus: "+", label: "ACTIVE CREATORS" },
  { n: "120", plus: "+", label: "LOCAL BRANDS" },
  { n: "300", plus: "+", label: "CAMPAIGNS RUN" },
  { n: "14", plus: "", label: "NICHE VERTICALS" },
];

const css = `
.cq{--ink:${INK};--paper:${PAPER};--accent:#d8412a;--ink-mut:#9b9385;--paper-mut:#6d6657;
  --line-d:rgba(244,239,228,.16);--line-l:rgba(16,15,12,.14);background:var(--paper);color:var(--ink);}
.cq ::selection{background:var(--accent);color:#fff;}
.cq-serif{font-family:var(--font-serif);font-optical-sizing:auto;}
.cq-mono{font-family:var(--font-mono);}
.cq-grain{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:.5;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.42'/%3E%3C/svg%3E");}

@keyframes cqRise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes cqFade{from{opacity:0}to{opacity:1}}
@keyframes cqDraw{to{stroke-dashoffset:0}}
@keyframes cqGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes cqFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes cqMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.cq-rise{opacity:0;animation:cqRise .9s cubic-bezier(.2,.7,.2,1) forwards}
.cq-fade{opacity:0;animation:cqFade 1.2s ease forwards}
.cq-float{animation:cqFloat 7s ease-in-out infinite}
.cq-draw line{stroke-dasharray:320;stroke-dashoffset:320;animation:cqDraw 1.4s ease .5s forwards}
.cq-bar{transform-origin:left;transform:scaleX(0);animation:cqGrow 1s cubic-bezier(.2,.7,.2,1) forwards}
.cq-rule{transform-origin:left;transform:scaleX(0);animation:cqGrow 1.1s cubic-bezier(.2,.7,.2,1) .2s forwards}

.cq-link-row .cq-arrow{transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.cq-link-row:hover .cq-arrow{transform:translateX(18px)}
.cq-link-row .cq-strip{max-height:0;opacity:0;transition:max-height .6s cubic-bezier(.2,.7,.2,1),opacity .5s ease}
.cq-link-row:hover .cq-strip{max-height:160px;opacity:1}
.cq-link-row .cq-big{transition:color .4s ease,transform .5s cubic-bezier(.2,.7,.2,1)}
.cq-link-row:hover .cq-big{color:var(--accent);transform:translateX(10px)}

.cq-port{filter:grayscale(1) contrast(1.04);transition:filter .6s ease,transform .6s cubic-bezier(.2,.7,.2,1)}
.cq-port:hover{filter:grayscale(0) contrast(1)}
.cq-track{animation:cqMarquee 38s linear infinite}
.cq-track:hover{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){
  .cq-rise,.cq-fade,.cq-bar,.cq-rule,.cq-float,.cq-track{animation:none!important;opacity:1!important;transform:none!important}
  .cq-draw line{stroke-dashoffset:0!important;animation:none!important}
}`;

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className="cq-mono inline-flex items-center gap-2 text-[11px] tracking-[0.28em]"
      style={{ color: dark ? "var(--ink-mut)" : "var(--paper-mut)" }}
    >
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="cq cq-serif overflow-clip">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="cq-grain" aria-hidden />

      {/* ════════════════ HERO — ink ════════════════ */}
      <section
        className="relative isolate"
        style={{ background: "var(--ink)", color: PAPER }}
      >
        {/* hairline frame */}
        <div
          className="pointer-events-none absolute inset-x-4 inset-y-4 sm:inset-x-8 sm:inset-y-6 border"
          style={{ borderColor: "var(--line-d)" }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-[1500px] px-6 pb-16 pt-28 sm:px-12 sm:pt-32 lg:min-h-screen lg:pb-24">
          {/* top descriptor / right portrait */}
          <div className="flex items-start justify-between gap-6">
            <p
              className="cq-rise max-w-[16rem] text-[13px] leading-relaxed sm:max-w-xs"
              style={{ animationDelay: ".05s", color: "var(--ink-mut)" }}
            >
              <Eyebrow dark>( EST. 2026 — DHAKA )</Eyebrow>
              <span className="mt-3 block cq-sans" style={{ fontFamily: "var(--font-sans)" }}>
                A matchmaking studio pairing Bangladeshi brands with the long-tail of
                authentic creators — scored, not guessed.
              </span>
            </p>

            <figure
              className="cq-rise cq-float relative hidden w-44 shrink-0 lg:block xl:w-52"
              style={{ animationDelay: ".15s" }}
            >
              <div className="overflow-hidden">
                <img
                  src={portrait(FACES.c, 480, 600)}
                  alt="Creator"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  className="cq-port aspect-[4/5] w-full object-cover"
                  style={{ background: "#241f18" }}
                />
              </div>
              <figcaption className="cq-mono mt-2 flex items-center justify-between text-[10px] tracking-[0.2em]" style={{ color: "var(--ink-mut)" }}>
                <span>NO. 044</span>
                <span style={{ color: "var(--accent)" }}>● LIVE</span>
              </figcaption>
            </figure>
          </div>

          {/* headline */}
          <div className="relative mt-10 text-center sm:mt-14">
            <h1 className="cq-serif font-light leading-[0.86] tracking-[-0.02em]">
              <span className="cq-rise block text-[clamp(2.6rem,9vw,8.5rem)]" style={{ animationDelay: ".1s" }}>
                Where brands
              </span>
              <span
                className="cq-rise block text-[clamp(4rem,17vw,16rem)] italic"
                style={{ animationDelay: ".2s" }}
              >
                <span style={{ color: "var(--accent)" }}>{"{"}</span>
                <span className="px-2 sm:px-4">meet</span>
                <span style={{ color: "var(--accent)" }}>{"}"}</span>
              </span>
              <span className="cq-rise block text-[clamp(2.6rem,9vw,8.5rem)]" style={{ animationDelay: ".3s" }}>
                their creators.
              </span>
            </h1>

            {/* radiating "match connections" → niches */}
            <svg
              className="cq-draw mx-auto mt-6 hidden h-20 w-full max-w-3xl sm:block"
              viewBox="0 0 600 80"
              fill="none"
              aria-hidden
            >
              {[60, 170, 280, 320, 430, 540].map((x, i) => (
                <line
                  key={i}
                  x1="300"
                  y1="2"
                  x2={x}
                  y2="78"
                  stroke="var(--line-d)"
                  strokeWidth="1"
                  style={{ animationDelay: `${0.5 + i * 0.08}s` }}
                />
              ))}
            </svg>

            <ul className="cq-mono cq-fade mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] tracking-[0.26em]" style={{ animationDelay: ".9s", color: "var(--ink-mut)" }}>
              {NICHES.map((n) => (
                <li key={n} className="transition-colors hover:text-[var(--accent)]">
                  {n}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA row + floating spec portrait */}
          <div className="relative mt-12 flex flex-col items-center gap-6 sm:mt-16">
            <div className="cq-fade flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "1s" }}>
              <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                <button
                  className="cq-mono group inline-flex items-center gap-3 px-7 py-3.5 text-[11px] tracking-[0.24em] transition-colors"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  BEGIN MATCHING
                  <span className="cq-arrow transition-transform group-hover:translate-x-1.5">→</span>
                </button>
              </SignUpButton>
              <Link
                href="/creators"
                className="cq-mono inline-flex items-center gap-3 border px-7 py-3.5 text-[11px] tracking-[0.24em] transition-colors hover:border-[var(--paper)]"
                style={{ borderColor: "var(--line-d)", color: PAPER }}
              >
                BROWSE THE INDEX
              </Link>
            </div>

            {/* spec-annotated portrait, crossing the band edge (echoes ref) */}
            <figure
              className="cq-rise pointer-events-none absolute -bottom-24 left-2 hidden w-48 lg:block"
              style={{ animationDelay: ".4s" }}
              aria-hidden
            >
              <div className="overflow-hidden shadow-2xl">
                <img
                  src={portrait(FACES.f, 460, 600)}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="cq-port aspect-[3/4] w-full object-cover"
                  style={{ background: "#241f18" }}
                />
              </div>
              <figcaption
                className="cq-mono mt-2 space-y-0.5 border-l pl-3 text-[10px] tracking-[0.15em]"
                style={{ borderColor: "var(--accent)", color: "var(--ink-mut)" }}
              >
                <div className="flex justify-between"><span>MATCH</span><span style={{ color: PAPER }}>0.94</span></div>
                <div className="flex justify-between"><span>NICHE</span><span>FASHION</span></div>
                <div className="flex justify-between"><span>TIER</span><span>MICRO</span></div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ════════════════ ABOUT / value — paper ════════════════ */}
      <section className="relative mx-auto max-w-[1500px] px-6 py-20 sm:px-12 sm:py-28">
        <Eyebrow>( THE PROBLEM, SOLVED )</Eyebrow>
        <div className="mt-6 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <h2 className="cq-serif max-w-3xl text-[clamp(1.9rem,4.2vw,3.6rem)] font-light leading-[1.04] tracking-[-0.01em]">
            Stop hunting through DMs and bot-inflated follower counts. Discover creators
            who genuinely fit your <span className="italic" style={{ color: "var(--accent)" }}>niche, budget</span> and audience —
            then run campaigns that actually convert.
          </h2>

          {/* line-art radiating motif + copy (echoes ref pencil block) */}
          <div className="flex flex-col justify-between gap-8">
            <svg viewBox="0 0 120 90" className="h-24 w-32" fill="none" aria-hidden>
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={i} x1="4" y1="86" x2={4 + i * 14} y2={86 - i * 9} stroke="var(--line-l)" strokeWidth="1" />
              ))}
            </svg>
            <p className="cq-sans max-w-xs text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-sans)", color: "var(--paper-mut)" }}>
              Cohesiq replaces the spreadsheet with a transparent, deterministic engine —
              built for BDT budgets and the nano-to-micro creators incumbents ignore.
            </p>
          </div>
        </div>

        {/* editorial portrait strip */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[FACES.a, FACES.d, FACES.g, FACES.b, FACES.k, FACES.e].map((id, i) => (
            <figure
              key={id}
              className={`overflow-hidden ${i === 2 ? "col-span-2 row-span-2 sm:col-span-2" : ""}`}
              style={{ background: "#d8cfbe" }}
            >
              <img
                src={portrait(id, 500, i === 2 ? 620 : 600)}
                alt="Creator portrait"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="cq-port h-full w-full object-cover"
                style={{ aspectRatio: i === 2 ? "8/5" : "4/5" }}
              />
            </figure>
          ))}
        </div>
      </section>

      {/* ════════════════ THE INDEX — ink rows ════════════════ */}
      <section style={{ background: "var(--ink)", color: PAPER }}>
        <div className="mx-auto max-w-[1500px] px-6 py-16 sm:px-12 sm:py-20">
          <div className="flex items-end justify-between">
            <Eyebrow dark>( THE INDEX )</Eyebrow>
            <span className="cq-mono text-[11px] tracking-[0.24em]" style={{ color: "var(--ink-mut)" }}>
              03 — WAYS IN
            </span>
          </div>

          <div className="mt-8 border-t" style={{ borderColor: "var(--line-d)" }}>
            {[
              { n: "01", label: "Creators", href: "/creators", sub: "Browse the roster", faces: [FACES.a, FACES.b, FACES.c, FACES.d, FACES.e, FACES.f] },
              { n: "02", label: "Campaigns", href: "/campaigns", sub: "Open briefs & budgets", faces: [FACES.g, FACES.h, FACES.i, FACES.j, FACES.k, FACES.l] },
            ].map((row) => (
              <Link
                key={row.n}
                href={row.href}
                className="cq-link-row block border-b py-8 sm:py-10"
                style={{ borderColor: "var(--line-d)" }}
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-baseline gap-5 sm:gap-10">
                    <span className="cq-mono text-[11px] tracking-[0.24em]" style={{ color: "var(--ink-mut)" }}>
                      {row.n}
                    </span>
                    <span className="cq-big cq-serif text-[clamp(2.4rem,8vw,6rem)] font-light leading-none">
                      {row.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="cq-mono hidden text-[11px] tracking-[0.22em] sm:block" style={{ color: "var(--ink-mut)" }}>
                      {row.sub}
                    </span>
                    <span className="cq-arrow cq-serif text-3xl sm:text-4xl" style={{ color: "var(--accent)" }}>
                      →
                    </span>
                  </div>
                </div>
                {/* hover-revealed portrait strip */}
                <div className="cq-strip overflow-hidden">
                  <div className="mt-6 flex gap-3">
                    {row.faces.map((id) => (
                      <img
                        key={id}
                        src={portrait(id, 320, 380)}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="cq-port h-32 w-28 shrink-0 object-cover"
                        style={{ background: "#241f18" }}
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
              </Link>
            ))}

            {/* third row — join */}
            <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
              <button className="cq-link-row block w-full border-b py-8 text-left sm:py-10" style={{ borderColor: "var(--line-d)" }}>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-baseline gap-5 sm:gap-10">
                    <span className="cq-mono text-[11px] tracking-[0.24em]" style={{ color: "var(--ink-mut)" }}>03</span>
                    <span className="cq-big cq-serif text-[clamp(2.4rem,8vw,6rem)] font-light italic leading-none">Join Cohesiq</span>
                  </div>
                  <span className="cq-arrow cq-serif text-3xl sm:text-4xl" style={{ color: "var(--accent)" }}>→</span>
                </div>
              </button>
            </SignUpButton>
          </div>
        </div>

        {/* slow marquee of faces */}
        <div className="overflow-hidden border-y py-4" style={{ borderColor: "var(--line-d)" }}>
          <div className="cq-track flex w-max gap-8 pr-8">
            {[...Object.values(FACES), ...Object.values(FACES)].map((id, i) => (
              <span key={i} className="cq-mono flex items-center gap-8 text-[11px] tracking-[0.3em]" style={{ color: "var(--ink-mut)" }}>
                <span style={{ color: "var(--accent)" }}>✳</span>
                AUTHENTIC REACH
                <span style={{ color: "var(--accent)" }}>✳</span>
                VERIFIED TIERS
                <span style={{ color: "var(--accent)" }}>✳</span>
                BDT-NATIVE BUDGETS
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ THE ENGINE — paper spec sheet ════════════════ */}
      <section id="engine" className="mx-auto max-w-[1500px] px-6 py-20 sm:px-12 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <div>
            <Eyebrow>( THE ENGINE )</Eyebrow>
            <h2 className="cq-serif mt-6 text-[clamp(2.4rem,6vw,5rem)] font-light leading-[0.98] tracking-[-0.01em]">
              Six signals,
              <br />
              <span className="italic">one</span> score.
            </h2>
            <p className="cq-sans mt-6 max-w-sm text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-sans)", color: "var(--paper-mut)" }}>
              Every match is deterministic math you can read — weighted, bounded, and
              explained. No black box: a BDT 1,500 brief will never be matched to a
              mega-celebrity.
            </p>
            <div className="cq-mono mt-8 inline-flex items-center gap-3 border px-4 py-2 text-[11px] tracking-[0.2em]" style={{ borderColor: "var(--line-l)", color: "var(--paper-mut)" }}>
              <span style={{ color: "var(--accent)" }}>◇</span> EXPLAINABLE BY DESIGN
            </div>
          </div>

          {/* weighted bars */}
          <div className="border-t" style={{ borderColor: "var(--line-l)" }}>
            {SIGNALS.map((s, i) => (
              <div key={s.name} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b py-5" style={{ borderColor: "var(--line-l)" }}>
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="cq-mono text-[12px] tracking-[0.22em]">{s.name}</span>
                    <span className="cq-mono text-[10px] tracking-[0.18em]" style={{ color: "var(--paper-mut)" }}>
                      / {s.note}
                    </span>
                  </div>
                  <div className="mt-3 h-px w-full" style={{ background: "var(--line-l)" }}>
                    <div
                      className="cq-bar h-px"
                      style={{ width: `${(s.weight / 35) * 100}%`, background: "var(--accent)", animationDelay: `${i * 0.08}s` }}
                    />
                  </div>
                </div>
                <span className="cq-serif text-4xl font-light tabular-nums sm:text-5xl">
                  {s.weight}
                  <span className="cq-mono align-top text-[11px]" style={{ color: "var(--paper-mut)" }}>%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ FIGURES — ink ════════════════ */}
      <section style={{ background: "var(--ink)", color: PAPER }}>
        <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-px px-6 sm:px-12 lg:grid-cols-4" style={{ background: "var(--line-d)" }}>
          {FIGURES.map((f) => (
            <div key={f.label} className="px-2 py-14 text-center sm:py-20" style={{ background: "var(--ink)" }}>
              <div className="cq-serif text-[clamp(3rem,9vw,7rem)] font-light leading-none tabular-nums">
                {f.n}
                <span style={{ color: "var(--accent)" }}>{f.plus}</span>
              </div>
              <div className="cq-mono mt-4 text-[10px] tracking-[0.26em]" style={{ color: "var(--ink-mut)" }}>
                {f.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ CLOSING CTA — paper ════════════════ */}
      <section className="relative mx-auto max-w-[1500px] px-6 py-24 text-center sm:px-12 sm:py-36">
        <Eyebrow>( YOUR MOVE )</Eyebrow>
        <h2 className="cq-serif mx-auto mt-8 max-w-5xl text-[clamp(2.8rem,10vw,9rem)] font-light leading-[0.9] tracking-[-0.02em]">
          Find your
          <span className="italic">
            {" "}
            <span style={{ color: "var(--accent)" }}>{"{"}</span>fit
            <span style={{ color: "var(--accent)" }}>{"}"}</span>
          </span>
          .
        </h2>
        <p className="cq-sans mx-auto mt-6 max-w-md text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-sans)", color: "var(--paper-mut)" }}>
          No spreadsheets. No guesswork. Just the right creator, scored and ready.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
            <button className="cq-mono inline-flex items-center gap-3 px-8 py-4 text-[11px] tracking-[0.24em] text-white transition-transform hover:-translate-y-0.5" style={{ background: "var(--ink)" }}>
              JOIN AS A BRAND →
            </button>
          </SignUpButton>
          <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
            <button className="cq-mono inline-flex items-center gap-3 border px-8 py-4 text-[11px] tracking-[0.24em] transition-colors hover:border-[var(--ink)]" style={{ borderColor: "var(--line-l)" }}>
              JOIN AS A CREATOR
            </button>
          </SignUpButton>
        </div>
      </section>
    </div>
  );
}
