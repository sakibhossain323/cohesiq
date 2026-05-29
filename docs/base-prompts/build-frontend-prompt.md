# Cohesiq — Frontend Generation Prompt

## Project Overview

Build the complete UI for **Cohesiq**, a **B2B influencer-brand matching platform** targeting the Bangladeshi market.

Two types of users:
- **Creators:** Social media influencers who list their profiles, platforms, and rate cards, and apply to campaigns.
- **Brands:** Companies that post campaign briefs and manage creator applications.

---

## Requirements (Non-Negotiable)

- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Language:** TypeScript (strict mode)
- **Icons:** lucide-react

Use whatever framework and routing solution you prefer. Focus on clean, modular, production-quality code.

---

## Modularity & Abstraction Principles

These are non-negotiable architectural rules. The codebase must be structured so that any layer can be swapped independently without touching the rest.

### 1. Strict Layer Separation
The codebase must have exactly three layers that never bleed into each other:

```
Mock Data Layer     →  lib/mock-data/       (raw data, no logic)
API Service Layer   →  lib/api/             (all data access, filtering, transforms)
UI Layer            →  components/ + pages  (pure presentation, calls api/ only)
```

- **Mock data files** contain only typed arrays. No functions, no logic.
- **API service files** contain all business logic (filtering, sorting, lookups). Components never reach past this layer.
- **Components** receive data as props or from the API layer. They have zero knowledge of where data comes from.

### 2. Single Responsibility Components
- Every component does exactly one thing.
- If a component renders a list AND filters it AND handles pagination, split it into three components.
- If a component file exceeds ~100 lines, it is doing too much — extract sub-components.
- Props must be typed with dedicated interfaces, never inlined object types on the component signature.

### 3. Swappable API Layer
Every function in `lib/api/` must be written as if it will one day make a real HTTP call. The signature, return type, and error handling must remain identical whether using mock data or a real backend. Replacing mock data with real API calls must require changing **only the internals of `lib/api/` files**, with zero changes to components or pages.

### 4. No Logic in Pages/Views
Pages are responsible for orchestrating components and fetching data. They must contain:
- Data fetching calls (via `lib/api/`)
- Loading and error state management
- Passing data down to components as props

Pages must NOT contain:
- Filtering logic
- Data transformation
- Business rules

### 5. Shared Components are Truly Generic
Components in `components/shared/` must accept only primitive or typed-interface props. They must not import from any specific domain. `StarRating`, `PlatformBadge`, `EmptyState` — these work for creators, brands, and campaigns alike without modification.

---

## Data Abstraction Architecture

Create a `lib/api/` directory. Every domain gets its own file:

```
lib/api/
  creators.ts
  brands.ts
  campaigns.ts
  applications.ts
  reviews.ts
```

Each function must be `async`, return a `Promise<T>` with proper TypeScript types, and simulate network delay with a `sleep(300)` utility. **Components must never import from `lib/mock-data/` directly — always go through `lib/api/`.**

Example pattern:

```typescript
// lib/api/campaigns.ts
import type { Campaign, CampaignFilters } from "@/lib/types";
import { mockCampaigns } from "@/lib/mock-data/campaigns";
import { sleep } from "@/lib/utils";

export async function getCampaigns(filters?: CampaignFilters): Promise<Campaign[]> {
  await sleep(300);
  let result = [...mockCampaigns];
  if (filters?.niche) result = result.filter(c => c.primary_niche === filters.niche);
  if (filters?.status) result = result.filter(c => c.status === filters.status);
  return result;
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  await sleep(300);
  return mockCampaigns.find(c => c.id === id) ?? null;
}
```

Mock data lives in `lib/mock-data/`:
```
lib/mock-data/
  creators.ts
  brands.ts
  campaigns.ts
  applications.ts
  reviews.ts
```

---

## TypeScript Types

Define all interfaces in `lib/types.ts`:

