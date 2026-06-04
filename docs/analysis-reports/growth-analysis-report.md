# Strategic Development & Expansion Document

**BuildFest 2026 (MarTech Track): Influencer Matching Engine Challenge** | Version 2.0 (June 2026)

**Overview:** 8 Strategic & Technical Sections | 6 Collaboration Types | 5 Revenue Streams | 5-Phase Roadmap

## 1. Platform Identity & Scope Expansion

### 1.1 From Influencer Platform to Creator & Talent Marketplace

Cohesiq was initially scoped as an influencer matching platform. Based on mentor feedback and strategic review, the platform is being repositioned as a Creator & Talent Marketplace — a broader category that dramatically expands the addressable market and makes the platform relevant to a far wider range of brand needs. The term "influencer" is deprecated across all user-facing surfaces. Cohesiq now uses Talent as the umbrella term, and Creator for social content-oriented profiles specifically. This language shift also makes the platform more credible to B2B buyers (brand marketing managers) who may find "influencer" too casual for enterprise use.

| Talent Type | Primary Use Case | Key Matching Criteria | Example Engagements |
|---|---|---|---|
| Content Creator | Social media campaigns, sponsored posts | Niche, engagement rate, audience demographics, platform presence | Instagram post, YouTube video, TikTok review |
| Event Host / Emcee | Brand events, product launches, galas, award nights | Industry experience, language, presentation style, availability | Annual gala MC, product launch host, awards night |
| Brand Ambassador | Long-term brand representation and sustained advocacy | Brand value alignment, personal brand fit, audience loyalty | Monthly content retainer, seasonal campaigns, brand face |
| UGC Creator | Content produced for brand's own channels and paid ads | Content quality, portfolio, turnaround time, style match | Product photography, ad creative videos, e-commerce listings |
| Speaker / Panelist | Industry events, webinars, conferences, and forums | Expertise area, credentials, speaking history, availability | Conference keynote, panel discussion, webinar presenter |
| Live Stream Host | Live commerce, product demos, brand Q&A events | Streaming experience, live audience interaction rate, platform | Facebook Live sale, product launch reveal, live Q&A session |
### 1.2 Host & Event Talent: A High-Value New Vertical

Event hosting is a particularly high-value vertical that no existing Bangladeshi platform addresses. The corporate events sector — product launches, annual galas, award ceremonies, and brand activations — represents a multi-crore opportunity where brands currently rely on personal connections and agency middlemen with no data, no pricing benchmarks, and no trust infrastructure.

- Separate profile type: Event hosts maintain profiles with event type specializations, language capabilities, verified past event references, and availability calendars rather than social media analytics

- Availability-first matching: Instead of audience-fit scoring, host matching prioritizes date availability, event type alignment, language requirements, and professional experience

- Post-event reputation system: Brands rate hosts after each engagement, building a verified professional track record that compound over time — something no informal hiring process can offer

- High ticket value: A single event hosting booking can be worth BDT 15,000–80,000, generating meaningful platform revenue from a single transaction

### 1.3 Updated Platform Positioning

Old: "An AI-powered influencer matching platform for Bangladeshi brands." New: "Cohesiq is Bangladesh's Creator & Talent Marketplace — connecting brands with the right content creators, event hosts, brand ambassadors, speakers, and UGC talent for any engagement, powered by Graph AI and verified data."

## 2. Architecture & System Design Improvements

### 2.1 Current State Assessment

The existing implementation has a sound technical foundation (FastAPI, PostgreSQL + pgvector, Neo4j, Next.js) but several systemic limitations prevent it from handling multi-talent types, real-world data reliability, and production-grade campaign workflows.

| Problem Area | Current State | Required Fix |
|---|---|---|
| Data Model | Single flat creator table — all talent types identical | Polymorphic profiles: base table + type-specific extension tables |
| Matching Pipeline | Single-pass weighted score on all creators | 5-stage pipeline: hard filter → score → graph check → vector similarity → LLM rationale |
| Data Sources | Synthetic (Llama-generated) and Tavily scrapes only | Real YouTube API public data + proportional synthetic companion profiles for demo |
| Campaign Workflow | Basic create/view — no state machine or milestone tracking | Type-specific state machines with logged timestamps and transition guards |
| LLM Reliability | Occasional hallucination on budget constraints | Deterministic pre-filter handles all hard constraints; LLM handles rationale only |
| API Rate Management | No quota tracking or circuit breakers | Quota budget manager in Redis, circuit breaker at 80% consumption, async job queues |
### 2.2 Polymorphic Talent Data Model

