You are an expert Solutions Architect and API Specialist specializing in influencer marketing platforms and developer ecosystem compliance.

Your task is to comprehensively analyze the data sources, technical constraints, limits, and compliance frameworks for a platform that connects content creators (influencers) with local brands across YouTube, Instagram, and Facebook. The platform requires these data points to verify creator reach, calculate engagement, categorize niches, and ensure local geographic alignment for brands.

Analyze the three target platforms using the following data structure, edge-case conditions, and referenced documentation endpoints.

---

### I. TECHNICAL ARCHITECTURE SUMMARY TO ANALYZE

#### 1. YouTube (Data API v3 & Analytics API)
*   **Public Layer (Direct Fetch / Zero-Friction Onboarding):**
    *   Metrics: Subscriber Count (`statistics.subscriberCount` - Note: Rounded to 3 significant figures), Lifetime Views (`statistics.viewCount`), Video Count (`statistics.videoCount`), Topic Categories (`topicDetails.topicCategories` - Returns Wikipedia topic URLs), Video Captions/Tags (`snippet.tags`).
    *   Platform Utility: Used for initial channel discovery, calculating raw Engagement Rates (Likes + Comments / Views on recent public uploads), and semantic niche parsing.
*   **Private Layer (Requires OAuth 2.0 Auth - `yt-analytics.readonly`):**
    *   Metrics: Demographic Data (`ageGroup`, `gender`), Geographic Data (`country`).
    *   Platform Utility: Audience targeting verification for brands.

#### 2. Instagram (Graph API - Professional/Creator Accounts Only)
*   **Public Layer (Via Business Discovery API - Facilitated by App's Own Token):**
    *   Metrics: Follower Count (`followers_count`), Media Count (`media_count`), Post Captions, Media URLs.
    *   Platform Utility: Allows scanning public creator handles to check audience size and parse hashtags/captions for automated niche assignment.
*   **Private Layer (Requires Facebook Login OAuth - `instagram_basic`, `instagram_manage_insights`):**
    *   Metrics: `follower_demographics` (Age & Gender tables), Precise Geography (`audience_city`, `audience_country`).
    *   Platform Utility: Critical for local matching, as it confirms city-level audience concentration.

#### 3. Facebook (Graph API - Pages Only, Profiles Prohibited)
*   **Public Layer (Requires Page Public Content Access [PPCA] Review Approval):**
    *   Metrics: Page Search, Post Context, Comment/Like counts, Category field.
*   **Private Layer (Requires Facebook Login OAuth - `pages_read_engagement`, `read_insights`):**
    *   Metrics: Aggregated demographics (`page_fans_gender_age`), Geographic tables (`page_fans_country`, `page_fans_city`).

---

### II. CORE RESEARCH INSTRUCTIONS & EDGE CASES TO INVESTIGATE

Evaluate each platform against the following architectural roadblocks, data limitations, and developer constraints:

1.  **Data Threshold & Privacy Masking Rules:**
    *   Investigate the specific conditions under which YouTube and Meta mask demographic or geographic rows. (e.g., YouTube's "Zero Rows" response for low views; Meta’s strict 100-user aggregation minimum for demographic buckets). Determine mitigation tactics (e.g., enforcing 365-day wide query frames to aggregate traffic past privacy boundaries).
2.  **Quota Systems, Rates, & Cost Constraints:**
    *   Analyze YouTube's 10,000 daily quota unit allocation relative to operational weight (Search = 100 units, Read = 1 unit, Write = 1,600 units) and how it affects background matching cron jobs.
    *   Analyze Meta’s User Rate Limiting and Business Rate Limiting formulas to prevent platform downtime during heavy syncing phases.
3.  **App Verification & Compliance Pitfalls:**
    *   Outline the Google Cloud verification process for apps pulling private analytics data.
    *   Outline Meta’s App Review process, specifically looking at the permissions required to utilize Page Public Content Access (PPCA) and Instagram Graph insights without triggering platform bans.
4.  **Data Normalization Strategy:**
    *   Propose an unified internal schema that maps varied data formats (e.g., YouTube’s country-level ISO data vs. Meta’s city-level audience data) into a cohesive dashboard structure suitable for local businesses.

---

### III. PRIMARY REFERENCE ENDPOINTS TO QUERY & CROSS-REFERENCE

Your analysis must align with the parameters, schemas, and restrictions documented at these specific resources:

*   **YouTube Data API Channels:** https://google.com
*   **YouTube Analytics API Core Reporting:** https://google.com
*   **Instagram Business Discovery API:** https://google.com
*   **Instagram Insights API:** https://google.com
*   **Facebook Page Public Content Access:** https://google.com
*   **Meta Graph API Pages Search:** https://google.com

Provide a deep technical brief structured by Platform, detailing the exact data flow, error handling for data thresholds, and app permission roadmaps.
