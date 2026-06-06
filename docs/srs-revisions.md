# SRS Revisions — Contract Entity Change Request

**Date:** 2026-06-06
**Author:** Sakib
**Status:** Approved
**Affects:** `docs/srs.md` §6 (Campaign), §8 (User Stories US-5, US-10, US-16), §9.2 (ER Diagram)

> This document records intentional divergences from the original SRS. Per the doc hierarchy in `docs/plan.md` §0, the SRS is not silently edited — all changes are captured here and referenced from the SRS.

---

## 1. Change Request Summary

The original SRS placed `collaboration_type` (six values: paid, booking, gifting, affiliate, hybrid, ambassador) on the **Campaign** entity. This is architecturally wrong:

- A campaign is a brand's *intent* — a job posting expressing what they need, from whom, and for how much.
- A collaboration type describes a *bilateral agreement* between two specific parties after negotiation.

Putting type on Campaign forces the brand to commit to an engagement structure before they even know which creator they'll work with — the wrong order of operations. It also means the six "types" had wildly different legal and operational implications collapsed into a single field with no structured clause data.

**This change introduces `Contract` as a first-class entity** that:
- Absorbs the engagement type (now three engagement-nature-based types, not six marketing-label types)
- Owns all clause data as structured fields (not free text)
- Owns the full execution state machine (removing the black box between `accepted` and `completed`)

Campaign becomes type-agnostic. Its `campaign_type` column is made nullable (not dropped, for backward compat).

---

## 2. Revised Personas

### Persona 1 — Rasha (Primary Brand Persona)

| Attribute | Detail |
|---|---|
| **Name** | Rasha Ahmed |
| **Role** | Marketing Manager, mid-size Dhaka fashion SME |
| **Campaigns** | 2–3 influencer campaigns per month, BDT 15,000–50,000 each |
| **Technical comfort** | Moderate — uses Instagram Business, Google Sheets, WhatsApp |
| **Core pain** | Spends hours negotiating on WhatsApp, gets ghosted after sending products, has no proof of delivery, no contract, no recourse |
| **Need** | A structured platform where deal terms are locked before work begins, payment is protected, and she can track progress without chasing |
| **Success metric** | Goes from campaign idea to contracted creator in under 30 minutes; never wonders "did they post it?" |

### Persona 2 — Arif (Primary Creator Persona)

| Attribute | Detail |
|---|---|
| **Name** | Arif Hossain |
| **Role** | Micro-creator, 25K Instagram followers, fashion/lifestyle niche |
| **Income from collabs** | BDT 8,000–20,000/month supplemental |
| **Technical comfort** | High on social apps; low on formal business tools |
| **Core pain** | Brands promise payment and ghost; deliverable expectations are unclear; no way to know if a brand is legitimate |
| **Need** | Clear deliverable list, payment locked before he starts work, a professional workflow that doesn't require WhatsApp negotiation |
| **Success metric** | Sees exactly what he must deliver and when, knows payment is held securely, receives it automatically on approval |

### Persona 3 — Zara (Growth Brand Persona)

| Attribute | Detail |
|---|---|
| **Name** | Zara Chowdhury |
| **Role** | Head of Growth, established D2C brand (5+ campaigns/month) |
| **Technical comfort** | High — uses project management tools, familiar with SaaS workflows |
| **Core pain** | Managing 10+ creator relationships manually is chaos; no standardized terms, no performance tracking, no repeatable workflow |
| **Need** | Contract templates, bulk pipeline management, per-campaign ROI rollup |
| **Success metric** | Runs 5 simultaneous campaigns from one dashboard with no WhatsApp |

---

## 3. Revised & New User Stories

User stories follow the **INVEST** principles:
- **I**ndependent — each story delivers value without requiring another story to be complete
- **N**egotiable — implementation detail left to the team; only the outcome is specified
- **V**aluable — each story has a named user who benefits
- **E**stimable — acceptance criteria make effort assessable
- **S**mall — each fits within a single sprint
- **T**estable — acceptance criteria are verifiable

---

### US-5 (Revised) — Brand Creates a Campaign

**Original:** "As a brand, I create a campaign through a 4-step wizard with a BDT budget and a collaboration type."

**Revised story:**
> As **Rasha (brand)**, I want to create a campaign by specifying a brief, budget, talent requirements, and visibility setting — without committing to an engagement type — so that I can attract the right creators and decide on engagement terms only after I've chosen who I want to work with.

