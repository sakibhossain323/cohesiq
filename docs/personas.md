# Cohesiq — Personas

Self-contained persona cards for Cohesiq's three segments: **demand side** (brands / SMEs), **supply side** (creators / talent), and **internal** (platform operators). These cards are the canonical home for personas — the [SRS](srs.md) §2.1 points here, and [`docs/user-stories.md`](user-stories.md) references the named personas (Rasha, Zara, Arif).

Each card lists: name, role, context, goals, frustrations, how Cohesiq helps, and the user stories that serve them.

---

## Demand side — Brands / SMEs (paying customers)

### Rasha Ahmed — Primary Brand Persona

| Attribute | Detail |
|---|---|
| **Role** | Marketing Manager, mid-size Dhaka fashion SME |
| **Context** | Runs 2–3 creator campaigns per month, BDT 15,000–50,000 each. Moderate technical comfort: Instagram Business, Google Sheets, WhatsApp. |
| **Goals** | Go from a campaign idea to a contracted creator in under 30 minutes; never wonder "did they actually post it?"; protect payment until delivery is approved. |
| **Frustrations** | Hours lost negotiating on WhatsApp; gets ghosted after shipping products; no proof of delivery, no contract, no recourse; no market rate benchmark. |
| **How Cohesiq helps** | Type-agnostic campaign wizard with AI brief analysis (incl. voice/PDF); AI matching with explainable scores; multi-turn negotiation in-platform; contract with locked clauses and simulated escrow; visual execution state machine so she never chases status. |
| **Serving stories** | US-5, US-5a, US-5b, US-6, US-7, US-8, US-10, US-14, US-16, US-19, US-20 |

### Zara Chowdhury — Growth Brand Persona

| Attribute | Detail |
|---|---|
| **Role** | Head of Growth, established D2C brand (5+ campaigns/month) |
| **Context** | High technical comfort: project-management tools, SaaS workflows. Manages 10+ creator relationships simultaneously. |
| **Goals** | Run 5 simultaneous campaigns from one dashboard with no WhatsApp; standardized terms; per-campaign ROI rollup; a repeatable workflow. |
| **Frustrations** | Managing many creator relationships manually is chaos; no standardized terms; no performance tracking; no repeatable workflow. |
| **How Cohesiq helps** | Public-campaign marketplace for inbound applications; Kanban application funnel; structured contracts that standardize terms; ROI summaries and rate benchmarks for performance visibility. |
| **Serving stories** | US-5, US-6, US-10, US-16, US-17, US-20, US-5a–US-5c |

### Other demand-side segments

| Segment | Profile | Core need | How Cohesiq helps |
|---|---|---|---|
| **Micro-SME brands** | Fashion/food/beauty/D2C running BDT 5,000–30,000 campaigns | Find affordable, real micro-creators fast; avoid fraud | Low-cost discovery, authenticity proxy, simulated escrow |
| **NRB / diaspora brands** | Bangladeshi-owned brands abroad targeting the BD market | Reach BD audiences via local creators remotely | BDT-native, fully remote campaign → contract → delivery flow |

---

## Supply side — Creators / Talent (must be seeded first)

### Arif Hossain — Primary Creator Persona

| Attribute | Detail |
|---|---|
| **Role** | Micro-creator, 25K Instagram followers, fashion/lifestyle niche |
| **Context** | Earns BDT 8,000–20,000/month supplemental from collabs. High comfort on social apps; low on formal business tools. |
| **Goals** | Know exactly what to deliver and when; have payment locked before he starts; receive it automatically on approval; work without WhatsApp negotiation. |
| **Frustrations** | Brands promise payment then ghost; deliverable expectations are unclear; no way to tell if a brand is legitimate; gets low-balled with no rate benchmark. |
| **How Cohesiq helps** | Opportunity feed of Public campaigns; apply with a proposed rate; multi-turn negotiation; "My Contracts" with a single clear next-action per contract; clauses and simulated escrow visible before work begins; rate-card benchmark. |
| **Serving stories** | US-2, US-3, US-5c, US-11, US-17, US-19 |

### Other supply-side talent types (roadmap-aware)

| Talent type | Profile attributes | Matching basis | Status |
|---|---|---|---|
| **Social Creators** | niche, engagement, follower counts (YT/IG/TikTok), content language | Niche + audience-fit + engagement | **Shipped** |
| **Event Hosts** | event-type specialisations, languages, references, availability | Availability-first (Talent Engagement contract) | Partial / roadmap |
| **UGC Creators** | portfolio, formats, turnaround, style tags | Portfolio + turnaround fit | Roadmap |
| **Speakers / Ambassadors** | expertise, credentials; long-term availability | Expertise / retainer fit | Roadmap |

---

## Internal — Platform operators

### Operator — Trust, Safety & Administration

| Attribute | Detail |
|---|---|
| **Role** | Platform operator: moderation, trust & safety, administration |
| **Context** | Internal staff keeping the two-sided marketplace credible; works through the admin panel. |
| **Goals** | Keep fraudulent/low-quality actors out; maintain credible discovery; have audit visibility into campaigns and contracts. |
| **Frustrations** | Without tooling, moderation and dispute handling do not scale; no single place to oversee users, roles, and campaign activity. |
| **How Cohesiq helps** | Admin panel for user/role oversight and campaign audit visibility; authenticity proxy flags are advisory and human-reviewable (never silent bans); contract state machines provide timestamped audit trails. |
| **Serving stories** | US-18, US-21, US-11 |

---

## Cold-start strategy (segment sequencing)

Marketplaces fail at the two-sided cold start, so Cohesiq **seeds supply first**: the demo loads 67 verified Bangladesh YouTube channels (real public data) plus estimated IG/TikTok companion profiles and ~190 portfolio items, giving brands (Rasha, Zara) a credible creator pool from day one while the supply side (Arif and peers) onboards.