The database schema must be refactored to support type-specific profile attributes without creating a single bloated creator table. A base creator_profiles table holds universal fields; extension tables hold category-specific data.

```
creator_profiles (base): id, display_name, talent_type ENUM, platforms[],
rate_card,
location, bio, verification_status, authenticity_score, created_at
```
```
social_creator_ext: creator_id FK, niche, sub_niches[], engagement_rate,
follower_counts{youtube,instagram,tiktok}, content_language_profile{}
```
```
host_profiles_ext: creator_id FK, event_types[], languages_spoken[],
past_events[], availability_calendar_url, presentation_style
```
```
ugc_creator_ext: creator_id FK, portfolio_urls[], content_formats[],
avg_turnaround_days, style_tags[]
```
```
speaker_ext: creator_id FK, expertise_areas[], credentials[],
talk_titles[], keynote_fee_range, past_speaking_events[]
```

### 2.3 Five-Stage Matching Pipeline

The single most critical architecture change is replacing the flat weighted score with a five-stage pipeline. Each stage acts as a gate, eliminating unsuitable candidates before more expensive operations run. This prevents LLM calls on obviously wrong matches and dramatically improves both speed and result quality.

| Stage | Operation | Purpose | Output |
|---|---|---|---|
| Stage 1 | Hard Constraint Filter | Eliminate wrong talent type, budget violations, platform mismatch, date conflicts. Typical elimination: 80% of pool. | Reduced candidate set for scoring |
| Stage 2 | Weighted Scoring | Score remaining candidates: niche alignment (30%), engagement (20%), budget fit (20%), language (15%), recency (10%), platform coverage (5%). | Ranked list with numeric match scores |
| Stage 3 | Graph Traversal | Neo4j query: has this talent worked with a competitor recently? Penalty applied if conflict detected. Previous successful collaborations get a bonus. | Score adjustments applied |
| Stage 4 | Vector Similarity | pgvector cosine similarity: brand brief embedding vs. talent bio and content embeddings. Semantic alignment bonus added to top-20 candidates. | Final ranked top candidates |
| Stage 5 | LLM Rationale | Gemini generates 2-sentence Bangla/English rationale for top 10 matches only. Never runs on full pool — prevents hallucination from large context. | Ranked results with localized explanation |
### 2.4 Campaign State Machine

Each collaboration type requires an explicit state machine stored as a database enum with logged timestamps per transition. This enables full audit trails, automated milestone triggers, payment automation, and reliable dispute resolution.

| Type | State Transitions |
|---|---|
| Paid Content | DRAFT → PUBLISHED → APPLIED → SHORTLISTED → CONTRACTED → IN_PROGRESS → CONTENT_SUBMITTED → REVISION_REQUESTED → APPROVED → PAYMENT_RELEASED → COMPLETED |
| Talent Booking | DRAFT → PUBLISHED → APPLIED → SHORTLISTED → AVAILABILITY_CONFIRMED → BOOKED → ATTENDED → FEE_RELEASED → RATED → COMPLETED |
| Product Gifting | DRAFT → PUBLISHED → APPLIED → ADDRESS_COLLECTED → DISPATCHED → DELIVERY_CONFIRMED → CONTENT_POSTED → URL_VERIFIED → COMPLETED |
| Affiliate | DRAFT → PUBLISHED → CREATOR_ENROLLED → LINK_GENERATED → ACTIVE → PERFORMANCE_TRACKED → PAYOUT_CALCULATED → PAYOUT_RELEASED → COMPLETED |
| Ambassador | DRAFT → CONTRACTED → MONTH_1_ACTIVE → MONTH_1_SUBMITTED → MONTH_1_APPROVED → MONTH_2_ACTIVE → ... → CONTRACT_COMPLETED |
### 2.5 Data Sync & Rate Limit Management