**Acceptance criteria:**
- [ ] Campaign creation wizard has no "campaign type" step
- [ ] Wizard includes a Visibility selector: **Public** (open applications, any qualifying creator can apply) or **Private** (brand hand-picks and invites specific creators)
- [ ] Required fields: title, description, budget_per_creator_max, required_platforms, visibility
- [ ] Optional fields: niche targets, language targets, deliverable requirements, follower range, application deadline, content deadline, KPI targets, hashtags, tracking notes
- [ ] AI Brief Analyzer (D02) still pre-fills the form from a natural language description
- [ ] Campaign is saved without a type — type is determined at contract creation
- [ ] Public campaigns appear in the public marketplace and creator discovery feed
- [ ] Private campaigns are not discoverable; only explicitly invited creators can see them

**Size estimate:** M (3 story points)

---

### US-5a (New) — Brand Creates a Contract After Accepting a Creator

> As **Rasha (brand)**, I want to define a Contract immediately after accepting a creator's application — choosing the engagement type and configuring the specific terms (clauses) — so that both parties have explicit, locked-in expectations before any work begins.

**Acceptance criteria:**
- [ ] Accepting a creator's application automatically opens a Contract creation modal
- [ ] Modal Step 1: Brand selects one of three engagement types:
  - **Content Collaboration** — creator publishes branded content on their channels
  - **Product Seeding** — brand transfers a product; creator engages with it
  - **Talent Engagement** — creator appears at or hosts a live event
- [ ] Modal Step 2: Clause configuration, shown/hidden by type:
  - All types: deliverable notes (text), max revision rounds (1–5, default 2), kill fee percentage (optional)
  - Content Collaboration & Talent Engagement: payment structure (flat fee or none); if flat fee → amount in BDT + payment schedule (upfront / on-delivery / milestone); exclusivity days; usage rights days
  - Product Seeding: product disposition (keep / return); optional payment toggle
- [ ] Modal Step 3: Plain-language summary of all configured clauses before confirmation ("BDT 15,000 paid on delivery · 2 revision rounds · 30-day exclusivity")
- [ ] Platform fee is computed and displayed: "Platform takes X% — creator receives BDT Y"
- [ ] On confirmation: contract is created in `active` state; application status remains `accepted`
- [ ] Contract appears immediately in the Active Contracts tab of the campaign detail page

**Size estimate:** L (5 story points)

---

### US-5b (New) — Brand Tracks Contract Execution

> As **Rasha (brand)**, I want to track each active contract through a visual state machine so that I always know the current status of every engagement and can take the correct action at each stage without confusion.

**Acceptance criteria:**
- [ ] Each contract card in the Active Contracts tab shows: creator info, contract type badge, color-coded status chip, clause summary, and one contextual action button
- [ ] State machine states displayed: Active → In Production → Content Submitted → Content Approved → Published → Closed
- [ ] Contextual brand actions per state:
  - `active` / `in_production` → no action (waiting for creator)
  - `content_submitted` → "Review Content" button (opens full contract detail with draft URL + Approve / Request Revision)
  - `published` → "Close Contract" button
  - `closed` → "Leave Review" (if review not yet submitted)
- [ ] Revision requests are blocked after `max_revision_rounds` is reached (system shows "Revision limit reached — you must approve or raise a dispute")
- [ ] All state transitions are timestamped in an audit trail visible in the contract detail

**Size estimate:** M (3 story points)

---

### US-5c (New) — Creator Tracks Their Contracts

> As **Arif (creator)**, I want to see all my active contracts with their current state and the single next action I must take so that I never miss a deadline or wonder what's expected of me.

**Acceptance criteria:**
- [ ] Creator dashboard has a "My Contracts" page listing all contracts
- [ ] Each contract card shows: brand logo, campaign title, contract type, status chip, and one highlighted next-action prompt:
  - `active` → "Your contract is live — await further instructions"
  - `in_production` → "Submit your content draft"
  - `content_submitted` → "Awaiting brand review"
  - `content_approved` → "Publish your content and submit the live URL"
  - `published` → "Awaiting brand to close"
  - `closed` → "Leave a review for this collaboration"
- [ ] Clicking a contract opens the full contract detail view showing all clauses and the execution workflow
- [ ] Creator can submit draft content URL when status is `active` or `in_production`
- [ ] Creator can submit live post URL when status is `content_approved`
- [ ] Creator cannot take actions out of sequence (e.g., submit live URL before content is approved)

**Size estimate:** M (3 story points)

---

### US-10 (Revised) — Brand Manages the Application Funnel

**Original:** "As a brand, I manage applicants on a Kanban board (Applied → Shortlisted → … → Completed), so I can run the campaign."

