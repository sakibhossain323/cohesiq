# Cohesiq: Executive Summary

## 1. Project Overview
**Cohesiq** is a modern B2B SaaS Influencer Matching Platform designed to bridge the gap between brands and creators in the South Asian ecosystem, starting with Bangladesh. Unlike first-generation platforms that prioritize expensive mega-celebrities and flat-fee brand awareness, Cohesiq empowers small-to-micro businesses (SMBs) to discover, vet, and partner with authentic content creators based on deep compatibility, verified audience tiers, and strict BDT budget constraints.

---

## 2. Market Analysis & Opportunity
*Source: `docs/feasibility-analysis-summary.md` (Fact-verified via Gemini Deep Research, May 23, 2026)*

### 2.1 Worldwide Market Size & Growth
The global influencer economy is expanding rapidly, demonstrating high ROI and strong compound annual growth rates (CAGR).

| Metric | Verified Figure | Source |
|---|---|---|
| Global influencer marketing (2025) | ~$32.55B | IMH Benchmark Report |
| Global platform market (2032) | $103.79B | Straits Research |
| Global platform CAGR | 30.6–32.7% | Straits Research / Multiple |
| Average ROI per $1 spent | $5.78 | Nielsen |

### 2.2 Existing Solutions vs. The Market Gap
Current global platforms focus on enterprise clients, leaving a massive gap for SME-accessible solutions in emerging markets. 

| Platform | Pricing Model | BD Support | Key Limitation for Local Market |
|---|---|---|---|
| GRIN / Aspire | $999–$2,000+/mo | No | USD pricing & annual lock-in inaccessible to SMEs |
| Collabstr / Modash | Free to $299/mo | Minimal | Analytics paywalled, no local payment layer |
| **HypeScout (BD Incumbent)** | BDT-priced | Full | First-gen platform; lacks deep Graph AI matching, Bengali NLP, and cross-platform analytics |

### 2.3 The Bangladesh Market & Potential Solution
- **The Gap:** The Bangladesh influencer advertising market is projected to reach **$45.3M by 2028**. However, the current landscape is chaotic. Brands hunt manually via DMs. Fraud is rampant (49% of Instagram accounts exhibit fraud globally), and engagement rates actually *drop* for larger accounts (Mega: 1.21% vs. Micro: 3.86%). 
- **Our Solution:** A two-sided marketplace (similar to Upwork) utilizing Graph AI to perform multi-hop matching, vector embeddings for semantic alignment, and Bengali NLP for comment authenticity scoring. A built-in escrow ledger (bKash) protects transactions and ensures trust.

---

## 3. Initial Execution Plan & API Constraints
*Source: `docs/plan.md`, `docs/data-availability-summary.md`*

**Strategic Approach**
Our initial execution plan revolves around using the **YouTube Data API v3** to actively fetch creator data, video performance metrics, and audience demography to feed our matching engine and build detailed creator profiles.

**Core Matching Engine Components:**
- **Deterministic Math:** A matching algorithm weighting Niche Alignment (30%), Audience Fit (25%), Budget (20%), Engagement Quality (15%), Platform (5%), and Authenticity (5%).
- **LLM Rationale:** For every match, the LLM generates a 2-3 sentence rationale (in English or Bengali) explaining exactly *why* this creator fits the brand's specific brief.
- **Graph Traversal:** Neo4j enables complex conflict-of-interest checks (e.g., "Has this creator worked with a competitor recently?") and lookalike audience discovery.

**API Constraints & Technical Realities:**
To implement this effectively, we must navigate several hard API limitations:
- **Meta Graph API Constraints:** 
  - OAuth is strictly required for almost all meaningful demographic data extraction.
  - The App Review process is rigorous, taking 18-20 working days, and mandates formal Business Verification (PPCA authorization).
  - *Critical Blocker:* In development mode, we cannot access real audience data. Furthermore, Meta has currently temporarily blocked API access for unverified applications.
  - Instagram's demographic API enforces a hard minimum of 100 followers and only returns the top 45 segments, meaning complete demographic profiles for nano-influencers are structurally impossible to obtain.
  - Facebook's "lifetime" period parameter for audience analytics is deprecated; we must warehouse daily demographic snapshots from day one because backfilling historical data is no longer supported.
- **YouTube API Daily Limits:** We are constrained by a hard limit of 10,000 quota units daily. Importantly, the Search endpoint costs 100 units per call, making it entirely unviable for proactive creator discovery at scale.
- **YouTube Audience Demographics:** The YouTube Analytics API requires a strict CASA Tier 2 security audit (taking 4-8 weeks) before we can access vital audience demographic data.

---

## 4. Current Progress & Implementation
*Source: `docs/submittable.md`*

Cohesiq is currently operational in a local Docker Compose environment, with significant progress on both the AI engine and the frontend UI.

**Current Architecture Stack:**
- **Backend:** Modular Monolith using FastAPI (Async), SQLAlchemy 2.0, and PostgreSQL (with `pgvector`).
- **Graph Database:** Neo4j Community Edition for multi-hop creator-niche-brand relationships.
- **Frontend:** Next.js 16 (App Router), Tailwind CSS v4, and shadcn/ui.
- **AI/ML Layer:** Gemini 1.5 Flash for natural-language rationale generation and semantic embeddings, Llama 3.1 8B for data generation, coupled with deterministic heuristic scoring.

**Key Achievements:**
1. **Data & Testing Pipeline:** We successfully seeded the platform with realistic testing data utilizing Tavily-assisted web scraping and Llama 3.1 8B synthetic generation across 14 standardized niche categories.
2. **AI Architecture Optimization:** We shifted from a pure LLM-based matching engine (which occasionally hallucinated budget constraints) to a **deterministic heuristic engine** guarded by semantic AI. The system forces strict mathematical budget tiering *before* passing verified metrics to Gemini 1.5 Flash to generate the localized reasoning tags.
3. **Frontend Integration:** The Next.js B2B dashboard is live. Brands can create campaigns, set BDT budgets, click "Run Matching", and instantly view ranked Creator Cards populated with Match Scores and AI-generated rationales.
