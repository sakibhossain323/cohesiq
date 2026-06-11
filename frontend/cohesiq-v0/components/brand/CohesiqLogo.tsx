// Shared brand mark — 3-node knowledge-graph SVG.
// Uses CSS variables so it adapts to light/dark mode automatically.
// Import this everywhere instead of duplicating the inline SVG.
export function CohesiqMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      width={size}
      height={size}
      className={className}
    >
      <line x1="8"  y1="8"  x2="24" y2="9"  stroke="var(--brand-primary)"   strokeWidth="1.6" opacity="0.55" />
      <line x1="8"  y1="8"  x2="22" y2="24" stroke="var(--brand-primary)"   strokeWidth="1.6" opacity="0.55" />
      <line x1="24" y1="9"  x2="22" y2="24" stroke="var(--brand-secondary)"  strokeWidth="1.6" opacity="0.55" />
      <circle cx="8"  cy="8"  r="4"   style={{ fill: 'var(--brand-primary)'   }} />
      <circle cx="24" cy="9"  r="3"   style={{ fill: 'var(--brand-secondary)' }} />
      <circle cx="22" cy="24" r="4.5" style={{ fill: 'var(--brand-primary)'   }} />
    </svg>
  )
}
