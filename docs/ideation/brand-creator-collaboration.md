# Brand–Creator Collaboration: Real-World Mental Model

A ground-up breakdown of how influencer marketing actually works — from first contact to final payment — and where Cohesiq fits in each stage.

---

## 1. Discovery & Audience Demographics

Before any outreach happens, brands need to vet creators. Demographic data flows through four channels:

| Source | How it works | Trust level |
|---|---|---|
| **Platform-native analytics** | Creator shares screenshots from Instagram Insights, YouTube Studio, TikTok Analytics | Low — self-reported, easily cherry-picked |
| **Third-party tools** | HypeAuditor, Modash, Influencity pull public data + estimate audience profiles independently | Medium — estimated, not ground truth |
| **Creator media kits** | Self-published PDF with stats, past collabs, rate card | Low — unverified, quality varies wildly |
| **Platform API authentication** | Creator authenticates social accounts on a marketplace; platform pulls real API data directly | High — bypasses self-reporting entirely |

**Trust hierarchy:** platform API data > third-party tools > creator screenshots > media kits

The core verification problem: demographics are always self-reported or estimated, never perfectly accurate. Authenticated integrations (like YouTube Data API) are a meaningful trust signal precisely because they bypass the creator.

---

## 2. Inbound vs. Outbound Reach

The initiation pattern shifts significantly based on brand and creator tier.

### Outbound (Brand → Creator)
Brand identifies, vets, and cold contacts the creator directly.
- Used by mid-to-large brands with dedicated influencer teams
- Targets mid-tier (100k–1M) and macro (1M+) creators where per-contact ROI justifies the effort
- Rarely used for nano/micro — too many to contact individually

### Inbound (Creator → Brand's campaign brief)
Brand publishes a brief; creators discover it and apply.
- Used by brands without a full influencer team, or always-on programs
- Nano (1k–10k) and micro (10k–100k) creators dominate inbound — they actively seek deals
- Top-tier creators rarely apply inbound — their management handles deal flow

### Market Matrix

| | Small Brand | Mid Brand | Large Brand |
|---|---|---|---|
| **Nano/Micro creator** | Inbound-heavy | Inbound + gifting | Open calls / platforms |
| **Mid-tier creator** | Outbound (brand hustles) | Mix | Mix |
| **Macro/Celebrity** | Rarely accessible | Outbound via agency | Agency-to-agency |

### Key nuance
Top-tier creators almost never touch a platform themselves — talent agencies handle everything. "Outbound to a macro creator" means emailing their manager, not the creator.

### Business Insight
The market fractures into two completely different industries:
- **Top-right** (large brand + macro creator): agency business, relationship-driven, no platform needed
- **Bottom-left** (small brand + nano/micro creator): volume business, discovery is the core problem, platform-dependent

These two segments have almost nothing in common operationally.

---

## 3. Where Cohesiq Fits

Cohesiq is well-suited for five cells of the matrix:

| | Small Brand | Mid Brand | Large Brand |
|---|---|---|---|
| **Nano/Micro** | **Cohesiq** | **Cohesiq** | **Cohesiq** |
| **Mid-tier** | **Cohesiq** | **Cohesiq** | edges |
| **Macro/Celebrity** | out of scope | out of scope | out of scope |

**Primary ICP:** small-to-mid brands that lack an influencer team, paired with nano-to-mid-tier creators who lack management. Both sides share the same problem — no efficient way to find each other.

The matching engine is the actual moat, not campaign management features. In this segment, **discovery is the bottleneck**, not workflow. The inbound (creator applies to brief) model is the right fit, which aligns with how Cohesiq is built.

---

## 4. Contracts

### By tier

| Deal size | Contract form |
|---|---|
| Nano/micro | Email thread or platform's built-in agreement — no formal legal document |
| Mid-tier | Statement of Work (SOW) or Influencer Agreement |
| Macro+ | Full MSA + SOW drafted by brand's legal team, negotiated by creator's manager |

In real-world legal practice, two documents govern a deal:
- **MSA (Master Service Agreement)** — defines the nature of the engagement (type)
- **SOW (Statement of Work)** — defines the specific terms per campaign (clauses)

This maps directly to how a platform should model contracts: the **contract type** is the MSA category; the **clauses** are the SOW terms.

### 4.1 Contract Type Taxonomy

The contract type answers: *what is the nature of the working relationship?*

It should describe the **engagement**, not the payment mechanism or physical artifact. Payment terms and deliverables are clauses *within* the contract, not the type itself.

