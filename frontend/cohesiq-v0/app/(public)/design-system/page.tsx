import "./design-system.css";

export const metadata = {
  title: "Design System | Cohesiq",
};

export default function DesignSystemPage() {
  return (
    <div style={{ background: "var(--color-surface-subtle)", minHeight: "100vh" }}>
      <section className="hero-ds">
        <div className="container-cohesiq">
          <span className="eyebrow">Foundations</span>
          <h1 style={{ marginTop: "var(--space-4)" }}>
            The <span className="grad">Cohesiq</span> design system.
          </h1>
          <p>
            Every token below maps 1:1 to a Tailwind v4 <code>@theme</code> custom property.
            Vibrant, energetic, professional — and first-class in both light and dark. Toggle the theme to inspect both.
          </p>
        </div>
      </section>

      {/* BRAND COLOR */}
      <section className="block">
        <div className="container-cohesiq">
          <div className="blabel">
            <h2>Brand</h2>
            <span>--color-brand-*</span>
          </div>
          <div className="swatch-grid">
            <div className="swatch">
              <div className="chip" style={{ background: "var(--brand-primary)" }} />
              <div className="meta">
                <div className="nm">Primary</div>
                <div className="vr">--brand-primary</div>
              </div>
            </div>
            <div className="swatch">
              <div className="chip" style={{ background: "var(--brand-primary-strong)" }} />
              <div className="meta">
                <div className="nm">Primary / strong</div>
                <div className="vr">hover · pressed</div>
              </div>
            </div>
            <div className="swatch">
              <div className="chip" style={{ background: "var(--brand-primary-soft)" }} />
              <div className="meta">
                <div className="nm">Primary / soft</div>
                <div className="vr">tint · badge bg</div>
              </div>
            </div>
            <div className="swatch">
              <div className="chip" style={{ background: "var(--brand-secondary)" }} />
              <div className="meta">
                <div className="nm">Secondary</div>
                <div className="vr">--brand-secondary</div>
              </div>
            </div>
            <div className="swatch">
              <div className="chip" style={{ background: "var(--brand-secondary-strong)" }} />
              <div className="meta">
                <div className="nm">Secondary / strong</div>
                <div className="vr">hover · pressed</div>
              </div>
            </div>
            <div className="swatch">
              <div className="chip" style={{ background: "var(--brand-secondary-soft)" }} />
              <div className="meta">
                <div className="nm">Secondary / soft</div>
                <div className="vr">tint · chip bg</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEUTRALS */}
      <section className="block">
        <div className="container-cohesiq">
          <div className="blabel">
            <h2>Warm neutrals</h2>
            <span>--n-50 → --n-950</span>
          </div>
          <div className="scale-row">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => (
              <div className="s" key={n}>
                <div className="c" style={{ background: `var(--n-${n})` }} />
                <div className="l">{n}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEMANTIC TOKENS */}
      <section className="block">
        <div className="container-cohesiq">
          <div className="blabel">
            <h2>Semantic tokens</h2>
            <span>resolve per theme</span>
          </div>
          <div className="tok2">
            <div className="panel">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "var(--space-4)" }}>
                Surfaces &amp; borders
              </div>
              <div className="tokrow">
                <span className="sw" style={{ background: "var(--color-surface)" }} />
                <code>--color-surface</code>
                <span className="hex">base</span>
              </div>
              <div className="tokrow">
                <span className="sw" style={{ background: "var(--color-surface-elevated)" }} />
                <code>--color-surface-elevated</code>
                <span className="hex">cards</span>
              </div>
              <div className="tokrow">
                <span className="sw" style={{ background: "var(--color-surface-subtle)" }} />
                <code>--color-surface-subtle</code>
                <span className="hex">sections</span>
              </div>
              <div className="tokrow">
                <span className="sw" style={{ background: "var(--color-border)" }} />
                <code>--color-border</code>
                <span className="hex">dividers</span>
              </div>
              <div className="tokrow">
                <span className="sw" style={{ background: "var(--color-border-subtle)" }} />
                <code>--color-border-subtle</code>
                <span className="hex">hairlines</span>
              </div>
            </div>
            <div className="panel">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "var(--space-4)" }}>
                Text
              </div>
              <div className="tokrow">
                <span className="sw" style={{ background: "var(--color-text-primary)" }} />
                <code>--color-text-primary</code>
                <span className="hex">headings · body</span>
              </div>
              <div className="tokrow">
                <span className="sw" style={{ background: "var(--color-text-secondary)" }} />
                <code>--color-text-secondary</code>
                <span className="hex">supporting</span>
              </div>
              <div className="tokrow">
                <span className="sw" style={{ background: "var(--color-text-muted)" }} />
                <code>--color-text-muted</code>
                <span className="hex">captions · meta</span>
              </div>
              <div style={{ marginTop: "var(--space-5)" }}>
                <p style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>Primary — headings and body copy.</p>
                <p style={{ color: "var(--color-text-secondary)", marginTop: 6 }}>Secondary — supporting paragraphs.</p>
                <p style={{ color: "var(--color-text-muted)", marginTop: 6, fontSize: "var(--text-sm)" }}>
                  Muted — captions and metadata. All ≥ 4.5:1.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TYPOGRAPHY */}
      <section className="block">
        <div className="container-cohesiq">
          <div className="blabel">
            <h2>Typography</h2>
            <span>Plus Jakarta Sans · DM Sans</span>
          </div>
          <div className="panel">
            <div className="type-spec">
              <div className="type-row">
                <span className="tk">--text-7xl<br />76px</span>
                <div className="smp" style={{ fontSize: "var(--text-7xl)" }}>Marketplace</div>
              </div>
              <div className="type-row">
                <span className="tk">--text-5xl<br />49px</span>
                <div className="smp" style={{ fontSize: "var(--text-5xl)" }}>Stop guessing.</div>
              </div>
              <div className="type-row">
                <span className="tk">--text-3xl<br />31px</span>
                <div className="smp" style={{ fontSize: "var(--text-3xl)" }}>AI matches creators</div>
              </div>
              <div className="type-row">
                <span className="tk">--text-xl<br />20px</span>
                <div className="smp" style={{ fontSize: "var(--text-xl)", fontWeight: 600 }}>
                  Get discovered by the right brands
                </div>
              </div>
              <div className="type-row">
                <span className="tk">--text-base<br />16px · body</span>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-base)", color: "var(--color-text-secondary)", maxWidth: "60ch" }}>
                  Body copy is set in DM Sans at a 16px floor for comfortable reading across Latin and Bangla-Latin mixed content. Nothing on the platform drops below 12px.
                </div>
              </div>
              <div className="type-row">
                <span className="tk">--text-sm<br />14.4px</span>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  Supporting metadata, table cells, and helper text.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPACING */}
      <section className="block">
        <div className="container-cohesiq">
          <div className="blabel">
            <h2>Spacing</h2>
            <span>4px base grid · --space-1 → --space-32</span>
          </div>
          <div className="panel">
            <div className="space-list">
              {[
                { s: 1, w: 4 }, { s: 2, w: 8 }, { s: 3, w: 12 },
                { s: 4, w: 16 }, { s: 6, w: 24 }, { s: 8, w: 32 },
                { s: 12, w: 48 }, { s: 16, w: 64 }, { s: 24, w: 96 }
              ].map(({ s, w }) => (
                <div className="space-row" key={s}>
                  <code>--space-{s}</code>
                  <div className="bar" style={{ width: w }} />
                  <span className="px">{w}px</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RADIUS + SHADOW */}
      <section className="block">
        <div className="container-cohesiq">
          <div className="tok2">
            <div>
              <div className="blabel">
                <h2>Radius</h2>
                <span>--radius-*</span>
              </div>
              <div className="demo-grid">
                <div className="radius-demo" style={{ borderRadius: "var(--radius-sm)" }}><span>sm · 4</span></div>
                <div className="radius-demo" style={{ borderRadius: "var(--radius-md)" }}><span>md · 8</span></div>
                <div className="radius-demo" style={{ borderRadius: "var(--radius-lg)" }}><span>lg · 12</span></div>
                <div className="radius-demo" style={{ borderRadius: "var(--radius-xl)" }}><span>xl · 16</span></div>
              </div>
            </div>
            <div>
              <div className="blabel">
                <h2>Elevation</h2>
                <span>warm-tinted · glow in dark</span>
              </div>
              <div className="demo-grid">
                <div className="shadow-demo" style={{ boxShadow: "var(--shadow-sm)" }}><span>shadow-sm</span></div>
                <div className="shadow-demo" style={{ boxShadow: "var(--shadow-md)" }}><span>shadow-md</span></div>
                <div className="shadow-demo" style={{ boxShadow: "var(--shadow-lg)" }}><span>shadow-lg</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPONENTS */}
      <section className="block" style={{ paddingBottom: "var(--space-24)" }}>
        <div className="container-cohesiq">
          <div className="blabel">
            <h2>Components</h2>
            <span>buttons · badges · cards</span>
          </div>
          <div className="comp-grid">
            <div className="panel comp">
              <span className="cl">Buttons / primary &amp; warm</span>
              <div className="row-comp">
                <button className="btn btn-primary">Get Started</button>
                <button className="btn btn-secondary">Join as Creator</button>
              </div>
              <div className="row-comp">
                <button className="btn btn-ghost">Sign In</button>
                <button className="btn btn-outline-warm">Join</button>
              </div>
              <div className="row-comp">
                <button className="btn btn-primary btn-sm">Small</button>
                <button className="btn btn-primary btn-lg">Large</button>
              </div>
            </div>
            <div className="panel comp">
              <span className="cl">Badges &amp; tags</span>
              <div className="row-comp">
                <span className="badge primary">AI matched</span>
                <span className="badge warm">New</span>
                <span className="badge neutral">Tech</span>
              </div>
              <div className="row-comp">
                <span className="badge primary">✓ Verified</span>
                <span className="badge warm">98% match</span>
              </div>
            </div>
            <div className="panel comp">
              <span className="cl">Match-score row</span>
              <div className="match-row">
                <div className="av"></div>
                <div>
                  <div className="mn">Tasnia R.</div>
                  <div className="sub">248K · 6.4% eng.</div>
                </div>
                <div className="scoreb">
                  <div className="pct">98%</div>
                  <div className="bar">
                    <i></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="panel comp">
              <span className="cl">Eyebrow labels</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <span className="eyebrow">For brands</span>
                <span className="eyebrow warm">For creators</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
