---
trigger: always_on
description: Enforce the Cohesiq design system — token-based styling only, no hardcoded values.
---

## Design System

Cohesiq has a defined design system. All frontend UI work must use design tokens. Full reference: `docs/design-system.md`. Live showcase: start the stack and visit `/design-system`.

### Token files

- `frontend/cohesiq-v0/frontend/design/cohesiq.css` — all CSS custom properties
- `frontend/cohesiq-v0/app/globals.css` — Tailwind v4 `@theme inline` exposes every token as a utility class
- `frontend/cohesiq-v0/app/layout.tsx` — fonts: `--font-display` (Plus Jakarta Sans) + `--font-body` (DM Sans)

### Rules (strictly enforced)

1. **Colors:** use `--brand-primary`, `--brand-secondary`, `--n-*` neutral scale, or `--color-*` semantic tokens. No hex literals in new CSS or inline styles.
2. **Typography:** `font-display` (headings) or `font-body` (UI text). Sizes from `--text-xs` → `--text-7xl` scale only.
3. **Spacing:** `--space-*` tokens on a 4px grid. No arbitrary `px` values.
4. **Dark mode:** tokens remap automatically — no `dark:` overrides unless a genuine one-off exception.
5. **shadcn/ui:** bridge tokens already applied — never override `--background`, `--primary`, `--ring`, or other shadcn CSS vars directly.
6. Check `docs/design-system.md` for the correct token name before writing any new style.
