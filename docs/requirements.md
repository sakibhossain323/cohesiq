# requirements.md — Cohesiq

## Project Identity

**Name:** Cohesiq
**Elevator Pitch:** Discover influencers precisely picked for your brand niche
**Domain:** Branding & Marketing (MarTech)
**Challenge:** Influencer Matching Engine
**Track:** BuildFest 2026 — The Infinity AI BuildFest

---

## Challenge Definition

> "This challenge is designed for teams who want to build systems that connect
> brands with suitable creators based on audience fit, authenticity, trust signals,
> and campaign relevance. The solution should go beyond simple follower counts and
> focus on deeper compatibility, credibility, and creator-brand alignment. Strong
> solutions will show reliable matching logic, use of social or creator ecosystem
> data, and a clear trust-based approach to influencer selection."

**Required Stack:** Full stack + Graph AI
**Winning Formula:** Matching accuracy
**Primary Focus:** Trust and authenticity — not just follower counts

---

## What the Judges Evaluate

| Criteria | Weight | What It Means for Cohesiq |
|---|---|---|
| Innovation | 20% | Graph-based matching + authenticity scoring beyond follower count |
| Technical Execution | 20% | Working system: creator profiles → matching engine → ranked results |
| Business Model + Global Readiness | 20% | BDT-priced SaaS, BD-first, SEA expansion roadmap |
| Real-World Impact + Ethical AI | 20% | Solves real BD market gap, opt-in data only, no scraping |
| Scalability + NRB Collaboration | 10% | Platform architecture that grows with creator supply |
| Presentation | 10% | The 180-second video |

---

## Demo Video Requirements

The preliminary submission requires a **3-minute (180-second) structured video** uploaded
to YouTube as Public or Unlisted. Structure every feature built around this narrative.

### Required Segments

| Time | Segment | What Must Be Shown | Key Message |
|---|---|---|---|
| 0:00–0:30 | Problem | The BD influencer matching problem: brands find creators manually via DM, no metric verification, no structured platform | "This problem matters" |
| 0:30–1:00 | Solution | Cohesiq — AI-powered matching platform, brand posts brief, system recommends ranked creators with rationale | "This is how we solve it" |
| 1:00–2:00 | Demo / Concept Flow | Live walkthrough: brand submits brief → matching engine runs → ranked creator cards with scores and AI rationale appear | "This is how it works" |
| 2:00–2:30 | AI Approach | Graph matching (Neo4j), LLM rationale (Gemini), engagement scoring, content classification | "This is real AI thinking" |
| 2:30–3:00 | Impact & Next Steps | BD market size ($30.4M), HypeScout as existing proof of market, Cohesiq's differentiation, Phase 2 roadmap | "We can build and scale this" |

### Mandatory Checklist (every item must appear in the video)

- [ ] Clear problem statement with Bangladesh + global relevance
- [ ] AI-native approach visible: LLM + Graph + scoring model
- [ ] System flow shown: input → AI → output (brand brief → match results)
- [ ] Working demo, prototype, or workflow walkthrough (early-stage is acceptable)
- [ ] Bangla language consideration visible somewhere in the UI
- [ ] Defined KPIs or expected outcomes stated

### What Gets You Selected

- **Clarity** — every person watching must understand what Cohesiq does in 30 seconds
- **AI Thinking** — the reasoning behind why Graph AI was chosen must be explicit
- **Feasibility** — the demo must show a real working interface, not slides
- **Structure** — follow the 30/30/60/30/30 second breakdown exactly
- **Energy** — confident delivery, ownership of the idea

### Common Mistakes to Avoid

- Showing only slides with no working system
- Explaining AI in vague terms ("we use advanced AI to match")
- Demonstrating features that are not yet built
- Forgetting to mention Bangla / localization
- Not stating specific KPIs or impact numbers

---

## Features Required for Demo Day

These are the minimum features that must be working and visible in the video.
Everything else is iterative.

### Must Work (Demo Blockers)

**1. Creator Registration and Profile**
A creator can register, fill in their display name, niche, city, and add at least
one platform profile (YouTube channel URL, follower count, engagement metrics).
This is the supply side — without creators in the system, matching cannot be shown.

**2. Brand Registration**
A brand can register with a name, industry, and description.

**3. Campaign Brief Submission**
A brand can create a campaign: title, description, niche, budget per creator (BDT),
required platform, target language. This is the input to the matching engine.

**4. Matching Engine Output**
After a brand submits a campaign brief, the system returns a ranked list of creators
with a visible match score and a short AI-generated rationale per creator. This is the
core demo moment — it must work end to end.

**5. Creator Cards with Score Breakdown**
Each result card shows: creator name, platform, follower count, engagement rate,
niche, match score (as a percentage), and the LLM-generated rationale paragraph.
Score breakdown showing individual component scores (niche, engagement, budget fit)
must be visible — this demonstrates "beyond follower counts" to judges.

**6. Bangla Language Presence**
At least one visible instance of Bangla text in the UI — either the LLM rationale
can be generated in Bangla, or the interface has a Bangla/English toggle, or
creator content language is displayed as "বাংলা". This satisfies the localization
requirement without requiring full Bangla translation of the UI.

### Should Work (Strengthens Demo)

**7. Authenticity Score**
A visible authenticity indicator on each creator card — even a simple
"High / Medium / Low" label derived from engagement rate vs. tier benchmark.
This directly addresses the challenge's "trust and authenticity" requirement.

**8. Creator Browse with Filters**
Brand can browse creators filtered by niche, platform, follower range.
Shows the platform has data, not just a matching algorithm in isolation.

