# Data Availability, Constraints & Matching Engine Metrics
## Influencer Matching Platform — Execution Blueprint
*Source: Deep Research on YouTube Data API v3, YouTube Analytics API, Instagram Graph API, Facebook Graph API*
*Compiled: May 2026 | Pre-build reference document*

---

## 0. Executive Summary — Read Before Writing Any Code

Five facts will fundamentally shape your architecture. Ignore any of them and you will rebuild significant portions mid-project.

| # | Fact | Consequence |
|---|---|---|
| 1 | YouTube Analytics API requires **CASA Tier 2** — a 4+ week paid third-party security audit | Audience demographics from YouTube are unavailable until this audit completes. Cannot be bypassed. |
| 2 | YouTube has **no city-level** geographic data via API — country-level only (ISO code `BD`) | You can never confirm "this YouTuber's audience is from Dhaka" from YouTube alone |
| 3 | Instagram demographic API has a **hard 100-follower minimum** and only returns the **top 45 segments** | Nano-influencer demographic profiles are structurally impossible. Segment sums will never equal total follower counts. |
| 4 | Facebook's **lifetime period parameter** for audience analytics is **deprecated** — returns silent empty data | You must warehouse daily demographic snapshots from day one. You cannot backfill Meta historical data later. |
| 5 | YouTube **Search endpoint costs 100 quota units** per call vs. 1 unit for a direct channel read | You cannot use the Search API for creator discovery at scale. 100 searches exhaust your entire daily quota. |

---

## 1. YouTube — Data Availability Map

### 1.1 Public Layer (API Key Only — No OAuth, No Compliance Review)

| Metric | API Field | Engineering Constraint | Matching Engine Use |
|---|---|---|---|
| Subscriber count | `statistics.subscriberCount` | **Rounded to 3 significant figures** by Google to prevent real-time tracking | Tier classification only; not a precise engagement denominator |
| Lifetime views | `statistics.viewCount` | Accurate | Channel authority scoring |
| Total video count | `statistics.videoCount` | Accurate | Content consistency signal |
| Content categories | `topicDetails.topicCategories` | **Returns Wikipedia URLs, not labels** (e.g., `https://en.wikipedia.org/wiki/Technology`) — requires internal mapping dictionary | Niche assignment after URL-to-category translation |
| Video tags | `snippet.tags` | Free text, inconsistent | LLM niche reinforcement |
| Per-video likes | `statistics.likeCount` | Accurate per video | Engagement rate numerator |
| Per-video comments | `statistics.commentCount` | Accurate per video | Engagement rate numerator |
| Standard views | `statistics.viewCount` (video) | **Shorts: redefined post-2025** — any play initiation counts, not minimum watch time | Overstates Shorts engagement if used raw |
| Engaged views (Shorts) | `engaged_views` / `engagedViews` | **New field added post-2025.** Reflects legacy view-counting methodology | Required for accurate Shorts engagement rate calculation |

**Quota cost table:**

| Operation | Endpoint | Unit Cost | Daily Max Calls |
|---|---|---|---|
| Read channel stats | `Channels.list` | **1 unit** | 10,000 |
| Read video stats | `Videos.list` | **1 unit** | 10,000 |
| List recent videos | `PlaylistItems.list` | **1 unit** | 10,000 |
| **Search by keyword** | `Search.list` | **100 units** | **100 max — almost never use** |
| Write/upload | `Videos.insert` | 1,600 units | 6 max |
| **Daily total** | — | — | **10,000 units per Google Cloud Project** |

### 1.2 Private Layer (OAuth — `yt-analytics.readonly` scope)

| Metric | Dimension / Metric | Critical Constraint | Matching Engine Use |
|---|---|---|---|
| Audience country | `country` + `views` | **Country-level only** — ISO alpha-2 code (`BD`). No city or district available. | BD national confirmation only |
| Audience age brackets | `ageGroup` | Brackets: 13-17, 18-24, 25-34, 35-44, 45-54, 55-64, 65+ | Age demographic matching |
| Audience gender | `gender` | Values: `male`, `female` | Gender demographic matching |
| Viewer percentage | `viewerPercentage` | **Cannot combine with `country` dimension** — API rejects this query | Must run two separate queries |
| Under-18 estimates | `ageGroup` (13-17) | **Added March 2026** — statistical estimates for users under 18 | Brand compliance flag for age-restricted products |
| BD audience percentage | Manual calculation | API returns raw view counts per country. Platform must compute: BD_views / total_global_views | Backend computation required, not an API field |

**The zero-row privacy threshold (critical bug risk):**
If a queried time window produces too few data points in a specific demographic cohort (e.g., BD viewers of a small channel), the API returns HTTP 200 with **empty rows and no error**. Your application thinks it succeeded. Your database has no data.

**Mandatory workaround:** Always query 30-day, 90-day, or 365-day rolling windows. Never query day-by-day demographics. Wide temporal windows aggregate enough data to cross Google's internal privacy threshold.

