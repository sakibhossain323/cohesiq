# Tasks — Sakib (Brand & Creator Marketplace · Campaign Workflow · UI)

Derived from `docs/plan.md` (the unified plan). Source of truth chain:
`requirements.md` → `srs.md` → `plan.md` → this file.

**Ownership:** the brand/creator marketplace UI and campaign workflow. Navid owns YouTube
ingestion, the matching engine internals, semantic/LLM services, and seeding (`tasks-navid.md`).

> **Workstream phases ≠ plan phases.** The `A/B/C/D` headings below are *Sakib's local
> workstream* and predate the unified plan. They map onto `docs/plan.md` phases as:
>
> | This file | Plan phase | Theme |
> |---|---|---|
> | Workstream A (A01–A11) | Plan Phase B | Campaign type + creation wizard |
> | Workstream B (B01–B07) | Plan Phase B | Campaign management Kanban |
> | Workstream C (C01–C03) | Plan Phase C/D | Analytics & ROI |
> | Workstream D (D01–D05) | Plan Phase D | Quality-of-life / AI features |
>
> The two type taxonomies (`campaign_type` vs `collaboration_type`) are intentionally
> distinct — see `docs/plan.md` §3.1. Do not merge them.

## Legend

- `[x]` Done & verified
- `[~]` Partially done / needs verification or testing
- `[ ]` Not started
- `[!]` Broken / needs fix
- `[P]` Can run in parallel with other tasks in the same phase

---

## Deliverables Status

| Artifact | Status | Location |
|---|---|---|
| `campaign_type` PostgreSQL enum | `[x]` | migration `0013_add_campaign_type_and_kpis.py` |
| `kpi_targets`, `hashtags`, `tracking_notes` DB columns | `[x]` | same migration |
| `Campaign` SQLAlchemy model — new columns | `[x]` | `backend/app/campaigns/models.py` — `campaign_type` (ENUM), `kpi_targets` (JSONB), `hashtags` (ARRAY(Text)), `tracking_notes` (Text) added |
| `CampaignCreate` / `CampaignUpdate` / `CampaignOut` schemas | `[x]` | `backend/app/campaigns/schemas.py` — all four fields + `KpiTargets` sub-schema added |
| `CampaignType` TS type + `KpiTargets` interface | `[x]` | `lib/types.ts` |
| `CampaignTypeBadge` component | `[x]` | `campaigns/_components/CampaignTypeBadge.tsx` |
| Type column in campaign list | `[x]` | `campaigns/page.tsx` |
| 4-step campaign creation wizard | `[~]` | `campaigns/new/page.tsx` — UI built; `campaign_type` silently dropped by backend until A03/A04 fixed |
| `mapCampaignResponse` explicit field mapping | `[x]` | `lib/api/campaigns.ts` |
| Application review drawer | `[x]` | `campaigns/[id]/_components/ApplicationDrawer.tsx` — imported and wired in `CampaignDetailClient.tsx` via `selectedApp` state |
| Kanban with clickable cards | `[x]` | `CampaignDetailClient.tsx` |
| Active Contracts tab | `[x]` | `CampaignDetailClient.tsx` — wired to `localApplications.filter(a => a.status === 'accepted' || a.status === 'completed')` |
| `updateApplicationStatusAction` server action | `[x]` | `_actions/campaign-actions.ts` |
| ROI Summary stats card (C01) | `[x]` | `brand/dashboard/page.tsx` |
| Campaign Overview panel | `[x]` | `brand/dashboard/page.tsx` |

---

## Phase A — Campaign Type + Creation Wizard

**Goal:** Replace minimal single-page form with a 4-step wizard capturing all data needed for accurate matching.

[x] A01 Add `campaign_type` PostgreSQL enum (6 values: `paid_content`, `product_gifting`, `affiliate`, `brand_ambassador`, `talent_booking`, `ugc_only`)

[x] A02 Alembic migration `0013_add_campaign_type_and_kpis.py` — adds `campaign_type`, `kpi_targets JSONB`, `hashtags TEXT[]`, `tracking_notes TEXT`

[x] A03 Update `Campaign` SQLAlchemy model — added `campaign_type` (ENUM), `kpi_targets` (JSONB), `hashtags` (ARRAY(Text)), `tracking_notes` (Text) to `backend/app/campaigns/models.py`. Also added JSONB import.

