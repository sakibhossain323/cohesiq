# Campaign Invitation Workflow Plan

## Product Decision: Revisions

Use a structured revision limit, not a free-form loop.

Default rule: each approved collaboration gets `max_revision_rounds = 2`, editable by the brand in the final campaign addendum before the creator accepts.

Why:
- It protects creators from unlimited unpaid edits.
- It gives brands a clear quality-control mechanism.
- It fits the existing contract model, which already has `max_revision_rounds` and `revisions_used`.
- It makes the workspace state machine easier to reason about and test.

If the brand rejects a draft, they must submit structured feedback and one or more requested changes. The creator can resubmit until the revision count is exhausted. After the limit, the brand can either approve, negotiate an additional paid revision, or escalate/cancel according to contract rules.

## Target Workflow

1. Campaign is live.
2. Brand invites creators or creators apply.
3. Creator answers application questions and acknowledgments.
4. Brand shortlists applicants.
5. Brand selects up to campaign capacity.
6. Selected creator enters `pending_agreement`.
7. Brand finalizes campaign addendum.
8. Creator accepts or declines final terms.
9. Accepted creator moves into active workspace.
10. Collaboration moves through milestones.
11. Creator submits live link.
12. System tracks performance analytics.

## Status Model

### Campaign Application Statuses

Current statuses cover most of the flow, but we should add clearer agreement states.

Recommended statuses:
- `invited`: brand invited creator, creator has not responded.
- `pending`: creator applied, brand has not reviewed.
- `shortlisted`: brand is interested, not selected yet.
- `pending_agreement`: brand selected creator and sent final addendum.
- `accepted`: creator accepted final terms and collaboration is active.
- `declined`: creator declined invite or final terms.
- `rejected`: brand rejected creator.
- `withdrawn`: creator withdrew.
- `completed`: collaboration finished.

Capacity rule:
- Brand can shortlist unlimited creators.
- Brand cannot move more than `campaign.number_of_creators` active creators into `pending_agreement` or `accepted`, unless a previous selected creator is rejected, declined, withdrawn, or cancelled.

## Backend Tasks

### 1. Application Requirements

Add campaign application requirement tables:

- `campaign_application_questions`
  - `id`
  - `campaign_id`
  - `question_text`
  - `question_type`: `text`, `single_choice`, `multi_choice`
  - `options_json`
  - `is_required`
  - `sort_order`

- `campaign_acknowledgments`
  - `id`
  - `campaign_id`
  - `statement_text`
  - `is_required`
  - `sort_order`

- `campaign_application_answers`
  - `id`
  - `application_id`
  - `question_id`
  - `answer_text`
  - `answer_options_json`

- `campaign_application_acknowledgments`
  - `id`
  - `application_id`
  - `acknowledgment_id`
  - `accepted_at`

Validation:
- Max 5 questions per campaign.
- Application cannot be submitted until all required questions and acknowledgments are completed.
- Invite acceptance should use the same validation path.

### 2. Shortlist And Selection Logic

Add service-level guardrails:

- `shortlist_application(application_id)`
- `send_agreement(application_id, addendum_payload)`
- `accept_agreement(application_id)`
- `decline_agreement(application_id)`
- `reject_application(application_id)`

Capacity checks:
- Count applications in `pending_agreement` and `accepted`.
- Block `send_agreement` if count >= `campaign.number_of_creators`.
- If a `pending_agreement` creator declines or is rejected, capacity opens again.
- Once an application becomes `accepted`, automatically release extra shortlisted creators only when all campaign slots are filled.

Notification events:
- Creator moved to shortlist.
- Creator selected for final terms.
- Creator declined or timed out.
- Shortlisted creators released after capacity is filled.

### 3. Campaign Addendum

Add final agreement/addendum fields, preferably attached to contract or application:

- `requires_content_approval`
- `paid_ad_usage_rights`
- `requires_creator_mention`
- `ships_physical_product`
- `shipping_address_required`
- `content_example_links_json`
- `briefing_file_urls_json`
- `max_revision_rounds`
- `final_payment_amount_bdt`
- `final_deliverables_json`

Rules:
- If `ships_physical_product = true`, creator must confirm shipping address before accepting.
- If `requires_content_approval = true`, live link submission is blocked until draft approval.
- `max_revision_rounds` defaults to 2.

### 4. Workspace And Milestones

Add collaboration workspace tables:

- `collaboration_workspaces`
  - `id`
  - `application_id`
  - `contract_id`
  - `current_stage`
  - `created_at`
  - `updated_at`