**Compliance requirement — CASA Tier 2 Audit:**

The `yt-analytics.readonly` scope is classified as **Restricted** by Google. Accessing it in production (beyond your own test accounts) requires a CASA Tier 2 Cloud Application Security Assessment.

| Process Step | Timeline | Cost |
|---|---|---|
| Engage authorized DAST auditor | Week 1 | $1,000–$4,000 USD |
| Dynamic Application Security Testing (DAST) scan | 2–3 weeks | Included in audit cost |
| Security Assessment Questionnaire (SAQ) | 1 week | Developer time |
| Vulnerability remediation and rescan | 1–2 weeks | Developer time |
| Google review and approval | 1–2 weeks | Free |
| **Total** | **4–8 weeks** | **$1,000–$4,000+** |

**Screencast account ban trap:**
Google requires uploading a demonstration screencast to YouTube as "Unlisted." YouTube's automated systems have historically terminated developer accounts that upload technical screen recordings, flagging them as spam or bot activity. Never upload this video from your main production Google account. Use a fully isolated burner Google Workspace account with no connection to your production billing or development infrastructure.

---

## 2. Instagram — Data Availability Map

### 2.1 Business Discovery API (No Direct Creator OAuth)

**Prerequisite:** Your app must have its own authenticated Facebook Page with a connected Instagram Professional account. You use your own token to query another creator's public profile — this is often overlooked.

| Metric | API Parameter | Constraint | Matching Engine Use |
|---|---|---|---|
| Follower count | `followers_count` | **Point-in-time snapshot only. No webhooks.** Must poll repeatedly to detect growth patterns. | Baseline audience size and tier classification |
| Post count | `media_count` | Accurate | Content volume signal |
| Biography | `biography` | Free text | NLP niche extraction |
| Recent media likes | `like_count` per media node | Accurate | Engagement numerator |
| Recent media comments | `comments_count` per media node | Accurate | Engagement numerator |
| Post captions + hashtags | `caption` | Free text | LLM semantic niche assignment |

**What you cannot get here:** Audience demographics, geographic distribution, age/gender breakdown. All private layer.

### 2.2 Instagram Graph API with Creator OAuth (`instagram_manage_insights`)

| Metric | API Parameter | Format | Critical Constraint |
|---|---|---|---|
| Audience age + gender | `follower_demographics` | `F.18-24`, `M.25-34` combined key | **Top 45 segments only.** Sum of segments ≠ total followers_count. |
| Audience city | `audience_city` | Unstructured string: `"Dhaka, Dhaka Division"` | **No standardization.** Spellings vary wildly. Requires internal geocoding dictionary. |
| Audience country | `audience_country` | ISO alpha-2 | Reliable for `BD` validation |
| Active follower hours | `online_followers` | Integer per hour | Determines optimal posting time (UTC+6 for BD) |
| Demographic reporting delay | N/A | N/A | **Up to 48-hour delay** — real-time demographics are impossible |
| Minimum threshold | N/A | N/A | **Hard minimum: 100 followers.** All insight endpoints return empty arrays below this. |

### 2.3 What Instagram Graph API Cannot Provide

- Individual follower identities or lists — impossible by API design
- Which followers actually engage vs. ghost (no per-follower engagement history)
- Audience interest categories — Meta does not expose these via API
- Real-time follower count changes — no webhooks; 48-hour demographic delay
- Complete demographic breakdown — only top 45 segments; remainder is structurally invisible

---

## 3. Facebook — Data Availability Map

### 3.1 Page Public Content Access (PPCA)

**Prerequisite:** PPCA requires Meta business verification — state incorporation documents and utility bills — before App Review submission. This is corporate entity verification, not just a developer account.

| Metric | API Field | Constraint | Matching Engine Use |
|---|---|---|---|
| Page post reactions | `reactions` aggregation | Accurate for public posts | Engagement numerator |
| Page post comments | `comments.count` | Accurate | Engagement numerator |
| Post content | `message` | Free text | LLM niche extraction |
| Page category | `category` | Broad category label | Niche classification |

**Critical limitation:** Legacy keyword search endpoints are deprecated. You cannot query "find all fashion Facebook Pages in Bangladesh." You must have the specific Page ID before fetching data. Facebook creator discovery is 100% inbound — creators submit their Page URLs to you. You cannot proactively find them.

### 3.2 Facebook Page Insights (OAuth — `pages_read_engagement` + `read_insights`)

| Metric | API Parameter | Critical Constraint | Matching Engine Use |
|---|---|---|---|
| Fans by country | `page_fans_country` | **`period=lifetime` is deprecated. Returns silent empty data. Must use `period=day` only.** | National BD validation |
| Fans by city | `page_fans_city` | Same deprecated lifetime issue. Unstructured city strings. | City-level targeting (after normalization) |
| Fans by age + gender | `page_fans_gender_age` | Same deprecated lifetime issue. Must request `period=day`. | Demographic matching |