```typescript
export type PlatformType = "youtube" | "instagram" | "facebook" | "tiktok" | "twitter_x" | "linkedin" | "snapchat" | "other";
export type CampaignStatus = "draft" | "active" | "in_progress" | "completed" | "cancelled";
export type ApplicationStatus = "pending" | "shortlisted" | "accepted" | "rejected" | "withdrawn" | "completed";
export type DeliverableType = "dedicated_video" | "integrated_mention" | "short_video" | "photo_post" | "story" | "live_stream" | "blog_post" | "other";

export interface CreatorSocialProfile {
  id: string;
  platform: PlatformType;
  handle: string;
  profile_url: string;
  follower_count?: number;
  engagement_rate?: number;
  avg_views_per_post?: number;
  is_primary_platform: boolean;
}

export interface CreatorRateCard {
  id: string;
  platform: PlatformType;
  deliverable_type: DeliverableType;
  price_bdt: number;
  is_negotiable: boolean;
}

export interface Creator {
  id: string;
  display_name: string;
  tagline?: string;
  bio?: string;
  profile_photo_url?: string;
  city?: string;
  primary_niche: string;
  niches: string[];
  languages: string[];
  social_profiles: CreatorSocialProfile[];
  rate_cards: CreatorRateCard[];
  is_available: boolean;
  total_collaborations: number;
  average_rating?: number;
}

export interface Brand {
  id: string;
  brand_name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  city?: string;
  niche: string;
  is_verified: boolean;
  total_campaigns: number;
  average_rating?: number;
}

export interface Campaign {
  id: string;
  brand_id: string;
  brand: Pick<Brand, "id" | "brand_name" | "logo_url" | "is_verified">;
  title: string;
  description: string;
  primary_niche: string;
  required_platforms: PlatformType[];
  budget_per_creator_min?: number;
  budget_per_creator_max: number;
  creator_min_followers: number;
  application_deadline?: string;
  status: CampaignStatus;
  application_count: number;
}

export interface Application {
  id: string;
  campaign_id: string;
  campaign: Pick<Campaign, "id" | "title" | "brand">;
  creator: Pick<Creator, "id" | "display_name" | "profile_photo_url" | "primary_niche">;
  proposed_rate?: number;
  proposal_text?: string;
  status: ApplicationStatus;
  applied_at: string;
}

export interface Review {
  id: string;
  rating: number;
  review_text?: string;
  is_public: boolean;
  created_at: string;
  reviewer_name: string;
  reviewer_photo?: string;
}

export interface CreatorFilters {
  niche?: string;
  platform?: PlatformType;
  min_followers?: number;
  max_followers?: number;
  language?: string;
  city?: string;
  is_available?: boolean;
}

export interface CampaignFilters {
  niche?: string;
  platform?: PlatformType;
  min_budget?: number;
  max_budget?: number;
  status?: CampaignStatus;
}
```

---

## Pages to Build

### 1. Landing Page

Professional, light-mode SaaS landing page. Include:
- **Navbar:** Logo "Cohesiq" left, links center (Browse Creators, Browse Campaigns), two buttons right: "Join as Creator", "Join as Brand".
- **Hero:** Bold headline: *"The Smart Way to Match Creators and Brands in Bangladesh."* Two CTAs: "Browse Campaigns", "Find Creators".
- **Stats banner:** 500+ Creators, 120+ Brands, 300+ Campaigns (mock numbers).
- **Features:** 3 cards — value prop for creators, brands, and the matching process.
- **Footer.**

### 2. Browse Creators

- **Filter sidebar** (collapsible on mobile):
  - Niche dropdown: Technology, Fashion, Food, Travel, Gaming, Fitness, Beauty, Finance, Lifestyle, Other
  - Platform checkboxes: YouTube, Instagram, TikTok, Facebook
  - Follower range slider: 1K–1M
  - Language filter: Bangla, English
  - City text input
  - "Available only" toggle
- **Creator card grid:** 3 cols desktop, 2 tablet, 1 mobile.
- **`CreatorCard` shows:** Avatar (with initials fallback), display name, city badge, niche badge, top platform with follower count ("124K followers"), engagement rate, availability badge, avg star rating. Card is fully clickable.
- **Loading skeleton** while data resolves.

### 3. Creator Public Profile

Sections:
- **Header:** Large avatar, display name, tagline, city, availability status, star rating, niche badges, language badges. "Contact" button.
- **About:** Bio text.
- **Social Platforms:** Cards per platform — icon, handle, formatted follower count, engagement rate. Primary platform highlighted.
- **Rate Cards:** Table — Platform | Deliverable | Price (BDT) | Negotiable.
- **Reviews:** Cards with star rating, reviewer name + avatar, review text, date.

### 4. Browse Campaigns

- **Filter sidebar:** Niche, platform checkboxes, budget slider (BDT 1K–500K), status (active by default).
- **Campaign list** (vertical cards):
  - Brand logo + name + verified badge, campaign title, niche badge, platform badges, budget range, deadline (red if < 7 days away), application count.