- All external API calls run in async background workers (Celery or APScheduler) — never blocking the UI thread

- YouTube quota manager in Redis tracks daily unit consumption; circuit breaker halts all Search.list calls (100 units each) permanently — Channel IDs collected only via UI or creator self-submission

- Meta API: parse X-Business-Use-Case-Usage header on every response; exponential backoff triggers at 80% BUC utilization

- Facebook Insights: period=day snapshots only, stored with timestamps; period=lifetime calls blocked at the HTTP client layer to prevent the silent-200-empty-response bug

- Cache layer: Redis caches computed match scores for 6 hours; invalidated on profile update or new campaign brief

- Retry policy: 3 retries with 2s/4s/8s backoff; failed jobs move to dead-letter queue with alert notification

## 3. Campaign & Collaboration Framework

### 3.1 The Six Collaboration Models

Cohesiq must support six distinct models, each with a different value exchange, workflow, tracking mechanism, and platform fee. Brands choose their model during campaign creation; a guided wizard explains the differences and recommends the most suitable type based on their brief.

#### Type 1 — Paid Sponsored Content

Brand pays talent to create and publish content on their own channels. The most common model and the highest-value transaction type for the platform.

- Workflow: Brief published → Talent applies or is matched → Platform contract generated → Talent creates content → Draft submitted for brand review → Approved or revision requested → Published → Post URL submitted → Escrow released within 48 hours

- Tracking: Draft submission timestamp, approval timestamp, published URL, post- publication engagement pulled at Day 7, Day 14, and Day 30 via API

- Platform fee: 10% of campaign value charged to brand at payment release

#### Type 2 — Brand-Produced Content (Talent Booking)

Brand invites talent to their studio or event location. Brand produces and owns the content. Talent is compensated as a performer, not a publisher — no audience reach requirement.

- Workflow: Brand posts talent brief with shoot details and date → Talent applies → Availability calendar checked → Booking confirmed → NDA/exclusivity terms agreed → Talent attends → Brand confirms attendance → Talent fee released

- Tracking: Booking confirmation, attendance flag (manually set by brand), talent fee invoice reference, exclusivity period end date

- Platform fee: 10% of talent fee. Key difference from Type 1: brand takes full IP ownership and publishes on its own channels. No content review workflow needed.

#### Type 3 — Product Gifting / Seeding

Brand sends physical products. No monetary transaction. Creator may review organically; brand can set optional compliance requirements for posting.

- Workflow: Brand creates gifting campaign with product description and value → Creator applies → Shipping address collected via encrypted form → Product dispatched with tracking ID → Delivery confirmed → Creator posts (if agreed) → Post URL submitted and verified against brand guidelines → Campaign closed

- Tracking: Shipment tracking ID, delivery confirmation timestamp, post URL, engagement on post (optional audit). Platform stores product value for brand internal records.

- Platform fee: No transaction fee — no money changes hands. Gifting campaigns gated behind the Growth subscription plan, incentivizing upgrades from free tier.

#### Type 4 — Affiliate Marketing

Creator earns commission on sales or conversions they drive. No upfront payment from brand. Highest alignment between creator incentive and brand ROI.

- Workflow: Brand sets commission rate and conversion window → Creator joins program → Platform generates unique UTM link and/or promo code per creator → Creator promotes organically → Clicks and conversions tracked via conversion webhook from brand e-commerce system → Monthly earnings calculated → Payout disbursed via bKash/Nagad on a defined schedule

- Tracking: UTM click events (via platform redirect proxy), conversion webhooks (brand implements a pixel or API call to Cohesiq on each sale), cumulative earnings ledger per creator, monthly payout records with transaction IDs

- Platform fee: 5% of commission earned, deducted from creator payout. Low rate reflects that the value delivered is tracking infrastructure, not escrow.

- Integration requirement: Brand must implement a conversion webhook. Platform provides documentation, a test sandbox, and integration support on Scale plan and above.

#### Type 5 — Hybrid Campaign

Combines a guaranteed flat fee with performance-based affiliate commission. Reduces creator financial risk while maintaining brand ROI incentive.