**Revised story:**
> As **Rasha (brand)**, I want to manage the creator application funnel on a Kanban board — from first application through to acceptance — and have accepting a creator automatically trigger contract creation, so that negotiation and execution are cleanly separated phases with no ambiguity between them.

**Acceptance criteria:**
- [ ] Kanban covers the application funnel only: Applied → Needs Review → Shortlisted → Accepted
- [ ] Accepting an application from any column (via Kanban card action or ApplicationDrawer) immediately opens the ContractCreateModal
- [ ] Once a contract exists, the creator moves out of the Kanban and into the Active Contracts tab
- [ ] Brand can still reject, decline, or withdraw applications at any Kanban stage
- [ ] Sent Invitations (brand-initiated, private campaigns) are visible as a sub-tab of the Pipeline
- [ ] Kanban does not attempt to track execution states — those belong to the contract

**Size estimate:** S (2 story points)

---

### US-16 (Revised) — Simulated Escrow via Contract Payment Clause

**Original:** "As a brand/creator, money flows through a simulated escrow with per-type platform-fee computation, so transactions are trustworthy."

**Revised story:**
> As **Rasha (brand) and Arif (creator)**, we want the contract's payment clause to simulate an escrow arrangement — fees locked at contract creation and visible to both parties — so that the creator knows payment is committed and the brand knows the creator is motivated to deliver.

**Acceptance criteria:**
- [ ] Contract creation locks the agreed payment amount (no edits after `active`)
- [ ] Platform fee percentage is computed from contract type at creation and stored (not recalculated): Content Collaboration 15%, Product Seeding 10%, Talent Engagement 18%
- [ ] Payment breakdown is shown to both parties: gross amount, platform fee, net to creator
- [ ] Contract detail shows the payment clause prominently with a "Held in escrow (simulated)" label
- [ ] When contract reaches `closed` state, the UI shows "Payment released to creator" confirmation
- [ ] Product Seeding contracts with no payment clause show "No payment — product transfer only"

**Size estimate:** S (2 story points)

---

## 4. Use Cases

### UC-1: Brand Creates a Private Campaign and Invites a Creator

**Actor:** Rasha (brand)
**Precondition:** Rasha has an active brand account; Arif has a verified creator profile.
**Trigger:** Rasha wants to run a sponsored post campaign with a specific creator she found.

**Main flow:**
1. Rasha creates a campaign (visibility: Private, budget: BDT 20,000, platform: Instagram)
2. Rasha browses the creator marketplace, finds Arif, opens his profile
3. Rasha clicks "Invite to Campaign" and selects her new campaign
4. Arif receives the invitation in his dashboard → accepts with a proposed rate of BDT 18,000
5. Rasha sees Arif's acceptance in the Sent Invitations tab → clicks Accept
6. ContractCreateModal opens automatically
7. Rasha selects Content Collaboration → sets payment BDT 18,000 on-delivery, 2 revision rounds, 30-day exclusivity → confirms
8. Contract is created in `active` state
9. Arif sees the contract in My Contracts → submits a draft Instagram Reel URL
10. Contract moves to `content_submitted`; Rasha sees "Review Content" action
11. Rasha reviews and approves
12. Arif publishes the Reel, submits the live URL
13. Rasha closes the contract; both parties are prompted to leave a review

**Postcondition:** Contract is `closed`; `campaign_application.status = completed`; reviews available.

---

### UC-2: Creator Applies to a Public Campaign

**Actor:** Arif (creator)
**Precondition:** A public campaign exists with matching niche/budget.
**Trigger:** Arif discovers the campaign in the marketplace.

**Main flow:**
1. Arif browses public campaigns in the Opportunities tab
2. Arif finds a matching campaign, reads the brief, clicks Apply
3. Arif enters proposal text and proposed rate → submits
4. Application enters Rasha's Kanban (Needs Review column)
5. Rasha shortlists → reviews further → accepts
6. ContractCreateModal opens (same flow as UC-1 from step 6)

**Postcondition:** Same as UC-1.

---

### UC-3: Product Seeding Contract (No Payment)

**Actor:** Rasha (brand)
**Trigger:** Rasha wants to send a new product to Arif for an authentic review — no payment, just the product.

**Main flow:**
1. Rasha accepts Arif's application → ContractCreateModal opens
2. Rasha selects Product Seeding
3. Rasha sets: product disposition = keep, no payment, deliverable notes = "1 Instagram post featuring the product within 14 days"
4. Rasha confirms → Contract created
5. Rasha ships the product (off-platform)
6. Arif submits a draft post URL
7. Rasha approves (no revision needed)
8. Arif publishes; Rasha closes the contract

