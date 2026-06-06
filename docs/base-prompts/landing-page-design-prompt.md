# Landing Page & Design System — Frontend Design Prompt

> Paste this prompt into `/frontend-design` to generate the landing page redesign and full design system.

---

**Project:** Cohesiq — Bangladesh's Creator & Talent Marketplace
**Task:** Redesign the landing page (`app/page.tsx`) and define a full design system (tokens, typography, color, component conventions) to be applied consistently across the entire application.

---

## Product Context

Cohesiq is a B2B marketplace that connects **brand managers / brand owners** with **content creators and talent** in Bangladesh. Think of it as Upwork for the creator economy — structured, trusted, AI-powered matching instead of WhatsApp negotiations and DM cold-outreach. The platform serves two audiences simultaneously: brands who need talent, and creators who want to be discovered.

The product is built on **Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui**. The design system must be implemented as Tailwind CSS v4 CSS custom properties (`@theme` block in globals.css) so all tokens are available globally. Do not use Tailwind v3 `theme.extend` — this is v4.

---

## Design Direction

**Mood:** Vibrant, energetic, bold — but professional enough for B2B buyers. This is not a playful consumer app. Think the confidence of Figma's marketing site meets the warmth of a South Asian creator culture. Not corporate grey. Not startup pastel. Charged, vivid, purposeful.

**References:** Upwork (dual-audience hero), Contra (bold typography + motion), Canva (accessible vibrancy), Notion (clean information hierarchy).

---

## Design System Requirements

### Color System
Define a full dual-theme palette (CSS custom properties for both `:root` light and `.dark`):

- **Primary brand color:** A bold, saturated hue that works as an accent and CTA — consider deep electric violet (`#6C3FF5` range) or charged indigo-blue. Must pass WCAG AA contrast on both light and dark backgrounds.
- **Secondary / complementary:** A warm accent (amber/coral/saffron range) that contrasts the primary — for creator-side CTAs and highlights. Reflects the energy of BD's visual culture.
- **Neutrals:** A full neutral scale (50–950) in warm-tinted grey (slightly warm, not cool grey) for backgrounds, cards, text.
- **Semantic tokens:** `--color-brand-primary`, `--color-brand-secondary`, `--color-surface`, `--color-surface-elevated`, `--color-surface-subtle`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-border-subtle`.
- Light theme: clean white/warm-off-white backgrounds; dark theme: deep near-black (not pure `#000`) with elevated surfaces at `#111`/`#1a1a1a` range.
- Both themes must feel equally first-class — not an afterthought inversion.

### Typography
- **Display / Hero:** A geometric or humanist sans-serif with strong personality at large sizes. Suggest `Plus Jakarta Sans` (Google Fonts) or `Syne` for display. Bold weight (700–800) for hero headings, tight tracking.
- **Body:** `Inter` or `DM Sans` — highly readable at 14–16px, works across Latin and Bangla-Latin mixed content.
- **Scale (CSS custom properties):** `--text-xs` through `--text-7xl` following a modular scale (1.25 ratio). Line heights and letter spacings as tokens too.
- **Rule:** All body text minimum 16px. No text below 12px anywhere. Contrast ratio ≥ 4.5:1 for all body text in both themes.

