# Tasks — Labib (Campaign Creation UX · Invitation Lifecycle Redesign)

Derived from `docs/plan.md` (the unified plan). Source of truth chain:
`requirements.md` → `srs.md` → `plan.md` → this file.

**Ownership:** Campaign creation UI/UX improvements and invitation/collaboration lifecycle redesign.
Sakib owns the broader campaign workflow and marketplace UI (`tasks-sakib.md`).
Navid owns matching engine and data (`tasks-navid.md`).

> **Scope summary:** Two major areas.
>
> 1. **Campaign Creation UX** — the intro screen's "Create" button should open a popup modal
>    that lets the brand AI-fill or start from scratch. Step 4 ("Goals & Tracking") should be
>    folded into Step 3 (making the wizard 3 steps total), since all its fields are optional.
>
> 2. **Invitation Lifecycle Redesign** — the concept of "Shortlist" is decoupled from the
>    invitation cycle. Shortlisting is now a pre-invitation bookmark action (available from AI
>    recommendations, manual search, or the creator profile). The formal lifecycle — visible on
>    the Pipeline Kanban — only begins when an invitation is sent and has exactly three phases:
>    **Invited → Negotiation → Accepted**.

## Legend

- `[x]` Done & verified
- `[~]` Partially done / needs verification
- `[ ]` Not started
- `[!]` Broken / needs fix
- `[P]` Can run in parallel with other tasks

---

## Current State (as of 2026-06-08)

| Area | Current behaviour | Required behaviour |
|---|---|---|
| Campaign creation intro | Two cards: "Describe with AI" (inline panel) and "Fill manually" (→ step 1). AI card is toggled, not a popup. | "Create Campaign" button opens a modal with two choices: **"Describe with AI"** → AI autofills then proceeds to form; **"Start from Scratch"** → jumps straight to Step 1. |
| Step 4 "Goals & Tracking" | Separate 4th step with hashtags, tracking notes, KPI targets — all optional | Remove Step 4 as a standalone step. Move its fields into a collapsible / optional sub-section of Step 3 ("Requirements & Budget"). Wizard becomes 3 steps. |
| Pipeline Kanban columns | `Invited | Needs Review | Shortlisted | Accepted` | `Shortlisted` is **not** an invitation phase. Replace with `Invited | Negotiation | Accepted`. |
| Shortlist action | Part of the invitation cycle — transition `pending → shortlisted` in the kanban | Becomes a standalone **bookmark** action on creator cards (AI Matches tab, creator directory, creator profile page). Shortlisted creators appear in a new "Shortlisted" sub-section within the Matches tab (or a dedicated tab), not in the Pipeline Kanban. |
| Invitation trigger | Brands send invites from the ApplicationDrawer or Matches view | Brands send invites **from the Shortlist** (or any creator card). Only after an invite is sent does the creator appear in the Pipeline Kanban. |
| `ApplicationStatus` enum | `invited`, `pending`, `shortlisted`, `accepted`, `rejected`, `pending_agreement`, `declined`, `withdrawn`, `completed` | Add `negotiation` status. `shortlisted` remains in DB for legacy data, but its UX role changes (it no longer appears in the Kanban). |

---

## Workstream L1 — Campaign Creation UX

**Goal:** Reduce cognitive load on the intro screen and eliminate the unnecessary 4th step.

### L1-01 — Campaign creation entry: modal popup instead of inline toggle

**Context:** `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/new/page.tsx`

Currently, `currentStep === 0` renders an intro screen with two card buttons.
The AI option toggles an inline textarea (`aiMode` state). This should instead
open a proper modal Dialog so the brand user sees a clean, focused choice.

**Changes (frontend only — no backend changes needed):**

- [ ] L1-01a Replace the current intro (`currentStep === 0`) with a simple "Create Campaign"
  heading + a single primary `Button` that opens a `<Dialog>` (shadcn/ui).

- [ ] L1-01b Inside the Dialog, render two options:
  - **"Describe with AI"** — description: *"Write what you need in plain language. AI extracts
    the details and pre-fills every field."* On click: show the AI textarea inside the dialog,
    let the user analyze, then on success close the dialog and navigate to `currentStep = 1`
    (form pre-filled).
  - **"Start from Scratch"** — description: *"Step through each field yourself. Full control
    from the start."* On click: close the dialog and set `currentStep = 1` (form blank).