### 5. Campaign Detail

- **Header:** Title, brand row (logo, name, verified badge), status badge, budget range, deadline.
- **Description:** Full brief.
- **Requirements:** Niche, required platforms, follower range.
- **Deliverables:** Table — Platform | Deliverable Type | Quantity.
- **Apply Button:** Opens a `Dialog` with: proposal text `Textarea`, proposed rate `Input` (BDT). On submit: success `Toast`, log to console. No API call.
- **Brand sidebar card:** Name, logo, city, total campaigns, avg rating.

### 6. Creator Dashboard

Hardcode current creator as `mockCreators[0]`.
- **My Applications:** Table — Campaign, Brand, Applied Date, Proposed Rate (৳), Status badge. Empty state if empty.
- **Profile summary card** linking to public profile.
- **Suggested Campaigns:** 3 campaign cards.

### 7. Brand Dashboard

Hardcode current brand as `mockBrands[0]`.
- **My Campaigns:** Table — Title, Status badge, Application Count, Budget Max, Deadline. "Manage" button per row.
- **"Manage" opens a `Sheet`** (side drawer) with all applications for that campaign: creator avatar + name + niche + follower count + proposed rate + status `Select`. Status changes are local state only.

---

## Component Organization

```
components/
  layout/
    Navbar.tsx
    Footer.tsx
  creator/
    CreatorCard.tsx
    CreatorProfileHeader.tsx
    SocialProfileCard.tsx
    RateCardTable.tsx
    CreatorFilters.tsx
  campaign/
    CampaignCard.tsx
    CampaignFilters.tsx
    ApplyModal.tsx
    DeliverableTable.tsx
  brand/
    BrandCard.tsx
  application/
    ApplicationRow.tsx
    ApplicationStatusBadge.tsx
  shared/
    StarRating.tsx
    PlatformBadge.tsx
    NicheBadge.tsx
    FollowerCount.tsx
    LoadingSkeleton.tsx
    EmptyState.tsx
```

Components must be small and single-responsibility. If a component exceeds ~100 lines, extract sub-components.

---

## Mock Data Requirements

Generate **realistic Bangladeshi market data**:

- **8 creators** — varied niches (tech, fashion, food, gaming, travel, fitness, beauty, finance), cities (Dhaka, Chittagong, Sylhet, Rajshahi), follower counts from 5K to 800K. Mix of YouTube, Instagram, TikTok.
- **4 brands** — different industries (fashion, food, tech, finance). Bangladeshi brand feel.
- **6 campaigns** — 4 active, 1 completed, 1 draft. BDT budgets ৳10K–৳200K.
- **10 applications** — all statuses represented.
- **8 reviews** — mixed between creator and brand reviews.

---

## Utility Functions

Must include in `lib/utils.ts`:

```typescript
export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export function formatFollowerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}
```

---

## REST API Reference (Backend Contract)

The mock data shapes and API function signatures must match this backend contract exactly. When real API calls replace the mocks, these are the endpoints that will be called:

### Auth
- `POST /auth/register` — Body: `{ email, password, role: "creator"|"brand", display_name?, brand_name? }` → `{ access_token, token_type }`
- `POST /auth/login` — Body: `{ email, password }` → `{ access_token, token_type }`
- `GET /auth/me` → `{ id, email, role, is_active, created_at }`

### Creators
- `GET /creators/` — Query: `niche?`, `platform?`, `min_followers?`, `max_followers?`, `language?`, `city?`, `is_available?`, `max_rate?`, `limit`, `offset` → `CreatorProfileOut[]`
- `GET /creators/{creator_id}` → `CreatorProfileOut`
- `PUT /creators/{creator_id}` — Body: `CreatorProfileUpdate` → `CreatorProfileOut`
- `POST /creators/{creator_id}/platforms` — Body: `SocialProfileCreate` (platform, handle, profile_url, follower_count?, engagement_rate?, content_languages, etc.) → `SocialProfileOut`
- `PUT /creators/{creator_id}/platforms/{platform_id}` → `SocialProfileOut`
- `DELETE /creators/{creator_id}/platforms/{platform_id}` → 204
- `POST /creators/{creator_id}/rate-cards` — Body: `{ platform, deliverable_type, price_bdt, turnaround_days?, is_negotiable }` → `RateCardOut`
- `PUT /creators/{creator_id}/rate-cards/{rate_card_id}` → `RateCardOut`
- `DELETE /creators/{creator_id}/rate-cards/{rate_card_id}` → 204
- `POST /creators/{creator_id}/portfolio` — Body: `{ platform, content_url, title?, thumbnail_url?, views?, likes?, is_featured }` → `PortfolioItemOut`
- `DELETE /creators/{creator_id}/portfolio/{item_id}` → 204
- `GET /creators/{creator_id}/applications` → `ApplicationOut[]`
- `GET /creators/{creator_id}/reviews` → `ReviewOut[]`

