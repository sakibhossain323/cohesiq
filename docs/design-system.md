# Design System

> **Token reference for agents and contributors.**
> All frontend UI work must use design tokens — never hardcode colors, font sizes, spacing, or shadows.
> Live visual showcase: run the stack and visit `/design-system`.

## 1. File Locations

| File | Purpose |
|---|---|
| `frontend/cohesiq-v0/frontend/design/cohesiq.css` | Token source — all CSS custom properties defined here |
| `frontend/cohesiq-v0/app/globals.css` | Merges `cohesiq.css`; exposes all tokens as Tailwind v4 utilities via `@theme inline` |
| `frontend/cohesiq-v0/app/layout.tsx` | Loads `Plus Jakarta Sans` and `DM Sans` via `next/font/google`; injects `--font-display` / `--font-body` on `<html>` |
| `frontend/cohesiq-v0/app/(public)/design-system/` | Interactive showcase page — use this to verify tokens visually |

---

## 2. Brand Colors

Two brand hues: **primary** (purple) and **secondary** (red/coral). Each has three tiers: base, strong (hover/pressed), soft (tints, badge backgrounds).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand-primary` | `#5B2BD9` | `#8B5CFF` | Primary buttons, links, active states |
| `--brand-primary-strong` | `#4A1FBF` | `#A07BFF` | Hover / pressed on primary |
| `--brand-primary-soft` | `#EDE6FB` | `#241a3d` | Badge backgrounds, tinted surfaces |
| `--brand-secondary` | `#FF5C5C` | `#FF7A6E` | Secondary accent, destructive-adjacent |
| `--brand-secondary-strong` | `#ED4444` | `#FF9183` | Hover / pressed on secondary |
| `--brand-secondary-soft` | `#FFE7E3` | `#3a1f1c` | Secondary tint backgrounds |
| `--color-on-brand` | `#FFFFFF` | `#FFFFFF` | Text/icon on brand-colored backgrounds |

### Gradient washes

| Token | Value |
|---|---|
| `--wash-primary` | `color-mix(--brand-primary, transparent)` at 12% (light) / 18% (dark) |
| `--wash-secondary` | `color-mix(--brand-secondary, transparent)` at 10% (light) / 14% (dark) |

Tailwind utilities: `bg-wash-primary`, `bg-wash-secondary`

---

## 3. Warm Neutral Scale

11-step warm-tinted gray scale. Use these for backgrounds, borders, and muted UI elements.

| Token | Value |
|---|---|
| `--n-50` | `#FAF8F5` |
| `--n-100` | `#F3EFE9` |
| `--n-200` | `#E8E2D8` |
| `--n-300` | `#D6CEBE` |
| `--n-400` | `#C0B59E` |
| `--n-500` | `#A89B82` |
| `--n-600` | `#8B8170` |
| `--n-700` | `#6D6456` |
| `--n-800` | `#4E483D` |
| `--n-900` | `#302B22` |
| `--n-950` | `#14110D` |

Tailwind utilities: `bg-n-50`, `text-n-800`, `border-n-200`, etc.

---

## 4. Semantic Surface & Text Tokens

Prefer semantic tokens over raw neutral values — they remap automatically in dark mode.

### Surfaces

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-surface` | `#FFFFFF` | `#14110D` | Page / modal background |
| `--color-surface-elevated` | `#FFFFFF` | `#1C1813` | Cards, dropdowns, popovers |
| `--color-surface-subtle` | `→ --n-50` | `→ --n-50 dark` | Subtle section fills |
| `--color-surface-sunken` | `→ --n-100` | `→ --n-100 dark` | Input backgrounds, code blocks |

### Text

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-text-primary` | `#14110D` | `#F6F2EB` | Body copy, headings |
| `--color-text-secondary` | `#4E483D` | `#C9C1B3` | Supporting labels, metadata |
| `--color-text-muted` | `#8B8170` | `#8B8170` | Placeholders, disabled text |