- Example: BDT 3,000 flat fee + 8% affiliate commission. Platform handles both components independently: escrow for flat fee, commission ledger for affiliate portion.

- Platform fee: 10% on flat fee component at release + 5% on affiliate commissions. Each component tracked separately in the ledger.

#### Type 6 — Brand Ambassadorship

Long-term monthly retainer. Creator represents the brand over multiple months with recurring deliverables. Highest lifetime value engagement type for the platform.

- Workflow: Brand creates ambassador brief with monthly deliverables list → Creator applies → Multi-month contract signed on platform → Monthly submissions tracked → Monthly fee released upon deliverable approval → Contract auto-renews unless cancelled by either party with notice period

- Tracking: Monthly deliverable list (brand-defined), submission per deliverable, approval status, payout history for each month, total contract value and remaining balance

- Platform fee: 5% of monthly retainer — reduced rate rewards long-term engagement and incentivizes brands to use the platform for sustained relationships

### 3.2 Platform Fee & Charging Summary

| Campaign Type | Fee Rate | Fee Basis | Notes |
|---|---|---|---|
| Paid Sponsored Content | 10% | Transaction value | Charged to brand at escrow release |
| Talent Booking | 10% | Talent fee | Charged to brand at fee release |
| Product Gifting | Subscription-gated | Monthly plan | Growth plan required; no per-campaign fee |
| Affiliate Marketing | 5% | Commission earned | Deducted from creator payout monthly |
| Hybrid Campaign | 10% + 5% | Split structure | 10% on flat fee; 5% on affiliate commissions |
| Brand Ambassadorship | 5% | Monthly retainer | Charged to brand monthly; reduced rate for loyalty |

## 4. Business Model & Monetization Strategy

### 4.1 Core Principle: Brands are the Revenue Engine

Brands are Cohesiq's primary clients and the sole source of revenue. Every product decision should be evaluated against one question: does this make Cohesiq more valuable to brands? Creators benefit from discovery, trust infrastructure, and payment protection — but should not bear significant cost until the platform has proven undeniable value to them.

### 4.2 Three-Phase Revenue Introduction

#### Phase 1 — Free Access (Months 0–6)

All features available for free. Zero revenue. This is deliberate: the platform needs supply (creators) and demand (brands) before charging either. Marketplace businesses that charge too early before reaching critical mass fail at the network effect stage.

#### Phase 2 — Transaction Fees Only (Months 7–18)

Introduce a 15% transaction fee on all monetary campaigns. This is intentionally set high. Reasoning: (a) brands only pay when they receive value; (b) the 15% rate creates a psychological anchor — subscription plans introduced later feel like a discount by comparison; (c) occasional users on the free tier subsidize platform costs.

#### Phase 3 — Subscription Tiers + Reduced Transaction Fees (Month 19+)

Subscription tiers lower the transaction fee, creating a clear ROI case for brands running more than 2-3 campaigns per month. The cross-over point where subscribing is cheaper than paying per transaction is the primary sales argument.

### 4.3 Subscription Tier Structure

| Feature | Starter (Free) | Growth BDT 2,499/mo | Scale BDT 5,999/mo | Enterprise Custom |
|---|---|---|---|---|
| Active Campaigns/mo | 2 | 10 | Unlimited | Unlimited |
| Transaction Fee | 15% | 10% | 8% | 5% (negotiated) |
| Campaign Types | Paid only | Paid + Gifting | All six types | All + custom |
| Analytics | Basic | Advanced | Full suite + export | Custom reports + API |
| Authenticity Audits | 3/month | 20/month | Unlimited | Unlimited |
| Affiliate Tracking | No | No | Yes | Yes + webhook API |
| Support | Community | Email 48h | Priority 12h | Dedicated manager |
| Event Host Booking | No | Yes | Yes | Yes |
### 4.4 Additional Revenue Streams

