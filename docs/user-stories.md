# Cohesiq — User Stories

Companion to the [SRS](srs.md). Each story is **INVEST**-compliant and cross-references the Functional Requirement(s) it satisfies and the BuildFest rubric criterion it earns.

## INVEST

- **I**ndependent — each story delivers value without depending on another.
- **N**egotiable — only the outcome is fixed; implementation is the team's call.
- **V**aluable — each story names a user who benefits.
- **E**stimable — acceptance criteria make effort assessable.
- **S**mall — each fits within a single sprint.
- **T**estable — acceptance criteria are verifiable.

**Format:** "As a `<role>`, I want `<goal>`, so that `<benefit>`" + acceptance criteria + FR / rubric cross-refs.
Personas (Rasha, Zara, Arif) are defined in [`docs/personas.md`](personas.md).
Estimation scale (modified Fibonacci): 1 trivial · 2 small · 3 moderate · 5 substantial · 8 large (split candidate) · 13 epic (must split).

---

## Phase A — Presentable core

### US-1 — Register and choose a role
**As a user, I want to register/log in and select brand, creator, or operator, so that I land in the right workspace.**
- [ ] Clerk auth (sign up / sign in / sign out)
- [ ] Role selection routes to the role-appropriate dashboard
- [ ] Backend validates the JWT on every protected request
*FR-1 · Rubric: Technical Execution · Points: 3*

### US-2 — Creator builds a profile
**As Arif (creator), I want to create a profile with niche, platforms, rate card, languages, and bio, so that brands can discover and assess me.**
- [ ] Required fields: display name, primary niche, platforms, rate card (BDT)
- [ ] Profile is persisted and visible in discovery
- [ ] Profile-strength indicator reflects completeness
*FR-2, FR-5 · Rubric: Business Model · Points: 3*

### US-3 — Creator submits a YouTube channel
**As Arif (creator), I want to submit my YouTube Channel ID/handle, so that the platform fetches my real public stats.**
- [ ] Public stats fetched via the stateless YouTube read wrapper (not persisted as a graph)
- [ ] Stats display on the profile, labelled verified
*FR-3 · Rubric: Technical Execution · Points: 3*

### US-4 — Seed real demo data
**As the platform, I want to seed 67 real BD YouTube channels plus estimated IG/TikTok companions and portfolio items, so that the demo runs on credible data.**
- [ ] 67 verified YouTube channels loaded
- [ ] Estimated IG/TikTok fields visibly tagged; verified fields show a check
- [ ] ~190 portfolio items present
*FR-30 · Rubric: Technical Execution / Real-World Impact · Points: 5*

### US-5 (Revised) — Brand creates a type-agnostic campaign
**As Rasha (brand), I want to create a campaign with a brief, budget, talent requirements, and a visibility setting — without committing to an engagement type — so that I attract the right creators and decide engagement terms only after choosing who to work with.**
- [ ] Wizard has **no** campaign-type step
- [ ] Visibility selector: Public (open applications) or Private (invite-only)
- [ ] Required: title, description, budget_per_creator_max, required_platforms, visibility
- [ ] Optional: niche/language targets, deliverables, follower range, deadlines, KPI targets, hashtags
- [ ] AI Brief Analysis can pre-fill the form
- [ ] Campaign saved without a type; type chosen at contract creation
- [ ] Public appears in marketplace/discovery; Private is invitation-only
*FR-6, FR-7, FR-8 · Rubric: Business Model · Points: 3 · (supersedes original 4-step-typed wizard)*

### US-6 — Run AI matching
**As Rasha (brand), I want to click "Run Matching" and get a ranked list of creators with a 0–100 score, so that I can see who fits.**
- [ ] Returns the top 10 candidates ranked
- [ ] Hard filters applied first (platform, budget ceiling, language)
- [ ] 90-day relational conflict-of-interest exclusion applied
- [ ] Deterministic 6-factor weighted score (niche 0.45, budget 0.20, platform 0.15, engagement 0.10, language 0.08, recency 0.02)
*FR-11, FR-14 · Rubric: Technical Execution / Innovation · Points: 5*

### US-7 — Explainable match scores
**As Rasha (brand), I want each match to show its sub-score breakdown plus a personalised rationale, so that I trust the result.**
- [ ] Sub-scores shown: niche, budget, platform, engagement, language, recency
- [ ] Top 5 get an LLM-personalised rationale (Groq llama-3.1-8b-instant, Gemini fallback)
- [ ] Remaining results show a heuristic rationale
*FR-12 · Rubric: Real-World Impact (Ethical AI) · Points: 5*