### Borders

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-border` | `#E8E2D8` | `#2D281F` | Component borders, dividers |
| `--color-border-subtle` | `#F3EFE9` | `#241F18` | Hairlines, very subtle separators |

Tailwind utilities: `bg-surface`, `bg-surface-elevated`, `text-text-primary`, `text-text-muted`, `border-border`, etc.

---

## 5. Typography

### Fonts

| Token | Family | Weights | Role |
|---|---|---|---|
| `--font-display` | `Plus Jakarta Sans` | 400, 500, 600, 700, 800 | Headlines, display text, marketing copy |
| `--font-body` | `DM Sans` | 400, 500, 600, 700 | Body text, UI labels, buttons |

Loaded via `next/font/google` in `app/layout.tsx`. Injected as CSS variables on `<html>`.

Tailwind utilities: `font-display`, `font-body`

**Rule:** Never import fonts via `<link>` or `@import url()` — always add to the existing `next/font/google` config in `layout.tsx`.

### Type scale (modular)

| Token | Value | px equiv |
|---|---|---|
| `--text-xs` | `0.8rem` | ~12.8px |
| `--text-sm` | `0.9rem` | ~14.4px |
| `--text-base` | `1rem` | 16px |
| `--text-lg` | `1.125rem` | 18px |
| `--text-xl` | `1.25rem` | 20px |
| `--text-2xl` | `1.563rem` | ~25px |
| `--text-3xl` | `1.953rem` | ~31px |
| `--text-4xl` | `2.441rem` | ~39px |
| `--text-5xl` | `3.052rem` | ~49px |
| `--text-6xl` | `3.815rem` | ~61px |
| `--text-7xl` | `4.768rem` | ~76px |

Tailwind utilities: `text-xs` through `text-7xl` (these map to the Cohesiq scale, not Tailwind defaults)

### Line heights

| Token | Value | Use |
|---|---|---|
| `--leading-tight` | `1.05` | Display headings |
| `--leading-snug` | `1.2` | Subheadings, large UI text |
| `--leading-normal` | `1.55` | Body copy |

### Letter spacing

| Token | Value | Use |
|---|---|---|
| `--tracking-tight` | `-0.03em` | Large display headings |
| `--tracking-snug` | `-0.01em` | UI headings |
| `--tracking-wide` | `0.08em` | Eyebrow labels, all-caps tags |

---

## 6. Spacing

4px grid system. Use these tokens for all margins, padding, and gaps — do not use arbitrary pixel values.

| Token | Value |
|---|---|
| `--space-1` | `0.25rem` (4px) |
| `--space-2` | `0.5rem` (8px) |
| `--space-3` | `0.75rem` (12px) |
| `--space-4` | `1rem` (16px) |
| `--space-5` | `1.25rem` (20px) |
| `--space-6` | `1.5rem` (24px) |
| `--space-8` | `2rem` (32px) |
| `--space-10` | `2.5rem` (40px) |
| `--space-12` | `3rem` (48px) |
| `--space-16` | `4rem` (64px) |
| `--space-20` | `5rem` (80px) |
| `--space-24` | `6rem` (96px) |
| `--space-32` | `8rem` (128px) |

Tailwind utilities: `p-space-4`, `gap-space-6`, `mb-space-8`, etc.

---

## 7. Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `4px` | Badges, tags, small chips |
| `--radius-md` | `8px` | Buttons, inputs |
| `--radius-lg` | `12px` | Cards, panels |
| `--radius-xl` | `16px` | Modals, large cards |
| `--radius-2xl` | `24px` | Hero sections, featured cards |
| `--radius-full` | `9999px` | Pills, avatars |

Tailwind utilities: `rounded-sm` through `rounded-2xl`, `rounded-full`

---

## 8. Shadows

Dual-layer shadows with warm tints and brand color accents.