### Nice to Have (Not Required for Video)

- Application flow (creator applies, brand shortlists)
- Review submission
- Multi-platform profiles (Instagram, Facebook)

---

## AI Components — What Must Be Implemented and Explainable

The judges require a clear explanation of the AI approach. Every component below
must exist in the codebase so it can be honestly demonstrated and explained.

### Component 1: Graph-Based Matching (Neo4j)

**What it does:** Stores creator-niche-brand relationships as a graph.
Matching query traverses: Campaign niche → Creator nodes in that niche →
filtered by budget, platform, follower range → ranked by composite score.

**Why graph and not SQL:** Multi-hop relationship queries — conflict-of-interest
detection ("has this creator worked with a competitor brand in the last 90 days")
and lookalike discovery are graph traversals, not joins.

**What to show in demo:** A Cypher query running in the background, or simply
state "our matching engine uses a knowledge graph to find compatible creators."

### Component 2: LLM Match Rationale (Gemini 2.5 Flash — free tier)

**What it does:** After scoring, Gemini generates a 2-3 sentence explanation
in English or Bangla: why this creator is a good fit for this specific campaign.

**Why LLM and not a template:** The rationale is personalized to the specific
brand brief + creator profile combination. Two different campaigns matching the
same creator produce different rationale text.

**What to show in demo:** The rationale paragraph appearing on the creator card.
Explicitly say "this explanation was generated by Gemini based on brand brief
and creator profile."

### Component 3: Content Niche Classification (Gemini)

**What it does:** When a creator submits their YouTube channel URL and video titles,
Gemini classifies their primary niche and sub-niches, and detects the language profile
(Bangla/English/Banglish ratio).

**Why this matters:** Creators self-report their niche but the LLM cross-verifies
it against their actual content — this is the "credibility" layer.

**What to show in demo:** After a creator connects their YouTube channel,
show the auto-detected niche appearing on their profile.

### Component 4: Engagement Authenticity Scoring (Rule-Based ML)

**What it does:** Computes an authenticity score from publicly available metrics:
engagement rate vs. tier benchmark, comment-to-like ratio, posting consistency.
Flags accounts with engagement rates far below the tier average (bot inflation signal).

**Why this matters:** Directly addresses the challenge requirement to "go beyond
simple follower counts."

**What to show in demo:** The authenticity score badge (High/Medium/Low or 0-100)
on each creator card. State "this score is calculated from engagement patterns,
not just follower count."

### System Flow to State Explicitly in the Video

```
Brand submits campaign brief (niche + budget + platform + language)
        ↓
Gemini parses brief → extracts structured requirements
        ↓
Neo4j graph query → finds creators in matching niche
        ↓
Scoring engine → ranks by engagement, budget fit, language, recency
        ↓
Gemini generates match rationale per top 10 creators
        ↓
Brand sees ranked creator list with scores and AI explanations
```

This is the "input → AI → output" flow the judges require.

---

## Localization Requirements

The challenge awards points for Bangla consideration. Implement at minimum:

1. LLM rationale can be requested in Bangla — add a toggle on the match results page:
   "Rationale language: English / বাংলা"
2. Creator content language displayed on profile: "Content Language: বাংলা (65%)"
3. Campaign brief form includes "Target Language" field with বাংলা as default option

Full UI translation is not required. These three points satisfy the requirement.

---

## KPIs and Impact to State in the Video

Use these verified figures when stating impact:

- Bangladesh influencer advertising market: **$30.4M (2024) → $45.3M (2028)**
- BD micro-influencer engagement rate: **3.86%** vs mega influencer 1.21%
- Global influencer fraud losses: **$4.6B/year** (Cohesiq's authenticity scoring addresses this)
- Existing BD incumbent: HypeScout (pre-seed, $280K raised) — validates market
- Cohesiq's differentiation over HypeScout: Graph AI matching + LLM rationale +
  cross-platform analytics + Bengali NLP authenticity scoring

State this as the impact: *"Cohesiq reduces brand-influencer matching time from
days of manual DM research to under 60 seconds, while adding verified engagement
authenticity that no existing BD platform provides."*

---

## Demo Seed Data Requirements

The demo must not show an empty system. Before recording the video, the database
must contain:

- Minimum **10 creator profiles** across at least 3 niches (technology, food, fashion)
- Each creator has at least one platform profile with follower count and engagement metrics
- Minimum **2 brand profiles**
- Minimum **1 active campaign brief** ready to run matching against
- The matching engine must return at least **5 ranked results** with rationale text

Use real public YouTube channels as the basis for creator profiles. Find channels
manually, copy their public stats (subscriber count, average views), and enter them
as self-reported data. This keeps the demo honest while being fully functional.

---

## What the Coding Agent Must Prioritize

Build in this order. Stop and record the demo video as soon as Step 4 is complete.
Everything after that is iterative improvement.

```
Priority 1 — Creator profile + manual platform stats entry (supply side)
Priority 2 — Brand registration + campaign brief form (demand side)
Priority 3 — Matching engine: score function + Neo4j graph query (core AI)
Priority 4 — Match results page: ranked cards + score breakdown + LLM rationale
Priority 5 — Authenticity score badge on creator cards
Priority 6 — Bangla rationale toggle
Priority 7 — Creator browse with filters
Priority 8 — Application flow (creator applies, brand manages)
Priority 9 — Reviews
```

The demo video only requires Priority 1 through 4 to be complete.
Do not delay recording because Priority 5-9 are unfinished.

---

*This file defines what Cohesiq must be on demo day. agents.md defines how to build it.
schema.md defines the data model. These three files are the complete specification.*