**The silent failure — most common undetected bug:**
Using `period=lifetime` on any of the three metrics above returns HTTP 200 OK with an empty array. No error is raised. Your application thinks it succeeded. Your database stores nothing. This failure is completely invisible without explicit assertion testing on the response body.

**Mandatory solution:** Write a test that asserts demographic data is non-empty after a Facebook Insights call. Add a database-level flag that marks creators with empty Facebook demographic profiles as needing re-ingestion. Never trust a 200 OK response alone.

---

## 4. Compliance Gauntlet — Timeline Reality

| Platform | Requirement | Timeline | Cost | Trigger |
|---|---|---|---|---|
| Google | CASA Tier 2 audit | 4–8 weeks | $1,000–$4,000 | `yt-analytics.readonly` scope in production |
| Meta | Business Verification | 1–2 weeks | Free | Before any App Review for PPCA or Insights |
| Meta | App Review (Insights) | 18–20 working days | Free | `instagram_manage_insights`, `read_insights`, PPCA |
| TikTok | App Review | 1–3 business days | Free | Login Kit and user data access |

**Recommended submission order:**
```
Day 1:    Submit Meta App Review (18-20 day clock starts)
Day 1:    Submit TikTok App Review (1-3 day clock starts)
Week 2:   Engage CASA Tier 2 auditor (4-8 week clock starts)
Week 4:   Meta review likely completes → Instagram + Facebook Insights unlocked
Week 6-8: CASA audit likely completes → YouTube Analytics unlocked
```

**For competition demo:** All compliance timelines exceed a hackathon window. Build the demo around:
- YouTube public data (no OAuth, no review, instant)
- Pre-authorized test accounts for OAuth insight demonstration (5–8 accounts you control)
- State clearly: "App Reviews are in progress. This demo shows authenticated analytics from pre-authorized test creator accounts."

---

## 5. Quota Strategy & Rate Limit Management

### 5.1 YouTube Quota Budget

**Discovery without burning quota:**
- Never use `Search.list` for creator discovery at scale (100 units/call = 100 max searches/day)
- Discovery methods that cost zero quota: creator-submitted YouTube channel URLs, external channel directories, manual seeding
- Once you have a Channel ID from any source, a single `Channels.list` call costs only 1 unit

**Creator sync tiering (mandatory at scale):**
```
Tier 1 — Active brand campaigns:  Sync every 12 hours
Tier 2 — Recent sign-ups (30 days): Sync every 48 hours  
Tier 3 — Dormant / inactive:      Sync weekly
```

### 5.2 Meta BUC Rate Limit Monitoring

Meta uses two concurrent rate limit systems:

**System 1: Platform/User Rate Limit**
```
Limit = 200 × N_authenticated_users per hour
```
Grows automatically with platform growth. Manageable.

**System 2: Business Use Case (BUC) Rate Limit**
```
Limit = (Calls / 200) × Engaged_Users per hour
```
Opaque, dynamic, per-business account. Can change without warning.

**Required implementation — parse every Meta API response header:**
```python
# Every Meta API call must read these headers
x_app_usage = response.headers.get("X-App-Usage")
x_buc_usage = response.headers.get("X-Business-Use-Case-Usage")

buc_data = json.loads(x_buc_usage)
utilization_pct = buc_data["acc_id_util_pct"]
reset_seconds = buc_data["reset_time_duration"]

if utilization_pct > 80:
    # Trigger exponential backoff
    halt_all_non_critical_sync_jobs()
    queue_pending_requests()
    wait_with_jitter(reset_seconds)
```

Without this monitoring, Meta API failures are invisible until your sync pipeline collapses silently.

---

## 6. Data Normalization Architecture

### 6.1 Geographic Data — The Cross-Platform Incompatibility Problem

| Platform | Geographic Resolution | Format | Example |
|---|---|---|---|
| YouTube Analytics | **Country only** | ISO alpha-2 | `BD` |
| Instagram Insights | Country + **City** | Unstructured string | `"Dhaka, Dhaka Division"` OR `"ঢাকা"` OR `"Chittagong"` |
| Facebook Insights | Country + **City** | Unstructured string | `"Dhaka"` OR `"Dhaka, Bangladesh"` OR `"Chattogram"` |

**Cross-platform city inference for YouTube:**
Since YouTube only returns `BD`, you cannot confirm Dhaka concentration from YouTube alone. Apply a probabilistic cross-platform weighting:

```
IF Instagram.audience_city("Dhaka") = 65%
AND Facebook.page_fans_city("Dhaka") = 70%
THEN infer YouTube Dhaka concentration ≈ (65% + 70%) / 2 = 67.5%

Label this in the database as: dhaka_concentration_source = "inferred_cross_platform"
Display this in the UI with a note: "City-level estimate inferred from Instagram/Facebook data"
```