### Brands
- `GET /brands/` → `BrandProfileOut[]`
- `GET /brands/{brand_id}` → `BrandProfileOut`
- `PUT /brands/{brand_id}` — Body: `BrandProfileUpdate` → `BrandProfileOut`
- `GET /brands/{brand_id}/campaigns` → `CampaignOut[]`
- `GET /brands/{brand_id}/applications` → `ApplicationOut[]`
- `GET /brands/{brand_id}/reviews` → `ReviewOut[]`

### Campaigns
- `GET /campaigns/` — Query: `niche?`, `platform?`, `min_budget?`, `max_budget?`, `language?`, `status` → `CampaignOut[]`
- `POST /campaigns/` — Body: `CampaignCreate` (title, description, required_platforms, budget_per_creator_max, niche_targets, language_targets, deliverable_requirements, etc.) → `CampaignOut`
- `GET /campaigns/{campaign_id}` → `CampaignOut`
- `PUT /campaigns/{campaign_id}` — Body: `CampaignUpdate` → `CampaignOut`
- `PATCH /campaigns/{campaign_id}/status` — Body: `{ status: "draft"|"active"|"in_progress"|"completed"|"cancelled" }` → `CampaignOut`
- `POST /campaigns/{campaign_id}/apply` — Body: `{ proposal_text?, proposed_rate? }` → `ApplicationOut`
- `GET /campaigns/{campaign_id}/applications` → `ApplicationOut[]`
- `PATCH /campaigns/{campaign_id}/applications/{application_id}/status` — Body: `{ status, brand_notes?, rejection_reason?, agreed_rate?, agreed_deliverables? }` → `ApplicationOut`
- `POST /campaigns/reviews/` — Body: `{ application_id, rating: 1-5, review_text?, is_public }` → `ReviewOut`

---

## Code Quality Rules

1. **No `any` types.**
2. **No inline styles.** Only Tailwind classes.
3. **Components never import from `mock-data/` directly.** Only through `lib/api/`.
4. **Loading state on every async fetch.**
5. **All monetary values in BDT** using `formatBDT()`.
6. **All follower counts formatted** using `formatFollowerCount()`.
7. **Responsive** for mobile, tablet, desktop.

---

## Design Direction

Cohesiq is a **B2B marketplace** where business deals happen. Apply a **professional SaaS design language** — not a consumer social app, not a dark developer tool. Think **Stripe Dashboard, Linear, Vercel, or Intercom**: clean, trustworthy, focused.

### Color
- **Light mode as the primary experience.** B2B users work in office environments. Dark mode is optional but not the default.
- **Neutral base palette** — whites, light grays, slate tones for backgrounds and surfaces.
- A **single trust-inspiring accent color** (indigo, violet, or a calm blue) for CTAs, active states, and highlights. Avoid loud or high-saturation colors.
- Reserve color intentionally: status badges, platform icons, CTAs. Everything else stays neutral.

### Typography
- Clear hierarchy: large bold headings, medium body text, small muted supporting text.
- Use font weight to create hierarchy — not color alone.
- Consistent scale throughout.

### Layout & Spacing
- Generous whitespace. Cramped B2B UIs feel untrustworthy.
- **Card-based layouts** for browsing (creators, campaigns). **Table-based layouts** for management (dashboards, applications).
- Consistent padding and grid — everything should feel intentionally placed.

### Components & Interaction
- Status badges must communicate with **both color and a text label** — never color alone.
- Prefer **contained, bordered cards** over heavy shadows.
- Subtle hover states: a slight background tint or shadow lift is enough.
- Navigation and filters feel stable and secondary — the content is the star.

### Tone
- Professional and trustworthy, not playful, not corporate-boring.
- Every element earns its place on screen.

---

## Final Notes

- **No auth pages.** Dashboards hardcode current user from mock data (`mockCreators[0]`, `mockBrands[0]`).
- **No real API calls.** All data from mock files via `lib/api/`.
- **Generate all mock data fully** — no empty arrays or placeholders.
- **App must run immediately** with zero errors.