[x] A04 Update Pydantic schemas — added `KpiTargets` sub-schema; added all four fields to `CampaignCreate`, `CampaignUpdate`, `CampaignOut` in `backend/app/campaigns/schemas.py`. Service `create_campaign` updated to map the new fields; `kpi_targets` serialised via `.model_dump()` before JSONB write.

[x] A05 Add `CampaignType` and `KpiTargets` to `lib/types.ts`

[x] A06 Create `CampaignTypeBadge` component

[x] A07 Add Type column to campaign list page

[x] A08 Fix: `<SelectItem value="">` crash — Radix Select rejects empty string values; replaced with `"any"` sentinel and mapped back to `""` before submit

[x] A09 Wizard end-to-end verification — campaign creation form now includes `campaign_type`, `hashtags`, `tracking_notes`, `kpi_targets`; DB confirmed `campaign_type` persists correctly (verified via psql). Deliverable rows not applicable (no `campaign_deliverable_requirements` table in current schema).

[x] A10 [P] Pass `campaign_type` through `mapCampaignResponse` in `lib/api/campaigns.ts` so it appears on the `Campaign` object from all API calls

[x] A11 Update edit form (`campaigns/[id]/edit/page.tsx`) — added "Campaign Type & Goals" card with campaign_type select, hashtags input, tracking_notes textarea, and KPI targets grid (reach, engagement_rate, conversions, roi_target). Load/save fully wired.

---

## Phase B — Campaign Management Kanban

**Goal:** Brand can manage all applications for a campaign from a single Kanban view instead of a flat table.

[x] B01 Kanban in `CampaignDetailClient.tsx`: columns = Invited | Needs Review | Shortlisted | Accepted — cards are clickable

[x] B02 Application review side-drawer — `ApplicationDrawer` imported and rendered in `CampaignDetailClient.tsx`; opens on `ApplicationCard` click via `selectedApp` state.

[x] B03 Accept / Shortlist / Reject controls — fully reachable: drawer calls `updateApplicationStatusAction`; `handleAppStatusChange` updates `localApplications` optimistically so Kanban columns reorder instantly.

[x] B04 Rejection reason textarea — reachable via drawer's reject flow; `showRejectForm` state + textarea wired to `handleAction("rejected", reason)`.

[x] B05 Active Contracts tab — badge and list now wired to `localApplications.filter(a => a.status === 'accepted' || a.status === 'completed')`. Sent Invitations tab also wired to `initiated_by === 'brand'`.