**City string normalization dictionary (build at day 1, maintain continuously):**

```python
CITY_NORMALIZATION = {
    # Dhaka variants
    "Dhaka": "dhaka", "dhaka": "dhaka", "DHAKA": "dhaka",
    "Dhaka, Dhaka Division": "dhaka", "Dhaka, Bangladesh": "dhaka",
    "Dhaka Division": "dhaka", "Dacca": "dhaka", "ঢাকা": "dhaka",

    # Chittagong / Chattogram variants
    "Chittagong": "chittagong", "Chattogram": "chittagong",
    "চট্টগ্রাম": "chittagong", "Chittagong Division": "chittagong",
    "Chittagong, Chittagong Division": "chittagong",

    # Other major BD cities
    "Sylhet": "sylhet", "সিলেট": "sylhet",
    "Rajshahi": "rajshahi", "রাজশাহী": "rajshahi",
    "Khulna": "khulna", "খুলনা": "khulna",
    "Barishal": "barishal", "Barisal": "barishal",
    "Mymensingh": "mymensingh",
    "Gazipur": "gazipur", "Narayanganj": "narayanganj",
}
# Unrecognized strings → "unknown_location" bucket, never silently dropped
```

### 6.2 Age & Gender — Format Incompatibility

| Platform | Format | Example |
|---|---|---|
| YouTube Analytics | Separate dimension fields | `ageGroup: "18-24"`, `gender: "female"` |
| Instagram Insights | Combined alphanumeric key | `"F.18-24"` |
| Facebook Insights | Combined alphanumeric key | `"F.18-24"` |

**Database schema:** Store age and gender in **separate columns always.** Parse Meta's combined key at ingestion time:

```python
def parse_meta_demographic_key(key: str) -> tuple[str, str]:
    gender_code, age_range = key.split(".")
    gender = "female" if gender_code == "F" else "male"
    return gender, age_range  # ("female", "18-24")
```

**Unified internal age taxonomy:**

| Internal Bucket | YouTube Bracket | Meta Bracket |
|---|---|---|
| `under_18` | `13-17` | `F.13-17`, `M.13-17` |
| `18_24` | `18-24` | `F.18-24`, `M.18-24` |
| `25_34` | `25-34` | `F.25-34`, `M.25-34` |
| `35_44` | `35-44` | `F.35-44`, `M.35-44` |
| `45_plus` | `45-54`, `55-64`, `65+` | `F.45-54`, `M.45-54`, etc. |

### 6.3 YouTube Category Normalization

YouTube returns Wikipedia URLs, not category labels. A mapping dictionary is required:

```python
YOUTUBE_CATEGORY_MAP = {
    "https://en.wikipedia.org/wiki/Technology": "technology",
    "https://en.wikipedia.org/wiki/Fashion": "fashion",
    "https://en.wikipedia.org/wiki/Lifestyle_(sociology)": "lifestyle",
    "https://en.wikipedia.org/wiki/Food": "food",
    "https://en.wikipedia.org/wiki/Travel": "travel",
    "https://en.wikipedia.org/wiki/Gaming": "gaming",
    "https://en.wikipedia.org/wiki/Beauty": "beauty",
    "https://en.wikipedia.org/wiki/Entertainment": "entertainment",
    "https://en.wikipedia.org/wiki/Music": "music",
    "https://en.wikipedia.org/wiki/Sports": "sports",
    # Extend as new Wikipedia URLs appear in ingested data
}
```

### 6.4 Incomplete Demographics — Display Protocol

Instagram returns only top 45 segments. The sum will be less than the total follower count:

```
Total followers:          52,400
Sum of top 45 segments:  41,800  (79.8%)
Uncategorized remainder: 10,600  (20.2%)
```

Never inflate demographic percentages by distributing the remainder across known segments. Always display the remainder explicitly as "Uncategorized (20.2%)." Distributing the remainder introduces false demographic signals that corrupt brand targeting decisions.

---

## 7. Matching Engine Metrics — Must-Have vs. Optional

### 7.1 MUST-HAVE — Day 1, All Public Data, No OAuth Required

These six metrics are obtainable without any compliance audit. They determine whether a match is fundamentally relevant or irrelevant. The platform cannot launch without them.

---

**M1 — Content Niche Score** `Weight: 30%`

The primary content category of the creator (fashion, food, tech, gaming, beauty, travel, etc.)

- **Why must-have:** A tech brand matched to a beauty influencer is 0/10 regardless of every other metric. This is the first filter, not a fine-tuner.
- **Data source (YouTube):** `topicDetails.topicCategories` → Wikipedia URL mapping dictionary → internal taxonomy
- **Data source (Instagram/Facebook):** Caption text + hashtags → LLM classification (Gemini free tier)
- **Data source (all platforms):** Video/post titles and descriptions → LLM niche extraction
- **Complexity:** Medium. Wikipedia URL mapping is one-time manual work. LLM classification is straightforward.
- **Output:** `{primary_niche: "fashion", sub_niches: ["modest_fashion"], confidence: 0.87}`