**Postcondition:** Contract closed; no payment transaction. Product disposition recorded as "keep."

---

## 5. Happy Paths

### Brand Happy Path
```
Create Campaign (type-agnostic, visibility set)
  → Run AI Matching / Browse Creators
  → Invite or Accept Applicant
  → [ContractCreateModal] Choose type → Configure clauses → Confirm
  → Active Contracts: monitor state machine
  → content_submitted: Review draft → Approve
  → published: Close Contract
  → Leave Review
```

### Creator Happy Path
```
Browse Public Campaigns (Opportunities tab)
  → Apply with proposal + rate
  → Receive acceptance notification
  → My Contracts: see new contract + clauses
  → in_production: Submit draft content URL
  → content_approved: Publish → Submit live URL
  → closed: Receive payment confirmation → Leave Review
```

---

## 6. Sad Paths

### Brand Ghosts Post-Contract
- Brand accepts application, contract created in `active` state
- Creator submits draft; brand never reviews
- System behavior: brand cannot close without approving; review prompt is blocked
- Current scope: flagged as `disputed` state (manual resolution — dispute UI deferred)

### Creator Does Not Deliver
- Contract in `in_production`; content deadline passes with no submission
- Brand can raise a dispute → contract enters `disputed` state
- Kill fee clause: if configured, creator receives the kill fee percentage even if brand cancels

### Revision Limit Exceeded
- Brand requests revision round 1 → `in_production` → creator resubmits
- Brand requests revision round 2 → `in_production` → creator resubmits
- Brand attempts to request revision round 3 → system blocks with HTTP 409: "Revision limit reached"
- Brand must approve the current submission or raise a dispute

### Creator Declines Invitation
- Application status → `declined`
- Brand can invite a different creator to the same campaign
- Campaign funnel unaffected

### Product Not Returned (Product Seeding with disposition = return)
- Contract closed by brand; product return not verifiable on-platform
- Recorded in contract for audit trail; return verification is off-platform

---

## 7. FR Mapping — Original vs. Revised

| FR | Original interpretation | Revised interpretation | Change |
|---|---|---|---|
| FR-6 | Wizard step 2 selects campaign_type (6 values) | Wizard has no type step; type is chosen at contract creation | **Breaking change** |
| FR-7 | Brands select one of six collaboration models on the campaign | Three engagement types on Contract; Affiliate Partnership deferred | **Breaking change** |
| FR-14 | Kanban covers full lifecycle (Applied → Completed) | Kanban covers application funnel only (Applied → Accepted); Contract owns execution | **Breaking change** |
| FR-15 | State machine on collaboration type | State machine on Contract entity with timestamped transitions | **Breaking change** |
| FR-16 | Content review workflow on collaboration | Contract states: in_production → content_submitted → content_approved → published | **Clarification** |
| FR-18 | Escrow on collaboration | Simulated escrow via contract payment_clause; locked at contract creation | **Clarification** |
| FR-19 | Platform fee per campaign_type | Platform fee per contract_type: Content Collaboration 15%, Product Seeding 10%, Talent Engagement 18% | **Value change** |

---

## 8. Deprecation Notice — `campaigns.campaign_type`

**`Campaign.campaign_type` is deprecated as of 2026-06-06.**

- The column is **nullable** (NOT NULL constraint dropped, default removed) via migration `0015`.
- Do **not** read or write `campaign_type` in any new code. Type information now lives on `Contract.contract_type`.
- Do **not** propagate `campaign_type` to new API endpoints, frontend components, or Pydantic schemas.
- Existing references (D06 fee simulation, `CampaignTypeBadge`, wizard form) will be migrated as part of this change request.
- The column will be **hard-dropped** in a future migration once all references are confirmed removed. Track readiness by grepping for `campaign_type` across the codebase — when zero hits remain, it is safe to drop.

```bash
# Run this to check if any reference still exists before dropping:
grep -r "campaign_type" backend/ frontend/ --include="*.py" --include="*.ts" --include="*.tsx" -l
```

---

## 9. Deferred Items (Out of Scope for This Change)

- **Affiliate Partnership** contract type — deferred; requires performance-based payment clause (commission per conversion), fundamentally different from deliverable-based types
- **Real payment rails** (bKash/Nagad) — fee computation remains simulated
- **Contract templates** — brands cannot save reusable clause presets yet
- **Dispute resolution UI** — disputes are flagged (`disputed` state) but not actively mediated in-platform
- **Bangla i18n** on new contract components