| Feature | Price | Description |
|---|---|---|
| Authenticity Audit Report | BDT 300/report | On-demand deep trust score with engagement anomaly breakdown for any creator profile |
| Creator Comparison | BDT 150/comparison | Side-by-side comparison of 2-3 creators with AI-generated recommendation for the brand's specific brief |
| Campaign Boost | BDT 500/week | Featured placement at the top of the creator opportunity feed; increases application volume |
| Verified Creator Badge | BDT 200/month (creator-paid) | Only revenue stream charged to creators. Enhanced profile visibility and trust badge. Incentivizes creators to maintain quality profiles. |
| Analytics Export | BDT 500/export | Campaign performance data export to Excel/PDF for brand internal reporting and board presentations |
### 4.5 Break-Even & Projection Model

Conservative monthly projections based on gradual ramp-up, assuming an average paid campaign value of BDT 12,000 and a mix of subscription and transaction revenue from Month 19 onward.

| Metric | End Year 1 | End Year 2 | End Year 3 |
|---|---|---|---|
| Active Brands (monthly) | 150 | 600 | 2,000 |
| Active Creators | 800 | 3,500 | 12,000 |
| Campaigns Completed/month | 80 | 400 | 1,000 |
| Avg. Campaign Value (BDT) | 12,000 | 18,000 | 25,000 |
| Est. Annual Revenue (BDT) | 10-20 Lakh | 80L - 1.5 Crore | 3-5 Crore |

## 5. Platform Interactivity & UX Design

### 5.1 Design Philosophy

Cohesiq must feel both professional enough for brand marketing managers and accessible enough for independent creators. The UX must follow progressive disclosure: simple and clear on the surface, with power features revealed as users go deeper. The platform must also feel alive — a static directory is not a marketplace. Vitality signals matter enormously for two-sided platforms.

### 5.2 Brand-Side Experience

- Campaign Wizard: A four-step guided flow — Campaign Type selection → Talent Requirements → Budget and Timeline → Brief and Assets. Each step validates before advancing. The wizard dramatically reduces campaign creation abandonment.

- AI Brief Generator: Brand types a short description in Bangla or English. Gemini extracts and pre-fills campaign parameters: niche, target demographics, content format, estimated budget range, and suggested talent tier. One click from idea to structured campaign.

- Live Creator Discovery Panel: Matched creator grid updates in real time as the brand adjusts filters. Match score displayed as a visual meter (0-100). Clicking a creator opens a full-screen profile drawer without leaving the page — no navigation interruption.

- Campaign Dashboard: Kanban-style board with status columns (Applied, Shortlisted, In Progress, Content Review, Completed). Drag-and-drop shortlisting. Color-coded deadlines.

- ROI Summary Card: Homepage widget showing total campaigns, cumulative reach delivered, total spend, and estimated ROI based on BDT-per-engagement benchmarks across completed campaigns.

- Notification Center: Real-time toasts and an inbox for new applications, content submissions awaiting review, overdue milestones, and payout confirmations.

### 5.3 Creator and Talent-Side Experience

- Opportunity Feed: Personalized list of open campaigns matching the creator's profile, sorted by match score. Filterable by type, niche, budget range, and deadline. Creators should feel like opportunities are coming to them, not that they need to hunt.

- Earnings Dashboard: Real-time view of pending, cleared, and projected earnings with payout schedule, history by campaign, and a simple monthly earnings chart.

- Profile Strength Meter: Gamified progress indicator showing what profile data is incomplete and how each addition improves match score. Completing all sections unlocks a "Complete Profile" badge that signals reliability to brands.

- Rate Card Benchmark Widget: Shows median rates for creators of similar tier and niche on the platform. Helps creators price fairly and prevents the race-to-the-bottom that plagues informal Bangladesh creator markets.

- Application Status Tracker: Status of all submitted applications with estimated decision timelines. Creators frequently complain about ghosting — this transparency builds platform loyalty.

### 5.4 Platform-Wide Engagement & Vitality Features

- Trending Creators: Weekly-refreshed leaderboard of creators with the fastest-growing engagement rates, calculated from stored API snapshots. Brands use this as a discovery shortcut; creators aspire to appear on it.

- Creator Spotlight: One featured talent per week selected by platform editors. Displayed prominently on the brand homepage. Creates aspiration for creators and gives brands a curated starting point.