---

**M2 — Engagement Rate** `Weight: 20%`

Quality of the audience relationship — what percentage of the creator's audience actively responds to content.

- **Why must-have:** Follower count is meaningless without engagement. A 500K account at 0.3% engagement is worse than a 15K account at 6% for most BD brands.
- **Formula (YouTube):** `avg(likes + comments per video) / avg(views per video)` — last 10 videos. Use `engaged_views` for Shorts channels.
- **Formula (Instagram):** `avg(likes + comments per post) / followers_count` — last 12 posts
- **Formula (Facebook):** `avg(reactions + comments + shares per post) / page_fans` — last 10 posts
- **Tier benchmarks for normalization:**

| Tier | Expected Engagement | Score if Below Benchmark |
|---|---|---|
| Nano | 5.0%–7.2% | Flag for authenticity review |
| Micro | 3.86% | Standard |
| Macro | 1.5%–2.0% | Standard |
| Mega | 1.21% | Standard |

- **Complexity:** Low. Iterate recent video/post IDs and compute averages.

---

**M3 — Audience Tier Classification** `Weight: 20%` (in combination with M5 Budget Fit)

The creator's audience size mapped to a tier.

- **Why must-have:** Brand budget is a hard constraint. A BDT 5,000 budget cannot match a macro-influencer. This is binary, not a preference.
- **BD-specific tiers:**

| Tier | Follower Range |
|---|---|
| Nano | 100 – 10,000 |
| Micro | 10,001 – 100,000 |
| Macro | 100,001 – 500,000 |
| Mega | 500,001+ |

- **Constraint:** YouTube subscriber count rounded to 3 significant figures. Acceptable for tier classification.
- **Complexity:** Very low.

---

**M4 — Platform Presence Map** `Weight: 15%`

Which platforms the creator actively posts on and their relative audience size per platform.

- **Why must-have:** A brand needing YouTube video content cannot match a creator who only posts to Facebook. This is a binary requirement.
- **Data source:** Self-reported at sign-up, verified by successful OAuth connection.
- **Complexity:** Very low — a checklist stored in the database.

---

**M5 — Budget Fit Score** `Weight: 10%`

Whether the creator's rate card falls within the brand's campaign budget.

- **Why must-have:** No match is valid if the brand cannot afford the creator.
- **Formula:**
```
1.0   if creator_rate ≤ brand_budget_per_creator
0.5   if creator_rate ≤ brand_budget_per_creator × 1.3  (slight overage, negotiable)
0.0   if creator_rate >  brand_budget_per_creator × 1.3  (exclude entirely)
```
- **Data source:** Self-reported rate card at creator sign-up.
- **Complexity:** Very low.

---

**M6 — Content Language Profile** `Weight: 5%`

The ratio of Bangla, English, and Banglish in the creator's content.

- **Why must-have:** A brand targeting Bangla-speaking audiences cannot use an English-only creator. An export-oriented brand needs English-capable creators.
- **Data source:** YouTube video titles + descriptions (public); Instagram captions (public via Business Discovery)
- **Detection tool:** Python `langdetect` or `fasttext` (both free, open-source, handle Bengali reliably)
- **Output:** `{bangla: 0.65, english: 0.20, banglish: 0.15}`
- **Complexity:** Low.

---

**M7 — Content Frequency & Recency** (Embedded in platform scoring, not weighted separately)

How consistently and recently the creator posts.

- **Metrics:** Posts per month (90-day rolling average), days since last post, posting consistency (standard deviation of inter-post intervals — lower = more consistent)
- **Data source:** Public upload timestamps from YouTube `PlaylistItems.list` and Instagram media endpoints.
- **Complexity:** Low.

---

### 7.2 SHOULD-HAVE — Phase 2, High Accuracy Impact, Requires OAuth

Build after MVP matching works. Each adds meaningful accuracy but requires authenticated data or longer build time.

---

**S1 — Audience Geographic Concentration** `Adds: +15% to match score`

Percentage of creator's audience located in Bangladesh and target cities.

- **Why high impact:** A brand selling exclusively in Dhaka needs an influencer with Dhaka-concentrated audience — not a creator with 100K followers primarily in Mumbai.
- **Data source:**
  - YouTube: `country` dimension via `yt-analytics.readonly` → requires CASA Tier 2
  - Instagram: `audience_city` + `audience_country` → requires `instagram_manage_insights` + App Review
  - Facebook: `page_fans_city` + `page_fans_country` → requires `read_insights` + App Review + PPCA
- **Workaround for MVP:** Cross-platform inference (if Instagram/Facebook city data available, use probabilistic weighting to estimate YouTube city distribution). Disclose as estimate.
- **Complexity:** High — compliance burden + normalization challenge.

