import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LandingClient } from "./_components/LandingClient";
import "./landing.css";

/* ── SVG icons ─────────────────────────────────────────────── */
const ArrowRight = () => (
  <svg className="ico arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoStar = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4 7.2 17.9l.9-5.4L4.2 8.7l5.4-.8z" strokeLinejoin="round" />
  </svg>
);
const IcoCheck = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoVerified = () => (
  <svg className="ico verified" viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
    <path d="M12 1l2.4 2.2 3.2-.3.9 3.1 2.8 1.6-1.2 3 .8 3.1-3.1.7-1.9 2.6-3-1.3-3 1.3-1.9-2.6-3.1-.7.8-3.1-1.2-3 2.8-1.6.9-3.1 3.2.3z" />
  </svg>
);

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <>
      <LandingClient />

      {/* ══════ HERO ══════ */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container-cohesiq">
          <div className="hero-grid">
            {/* text column */}
            <div className="hero-text">
              <span className="badge-row reveal">
                <span className="pill">NEW</span>
                Bangladesh&apos;s first structured creator marketplace
              </span>
              <h1 className="reveal" style={{ "--index": 1 } as React.CSSProperties}>
                Bangladesh&apos;s <span className="grad">Creator Marketplace.</span>
              </h1>
              <p className="hero-sub reveal" style={{ "--index": 2 } as React.CSSProperties}>
                Brands find the right talent. Creators get discovered. No DMs. No guesswork.
              </p>

              {/* dual CTA */}
              <div className="dual reveal" style={{ "--index": 3 } as React.CSSProperties}>
                {userId ? (
                  <Link className="dual-card brand" href="/onboarding/brand/profile">
                    <span className="di">
                      <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 11l18-5v12L3 14v-3z" strokeLinejoin="round" />
                        <path d="M11.6 16.8a3 3 0 0 1-5.8-1.1V14" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="dt">I represent a Brand</span>
                    <span className="dd">Post a campaign and get matched with verified creators.</span>
                    <span className="dgo">Get started <ArrowRight /></span>
                  </Link>
                ) : (
                  <SignUpButton mode="modal" forceRedirectUrl="/onboarding/brand/profile" signInForceRedirectUrl="/onboarding/brand/profile">
                    <button className="dual-card brand text-left w-full cursor-pointer">
                      <span className="di">
                        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 11l18-5v12L3 14v-3z" strokeLinejoin="round" />
                          <path d="M11.6 16.8a3 3 0 0 1-5.8-1.1V14" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="dt">I represent a Brand</span>
                      <span className="dd">Post a campaign and get matched with verified creators.</span>
                      <span className="dgo">Get started <ArrowRight /></span>
                    </button>
                  </SignUpButton>
                )}
                {userId ? (
                  <Link className="dual-card creator" href="/onboarding/creator/personal-info">
                    <span className="di">
                      <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="dt">I&apos;m a Creator</span>
                    <span className="dd">Build a verified profile and let brands come to you.</span>
                    <span className="dgo">Join free <ArrowRight /></span>
                  </Link>
                ) : (
                  <SignUpButton mode="modal" forceRedirectUrl="/onboarding/creator/personal-info" signInForceRedirectUrl="/onboarding/creator/personal-info">
                    <button className="dual-card creator text-left w-full cursor-pointer">
                      <span className="di">
                        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="dt">I&apos;m a Creator</span>
                      <span className="dd">Build a verified profile and let brands come to you.</span>
                      <span className="dgo">Join free <ArrowRight /></span>
                    </button>
                  </SignUpButton>
                )}
              </div>

              <div className="proof reveal" style={{ "--index": 4 } as React.CSSProperties}>
                <div className="avatars">
                  <span style={{ background: "repeating-linear-gradient(135deg,#5B2BD9 0 6px,#4A1FBF 6px 12px)" }} />
                  <span style={{ background: "repeating-linear-gradient(135deg,#FF5C5C 0 6px,#ED4444 6px 12px)" }} />
                  <span style={{ background: "repeating-linear-gradient(135deg,#5B2BD9 0 6px,#FF5C5C 6px 12px)" }} />
                  <span style={{ background: "repeating-linear-gradient(135deg,#FF5C5C 0 6px,#5B2BD9 6px 12px)" }} />
                </div>
                Trusted by <strong style={{ color: "var(--color-text-primary)" }}>500+ BD creators</strong> across 12 niches.
              </div>
            </div>

            {/* mosaic — editorial: 4 columns */}
            <div className="mosaic reveal" style={{ "--index": 2 } as React.CSSProperties}>
              <div className="mgrid">
                <div className="mcol">
                  <div className="tile r1" style={{ "--dur": "5s", "--del": "0s", "--tc": "#5B2BD9" } as React.CSSProperties}>
                    <div className="ph" style={{ "--ar": "4/5" } as React.CSSProperties}>
                      <span className="metric">REEL</span>
                      <span className="pglyph">
                        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="5" /><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
                        </svg>
                      </span>
                      <span className="tlabel">fashion · reels</span>
                    </div>
                  </div>
                  <div className="tile r2" style={{ "--dur": "6.5s", "--del": ".6s", "--tc": "#FF5C5C" } as React.CSSProperties}>
                    <div className="ph" style={{ "--ar": "1/1" } as React.CSSProperties}>
                      <span className="pglyph">
                        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
                        </svg>
                      </span>
                      <span className="tlabel">food · photo</span>
                    </div>
                  </div>
                  <div className="tile r3" style={{ "--dur": "5.5s", "--del": "1.1s", "--tc": "#5B2BD9" } as React.CSSProperties}>
                    <div className="ph" style={{ "--ar": "4/5" } as React.CSSProperties}>
                      <span className="metric">YT</span><span className="tlabel">tech · long-form</span>
                    </div>
                  </div>
                </div>
                <div className="mcol offset">
                  <div className="tile r4" style={{ "--dur": "6s", "--del": ".3s", "--tc": "#FF5C5C" } as React.CSSProperties}>
                    <div className="ph" style={{ "--ar": "1/1" } as React.CSSProperties}>
                      <span className="pglyph">
                        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                        </svg>
                      </span>
                      <span className="tlabel">music · short</span>
                    </div>
                  </div>
                  <div className="tile r1" style={{ "--dur": "5.2s", "--del": ".9s", "--tc": "#5B2BD9" } as React.CSSProperties}>
                    <div className="ph" style={{ "--ar": "4/5" } as React.CSSProperties}>
                      <span className="metric">96%</span><span className="tlabel">beauty · reels</span>
                    </div>
                  </div>
                  <div className="tile r2" style={{ "--dur": "6.2s", "--del": ".2s", "--tc": "#FF5C5C" } as React.CSSProperties}>
                    <div className="ph" style={{ "--ar": "1/1" } as React.CSSProperties}>
                      <span className="tlabel">travel · vlog</span>
                    </div>
                  </div>
                </div>
                {/* extra cols — visible in editorial layout */}
                <div className="mcol extra">
                  <div className="tile r3" style={{ "--dur": "5.8s", "--del": ".5s", "--tc": "#5B2BD9" } as React.CSSProperties}>
                    <div className="ph" style={{ "--ar": "1/1" } as React.CSSProperties}>
                      <span className="tlabel">gaming · stream</span>
                    </div>
                  </div>
                  <div className="tile r4" style={{ "--dur": "6.4s", "--del": "1s", "--tc": "#FF5C5C" } as React.CSSProperties}>
                    <div className="ph" style={{ "--ar": "4/5" } as React.CSSProperties}>
                      <span className="metric">REEL</span><span className="tlabel">street · fashion</span>
                    </div>
                  </div>
                </div>
                <div className="mcol extra offset">
                  <div className="tile r2" style={{ "--dur": "5.6s", "--del": ".4s", "--tc": "#FF5C5C" } as React.CSSProperties}>
                    <div className="ph" style={{ "--ar": "4/5" } as React.CSSProperties}>
                      <span className="tlabel">fitness · short</span>
                    </div>
                  </div>
                  <div className="tile r1" style={{ "--dur": "6.1s", "--del": ".8s", "--tc": "#5B2BD9" } as React.CSSProperties}>
                    <div className="ph" style={{ "--ar": "1/1" } as React.CSSProperties}>
                      <span className="metric">YT</span><span className="tlabel">edu · long-form</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section className="section" id="how">
        <div className="container-cohesiq">
          <div className="section-head center reveal">
            <span className="eyebrow">How it works</span>
            <h2>From brief to payment, in three steps.</h2>
            <p>Structured, trusted, and AI-powered — the messy middle of creator deals, finally organized.</p>
          </div>
          <div className="steps" id="steps">
            <div className="connector" aria-hidden>
              <svg viewBox="0 0 100 4" preserveAspectRatio="none"><path d="M0 2 H100" /></svg>
            </div>
            <div className="step reveal" style={{ "--index": 0 } as React.CSSProperties}>
              <div className="num">1</div>
              <svg className="stepicon ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22 }}>
                <path d="M3 11l18-5v12L3 14v-3z" strokeLinejoin="round" /><path d="M11.6 16.8a3 3 0 0 1-5.8-1.1V14" strokeLinecap="round" />
              </svg>
              <h3>Brand posts a campaign</h3>
              <p>Define your niche, budget, and goals. A clear brief replaces a thread of DMs.</p>
            </div>
            <div className="step reveal" style={{ "--index": 1 } as React.CSSProperties}>
              <div className="num">2</div>
              <svg className="stepicon ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22 }}>
                <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" />
                <path d="M7.6 7.6L11 16M16.4 7.6L13 16M8 6h8" strokeLinecap="round" />
              </svg>
              <h3>AI matches the right creators</h3>
              <p>Our graph model ranks talent by niche, audience overlap, and real engagement.</p>
            </div>
            <div className="step reveal" style={{ "--index": 2 } as React.CSSProperties}>
              <div className="num warm">3</div>
              <svg className="stepicon ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22 }}>
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>Collaborate, track, pay securely</h3>
              <p>Manage delivery, approve work, and release secure BDT payment — all in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ FOR BRANDS ══════ */}
      <section className="section" id="brands" style={{ background: "var(--color-surface-subtle)" }}>
        <div className="container-cohesiq">
          <div className="feature brand">
            <div className="feature-text reveal">
              <span className="eyebrow">For brands</span>
              <h2 style={{ fontSize: "clamp(2rem,4.5vw,var(--text-5xl))", marginTop: "var(--space-3)" }}>
                Stop guessing. Start matching.
              </h2>
              <ul className="flist">
                {[
                  { icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M7.6 7.6L11 16M16.4 7.6L13 16" strokeLinecap="round" /></svg>, title: "AI-powered creator matching", desc: "By niche, audience, and engagement — ranked, not guessed." },
                  { icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6z" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>, title: "Authenticity scoring", desc: "Fraud and fake-follower detection built in." },
                  { icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v16" strokeLinecap="round" /></svg>, title: "Campaign management", desc: "From brief to payment in a single workspace." },
                  { icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M4 19V5M4 19h16M8 16l3-4 3 2 5-7" strokeLinecap="round" strokeLinejoin="round" /></svg>, title: "ROI tracking", desc: "Measure performance per collaboration." },
                ].map(({ icon, title, desc }) => (
                  <li key={title}>
                    <span className="fi">{icon}</span>
                    <span><span className="ft">{title}</span><br /><span className="fd">{desc}</span></span>
                  </li>
                ))}
              </ul>
              {userId ? (
                <Link className="btn btn-primary" href="/onboarding/brand/profile" style={{ marginTop: "var(--space-8)" }}>
                  Post a campaign <ArrowRight />
                </Link>
              ) : (
                <div style={{ marginTop: "var(--space-8)" }}>
                  <SignUpButton mode="modal" forceRedirectUrl="/onboarding/brand/profile" signInForceRedirectUrl="/onboarding/brand/profile">
                    <button className="btn btn-primary">
                      Post a campaign <ArrowRight />
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
            <div className="feature-visual reveal" style={{ "--index": 1 } as React.CSSProperties}>
              <div className="mock">
                <div className="mock-bar"><i /><i /><i /><span className="mock-title">campaign · creator matches</span></div>
                <div className="match">
                  {[
                    { name: "Tasnia R.", warm: false, icon: <IcoVerified />, followers: "248K", eng: "6.4%", score: 98, v: 0.98 },
                    { name: "Rafiul H.", warm: true, tag: "Tech", followers: "112K", eng: "5.1%", score: 94, v: 0.94 },
                    { name: "Nabila K.", warm: false, tag: "Beauty", followers: "89K", eng: "7.2%", score: 91, v: 0.91 },
                  ].map(({ name, warm, icon, tag, followers, eng, score, v }) => (
                    <div className="match-row" key={name}>
                      <div className={`av${warm ? " warm" : ""}`} />
                      <div className="match-meta">
                        <div className="mn">{name} {icon}{tag && <span className="tag">{tag}</span>}</div>
                        <div className="sub"><span>{followers} followers</span><span>{eng} eng.</span></div>
                      </div>
                      <div className="score">
                        <div className="pct">{score}%</div>
                        <div className="bar"><i style={{ "--v": v } as React.CSSProperties} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ FOR CREATORS ══════ */}
      <section className="section" id="creators">
        <div className="container-cohesiq">
          <div className="feature creator flip">
            <div className="feature-text reveal" style={{ "--index": 1 } as React.CSSProperties}>
              <span className="eyebrow warm">For creators</span>
              <h2 style={{ fontSize: "clamp(2rem,4.5vw,var(--text-5xl))", marginTop: "var(--space-3)" }}>
                Get discovered by brands that fit your niche.
              </h2>
              <ul className="flist">
                {[
                  { icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" /></svg>, title: "Build a verified creator profile", desc: "Stand out with proof, not promises." },
                  { icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M3 11l18-5v12L3 14v-3z" strokeLinejoin="round" /></svg>, title: "Brands come to you", desc: "No cold pitching, no chasing DMs." },
                  { icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" strokeLinecap="round" /></svg>, title: "Transparent rate cards", desc: "Secure BDT payments, released on delivery." },
                  { icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>, title: "Portfolio showcase", desc: "All your platforms, one home." },
                ].map(({ icon, title, desc }) => (
                  <li key={title}><span className="fi">{icon}</span><span><span className="ft">{title}</span><br /><span className="fd">{desc}</span></span></li>
                ))}
              </ul>
              {userId ? (
                <Link className="btn btn-secondary" href="/onboarding/creator/personal-info" style={{ marginTop: "var(--space-8)" }}>
                  Create your profile <ArrowRight />
                </Link>
              ) : (
                <div style={{ marginTop: "var(--space-8)" }}>
                  <SignUpButton mode="modal" forceRedirectUrl="/onboarding/creator/personal-info" signInForceRedirectUrl="/onboarding/creator/personal-info">
                    <button className="btn btn-secondary">
                      Create your profile <ArrowRight />
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
            <div className="feature-visual reveal">
              <div className="mock profile">
                <div className="profile-cover"><div className="profile-av" /></div>
                <div className="profile-body">
                  <div className="pn">Maisha Ahmed
                    <svg className="ico" viewBox="0 0 24 24" fill="var(--brand-secondary)" style={{ width: 16, height: 16 }}>
                      <path d="M12 1l2.4 2.2 3.2-.3.9 3.1 2.8 1.6-1.2 3 .8 3.1-3.1.7-1.9 2.6-3-1.3-3 1.3-1.9-2.6-3.1-.7.8-3.1-1.2-3 2.8-1.6.9-3.1 3.2.3z" />
                    </svg>
                  </div>
                  <div className="pr">Lifestyle &amp; Fashion · Dhaka</div>
                  <div className="platforms">
                    <span title="YouTube"><svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" /></svg></span>
                    <span title="Instagram"><svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" /></svg></span>
                    <span title="TikTok"><svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg></span>
                  </div>
                  <div className="pstats">
                    <div className="ps"><b>312K</b><small>Followers</small></div>
                    <div className="ps"><b>6.8%</b><small>Engagement</small></div>
                    <div className="ps"><b>4.9★</b><small>Brand rating</small></div>
                  </div>
                  <div className="matchchip"><IcoStar /> 97% match for your last campaign</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ STATS BAND ══════ */}
      <section className="stats-band" id="stats">
        <div className="container-cohesiq">
          <div className="stats-grid">
            <div className="stat"><div className="sv" data-count="500" data-suffix="+">0</div><div className="sl">Creators</div></div>
            <div className="stat"><div className="sv" data-count="12" data-suffix="">0</div><div className="sl">Niches</div></div>
            <div className="stat"><div className="sv" data-prefix="BDT " data-count="2" data-suffix="Cr+">0</div><div className="sl">Deals facilitated</div></div>
            <div className="stat"><div className="sv" data-count="4.8" data-suffix="★" data-decimals="1">0</div><div className="sl">Average rating</div></div>
          </div>
        </div>
      </section>

      {/* ══════ TESTIMONIALS ══════ */}
      <section className="section" id="voices">
        <div className="container-cohesiq">
          <div className="section-head center reveal">
            <span className="eyebrow">Voices</span>
            <h2>Built for both sides of the deal.</h2>
          </div>
          <div className="quotes">
            {[
              { warm: false, quote: "We filled a Ramadan campaign with five vetted creators in two days. The match scores were genuinely accurate.", name: "Sadia Karim", role: "Brand Manager, Aarong Digital", idx: 0 },
              { warm: true, quote: "I stopped sliding into brand DMs. Now offers come to me — with budgets attached. That changed everything.", name: "Tahmid Hasan", role: "Tech Creator · 180K subs", idx: 1 },
              { warm: false, quote: "Secure BDT payouts and clear rate cards mean no more awkward money talk. It feels professional, finally.", name: "Farhana Islam", role: "Lifestyle Creator · Dhaka", idx: 2 },
            ].map(({ warm, quote, name, role, idx }) => (
              <div key={name} className={`card quote${warm ? " warm" : ""} reveal`} style={{ "--index": idx } as React.CSSProperties}>
                <div className="qmark">&ldquo;</div>
                <p>{quote}</p>
                <div className="qby">
                  <div className="qav" />
                  <div><div className="qn">{name}</div><div className="qrole">{role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="section" id="pricing">
        <div className="container-cohesiq">
          <div className="final reveal">
            <span className="eyebrow center" style={{ justifyContent: "center" }}>Get started today</span>
            <h2 style={{ marginTop: "var(--space-4)" }}>Ready to connect?</h2>
            <p>Join Bangladesh&apos;s first structured creator marketplace.</p>
            <div className="cta-row">
              {userId ? (
                <Link href="/onboarding" className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <SignUpButton mode="modal" forceRedirectUrl="/onboarding/brand/profile" signInForceRedirectUrl="/onboarding/brand/profile">
                    <button className="btn btn-primary btn-lg">Start as a Brand</button>
                  </SignUpButton>
                  <SignUpButton mode="modal" forceRedirectUrl="/onboarding/creator/personal-info" signInForceRedirectUrl="/onboarding/creator/personal-info">
                    <button className="btn btn-outline-warm btn-lg">Join as a Creator</button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