| Contract type | Nature of engagement | Typical initiator | Typical visibility |
|---|---|---|---|
| **Content Collaboration** | Creator produces and publishes branded content | Brand | Private |
| **Product Seeding** | Brand transfers a product; creator engages with it | Brand | Private |
| **Talent Engagement** | Creator appears at or hosts a live event | Brand | Private |
| ~~Affiliate Partnership~~ | *(deferred — see note below)* | Either | Public |

> **Note on Affiliate Partnership:** Deferred from current scope but important to understand. It is performance-based (commission per conversion), not deliverable-based. Payment is tied to outcomes (clicks, sales) rather than content production. It has a fundamentally different payment clause structure and is typically always-on rather than campaign-bound.

### 4.2 Contract Clause Structure

The clauses answer: *what are the specific terms of that relationship?*

```
Contract
├── type: Content Collaboration | Product Seeding | Talent Engagement
├── payment_clause
│   ├── structure: flat_fee | none
│   └── amount, currency, schedule (upfront / on-delivery / milestone)
├── product_transfer_clause
│   ├── applies: yes | no
│   └── disposition: keep | return
│       (handles gifting AND loan/review-and-return in one field)
├── deliverable_clause
│   └── [list of deliverables: platform, type, quantity, deadline]
├── exclusivity_clause
│   ├── competitor_lockout_days
│   └── usage_rights_duration (for whitelisting / repurposing)
├── revision_clause
│   └── max_rounds (default 2; beyond is billable)
└── kill_fee_clause
    └── percentage of fee owed if brand cancels post-production start
```

**Key insight:** "paid + product" is not a fourth type — it is a `Content Collaboration` with both `payment_clause` and `product_transfer_clause` active simultaneously. The type stays semantically clean; the variance lives in the clauses.

### 4.3 Key Clauses Explained

| Clause | What it governs |
|---|---|
| **payment_clause** | Whether money changes hands, how much, and when |
| **product_transfer_clause** | Whether a physical product is transferred, and whether it is kept or returned |
| **deliverable_clause** | What content the creator must produce (platform, format, quantity, deadline) |
| **exclusivity_clause** | Competitor lockout window; content usage/whitelisting rights duration |
| **revision_clause** | Maximum revision rounds before additional billing kicks in |
| **kill_fee_clause** | Creator's compensation if brand cancels after production has started (typically 25–50%) |

---

## 5. Payment

### Common structures

| Structure | Used by |
|---|---|
| 50% upfront, 50% on delivery | Standard for mid-tier |
| 100% upfront | Nano/micro demand this — they've been burned before |
| Net-30 / Net-60 after delivery | Large brands, procurement-driven — painful for creators |
| Platform escrow | Marketplace holds full payment at campaign start, releases on brand approval |

### Escrow flow (platform model)

```
Brand deposits funds → Platform holds escrow
→ Creator delivers content → Brand approves
→ Platform releases payment (minus commission)
```

Escrow is the critical protection mechanism. Without it, the entire trust model breaks.

---

## 6. Violations & Enforcement

### Brand ghosts without paying (most common)

| Scenario | Outcome |
|---|---|
| On a platform with escrow | Funds already locked — ghosting doesn't work, creator gets paid regardless |
| Off-platform | Almost no practical recourse |

Off-platform options: small claims court (rarely worth it), public callout ("I was not paid by X"), chargeback via payment processor for partial card payments, collections agency for larger amounts.

This is the #1 reason creators prefer platform-mediated deals over direct deals.

### Creator doesn't deliver

- Brand withholds payment (disputes escrow release)
- Platform mediates — most have a dispute resolution window (e.g., 72 hours after delivery)
- Kill fee applies in reverse if creator cancels mid-production

### Creator posts non-compliant content

- Brand can demand takedown — creator is contractually obligated
- If creator refuses, brand can pursue damages for FTC liability exposure (rare but real)
- Platform audit trail (all approved versions timestamped) is the paper trail

### Reality for nano/micro segment

Most violations are never legally pursued — deal size doesn't justify it. **Reputation within the platform (reviews, ratings) is the actual enforcement mechanism at this tier.** This is why the reviews/rating system is a trust-critical feature, not a nice-to-have.

---

## 7. Content Review & Approval

### Typical flow

```
Creator produces draft
→ Submits via platform / Google Drive / email
→ Brand reviews (48–72 hr window)
→ Requests revisions OR approves
→ Creator makes changes (round 2 if needed)
→ Final approval
→ Creator posts within agreed go-live window
→ Creator shares live link + performance screenshot
→ Brand verifies post is live and compliant
→ Payment released
```

### What brands actually review