- [ ] L1-01c The AI analysis flow (textarea → Analyze → pre-fill → "Review & edit fields")
  all lives inside the Dialog. When pre-fill is successful, clicking "Review & edit fields"
  closes the Dialog and advances `currentStep` to 1.

- [ ] L1-01d Remove the old two-card `<div className="grid sm:grid-cols-2 gap-4">` and the
  inline AI input panel that lived below it. All that UI moves into the Dialog.

- [ ] L1-01e Update the `STEPS` progress indicator from 4 steps to 3 steps after L1-02 lands
  (or do it in the same PR).

**Files to touch:**
- `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/new/page.tsx`

**Design token reminder:** Use `<Dialog>` from `components/ui/dialog.tsx`. Do not hardcode
any colors — use `--brand-primary`, `--n-*` tokens. See `docs/design-system.md`.

---

### L1-02 — Eliminate Step 4 ("Goals & Tracking") as a standalone step

**Context:** Step 4 currently contains `hashtags`, `tracking_notes`, and `kpi_targets` — all
optional fields. Having a dedicated step for optional-only fields creates unnecessary friction.

**Changes (frontend only):**

- [ ] L1-02a Move the Step 4 fields (Hashtags, Tracking Notes, KPI Targets) into Step 3
  ("Requirements & Budget") as a collapsible "Optional: Goals & Tracking" section.
  Render it after the existing Deliverables carousel.

- [ ] L1-02b Implement the collapsible using a `<details>`/`<summary>` HTML element or a
  local `showGoals` boolean state with a toggle button. Default: collapsed.
  Label: **"+ Add Goals & Tracking (optional)"**.

- [ ] L1-02c Update `STEPS` constant to 3 entries:
  ```ts
  const STEPS = [
    { id: 1, label: "Brief" },
    { id: 2, label: "Strategy" },
    { id: 3, label: "Requirements" },
  ];
  ```

- [ ] L1-02d Update the step indicator eyebrow label: `Campaigns · Step {currentStep} of 3`.

- [ ] L1-02e Update `handleSubmit` — the submit action now fires from Step 3 (previously
  Step 4). The "Continue" button on Step 3 becomes "Create Campaign" (submit). Adjust the
  `currentStep < 3` guard in the navigation row accordingly.

- [ ] L1-02f Remove the `{currentStep === 4 && (...)}` JSX block. The Step 4 content has
  been folded into Step 3 in L1-02a.

**Files to touch:**
- `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/new/page.tsx`

---

## Workstream L2 — Invitation Lifecycle Redesign

**Goal:** Decouple "shortlisting" (bookmark/pre-selection) from the formal invitation cycle.
The Pipeline Kanban should only show creators once an invitation has been sent, and the columns
must reflect the true negotiation lifecycle: Invited → Negotiation → Accepted.

### L2-01 — Backend: add `negotiation` application status

**Context:**
`backend/app/campaigns/models.py` (line 280–285), `backend/app/campaigns/service.py`

The `application_status` PostgreSQL ENUM currently has no `negotiation` value.
Adding it requires an Alembic migration.

- [ ] L2-01a Create Alembic migration `0019_add_negotiation_status.py`:
  ```sql
  ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'negotiation';
  ```
  Migration file in `backend/alembic/versions/`.

- [ ] L2-01b Update `_validate_application_status_transition` in `campaigns/service.py` to
  allow the transition `invited → negotiation` and `negotiation → accepted`. Also allow
  `invited → accepted` (direct fast-path).

  Allowed transitions for the new lifecycle:
  | From | To | Actor |
  |---|---|---|
  | `invited` | `negotiation` | brand (brand opens negotiation) |
  | `invited` | `declined` | creator (creator declines) |
  | `invited` | `accepted` | brand (fast-path accept without negotiation) |
  | `negotiation` | `accepted` | brand |
  | `negotiation` | `rejected` | brand |
  | `negotiation` | `withdrawn` | creator |
  | `accepted` | `completed` | brand/system |

- [ ] L2-01c Update `ApplicationStatusUpdate.status` Pydantic schema in
  `backend/app/campaigns/schemas.py` — add `negotiation` to the allowed set.

- [ ] L2-01d Verify `docker compose ps` and `docker compose logs --tail 50 backend` after
  migration. No startup errors.

**Files to touch:**
- `backend/alembic/versions/0019_add_negotiation_status.py` *(new)*
- `backend/app/campaigns/service.py`
- `backend/app/campaigns/schemas.py`

---

### L2-02 — Frontend types: add `negotiation` to `ApplicationStatus`

**Context:** `frontend/cohesiq-v0/lib/types.ts` line 3.