---

**S2 — Audience Age & Gender Breakdown** `Adds: +10% to match score`

Percentage of audience by age bracket and gender.

- **Why high impact:** A children's clothing brand must avoid influencers with primarily 35-44 male audiences. A women's beauty brand needs majority female audience.
- **Under-18 compliance flag:** Creators with >20% under-18 audience (March 2026 YouTube update added this bracket) must be flagged for brand compliance review — especially for financial products or adult-oriented content.
- **Data source:**
  - YouTube: `ageGroup` + `gender` dimensions → CASA Tier 2 required
  - Instagram: `follower_demographics` (top 45 segments, combined F.18-24 key)
  - Facebook: `page_fans_gender_age` (day period only)
- **Complexity:** High (compliance) + Medium (normalization — decouple combined Meta keys).

---

**S3 — Audience Authenticity Score** `Adds: +10% to match score`

Composite probability that the creator's followers are real human beings.

- **Why high impact:** 49% of Instagram accounts show follower fraud. Your anti-fraud layer is a primary differentiator vs. HypeScout. $4.6B/year is lost globally to influencer fraud.
- **Components (all computable from public data):**

| Signal | Formula | Weight |
|---|---|---|
| Engagement rate vs. tier benchmark | How far below 3.86% micro average? | 40% |
| Follower growth spike detection | Z-score on historical follower count deltas | 25% |
| Comment-to-like ratio | Bot farms inflate likes, not comments | 25% |
| Follower-to-following ratio | Heavy follow-back fraud detection | 10% |

- **BanglaBERT enhancement:** Analyze comment text for genuine Bengali responses vs. emoji-only or copy-paste bot patterns. Adds qualitative signal unavailable in any basic engagement rate formula.
- **Data source:** Mostly public. BanglaBERT inference: free, HuggingFace.
- **Complexity:** Medium. Requires time-series storage of historical follower counts — build this storage from day 1 even if the scoring isn't ready yet.

---

**S4 — Conflict-of-Interest Detection** (Graph traversal — no additional data source needed)

Has this creator collaborated with a direct competitor brand in the last 90 days?

- **Why high impact:** Brands will not accept a creator who recently endorsed a direct competitor.
- **Data source:** Platform's own campaign graph. `(:Influencer)-[:COLLABORATED_WITH {date}]->(:Brand {category})` Neo4j traversal.
- **MVP workaround:** Self-reported. Ask creators to disclose current/recent brand partnerships at sign-up. Platform-detected history accumulates as campaigns complete.
- **Complexity:** Low once the graph exists.

---

**S5 — Brand Safety Score**

Whether the creator's content contains material that could create reputational risk.

- **Data source:** LLM batch scan (Gemini free tier) of recent video titles, descriptions, and captions for violence, explicit content, or controversial political content.
- **Complexity:** Medium. Run as a background job at creator onboarding and monthly thereafter.

---

### 7.3 NICE-TO-HAVE — Phase 3, Competitive Differentiation

Build when core platform is stable and HypeScout is being displaced. These are the features that make the platform category-defining.

| Metric | What It Does | Data Requirement | Timeline |
|---|---|---|---|
| **N1 — Audience Overlap Detection** | Prevent brands from paying twice for the same person across multiple creators | Graph-based demographic similarity (API does not expose follower lists) | Year 1, Phase 3 |
| **N2 — Predictive ROI Model** | Estimate expected reach + conversions before brand commits budget | Requires 500+ completed platform campaigns for training | Year 2 |
| **N3 — Optimal Posting Time** | Recommend posting hour for maximum BD audience activity | Instagram `online_followers` hourly metric (requires `instagram_manage_insights`) | Phase 2 |
| **N4 — KOS Affiliate Conversion Tracking** | Attribute actual sales to creator posts via affiliate links or promo codes | Internal affiliate link generator + brand e-commerce webhook (WooCommerce/Daraz API) | Phase 2 — architecture must be planned from day 1 |
| **N5 — Bengali Comment Sentiment Scoring** | Distinguish genuine audience enthusiasm from passive or automated reactions | BanglaBERT on comment text (free, HuggingFace) | Phase 2 |
| **N6 — Content Quality Scoring** | Visual production quality, audio quality, thumbnail effectiveness | Multimodal LLM analysis (Gemini Vision) | Phase 3 |

---

## 8. MVP Scoring Function