| Token | Use |
|---|---|
| `--shadow-sm` | Subtle lift on cards at rest |
| `--shadow-md` | Cards on hover, dropdowns |
| `--shadow-lg` | Modals, elevated panels |
| `--shadow-brand` | Brand-colored glow on primary interactive elements |
| `--shadow-warm` | Secondary/coral-colored glow |

Tailwind utilities: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-brand`, `shadow-warm`

Dark mode: shadow values automatically remap to lighter, more diffuse versions — do not override.

---

## 9. Tailwind v4 Integration

All tokens are exposed as Tailwind utilities via the `@theme inline` block in `globals.css` (lines 200–272). This means every `--brand-*`, `--color-*`, `--n-*`, `--space-*`, `--text-*`, `--radius-*`, `--shadow-*`, and `--font-*` token is directly usable as a Tailwind class.

**Pattern:** `var(--brand-primary)` in CSS → `text-brand-primary` / `bg-brand-primary` / `border-brand-primary` in JSX.

Examples:
```tsx
// Correct
<div className="bg-surface-elevated text-text-primary rounded-lg shadow-md p-space-6">
  <h2 className="font-display text-2xl tracking-tight leading-tight text-brand-primary">
    Heading
  </h2>
  <p className="font-body text-base leading-normal text-text-secondary">
    Body copy
  </p>
</div>

// Wrong — hardcoded values bypass the design system
<div style={{ backgroundColor: '#FFFFFF', color: '#14110D' }}>
```

---

## 10. shadcn/ui Bridge

shadcn/ui components use standard CSS variable names (`--background`, `--primary`, etc.). These are mapped to Cohesiq design tokens in `globals.css` so all shadcn components automatically pick up the brand theme.

| shadcn var | Mapped to Cohesiq token |
|---|---|
| `--background` | `--color-surface` |
| `--foreground` | `--color-text-primary` |
| `--card` | `--color-surface-elevated` |
| `--card-foreground` | `--color-text-primary` |
| `--popover` | `--color-surface-elevated` |
| `--primary` | `--brand-primary` |
| `--primary-foreground` | `--color-on-brand` |
| `--secondary` | `--color-surface-subtle` |
| `--muted` | `--color-surface-subtle` |
| `--muted-foreground` | `--color-text-muted` |
| `--accent` | `--brand-primary-soft` |
| `--border` | `--color-border` |
| `--input` | `--color-border` |
| `--ring` | `--brand-primary` |
| `--chart-1` … `--chart-5` | Data visualization palette |
| `--sidebar-*` | Sidebar-specific surface/text tokens |

**Rule:** Never override `--background`, `--primary`, or other shadcn variables directly in component CSS — edit the bridge mapping in `globals.css` if a change is needed.

---

## 11. Container

| Token | Value | Use |
|---|---|---|
| `--maxw` | `1200px` | Maximum page content width |

Use `max-w-[var(--maxw)]` or set via `globals.css` `@theme` alias.

---

## 12. Usage Rules for Agents

1. **No hex literals.** Use `--brand-primary`, `--n-*`, or `--color-*` tokens. Raw hex values in new CSS or `style={}` props will be flagged in review.

2. **Colors.** Prefer semantic tokens (`--color-surface`, `--color-text-primary`) over raw neutrals (`--n-50`) — semantic tokens remap in dark mode automatically.

3. **Typography.** Always `font-display` for headings and display text; `font-body` for everything else. Font sizes must come from the `--text-*` scale.

4. **Spacing.** Use `--space-*` grid tokens. Do not use arbitrary `px` values like `p-[13px]`.

5. **Dark mode.** All tokens have dark-mode variants baked in via `:root.dark {}` / `@media (prefers-color-scheme: dark)`. Do not add `dark:bg-*` overrides unless handling a one-off exception that genuinely cannot use a token.

6. **shadcn/ui.** Do not re-style shadcn component internals unless changing the bridge mapping. The components already reflect the brand theme.

7. **Visual check.** After adding new UI, verify against the design system showcase at `/design-system` to confirm tokens are rendering correctly in both light and dark modes.