- Campaign Showcase: Anonymized case studies of successful campaigns with real outcome metrics (reach, engagement, ROI multiplier). Updated monthly. Builds brand confidence in platform ROI.

- Live Activity Feed: "43 campaigns live right now | 218 active creators | 12 campaigns completed this week" — updated daily with real numbers. Signals platform vitality and social proof.

- Niche Leaderboards: Top 5 creators per niche on each category landing page. Incentivizes creators to specialize and produce quality content consistently.

- Bangla Language Toggle: Full Bangla UI mode across all pages. Non-negotiable for creator onboarding from non-English-speaking backgrounds — a critical driver of platform supply growth.

## 6. Quality-of-Life Features

### 6.1 Overview

The following five features add meaningful brand utility without requiring complex new infrastructure. Each is implementable within 1-4 days using the existing platform stack. They collectively position Cohesiq as a professional tool rather than a basic discovery directory — directly differentiated from HypeScout and informal WhatsApp-based matching.

| Feature | What It Does | Build Time | Implementation Path |
|---|---|---|---|
| Authenticity Auditor | Computes a 0-100 trust score from engagement rate vs. tier benchmark, follower growth Z-score, and comment-to-like ratio. Generates plain-language flag explanations. | 2-3 days | YouTube public API + statistical computation + Gemini summary generation |
| Creator Comparison | Side-by-side table for 2-3 creators on followers, engagement, match score, niche, authenticity, and rate. AI generates a one-paragraph recommendation for the brand's specific brief. | 3-4 days | Existing DB + pgvector cosine similarity + Gemini comparative rationale |
| Budget & ROI Calculator | Brand inputs budget (BDT), niche, platform. Outputs: creator tier options affordable, estimated total reach, estimated engagement count, projected ROI. | 1-2 days | Pure frontend computation using tier benchmarks. Zero API calls required. |
| AI Brief Analyzer | Brand pastes free-text brief. Gemini extracts: niche category, target audience demographics, suggested content format, budget range, timeline. Auto-populates campaign creation form. | 2-3 days | Gemini API with structured JSON output schema. Direct form pre-fill via state management. |
| Rate Card Benchmark | Shows median and range rates for creators by tier and niche. Helps brands budget accurately and helps creators price fairly. Seeded with market research initially, enriched by platform data over time. | 1 day | Aggregation query on rate_cards table + simple chart component. No external API. |
### 6.2 Authenticity Auditor — Implementation Detail

This is the highest-priority QoL feature because fake followers are the #1 brand pain point, and no existing Bangladeshi platform addresses it. The implementation uses only public data and free statistical methods.

Signal 1 — Engagement rate check:
Compute avg(likes + comments) / avg(views) for last 10 videos.
Compare vs. tier benchmark (Nano: 5%, Micro: 3.86%, Macro: 1.5%).
Flag if below 50% of tier benchmark. Weight: 40%

Signal 2 — Follower growth spike detection:
Store subscriber count snapshots every 48 hours.
Compute Z-score of growth deltas. Z > 3.0 triggers spike flag.
Weight: 30%

Signal 3 — Comment quality scoring:
Sample 20 comments from recent videos.
Gemini prompt: "Rate these as genuine vs. bot (0.0-1.0 per comment)."
Average score becomes comment quality signal. Weight: 30%

Final Trust Score = weighted composite (0-100).
Output: score + flag labels + plain-language explanation for brand.

## 7. Demo Data Strategy — Real YouTube API Integration

### 7.1 Strategy

For the BuildFest demonstration, Cohesiq will seed its database with real creator data from YouTube using the public Data API v3 (no OAuth required, no compliance audit needed), combined with proportionally generated synthetic companion profiles for Instagram and TikTok. This provides verifiable, real-world data for demo day without depending on API approvals that cannot clear in time.

### 7.2 Setup Prerequisites

- Create a dedicated Google Cloud project (do not use a personal account — keep demo infrastructure isolated)

- Enable the YouTube Data API v3 in the Cloud Console under APIs & Services
- Create an API Key credential. Restrict to YouTube Data API v3 scope. For development, leave IP unrestricted; lock to server IP before production.

