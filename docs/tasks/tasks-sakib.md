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
| `Campaign` SQLAlchemy model — new columns | `[!]` | `backend/app/campaigns/models.py` — **missing `campaign_type`, `kpi_targets`, `hashtags`, `tracking_notes`** despite DB columns existing |
| `CampaignCreate` / `CampaignUpdate` / `CampaignOut` schemas | `[!]` | `backend/app/campaigns/schemas.py` — same four fields absent |
| `CampaignType` TS type + `KpiTargets` interface | `[x]` | `lib/types.ts` |
| `CampaignTypeBadge` component | `[x]` | `campaigns/_components/CampaignTypeBadge.tsx` |
| Type column in campaign list | `[x]` | `campaigns/page.tsx` |
| 4-step campaign creation wizard | `[~]` | `campaigns/new/page.tsx` — UI built; `campaign_type` silently dropped by backend until A03/A04 fixed |
| `mapCampaignResponse` explicit field mapping | `[x]` | `lib/api/campaigns.ts` |
| Application review drawer | `[!]` | `campaigns/[id]/_components/ApplicationDrawer.tsx` — **built but not imported in `CampaignDetailClient.tsx`** |
| Kanban with clickable cards | `[x]` | `CampaignDetailClient.tsx` |
| Active Contracts tab | `[~]` | `CampaignDetailClient.tsx` — tab renders, badge hardcoded 0, not wired to real accepted applications |
| `updateApplicationStatusAction` server action | `[x]` | `_actions/campaign-actions.ts` |
| ROI Summary stats card (C01) | `[x]` | `brand/dashboard/page.tsx` |
| Campaign Overview panel | `[x]` | `brand/dashboard/page.tsx` |

---

## Phase A — Campaign Type + Creation Wizard

**Goal:** Replace minimal single-page form with a 4-step wizard capturing all data needed for accurate matching.

[x] A01 Add `campaign_type` PostgreSQL enum (6 values: `paid_content`, `product_gifting`, `affiliate`, `brand_ambassador`, `talent_booking`, `ugc_only`)

[x] A02 Alembic migration `0013_add_campaign_type_and_kpis.py` — adds `campaign_type`, `kpi_targets JSONB`, `hashtags TEXT[]`, `tracking_notes TEXT`

[!] A03 Update `Campaign` SQLAlchemy model — `campaign_type`, `kpi_targets`, `hashtags`, `tracking_notes` mapped columns are **absent** from `backend/app/campaigns/models.py`. The DB columns exist (A02 applied) but the ORM ignores them; all four values are silently dropped on every campaign create/update. Add all four fields using `JSONB`, `ARRAY(Text)`, etc., mirroring what migration 0013 added.

[!] A04 Update Pydantic schemas — `CampaignCreate`, `CampaignUpdate`, `CampaignOut` in `backend/app/campaigns/schemas.py` are also missing these four fields. Fix A03 first, then:
  - Add `KpiTargets` sub-schema (reach, engagement_rate, conversions, roi_target)
  - Add `campaign_type: Optional[str]`, `kpi_targets: Optional[KpiTargets]`, `hashtags: List[str]`, `tracking_notes: Optional[str]` to all three schemas

[x] A05 Add `CampaignType` and `KpiTargets` to `lib/types.ts`

[x] A06 Create `CampaignTypeBadge` component

[x] A07 Add Type column to campaign list page

[x] A08 Fix: `<SelectItem value="">` crash — Radix Select rejects empty string values; replaced with `"any"` sentinel and mapped back to `""` before submit

[~] A09 Wizard end-to-end verification — **blocked on A03/A04**
  - [ ] Fix A03/A04 first (model + schema must expose the four new fields)
  - [ ] Create campaign through all 4 steps → verify `campaign_type` saved to DB correctly
  - [ ] Verify `kpi_targets` JSONB round-trips correctly
  - [ ] Verify `hashtags[]` stored and returned correctly
  - [ ] Verify deliverable rows saved to `campaign_deliverable_requirements`
  - [ ] Verify campaign appears in brand list with correct type badge

[x] A10 [P] Pass `campaign_type` through `mapCampaignResponse` in `lib/api/campaigns.ts` so it appears on the `Campaign` object from all API calls

[ ] A11 Update edit form (`campaigns/[id]/edit/page.tsx`) to include campaign type + KPI targets + hashtags + tracking notes at parity with the creation wizard (currently only has title, description, visibility, budget, followers, deadline)

---

## Phase B — Campaign Management Kanban

**Goal:** Brand can manage all applications for a campaign from a single Kanban view instead of a flat table.

[x] B01 Kanban in `CampaignDetailClient.tsx`: columns = Invited | Needs Review | Shortlisted | Accepted — cards are clickable

[!] B02 Application review side-drawer — `ApplicationDrawer.tsx` exists at `campaigns/[id]/_components/ApplicationDrawer.tsx` but is **not imported or rendered** in `CampaignDetailClient.tsx`. The current Kanban card is a read-only inline `ApplicationCard` component (defined at bottom of the file) with only "View Profile" link — no drawer opens on click.

[!] B03 Accept / Shortlist / Reject controls — **unreachable from Kanban** because B02 is not wired. `updateApplicationStatusAction` server action is correct and ready; it just needs to be called from within the drawer once B02 is connected.

[!] B04 Rejection reason textarea — same as B03: the textarea and logic exist but cannot be reached from the current Kanban card UI.

[~] B05 Active Contracts tab — tab UI renders inside `CampaignDetailClient.tsx` but shows an empty placeholder (badge count hardcoded to 0). Not yet filtered from real `accepted`/`completed` applications.

[ ] B06 [P] Wire reviews to real data — replace placeholders in `lib/api/reviews.ts` with `GET /creators/{id}/reviews` and `GET /brands/{id}/reviews`

[ ] B07 Wire `ApplicationDrawer` into Kanban — this single task closes B02–B05:
  - Import `ApplicationDrawer` into `CampaignDetailClient.tsx`
  - Open it on `ApplicationCard` click (pass the selected `app` as prop)
  - Drawer triggers `updateApplicationStatusAction` for Shortlist/Accept/Reject (B03)
  - Drawer exposes rejection reason textarea (B04)
  - Wire Active Contracts tab to filter `applications` by `status === 'accepted' || 'completed'` (B05)

---

## Phase C — Analytics & ROI

[x] C01 ROI Summary Card on brand homepage: Active Campaigns · Pending Applications · Budget Committed · Estimated Reach + Campaign Overview panel with budget by type

[ ] C02 Per-campaign analytics: engagement snapshots at Day 7 / 14 / 30 after publish — **depends on Navid N01/N02** (persisted YouTube data) for real numbers; until then, render estimated/labelled placeholders

[ ] C03 Creator performance comparison across accepted creators per campaign

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

[ ] D01 Authenticity Auditor (UI) — inline 0–100 trust score on creator cards with flag labels + explanation tooltip. **Backend = Navid N06**; this task is the card UI only.

[ ] D02 AI Brief Analyzer — brand pastes free-text description; Gemini pre-fills wizard fields (campaign type, niche, budget range, KPI targets). Maps to SRS FR-8 / US-14. Coordinate the Gemini call with Navid N05.

[ ] D03 Budget & ROI Calculator — pure frontend widget: budget input → creator tiers affordable + estimated reach + projected ROI (zero API calls)

[ ] D04 Rate Card Benchmark Widget — median rates by tier + niche (reads `creator_rate_cards`)

[ ] D05 Creator Comparison Tool — side-by-side 2–3 creators with Gemini recommendation for the brand's specific brief