### US-8 — Fluid discovery drawer
**As Rasha (brand), I want to open a full creator profile in a drawer without leaving the page, so that discovery feels fluid.**
- [ ] Clicking a card opens a profile drawer
- [ ] Filters update the result grid in place
*FR-13 · Rubric: Presentation · Points: 3*

### US-10 (Revised) — Manage the application funnel
**As Rasha (brand), I want to manage the application funnel on a Kanban board and have acceptance automatically trigger contract creation, so that negotiation and execution are cleanly separated.**
- [ ] Kanban columns: Applied → Needs Review → Shortlisted → Accepted (funnel only)
- [ ] Accepting (from a card or the application drawer) opens the Contract creation flow
- [ ] Once a contract exists, the creator moves out of the Kanban into Active Contracts
- [ ] Brand can reject/decline/withdraw at any stage
- [ ] Sent Invitations (private campaigns) shown as a pipeline sub-tab
*FR-17, FR-18, FR-20 · Rubric: Business Model · Points: 2 · (supersedes full-lifecycle Kanban)*

---

## Phase B — Differentiators (shipped)

### US-11 — Authenticity proxy on creator cards
**As Rasha (brand), I want an engagement-vs-tier authenticity proxy on each creator, so that I can sanity-check follower quality.**
- [ ] Engagement normalised against tier benchmark, shown per creator
- [ ] Labelled as a proxy (full statistical fraud trust score is roadmap)
*FR-16 · Rubric: Real-World Impact · Points: 3*

### US-12 — Five-stage gated pipeline
**As the platform, I want a 5-stage gated pipeline, so that matching is fast, cheap, and high-quality.**
- [ ] Stage 1 hard SQL filter → Stage 2 relational 90-day conflict check → Stage 3 deterministic niche + capped semantic rescue → Stage 4 6-factor weighted score → Stage 5 heuristic + top-5 LLM rationale
- [ ] Result set capped at 10
*FR-11, FR-12, FR-14, FR-15 · Rubric: Technical Execution · Points: 5*

### US-13 — Conflict-of-interest protection
**As Rasha (brand), I want creators who recently collaborated with a competitor excluded, so that I avoid brand clashes.**
- [ ] Relational query over prior collaborations, 90-day lookback
- [ ] Conflicting creators excluded from results
*FR-14 · Rubric: Innovation · Points: 3 · (relational, not Neo4j)*

### US-14 — AI brief analysis
**As Rasha (brand), I want to type a description and get a pre-filled structured campaign, so that I go from idea to brief in one step.**
- [ ] Natural-language input parsed into niche, demographics, format, budget range, suggested tier
- [ ] All fields editable before commit
*FR-8 · Rubric: Innovation · Points: 5*

### US-5d (New) — Voice-driven campaign creation
**As Rasha (brand), I want to dictate my brief by voice, so that I can create a campaign hands-free.**
- [ ] Voice captured and transcribed via Groq Whisper large-v3-turbo
- [ ] Transcript fed into AI Brief Analysis
- [ ] Brand reviews/edits before commit
*FR-9 · Rubric: Innovation · Points: 3*

### US-5e (New) — PDF-driven campaign creation
**As Rasha (brand), I want to upload a brief PDF, so that I can reuse an existing document.**
- [ ] PDF parsed in-browser via PDF.js
- [ ] Extracted text fed into AI Brief Analysis
- [ ] Brand reviews/edits before commit
*FR-10 · Rubric: Innovation · Points: 3*

### US-16 (Revised) — Simulated escrow via contract payment clause
**As Rasha (brand) and Arif (creator), we want the contract payment clause to simulate escrow with fees locked at creation, so that the creator knows payment is committed and the brand knows the creator is motivated.**
- [ ] Payment amount locked at contract creation (no edits after `active`)
- [ ] Platform fee by type: Content Collaboration 15%, Product Seeding 10%, Talent Engagement 18%
- [ ] Breakdown shown to both parties: gross, fee, net to creator
- [ ] Contract detail shows "Held in escrow (simulated)"
- [ ] On `closed`: "Payment released to creator"
- [ ] Product Seeding with no payment shows "No payment — product transfer only"
*FR-25 · Rubric: Business Model · Points: 2*