- [ ] L2-02a Add `"negotiation"` to the `ApplicationStatus` union type:
  ```ts
  export type ApplicationStatus =
    | "invited" | "declined" | "pending" | "shortlisted"
    | "negotiation" | "pending_agreement"
    | "accepted" | "rejected" | "withdrawn" | "completed";
  ```

- [ ] L2-02b Update `ApplicationStatusBadge.tsx` (`components/application/ApplicationStatusBadge.tsx`)
  to render a label and color for `"negotiation"` status. Suggested: amber/orange badge,
  label **"Negotiating"**.

**Files to touch:**
- `frontend/cohesiq-v0/lib/types.ts`
- `frontend/cohesiq-v0/components/application/ApplicationStatusBadge.tsx`

---

### L2-03 — Frontend: Redesign Pipeline Kanban columns

**Context:** `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/_components/CampaignDetailClient.tsx` (lines 44–49).

Currently:
```ts
const PIPELINE_COLUMNS = [
  { key: "invited",     label: "Invited",      statuses: ["invited"] },
  { key: "pending",     label: "Needs Review", statuses: ["pending"] },
  { key: "shortlisted", label: "Shortlisted",  statuses: ["shortlisted"] },
  { key: "accepted",    label: "Accepted",     statuses: ["accepted", "completed"] },
];
```

**Required changes:**

- [ ] L2-03a Replace `PIPELINE_COLUMNS` with the new 3-column lifecycle:
  ```ts
  const PIPELINE_COLUMNS = [
    { key: "invited",     label: "Invited",     dot: "bd-kanban-dot-invited",     statuses: ["invited"] as ApplicationStatus[] },
    { key: "negotiation", label: "Negotiation", dot: "bd-kanban-dot-pending",     statuses: ["negotiation", "pending", "pending_agreement"] as ApplicationStatus[] },
    { key: "accepted",    label: "Accepted",    dot: "bd-kanban-dot-accepted",    statuses: ["accepted", "completed"] as ApplicationStatus[] },
  ];
  ```
  > Note: `pending` and `pending_agreement` are mapped to the "Negotiation" column because
  > they represent the brand-creator back-and-forth phase in the legacy flow. They must not
  > disappear from the UI.

- [ ] L2-03b Remove the `Shortlisted` column from the Pipeline Kanban entirely.
  Applications with `status === "shortlisted"` are legacy data — show them in the "Negotiation"
  column as a safe fallback OR exclude them from the Pipeline and display a note in the Matches
  tab instead. Decision: fold `"shortlisted"` into the Negotiation column temporarily.

- [ ] L2-03c Update the empty-state copy on the Pipeline tab to reflect the new lifecycle:
  ```
  "No activity yet. Go to Matches to find creators, shortlist them, and send invitations."
  ```

**Files to touch:**
- `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/_components/CampaignDetailClient.tsx`

---

### L2-04 — Frontend: Shortlist action on creator cards (bookmark UX)

**Goal:** The brand should be able to "shortlist" (bookmark) any creator independently of
any campaign, or within a specific campaign's context from the Matches tab. Shortlisting does
**not** send an invitation — it only marks the creator for easy retrieval before deciding to invite.

#### L2-04a — Shortlist button on Match cards (Matches tab in campaign detail)

**Context:** `CampaignDetailClient.tsx` lines 374–418 (match card row).

> ⚠️ **Architecture rule:** `CampaignDetailClient.tsx` is a `"use client"` component.
> All mutations (add / remove shortlist) **must** go through a Server Action colocated in
> `_actions/campaign-actions.ts`. Do **not** call `fetchApi()` directly from the client component.
> Follow the same pattern as `inviteCreatorAction` and `updateApplicationStatusAction` in
> the existing `_actions/campaign-actions.ts`.

- [ ] Add a `Bookmark` / `Star` icon button to each match card. On click, optimistically
  update local state (mark creator as shortlisted), then call `addToShortlistAction`
  (a new Server Action — see L2-06). Toggle is idempotent.

- [ ] Show a filled bookmark icon when the creator is already shortlisted; outline if not.

#### L2-04b — Shortlist button on creator cards in the brand creator directory

**Context:** `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/creators/_components/`
(BrandCreatorsClient or equivalent creator card component).

> Same architecture rule applies: this is a client island. Shortlist mutations must call
> a Server Action, not `fetchApi()` directly.