- Daily quota: 10,000 units. The entire seeding operation for 20 creators costs approximately 41 units — well within the free allowance.

### 7.3 Target Channel Selection (18-20 Real BD Channels)

Manually browse YouTube using the search terms below to identify real Bangladeshi channels in each niche. Record their Channel IDs from the URL or the About page. Do not use Search.list API calls for this — use YouTube's own search UI. This costs zero quota.

| Niche | Target Count | YouTube Search Terms to Use Manually |
|---|---|---|
| Food & Cooking | 3-4 | "bangla ranna recipe", "Bangladeshi food vlog", "Dhaka street food", "ranna ghor" |
| Tech & Gadgets | 3-4 | "Bangladesh tech review", "bangla tech", "gadget review BD", "smartphone review Bangla" |
| Fashion & Lifestyle | 3-4 | "Bangladesh fashion vlog", "Dhaka lifestyle", "fashion haul BD", "beauty tips Bangla" |
| Travel & Vlog | 3-4 | "Bangladesh travel vlog", "Dhaka travel", "Cox's Bazar vlog", "sylhet travel bangladesh" |
| Gaming | 3-4 | "Bangladesh gaming channel", "bangla gaming", "PUBG Mobile BD", "Free Fire BD" |
### 7.4 Step-by-Step API Integration

#### Step 1 — Build seed_channels.json

Create a JSON file with the Channel IDs you collected manually. This file is your source of truth. No API calls needed yet.

```
{ "channels": ["UCxxxxxxxxxxxxxxxxxxxxxxx", "UCyyyyyyyyyyyyyyyyyyyyyyy", ...] }
```
#### Step 2 — Batch Fetch Channel Stats (1 quota unit for all 20)

```
GET /youtube/v3/channels
?part=snippet,statistics,topicDetails,contentDetails
&id=UCxxx,UCyyy,UCzzz (comma-separate all IDs, up to 50 per call)
&key=YOUR_API_KEY
```
```
Returns per channel: title, description, subscriberCount, videoCount,
viewCount, topicCategories[], uploadsPlaylistId
```
#### Step 3 — Fetch Recent Video Engagement (2 quota units per channel = 40 units total)

```
# Get last 10 video IDs from uploads playlist — 1 unit per channel
GET /youtube/v3/playlistItems
?part=contentDetails&playlistId=UPLOADS_PLAYLIST_ID&maxResults=
```
```
# Get engagement for all 10 videos in one call — 1 unit per channel
GET /youtube/v3/videos
?part=statistics&id=vid1,vid2,vid3,...,vid
```
```
# For Shorts-heavy channels, use engagedViews not viewCount
```
#### Step 4 — Map to Cohesiq Creator Schema

```
engagement_rate = avg(likes + comments) / avg(views) # last 10 videos
niche = YOUTUBE_CATEGORY_MAP[topicCategories[0]]
# Map Wikipedia URLs to internal taxonomy:
# ".../Technology" → "technology"
# ".../Fashion" → "fashion" | ".../Food" → "food"
tier = "nano" if subs < 10000 else "micro" if subs < 100000 else "macro"
language = fasttext.detect(channel["snippet"]["description"])
# fasttext handles Bengali reliably; install free from HuggingFace
```
#### Step 5 — Generate Proportional Synthetic Companion Data

For each real YouTube creator, generate synthetic Instagram and TikTok profiles using proportional ratios based on typical BD cross-platform patterns. Flag all synthetic fields in the database with data_source = "estimated".

```
instagram_followers = youtube_subscribers * uniform(0.30, 0.60)
instagram_engagement = youtube_engagement * uniform(0.80, 1.30)
tiktok_followers = youtube_subscribers * uniform(0.20, 1.50) # high variance
```
```
# NEVER display synthetic fields without the "Estimated" label in UI
# Verified fields (from YouTube API): show green checkmark
# Synthetic fields: show grey "Estimated" tag
```
#### Step 6 — Seed Neo4j Graph & Pre-Run Demo Matching

- Create :Creator nodes from all 18-20 seeded profiles
- Create :Niche nodes for each category (Fashion, Food, Tech, Travel, Gaming)
- Create WORKS_IN relationships from niche assignments