- `collaboration_milestones`
  - `id`
  - `workspace_id`
  - `stage`
  - `status`: `locked`, `pending`, `submitted`, `approved`, `rejected`, `completed`
  - `submitted_at`
  - `approved_at`
  - `completed_at`

Initial stages:
- `product_shipped`
- `product_received`
- `content_draft`
- `brand_review`
- `ready_to_post`
- `live_tracking`

If no physical product is shipped, skip `product_shipped` and `product_received`.

### 5. Draft Review And Revisions

Add draft submission tables:

- `content_drafts`
  - `id`
  - `workspace_id`
  - `version_number`
  - `file_urls_json`
  - `caption_text`
  - `notes`
  - `status`: `submitted`, `approved`, `changes_requested`, `rejected`
  - `submitted_at`

- `content_revision_requests`
  - `id`
  - `draft_id`
  - `requested_by_brand_id`
  - `feedback_text`
  - `requested_changes_json`
  - `revision_round`
  - `created_at`

Rules:
- `revision_round <= contract.max_revision_rounds`.
- Brand must provide feedback text when requesting changes.
- Creator submits a new draft version after changes.
- Approved draft unlocks `ready_to_post`.

### 6. Workspace Communication

Add workspace message table:

- `workspace_messages`
  - `id`
  - `workspace_id`
  - `sender_user_id`
  - `message_text`
  - `attachment_urls_json`
  - `message_type`: `chat`, `question`, `system`, `revision_feedback`
  - `created_at`

Use system messages for milestone changes, agreement acceptance, draft approvals, and revision requests.

### 7. Live Link And Analytics

Add live content tracking tables:

- `live_content_posts` (future normalization)
  - `id`
  - `workspace_id`
  - `platform`
  - `post_url`
  - `platform_post_id`
  - `submitted_at`
  - `verified_at`

- `live_content_metric_snapshots` (implemented in migration `0021`; v1 attaches directly to `contracts`)
  - `id`
  - `contract_id`
  - `platform`
  - `captured_at`
  - `views`
  - `impressions`
  - `likes`
  - `comments`
  - `shares`
  - `saves`
  - `engagement_rate`
  - `estimated_revenue_bdt`
  - `revenue_basis`
  - `source`

Analytics APIs:
- Summary tiles use latest snapshot.
- Line chart uses snapshots over time.
- Engagement bar chart uses latest likes/comments/shares/saves.
- `POST /campaigns/contracts/{contract_id}/sync-metrics` stores a snapshot from the platform API for a published contract.
- `GET /campaigns/contracts/{contract_id}/analytics` returns one contract timeline.
- `GET /campaigns/{campaign_id}/live-analytics` returns campaign totals, per-contract timelines, and aggregate chart points.

Live post verification rule:
- After a draft is approved, the creator should choose the final live post from synced creator content when available.
- If the creator pastes a link manually, the backend must verify that the URL belongs to one of the creator's connected platform profiles or already-synced portfolio items.
- Exact synced portfolio URLs are accepted.
- Platform profile URLs are accepted only when the path matches the creator's connected handle/channel/profile URL.
- Shortened URLs that do not expose ownership, such as generic `youtu.be` links, should only be accepted if already present as a synced portfolio item.
- Later API verification should confirm post ownership and metrics by platform post ID before analytics snapshots are trusted.

## Frontend Tasks

### 1. Campaign Create/Edit

Add fields for:
- Application questions.
- Acknowledgments.
- Creator capacity.
- Deliverable requirements.
- Optional screening settings.

UX:
- Max 5 questions.
- Question type selector.
- Add/remove acknowledgment rows.

### 2. Creator Application Flow

For public campaign pages and invited creators:
- Show application questions.
- Show acknowledgment checkboxes.
- Disable submit/accept until required fields are complete.
- Show invite context when creator came from brand invite.

### 3. Brand Applicant Pipeline

Campaign detail page should show pipeline tabs:
- Invited
- Pending
- Shortlisted
- Pending Agreement
- Approved
- Rejected/Declined

Actions:
- Shortlist
- Reject
- Select
- Send addendum
- Release shortlist

Capacity UI:
- Show `approved + pending agreement / campaign.number_of_creators`.
- Disable Select when capacity is full.

### 4. Campaign Addendum Modal