- [ ] Add a contextual "Shortlist for campaign" action — a button that opens a small popover
  letting the brand pick which active campaign to shortlist for (campaign-scoped approach).
  On selection, call `addToShortlistAction(campaignId, creatorId)` (Server Action).

#### L2-04c — "Shortlisted Creators" section in the Matches tab

- [ ] Inside the campaign detail Matches tab, add a **"Shortlisted"** section above the AI
  Recommendations list. The initial `shortlistedCreators` array is fetched **server-side**
  in `campaigns/[id]/page.tsx` (Server Component) and passed as a prop to
  `CampaignDetailClient` — never fetched inside the client component itself.

- [ ] Each shortlisted creator card shows: avatar, name, niche, and two CTA buttons:
  **"Invite"** and **"Remove from shortlist"**.
  - "Invite" → calls `inviteCreatorAction` (already exists in `_actions/campaign-actions.ts`).
  - "Remove" → calls `removeFromShortlistAction` (new Server Action, see L2-06).

- [ ] After inviting, move the creator from the shortlist section into the Pipeline Kanban
  optimistically (local state update).

**Files to touch:**
- `campaigns/[id]/page.tsx` — fetch shortlist server-side, pass as prop
- `CampaignDetailClient.tsx` — accept `initialShortlist` prop, Matches tab section
- `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/creators/_components/` — creator card

---

### L2-05 — Backend: Campaign shortlist endpoints

**Goal:** Persist shortlist entries — `(campaign_id, creator_id)` — as a lightweight bookmark
table, separate from `campaign_applications`.

> ⚠️ **Schema decision required.** Before writing the migration, read `docs/schema.md` and
> verify there is no existing shortlist mechanism. If there is, adapt to it instead of adding
> a new table.

- [ ] L2-05a **If no shortlist table exists:** Create migration `0020_add_campaign_shortlist.py`
  adding a `campaign_shortlist` table:
  ```sql
  CREATE TABLE campaign_shortlist (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      creator_id  UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
      added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (campaign_id, creator_id)
  );
  ```

- [ ] L2-05b Add SQLAlchemy model `CampaignShortlist` in `backend/app/campaigns/models.py`.

- [ ] L2-05c Add service functions in `backend/app/campaigns/service.py`:
  - `add_to_shortlist(db, campaign_id, creator_id, brand_id) → CampaignShortlist`
  - `remove_from_shortlist(db, campaign_id, creator_id, brand_id) → None`
  - `list_shortlisted_creators(db, campaign_id, brand_id) → List[CampaignShortlist]`

- [ ] L2-05d Add Pydantic schemas in `backend/app/campaigns/schemas.py`:
  - `ShortlistEntry` (out schema with creator nested)

- [ ] L2-05e Add endpoints in `backend/app/campaigns/router.py`:
  - `POST /campaigns/{campaign_id}/shortlist` — add creator to shortlist
  - `DELETE /campaigns/{campaign_id}/shortlist/{creator_id}` — remove
  - `GET /campaigns/{campaign_id}/shortlist` — list shortlisted creators

- [ ] L2-05f Update `docs/schema.md` with the new `campaign_shortlist` table.

**Files to touch:**
- `backend/alembic/versions/0020_add_campaign_shortlist.py` *(new)*
- `backend/app/campaigns/models.py`
- `backend/app/campaigns/service.py`
- `backend/app/campaigns/schemas.py`
- `backend/app/campaigns/router.py`
- `docs/schema.md`

---

### L2-06 — Frontend: shortlist API helper + Server Actions

> **Architecture split — read vs. mutation:**
>
> | Operation | Where it lives | Called by |
> |---|---|---|
> | `listShortlist` (GET) | `lib/api/campaigns.ts` — `fetchApi()` helper | Server Component (`campaigns/[id]/page.tsx`) using `BACKEND_API_URL` |
> | `addToShortlist` (POST) | `_actions/campaign-actions.ts` — Server Action | `CampaignDetailClient` and creator card client islands via `startTransition` |
> | `removeFromShortlist` (DELETE) | `_actions/campaign-actions.ts` — Server Action | Same client islands |
>
> **Never** import `addToShortlist` / `removeFromShortlist` directly from `lib/api/` into a
> `"use client"` component. Always wrap mutations in a `"use server"` action.

#### L2-06a — Read helper in `lib/api/campaigns.ts`

- [ ] Add one function using `fetchApi()` (never raw fetch):
  ```ts
  // Called server-side only — token comes from auth() in the Server Component
  listShortlist(campaignId: string, token: string): Promise<ShortlistEntry[]>
  ```