### Spacing & Radius
- 4px base grid. Define `--space-1` through `--space-32`.
- Radius tokens: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-xl` (16px), `--radius-full` (9999px).

### Elevation / Shadow
- 3-level shadow system: `--shadow-sm`, `--shadow-md`, `--shadow-lg` — warm-tinted shadows (slightly coloured toward the brand primary) in light mode, glow-based in dark mode.

---

## Landing Page — Section-by-Section Spec

### 1. Navigation Bar
- Logo left (wordmark "Cohesiq" with a small mark — suggest a connected-node or link glyph).
- Center: sparse nav links — "How it Works", "For Brands", "For Creators", "Pricing".
- Right: "Sign In" (ghost button) + "Get Started" (primary filled CTA).
- Behaviour: transparent on hero, transitions to a frosted-glass / elevated surface on scroll (`backdrop-blur` + subtle border-bottom). Sticky.
- Both light and dark themes applied.

### 2. Hero Section
**This is the most important section.** It must immediately communicate to both audiences — brand owners and creators — that this platform is for them.

**Layout:** Full-viewport-height split or layered composition.

**Headline (large, bold, display font):**
> "Bangladesh's Creator Marketplace."
> Subhead: "Brands find the right talent. Creators get discovered. No DMs. No guesswork."

**Dual CTA row** (like Upwork's "I want to hire / I want to work"):
Two large pill/card buttons side by side:
- Left: **"I represent a Brand"** — primary colour, brand icon — routes to `/sign-up?role=brand`
- Right: **"I'm a Creator"** — secondary/warm accent colour, creator icon — routes to `/sign-up?role=creator`

Below them, a small social-proof line: "Trusted by 500+ BD creators across 12 niches."

**Hero Visual (right side or background layer):**
A composed collage / mosaic of creator/brand content images — short-form video thumbnails, Instagram-style cards, YouTube preview tiles — arranged in a floating asymmetric grid. Some tiles slightly rotated (2–4°), varying sizes, with subtle hover lift animation (`transform: translateY(-4px)` on hover). This communicates "every niche, every platform, in one place." Use placeholder image URLs from Unsplash (search for: content creator, influencer, studio, brand shoot, Bangladesh culture, street fashion, food photography — all free-use). The mosaic should feel alive, not static.

For the mosaic tiles, implement a subtle continuous float animation using CSS keyframes — different tiles float at different speeds (3s–6s cycle) and offsets, giving a breathing, living feel without being distracting.

**Background:** A very subtle radial gradient — brand primary at ~10% opacity emanating from top-right, warm secondary at ~8% from bottom-left — on the light theme. On dark: a deep dark base with the same gradient at slightly higher opacity.

### 3. "How It Works" Section
Three-step horizontal flow with animated connectors between steps:
1. **Brand posts a campaign** — icon: megaphone/target
2. **AI matches the right creators** — icon: sparkle/graph-nodes
3. **Collaborate, track, pay securely** — icon: handshake/check

Each step: number badge (brand-primary colour), bold short title, 1-sentence description.
On scroll-into-view: steps animate in left-to-right with a staggered slide-up fade (CSS `@keyframes` + `animation-delay`).
The connector between steps is a dashed animated line (CSS `stroke-dashoffset` animation) that draws itself as the section enters the viewport.

### 4. "For Brands" Feature Block
Left: bold headline ("Stop guessing. Start matching."), 3–4 feature bullets with icons:
- AI-powered creator matching by niche, audience, and engagement
- Authenticity scoring — fraud detection built in
- Campaign management from brief to payment
- ROI tracking per collaboration

Right: a stylised dashboard mockup / screenshot placeholder showing a creator match result card (fabricate a clean card component with: creator avatar, name, niche tag, match score bar, follower count, engagement rate). This should look like a real product screenshot but built in HTML/CSS.

Scroll animation: left text slides in from left, right mockup slides in from right.

### 5. "For Creators" Feature Block
Mirror layout (mockup left, text right). Warm secondary accent colour dominates.
Headline: "Get discovered by brands that fit your niche."
Bullets:
- Build a verified creator profile
- Brands come to you — no cold pitching
- Transparent rate cards, secure BDT payments
- Portfolio showcase across platforms

Mockup: a creator profile card — avatar, cover, platform badges (YouTube/Instagram/TikTok icons), follower counts, engagement metric, a "Match Score" chip.

### 6. Social Proof / Stats Bar
Full-width band (brand primary gradient background) with 4 animated counters:
- `500+` Creators
- `12` Niches
- `BDT 2Cr+` Deals Facilitated
- `4.8★` Average Rating

Numbers animate counting up when the section enters viewport (CSS counter animation or JS `IntersectionObserver` triggered). White text on brand-primary background.

### 7. Testimonial / Quote Section
2–3 quote cards — fabricate realistic BD brand manager and creator personas. Cards with avatar, name, role/company, quote. Soft background, subtle border.

### 8. Final CTA Section
Large centred call to action:
Headline: "Ready to connect?"
Subhead: "Join Bangladesh's first structured creator marketplace."
Two buttons: "Start as a Brand" (primary) + "Join as a Creator" (secondary/outline warm).
Background: a subtle repeating geometric pattern (connected dots/nodes — nod to the Graph AI angle) at low opacity.

### 9. Footer
4-column layout: Logo + tagline | Product links | Company | Legal.
Dark background regardless of theme (creates visual grounding). Social icons. "© 2026 Cohesiq. Built for Bangladesh."

---

## Animation & Interaction Principles

- **Scroll-triggered reveals:** Use `IntersectionObserver` to add a `.is-visible` class; CSS handles the transition (`opacity 0→1`, `translateY(20px)→0`, duration 500ms, ease-out). No JS animation libraries — pure CSS transitions triggered by class toggle.
- **Stagger:** Child elements in a group animate with `animation-delay: calc(var(--index) * 80ms)` — pass index via inline CSS var.
- **Hero mosaic float:** CSS `@keyframes floatY` — `transform: translateY(0px)` to `translateY(-10px)` and back, `ease-in-out`, infinite. Different tiles get different `animation-duration` (3s–6s) and `animation-delay` for organic feel.
- **Hover states:** Cards lift (`translateY(-4px)` + shadow upgrade). CTA buttons scale slightly (`scale(1.02)`). All 200ms ease.
- **No layout shift on scroll** — use `will-change: transform` on animated elements.
- **Respect `prefers-reduced-motion`:** Wrap all animations in `@media (prefers-reduced-motion: no-preference)` — default to no animation for accessibility.

---

## Technical Constraints

- File: `frontend/cohesiq-v0/app/page.tsx` — this is a Next.js Server Component (no `"use client"` at the page level). Interactive islands (scroll observers, counter animations) go in colocated `_components/` files marked `"use client"`.
- Design tokens go in `frontend/cohesiq-v0/app/globals.css` under a `@theme {}` block (Tailwind v4 syntax).
- Use `next/image` for all images with proper `alt` text.
- Use `next/link` for all internal navigation.
- No new npm packages — only what's already installed: Tailwind v4, shadcn/ui, Lucide icons, `next/font` for Google Fonts.
- Dark mode: Tailwind's `class` strategy — `.dark` class on `<html>`. The existing `ThemeProvider` already handles this.
- The page must be fully responsive: mobile (375px), tablet (768px), desktop (1280px+).

---

## Deliverables Expected

1. Updated `app/globals.css` — full `@theme {}` design token block (colours, typography, spacing, radius, shadows) for both light and dark.
2. Updated `app/page.tsx` — full landing page as a Server Component, importing client islands as needed.
3. Any colocated client components under `app/_components/` (e.g. `HeroMosaic.tsx`, `AnimatedCounter.tsx`, `ScrollReveal.tsx`).
4. The result should be visually striking enough to win a hackathon judge's first impression in under 5 seconds.