Before final selection:
- Toggles for approval, ad usage rights, mention, physical product.
- Shipping prompt requirement if product is shipped.
- Upload links/files for examples and briefing docs.
- Set max revision rounds.
- Confirm final deliverables and package price.

### 5. Creator Agreement Review

Creator sees:
- Final deliverables.
- Final payment.
- Toggles/legal terms.
- Revision count.
- Content approval requirement.
- Shipping address form if needed.

Actions:
- Accept final terms.
- Decline final terms.

### 6. Collaboration Workspace

Create shared workspace route for brand and creator:

- Milestone board.
- Current stage card.
- Q&A/chat panel.
- Addendum/brief sidebar.
- Draft submission area.
- Brand review controls.

Brand controls:
- Add tracking info.
- Request revision.
- Approve draft.

Creator controls:
- Mark product received.
- Ask question.
- Submit draft.
- Select final live content from synced portfolio items or submit a verified live post link.

### 7. Tracking Dashboard

After live link submission:
- Show latest metric tiles.
- Line chart for views and likes.
- Bar chart for likes/comments/shares/saves.
- Last synced timestamp.
- Manual refresh button if API allows.

## API Task List

Application:
- `POST /campaigns/{id}/apply`
- `POST /campaigns/{id}/invite`
- `POST /applications/{id}/answer`
- `POST /applications/{id}/acknowledge`

Pipeline:
- `POST /applications/{id}/shortlist`
- `POST /applications/{id}/reject`
- `POST /applications/{id}/send-agreement`
- `POST /applications/{id}/accept-agreement`
- `POST /applications/{id}/decline-agreement`

Workspace:
- `GET /workspaces/{id}`
- `POST /workspaces/{id}/messages`
- `POST /workspaces/{id}/product-shipped`
- `POST /workspaces/{id}/product-received`
- `POST /workspaces/{id}/drafts`
- `POST /drafts/{id}/request-revision`
- `POST /drafts/{id}/approve`
- `POST /workspaces/{id}/live-posts`

Analytics:
- `GET /workspaces/{id}/analytics/summary`
- `GET /workspaces/{id}/analytics/timeseries`
- `POST /live-posts/{id}/sync-metrics`

## Implementation Order

### Milestone 1: Application Gate

1. Add question/acknowledgment tables and schemas.
2. Add campaign create/edit support for questions and acknowledgments.
3. Add apply/accept validation.
4. Add tests for required answers and acknowledgment gating.

### Milestone 2: Pipeline And Capacity

1. Add `pending_agreement` status.
2. Add shortlist/select/reject service methods.
3. Enforce capacity.
4. Add brand pipeline UI.
5. Add tests for over-capacity selection prevention.

### Milestone 3: Addendum And Agreement

1. Add addendum model fields.
2. Add addendum modal.
3. Add creator agreement review page.
4. Create contract/workspace only after creator acceptance.
5. Add tests for shipping-required flow and agreement decline.

### Milestone 4: Workspace And Draft Review

1. Add workspace, milestone, draft, revision request, and message tables.
2. Build shared workspace UI.
3. Implement product shipped/received.
4. Implement draft submission and revision approval.
5. Enforce max revision rounds.

### Milestone 5: Live Tracking

1. Add live post tracking tables.
2. Add live link submission.
3. Add metric snapshot sync jobs/services.
4. Build analytics dashboard.
5. Add tests for snapshot aggregation.

## Testing Checklist

Backend:
- Cannot apply without required answers.
- Cannot accept invite without acknowledgments.
- Cannot select beyond campaign capacity.
- Decline frees capacity.
- Accepted creator releases extra shortlisted creators only when capacity is full.
- Shipping address required only when product shipping is enabled.
- Draft rejection increments revision count.
- Revision request blocked after max rounds.
- Live link blocked until approved draft when approval is required.

Frontend:
- Campaign form validates max 5 questions.
- Creator application submit button respects validation.
- Brand selection button disables at capacity.
- Agreement modal shows correct toggles.
- Workspace milestone state updates correctly.
- Revision feedback is visible in chat/history.
- Analytics charts handle empty and populated metric snapshots.

## Open Product Questions

- Should additional revision rounds be paid automatically or handled manually?
- Should shortlisted creators be auto-released immediately when all slots are accepted, or only after all contracts are fully signed?
- Should content examples and briefing files be uploaded to our storage or stored as external links first?
- Which platforms get automatic live-post metric sync in v1: YouTube only, or YouTube plus TikTok/Instagram through Apify?
- What is the timeout window before a `pending_agreement` creator is considered ghosted?