```python
def compute_match_score_mvp(brand: Brand, creator: Creator) -> float:
    """
    MVP matching score using only public data.
    No OAuth required. No compliance audit required.
    """
    scores = {
        "niche":      compute_niche_alignment(brand.category, creator.niches),
        "engagement": normalize_engagement_vs_tier(creator.engagement_rate, creator.tier),
        "budget":     compute_budget_fit(brand.budget_per_creator, creator.rate_card),
        "platform":   check_platform_coverage(brand.required_platforms, creator.active_platforms),
        "language":   compute_language_match(brand.target_language, creator.language_profile),
        "recency":    normalize_posting_recency(creator.days_since_last_post),
    }
    weights = {
        "niche": 0.30, "engagement": 0.20, "budget": 0.20,
        "platform": 0.15, "language": 0.10, "recency": 0.05,
    }
    return sum(scores[k] * weights[k] for k in scores)


def compute_match_score_v2(brand: Brand, creator: Creator) -> float:
    """
    Enhanced score after OAuth and compliance are complete.
    Adds geographic, demographic, and authenticity data.
    """
    base = compute_match_score_mvp(brand, creator) * 0.65

    geo_bonus    = compute_geo_alignment(brand.target_city, creator.audience_geo)  * 0.15
    demo_bonus   = compute_demo_alignment(brand.target_demographics, creator.audience_demo) * 0.10
    auth_bonus   = creator.authenticity_score * 0.10
    conflict_pen = -0.20 if has_competitor_conflict(brand, creator) else 0.0

    return base + geo_bonus + demo_bonus + auth_bonus + conflict_pen
```

---

## 9. Blind Spots Catalog

### 🔴 Critical — Will Cause Build Failure

**BS1 — Facebook creator discovery is 100% inbound**
PPCA cannot search by keyword. There is no "find all fashion Facebook Pages in Bangladesh" query. You must have the Page ID before fetching. Facebook supply is entirely dependent on creators submitting their own Page links. You cannot proactively find and index Facebook Pages the way you can YouTube channels.

**BS2 — Facebook demographics silent failure**
Using `period=lifetime` on `page_fans_city`, `page_fans_country`, or `page_fans_gender_age` returns HTTP 200 OK with an empty array. No error is raised. Write an explicit assertion test that checks the response body is non-empty after every Facebook Insights call. Add a database flag that marks creators with suspiciously empty Facebook demographic profiles for forced re-ingestion.

**BS3 — Instagram nano-influencer demographic blindspot**
Any creator with fewer than 100 Instagram followers returns zero demographic data from all insight endpoints. Many genuine nano-influencers in Bangladesh have 2,000–8,000 followers and are affected. Their matching accuracy will rely on niche + engagement only — no geographic or demographic confirmation. Surface this limitation clearly in the brand-facing UI: "Limited demographic data available for nano-tier creators."

**BS4 — YouTube Search API quota destruction**
One background worker using `Search.list` for keyword-based creator discovery at startup burns 100 units per call. Ten searches = 1,000 units. One hundred searches = entire daily quota exhausted. Audit every code path that calls `Search.list` and replace with `Channels.list` using known Channel IDs gathered from creator submissions or external sources.

**BS5 — CASA Tier 2 costs real money**
The CASA Tier 2 audit requires a paid, authorized DAST scanning service. Budget BDT 85,000–350,000 ($1,000–$4,000 USD). There is no free path to production access for YouTube Analytics. For the competition prototype, operate entirely within test account exemptions — CASA is only triggered when seeking production access for arbitrary users.

**BS6 — YouTube OAuth screencast account ban**
Do not upload the required Google OAuth verification screencast from your main developer account. Use a dedicated burner Google Workspace account completely isolated from your production billing and infrastructure. Loss of the main account during this process would cascade to all connected Cloud services.

### 🟡 Moderate — Will Degrade Matching Quality

**BS7 — Shorts engaged_views must replace viewCount**
Post-2025, YouTube Shorts views count on any play initiation (no minimum watch time). Raw `viewCount` for Shorts channels dramatically overstates engagement. Always use `engaged_views` / `engagedViews` for Shorts content. Failing this makes Shorts-heavy creators appear artificially more engaging, causing bad matches for brands expecting genuine audience attention.

**BS8 — Instagram demographic data is always 48 hours stale**
Do not display Instagram demographic data as "live." Timestamp all demographic data in your database and display the last-updated time prominently in the UI. Design the sync pipeline to treat Instagram demographics as eventually consistent data.

**BS9 — City normalization is ongoing, not one-time**
New variants of "Dhaka," "Chittagong," and other BD city names will appear continuously as creators from different devices, locales, and language settings join. The normalization dictionary requires ongoing maintenance. Assign this as a living data quality task with a quarterly review.

**BS10 — Meta BUC rate limit failure is silent**
Without monitoring `X-Business-Use-Case-Usage` headers on every Meta API call, your sync pipeline will hit rate limits and silently fail. Failed sync jobs will leave stale creator data that appears fresh. Implement BUC header monitoring as a first-class system requirement, not an afterthought.

---

## 10. Data Lifecycle Summary