- Create 5 test :Brand profiles with realistic BDT budgets and campaign briefs — one per niche

- Pre-run the matching engine against all test brands and verify results look sensible before demo day. If any matching result is clearly wrong, debug the scoring weights before the event.

### 7.5 Quota Budget Summary

| Operation | API Calls | Units/Call | Total |
|---|---|---|---|
| Channels.list — batch all 20 channels in one call | 1 | 1 | 1 |
| PlaylistItems.list — get 10 recent video IDs per channel | 20 | 1 | 20 |
| Videos.list — get engagement data per channel batch | 20 | 1 | 20 |
| **TOTAL** | **41** | **—** | **41 of 10,000 daily** |
The entire seeding operation consumes 0.4% of the daily quota, leaving 9,959 units for live refreshes during demo day. If a judge asks to add a new creator on the spot, fetching that channel costs 3 units.

## 8. Future Plans & Growth Roadmap

### 8.1 Strategic North Star

Cohesiq's long-term vision is to become the standard infrastructure layer for brand-talent engagement across South and Southeast Asia — the platform brands use to find, vet, contract, track, and pay any type of marketing talent, regardless of platform or engagement format. Bangladesh is the foundation, not the ceiling.

### 8.2 Phased Growth Plan

| Phase | Timeline | Key Milestones | Revenue Target |
|---|---|---|---|
| 1 — Launch | Months 0-6 | 500 creators, 100 brands, 200 campaigns. YouTube-verified data live. Free access to all. | BDT 0 — network effect building |
| 2 — Monetize | Months 7-18 | Transaction fees introduced. Instagram/TikTok OAuth live. Gifting and affiliate campaign types added. Mobile optimization. | BDT 15-30 Lakh from transaction fees |
| 3 — Scale | Months 19-36 | Subscription tiers launched. Event hosting module. Ambassador contracts. Analytics suite. 2,000 creators, 500 active brands. | BDT 80L - 1.5 Crore annually |
| 4 — Regional | Months 37-60 | India (Bengali diaspora first), Pakistan, Sri Lanka, Nepal. Multi-currency. Enterprise tier. Agency white-label option. | BDT 3-8 Crore run rate |
| 5 — Southeast Asia | Year 5+ | Indonesia, Vietnam, Philippines, Thailand. Full multilingual support. Predictive ROI modeling. Data products for market research. | Category-defining regional platform |
### 8.3 Defensible Competitive Moat

- Network effects: Every brand and creator that joins makes the platform more valuable. Early market entry in an uncontested market is irreplaceable — the first structured platform in the Bangladesh creator economy owns the default position.

- Proprietary data: Campaign performance outcomes, creator reputation scores, and audience matching accuracy become a dataset no competitor can replicate without years of local market presence. Global platforms cannot buy this with money.

- Local payment rails: Deep bKash/Nagad integration and BDT-native pricing are not plug- and-play for foreign platforms. This is a technical and regulatory moat.

- Bengali NLP infrastructure: Content classification, comment sentiment, and rationale generation in Bangla and Banglish is months of work that global platforms have not prioritized for this market.

- Two-sided trust: Verified creator profiles, escrow payments, dispute resolution, and a growing review system create genuine switching costs for both brands and creators once they have history on the platform.

### 8.4 Exit & Scale Scenarios

- Acquisition: Regional influencer platforms (Qoruz, Aspire, Modash) expanding to South Asia would acquire a market-ready platform with local creator data rather than build from scratch. Bangladesh entry via acquisition is faster than organic build.

- Venture-backed scale: With demonstrated GMV growth and unit economics, a Series A raise would fund Southeast Asia expansion and advanced product development (predictive ROI, white-label).

- Strategic partnership: bKash, Nagad, or a major telecommunications company could become a strategic investor, providing distribution leverage across their existing merchant and user networks.

- Data product spin-off: Aggregated, anonymized audience and campaign performance data has standalone value for consumer goods brands, market research firms, and media buyers operating in Bangladesh.

#### Cohesiq — Build Locally. Connect Nationally. Scale Globally.

```
The Infinity AI BuildFest 2026 | MarTech Track | Version 2.0
```