[x] B06 [P] Wire reviews to real data — `lib/api/reviews.ts` now calls `GET /creators/{id}/reviews` and `GET /brands/{id}/reviews`; `Review` type in `lib/types.ts` updated to match backend schema; `CreatorDetailView` uses `getCreatorReviews(creatorId)` directly. Also added missing `updateApplicationStatusAction` server action and `updateApplicationStatus` API function (these were imported by `ApplicationDrawer` but didn't exist).

[x] B07 Wire `ApplicationDrawer` into Kanban — closes B02–B05:
  - Import `ApplicationDrawer` into `CampaignDetailClient.tsx`
  - Open it on `ApplicationCard` click (pass the selected `app` as prop)
  - Drawer triggers `updateApplicationStatusAction` for Shortlist/Accept/Reject (B03)
  - Drawer exposes rejection reason textarea (B04)
  - Wire Active Contracts tab to filter `applications` by `status === 'accepted' || 'completed'` (B05)

---

## Phase C — Analytics & ROI

[x] C01 ROI Summary Card on brand homepage: Active Campaigns · Pending Applications · Budget Committed · Estimated Reach + Campaign Overview panel with budget by type

[x] C02 Per-campaign analytics: Analytics tab added to campaign detail — Day 7/14/30 engagement snapshot cards (reach, views, engagements), KPI targets panel, budget efficiency card. All figures labelled `EstimatedTag`. Info banner explains real data pending Navid N10. Component: `CampaignAnalyticsTab.tsx`.

[x] C03 Creator performance comparison — `CreatorPerformanceComparison.tsx` renders a sortable table (by agreed rate desc) in the Active Contracts tab when 2+ creators are accepted. Columns: Creator (with TOP badge on highest rate), Niche, Followers, Proposed Rate, Agreed Rate (with "saved" diff), Deliverables, Status. Hidden when fewer than 2 active contracts.

[x] C04 Matching sub-score bars — added `score_platform`, `score_recency`, `score_semantic` to `ai_match_scores` DB model (migration 0014), Pydantic schema, service persist call, `AIMatchScore` TS type, and `MatchesClient.tsx`. Platform Fit and Recency bars always shown; Semantic Similarity bar shown only when score > 0 (i.e. semantic boost was used).

---

## Cross-team handoffs (Sakib ↔ Navid)

| Sakib task | Needs from Navid | Why |
|---|---|---|
| Render six match-score bars (`MatchesClient.tsx`) | N04 (persist platform/recency/semantic/rank to `ai_match_scores`) | FR-10 needs all six sub-score dimensions; currently only niche/engagement/budget/language stored |
| D01 Authenticity Auditor (UI) | N06 (Trust Score backend) | UI renders the score Navid computes |
| C02 per-campaign analytics | N01/N02 (real YouTube data) | real reach/engagement vs estimated |
| B06 reviews wiring | backend `GET /creators/{id}/reviews` shape | confirm endpoint response shape before wiring |

---

## Phase D — Quality-of-Life Features

[x] D06 Fee simulation (FR-19 / D11) — `lib/campaignFees.ts` defines fee % per campaign_type (paid_content 15%, product_gifting 10%, affiliate 8%, brand_ambassador 12%, talent_booking 18%, ugc_only 10%); campaign list table shows fee % column; campaign detail "Details" tab shows a 3-cell fee breakdown card (Budget → Platform Fee → Net to Creator). No real payment rail.

[x] D07 Profile-strength meter (FR-5) — `lib/profileStrength.ts` computes a 0–100 score from 9 weighted checklist items (photo, bio, tagline, city, niche, language, social profile linked, follower stats, rate card); `components/creator/ProfileStrengthMeter.tsx` renders a color-coded progress bar (Starter/Rising/Pro/Elite), completion %, and up to 3 actionable "next steps" tips. Shown in the creator dashboard sidebar.

[x] D08 Ethical-AI tags (US-19) — `components/shared/EstimatedTag.tsx` renders a tooltip-enabled pill in three variants: "Self-reported" (amber), "Estimated" (blue), "AI-scored" (purple). Applied to: engagement rate + avg views in `SocialProfileCard`; engagement rate in `CreatorCard`; Overall Match score and Engagement Strength bar in `MatchesClient`.

[x] D01 Authenticity Auditor (UI) — `AuthenticityBadge` component renders 0–100 score pill (green/amber/orange/red tiers) with flag labels and tooltip. Shows "Trust: Pending" when `trust_score` is undefined. Added to `CreatorCard` and `CreatorProfileHeader`. `trust_score?: number` added to `Creator` TS type. Wires to Navid N06 when backend lands.

[x] D02 AI Brief Analyzer — collapsible `BriefAnalyzerCard` on create campaign form; Server Action `analyzeBriefAction` calls Gemini 1.5 Flash REST API with structured JSON output; pre-fills campaign_type, niche, budget, creators, min_followers, hashtags, tracking_notes, kpi_targets. No Navid dependency — fully independent.

[x] D03 Budget & ROI Calculator — page at `/brand/dashboard/campaigns/roi-calculator`; inputs: total budget + product value (BDT); outputs: per-tier (nano/micro/macro/mega) creator count, estimated reach, engagements, conversions, revenue, and projected ROI %. Zero API calls. Linked from campaigns list header.

[x] D04 Rate Card Benchmark Widget — Server Component at `/brand/dashboard/campaigns/rate-benchmark`; fetches `/creators/?limit=200`, groups rate cards by `platform||deliverable_type||tier`, computes median/min/max per group; `RateBenchmarkClient` renders filterable table with tier dot, price range, and sample count. Linked from campaigns list header.

[x] D05 Creator Comparison Tool — Server Component at `/brand/dashboard/creators/compare`; reads `?ids=` param, fetches up to 3 creators in parallel via `getCreatorById`; `CompareClient` renders side-by-side CSS grid (Rating, Collaborations, Available, Platforms, Min Rate, Rate Cards, Niches rows) plus AI brief textarea (placeholder pending N05). Selection UI (checkbox overlay + sticky compare bar) added to `BrandCreatorsClient`; JSX parse error fixed by wrapping return in Fragment.