- Brand safety (no controversial adjacent content)
- Key message accuracy (product claims, pricing)
- FTC disclosure compliance (#ad placement, verbal mention in video)
- Visual brand guidelines (logo, color, product placement angle)
- No competitor mentions

### Intermediary role of a platform

- Stores every draft version with timestamps (audit trail)
- Enforces revision round limits contractually
- Holds the payment release gate
- Provides dispute resolution if parties disagree on whether revisions were "reasonable"

---

## 8. The Structural Problem Platforms Solve

**Without a platform:**
```
Email chain → Dropbox link → "Looks good!" reply
→ Invoice → Net-30 → Chase for payment → Maybe get paid
```

**With a platform like Cohesiq:**
```
Brief posted → Application → Escrow locked
→ Content submitted in-platform → Approval click
→ Payment auto-released → Review logged
```

The platform converts an informal, trust-dependent process into a structured, enforceable workflow. This is especially critical for the nano/micro segment where neither party has legal resources or industry relationships to fall back on.

---

## 9. Campaign Visibility and Initiation Model

Campaign visibility is the architectural split that determines which initiation model applies:

| Visibility | Who discovers it | How engagement starts | Real-world equivalent |
|---|---|---|---|
| **Public** | Any qualifying creator via marketplace browse | Creator applies → brand selects | Influencer program, open call |
| **Private** | Only creators the brand directly invites | Brand sends invitation → creator negotiates | Direct outreach, bespoke deal |

Both paths converge at the **Contract** stage. The campaign is the funnel; the contract is the transaction.

**Important:** Affiliate Partnerships are always public-visibility by nature. All other contract types (Content Collaboration, Product Seeding, Talent Engagement) can be either public or private depending on whether the brand wants open applications or curated outreach.

---

## 10. Corrected Data Model Architecture

The current Cohesiq schema conflates negotiation and execution inside `CampaignApplication`. The correct model introduces `Contract` as a first-class entity that absorbs campaign type, agreed terms, and governs the entire execution phase.

```
Campaign (type-agnostic, visibility: public | private)
    │
    ├── [public]  Creator discovers → applies → CampaignApplication (initiated_by: creator)
    └── [private] Brand identifies → invites → CampaignApplication (initiated_by: brand)
                                │
                                │ on acceptance
                                ▼
                          Contract
                          ├── type: Content Collaboration | Product Seeding | Talent Engagement
                          ├── payment_clause
                          ├── product_transfer_clause
                          ├── deliverable_clause
                          ├── exclusivity_clause
                          ├── revision_clause
                          └── kill_fee_clause
                                │
                                ▼
                          Execution Phase
                          ├── Escrow locked
                          ├── Content submitted (draft URLs, revision rounds)
                          ├── Brand approves
                          ├── Creator publishes (go-live URL, FTC disclosure verified)
                          ├── Payment released
                          └── Reviews exchanged
```

### What this fixes vs. the current model

| Current schema problem | Fix |
|---|---|
| `campaign_type` on `Campaign` — type is a campaign property | Move type to `Contract` — it's a bilateral agreement property |
| `agreed_rate`, `agreed_deliverables` as free-text on `Application` | Structured clauses on `Contract` |
| `application.status` jumps from `accepted` to `completed` | `Contract` owns the execution state machine |
| No payment/escrow modeled | `payment_clause` + escrow state on `Contract` |
| No content submission or revision tracking | Execution phase hangs off `Contract` |

---

## 11. Full Lifecycle Summary

| Phase | What happens | Cohesiq touchpoint |
|---|---|---|
| **Discovery** | Brand finds creators via search, filters, matching | Matching engine, marketplace browse |
| **Demographic vetting** | Brand reviews audience data | Creator profile, social analytics |
| **Outreach / Application** | Creator applies (public) or brand invites (private) | Campaign visibility + application flow |
| **Negotiation** | Rate, deliverables, timeline agreed | Application proposed_rate → agreed_rate |
| **Contract creation** | Typed contract with clauses locked | Contract entity (type + clause set) |
| **Escrow** | Brand deposits funds per payment_clause | payment_clause + escrow state |
| **Content production** | Creator produces draft | — |
| **Review & approval** | Brand reviews, requests revisions (tracked by revision_clause) | Content submission + revision rounds |
| **Publishing** | Creator posts with FTC disclosure | Go-live URL recorded |
| **Verification** | Brand confirms post is live and compliant | Deliverable_clause checklist |
| **Payment release** | Escrow released per payment_clause terms | Automated on approval |
| **Reporting** | Performance metrics shared | Metrics on contract |
| **Reviews** | Both parties rate each other | Review model (bidirectional) |