### US-17 — Creator dashboards & rate benchmark
**As Arif (creator), I want an opportunity feed, earnings view, and a rate-card benchmark, so that the supply side is engaging.**
- [ ] Opportunity feed lists Public campaigns matching the creator
- [ ] Rate-card benchmark widget shows market rate
*FR-18, FR-27 · Rubric: Scalability · Points: 3*

### US-20 — ROI summary
**As Rasha (brand), I want an ROI summary on completed contracts, so that I can prove value.**
- [ ] Reach, spend, and estimated ROI shown for completed contracts
- [ ] Backed by captured content-metric snapshots
*FR-23, FR-27 · Rubric: Real-World Impact · Points: 3*

---

## Contract lifecycle stories (offer-driven rework)

### US-19 (New) — Multi-turn negotiation
**As Rasha (brand) and Arif (creator), we want to exchange offers in a negotiation thread that updates near-real-time, so that we can agree terms without WhatsApp.**
- [ ] Either party can send an offer/counter-offer turn
- [ ] Thread polls for new turns every ~4 s
- [ ] Either party can accept; acceptance advances to contract creation
- [ ] All turns persisted (`negotiation_turns`)
*FR-19 · Rubric: Business Model / Real-World Impact · Points: 5*

### US-5a (New) — Brand creates a contract after accepting a creator
**As Rasha (brand), I want to define a Contract immediately after accepting a creator — choosing the engagement type and configuring clauses — so that both parties have explicit, locked-in expectations before work begins.**
- [ ] Accepting opens a Contract creation modal automatically
- [ ] Step 1 — type: Content Collaboration / Product Seeding / Talent Engagement
- [ ] Step 2 — clauses by type: deliverable notes, max revision rounds (1–5, default 2), optional kill fee; payment structure/schedule, exclusivity days, usage-rights days (Content/Talent); product disposition + optional payment (Product Seeding)
- [ ] Step 3 — plain-language clause summary before confirmation
- [ ] Platform fee computed and displayed
- [ ] On confirm: contract created in `active`
*FR-20, FR-25 · Rubric: Business Model · Points: 5*

### US-5b (New) — Brand tracks contract execution
**As Rasha (brand), I want to track each contract through a visual state machine, so that I always know status and the correct next action.**
- [ ] States: Active → In Production → Content Submitted → Content Approved → Published → Closed
- [ ] Contextual action per state (Review Content / Close Contract / Leave Review)
- [ ] Revision requests blocked after `max_revision_rounds` (HTTP 409)
- [ ] All transitions timestamped in an audit trail
*FR-21, FR-22 · Rubric: Technical Execution · Points: 3*

### US-5c (New) — Creator tracks their contracts
**As Arif (creator), I want to see each contract's state and the single next action, so that I never miss a deadline or wonder what's expected.**
- [ ] "My Contracts" page lists all contracts with status + a single next-action prompt
- [ ] Creator submits draft URL when `active`/`in_production`; live URL when `content_approved`
- [ ] Out-of-sequence actions are blocked
*FR-21, FR-22 · Rubric: Business Model · Points: 3*

---

## Operations stories

### US-9 (Roadmap) — Bilingual UI toggle
**As a user, I want to toggle the entire UI to Bangla, so that non-English users can work natively.**
- [ ] Today only the LLM rationale **text** localizes
- [ ] Full UI toggle is deferred (roadmap)
*FR (roadmap), NFR-21 · Rubric: Scalability (NRB) · Points: 5 (deferred)*

### US-18 — Operator admin panel
**As an operator, I want a moderation/administration panel, so that I can keep the marketplace trustworthy.**
- [ ] User/role oversight and campaign audit visibility
- [ ] Moderation actions available to operators
*FR-28 · Rubric: Real-World Impact · Points: 3*

### US-21 — Normalization & ethical safeguards
**As the platform, I want normalization and ethical-AI safeguards at ingestion and display, so that the demo is honest and judge-proof.**
- [ ] Normalization middleware (city dictionary, age/gender decoupling, niche-URL map)
- [ ] Incomplete demographics shown as explicit "Uncategorized %", never redistributed
- [ ] Estimated/synthetic fields labelled; real vs estimated stated in the demo
*FR-29 · NFR-15..18 · Rubric: Real-World Impact (Ethical AI) · Points: 5*