```
DATA SOURCES (External)
├── YouTube Data API v3 (public, no auth)  → channel stats, video engagement, topic categories
├── YouTube Analytics API (OAuth required) → country-level audience, age/gender demographics
├── Instagram Business Discovery API       → public followers, post engagement, captions
├── Instagram Graph API Insights (OAuth)   → city, demographic breakdown, active hours
├── Facebook PPCA (App Review required)    → public page posts, engagement
└── Facebook Page Insights (OAuth)        → fans by city/country/age-gender (day period ONLY)

NORMALIZATION MIDDLEWARE
├── City strings → internal location_id (city dictionary, maintained continuously)
├── Meta "F.18-24" combined keys → separate gender + age_bracket columns
├── YouTube Wikipedia category URLs → internal niche taxonomy
├── YouTube engaged_views substitution for Shorts content
├── Incomplete Meta demographics → explicit "Uncategorized" bucket (never distribute remainder)
└── Timestamp attachment to all demographic snapshots

STORAGE
├── PostgreSQL: Creator profiles, brand profiles, campaigns, rate cards
├── TimescaleDB / PostgreSQL: Time-series follower counts, engagement history
├── pgvector: Content embeddings for semantic similarity matching
└── Neo4j: Creator–Niche–Brand–Campaign–ROI knowledge graph

SYNC SCHEDULE
├── YouTube public stats:      48h (Tier 2), weekly (Tier 3)
├── YouTube Analytics demo.:   Monthly rolling 30-day window query
├── Instagram public (polling): 24h
├── Instagram Insights (OAuth): Daily snapshot
├── Facebook Insights (OAuth):  Daily snapshot (period=day ONLY)
└── Authenticity score:         Weekly recomputation

MATCHING ENGINE
├── Query Neo4j: niche alignment + conflict-of-interest filter
├── pgvector cosine similarity: brand brief ↔ creator content embeddings
├── Weighted score: MVP (6 public metrics) → Enhanced (+ geo, demo, authenticity)
└── Gemini free tier: Bangla/English match rationale generation

OUTPUT
├── Brand dashboard: Ranked creator list with match scores + rationale
├── Creator profile card: Authenticity score + audience data + availability
└── Campaign workspace: Brief → milestone tracking → compliance check → escrow release
```

---

## 11. Build Sequence

```
Phase 0 — Foundation (Week 1-2, Day 1 priority)
├── Set up PostgreSQL + pgvector + Neo4j + TimescaleDB (time-series)
├── Build city normalization dictionary (all major BD cities + variants)
├── Build YouTube Wikipedia URL → niche taxonomy mapping dictionary
├── Set up BanglaBERT inference pipeline (HuggingFace, CPU, local)
├── Submit Meta App Review IMMEDIATELY (18-20 day clock starts now)
└── Submit TikTok App Review IMMEDIATELY (1-3 day clock)

Phase 1 — Public Data Pipeline (Week 2-4)
├── YouTube: Channels.list ingestion (1 unit/call, known Channel IDs only)
├── YouTube: Video engagement calculation (last 10 videos, engaged_views for Shorts)
├── YouTube: topicCategories → niche mapping
├── Instagram: Business Discovery API (requires your own Page token)
├── Language detection pipeline (fasttext, free, local)
├── Posting frequency + recency calculation
└── MVP matching engine (M1-M6, all public data)

Phase 2 — OAuth Pipeline (Week 4-6)
├── YouTube OAuth (youtube.readonly — no CASA required for basic scope)
├── Instagram OAuth (instagram_basic — basic App Review)
├── Facebook Page OAuth (pages_read_engagement)
├── Meta BUC header monitoring (X-Business-Use-Case-Usage parsing — mandatory)
├── Daily Facebook Insights snapshot (period=day ONLY — never lifetime)
├── Authenticity scoring (engagement Z-score, comment-to-like ratio)
└── Neo4j graph population (creator-niche-brand-campaign relationships)

Phase 3 — Authenticated Audience Analytics (Week 6-8, after reviews complete)
├── Instagram Insights: audience_city, follower_demographics → normalization pipeline
├── Facebook Insights: page_fans_city, page_fans_gender_age → normalization pipeline
├── Cross-platform geographic inference (Instagram/Facebook → YouTube city estimate)
├── Demographic normalization (decouple Meta combined keys)
└── Enhanced matching engine v2 (+ S1 geo + S2 demographics + S3 authenticity)

Phase 4 — YouTube Analytics (Week 8+, after CASA Tier 2 completes)
├── Engage CASA Tier 2 auditor (start immediately if budget allows)
├── YouTube Analytics: country dimension, 30-day rolling windows
├── Complete demographic profile for YouTube creators
└── Full matching engine (all S-tier metrics operational)
```

---

*Compiled May 2026. Sources: YouTube Data API v3 documentation, YouTube Analytics API documentation, Instagram Graph API 2026 developer guide, Facebook Graph API documentation, Meta PPCA requirements, Google CASA Tier 2 specification, Stack Overflow engineering community verified API behavior patterns.*