#### L2-06b — Mutation helpers in `lib/api/campaigns.ts` (server-side only)

- [ ] Add two **internal** helpers (used exclusively by Server Actions — not exported for
  client use):
  ```ts
  addToShortlist(campaignId: string, creatorId: string, token: string): Promise<ShortlistEntry>
  removeFromShortlist(campaignId: string, creatorId: string, token: string): Promise<void>
  ```

#### L2-06c — Server Actions in `_actions/campaign-actions.ts`

- [ ] Add two Server Actions (follow the exact pattern of `inviteCreatorAction`):
  ```ts
  "use server";
  // ...
  export async function addToShortlistAction(campaignId: string, creatorId: string) {
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) return { success: false, error: "Unauthorized" };
    try {
      const entry = await addToShortlist(campaignId, creatorId, token);
      revalidatePath(`/brand/dashboard/campaigns/${campaignId}`);
      return { success: true, entry };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed" };
    }
  }

  export async function removeFromShortlistAction(campaignId: string, creatorId: string) {
    // same pattern
  }
  ```

- [ ] Add `ShortlistEntry` type to `frontend/cohesiq-v0/lib/types.ts`.

**Files to touch:**
- `frontend/cohesiq-v0/lib/api/campaigns.ts` — read helper + internal mutation helpers
- `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/_actions/campaign-actions.ts` — two new Server Actions
- `frontend/cohesiq-v0/lib/types.ts` — `ShortlistEntry` type

---

### L2-07 — Frontend: ApplicationDrawer actions for new lifecycle

**Context:** `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/_components/ApplicationDrawer.tsx`

Currently the drawer shows Shortlist / Accept / Reject buttons based on `canShortlist`/`canAccept`/`canReject`.

- [ ] L2-07a Replace the `canShortlist` guard and "Shortlist" button with a
  **"Start Negotiation"** button that transitions the application from `invited` → `negotiation`.

- [ ] L2-07b For applications already in `negotiation` status, show: **"Accept"** (→ `accepted`)
  and **"Reject"** (→ `rejected`) buttons.

- [ ] L2-07c For applications in `invited` status, show: **"Start Negotiation"** and
  **"Accept directly"** (fast-path) and **"Reject"**.

- [ ] L2-07d Update `canShortlist`, `canAccept`, `canReject` logic accordingly.

- [ ] L2-07e Remove any references to `"shortlisted"` as a status transition that the brand
  triggers from this drawer (shortlisting now happens from the Matches/creator card, not here).

**Files to touch:**
- `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/_components/ApplicationDrawer.tsx`

---

## Workstream L3 — Post-MVP / Later

> These items are out of scope for the current sprint but should be tracked here.

- [ ] L3-01 Notification / badge when a creator responds to an invitation (moves to
  `pending` or `declined`) — blocked on real-time or polling infrastructure.
- [ ] L3-02 Negotiation message thread inside the drawer (chat-like history of rate proposals
  between brand and creator). Needs a `negotiation_messages` table.
- [ ] L3-03 Creator-side view of the shortlist / invitation (creator sees incoming invites
  with "Accept" / "Decline" — already partially exists via `respond_invite` endpoint).
- [ ] L3-04 Bulk-invite from shortlist (select multiple shortlisted creators and send
  invitations in one action).

---

## Cross-team Handoffs

| Labib task | Needs from | Why |
|---|---|---|
| L2-03 Kanban columns | Sakib (confirm `bd-kanban-dot-*` CSS class names) | CSS token for new "negotiation" dot color must align with brand.css |
| L2-05 Backend schema | Read `docs/schema.md` first | Confirm no pre-existing shortlist mechanism before creating new table |
| L2-01 Migration | Run `docker compose ps` after migration | Verify Alembic applies cleanly and backend starts healthy |

---

## Verification Checklist (run after each workstream)

1. `docker compose ps` — all containers healthy.
2. `docker compose logs --tail 50 backend` — no startup or migration errors.
3. Campaign creation wizard: verify 3-step progress bar, modal popup, no Step 4.
4. Campaign detail → Pipeline tab: verify 3 kanban columns (Invited, Negotiation, Accepted), no Shortlist column.
5. Campaign detail → Matches tab: verify Shortlisted section appears, Invite button sends invite to Pipeline.
6. ApplicationDrawer: verify "Start Negotiation" replaces "Shortlist" button.
7. Run `graphify update .` after backend model changes to keep the knowledge graph current.
