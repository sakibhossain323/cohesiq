You are a rigorous research analyst. I am building an AI-powered influencer matching platform targeting the Bangladesh market, designed as a two-sided marketplace (similar to Upwork) connecting brands with micro-influencers. Before I make final business and technical decisions, I need you to systematically verify every factual claim listed below by finding primary or authoritative sources. For each claim:
- State: VERIFIED / CONTRADICTED / PARTIALLY ACCURATE / UNVERIFIABLE
- Provide the correct/updated figure if the claim is wrong or outdated
- Cite the specific source (publication, report name, date)
- Flag if the data is region-specific vs. global and whether it applies to Bangladesh

Work through every section below without skipping any item.

---

## SECTION A — Bangladesh Market Claims

Verify each of the following specific figures:

1. Bangladesh's influencer advertising market is projected to reach US$30.4 million in 2024 and US$45.3 million by 2028, growing at a CAGR of 10.47%. (Cited source: Statista)

2. Bangladesh has more than 500,000 local creators with over 10,000 followers on at least one social platform. (Cited source: Financial Express Bangladesh, November 2025)

3. Bangladesh now has over 120 million internet users and more than 50 million active social media users. (Cited source: Financial Express Bangladesh)

4. Facebook, YouTube, and Instagram are the most popular social platforms in Bangladesh among creators and audiences.

5. Bangladesh micro-influencers typically deliver engagement rates of 3–8% versus 0.5–2% for mega influencers.

6. Typical Bangladesh micro-influencer collaboration rate is BDT 5,000–10,000 per campaign. (Cited source: AgentWiseX)

7. On average, businesses earn US$5.78 in revenue for every US$1 invested in influencer marketing. (Cited source: Nielsen Global Trust in Advertising report)

8. No dedicated, structured influencer marketplace platform currently exists for the Bangladesh market. Verify: does any local Bangladeshi platform (Bengali-language, BDT-priced, with BD-specific creator database) serve this market as of mid-2026?

---

## SECTION B — Global Influencer Market Claims

Verify each figure and its source:

9. Global influencer marketing industry reached approximately US$32.55 billion in 2025, up from US$24 billion in 2024, representing ~35.6% year-over-year growth. (Context: grew from US$1.7 billion in 2016)

10. Global influencer marketing PLATFORM market (separate from the broader influencer marketing industry) was valued at US$9.39 billion in 2024 and is projected to reach US$103.79 billion by 2033 at a CAGR of 30.6%. (Cited source: Straits Research)

11. The influencer marketing platform market will grow from $28.09 billion in 2025 to $37.27 billion in 2026 at a CAGR of 32.7%, reaching $115.54 billion by 2030. (Cited source: Research and Markets)

12. Micro creators command 40% of the influencer marketing market, with nano influencer cohorts forecast to post the highest 36% growth rate through 2030. (Cited source: Mordor Intelligence)

13. Asia-Pacific is set to record the highest regional CAGR of 33.90% during 2026–2031 in influencer marketing. (Cited source: Mordor Intelligence)

14. Influencer marketing in Southeast Asia now drives $38–$46 billion in annual ecommerce sales, with $21 billion directly attributable to creator campaigns. (Cited source: Cube × impact.com 2025 SEA Influencer Report)

15. By 2026, shoppable influencer posts drove $8.2 billion in sales globally. (Cited source: eMarketer)

16. ~86% of brands will use influencer marketing in major markets by 2025.

17. IZEA Worldwide raised USD 42 million in Series D financing to expand its AI-matching engine and open regional data centers in Frankfurt and Singapore. (Cited as: February 2025)

18. Qoruz (India-based influencer platform) partnered with Dabur in June 2024. Verify: Is Qoruz operational, funded, and a legitimate comparable company?

---

## SECTION C — Competitive Landscape Claims

Verify the following platform pricing, features, and positioning claims:

19. Upfluence pricing starts around $2,000/month billed annually, with 20+ search filters across 8 platforms (YouTube, Instagram, Facebook, TikTok, Twitter/X, Twitch, Pinterest, blogs). Verify current 2026 pricing.

20. Aspire (formerly AspireIQ) pricing starts around $2,300/month for mid-tier use, with a creator database of 50M+. Verify current pricing.

21. GRIN pricing is custom/quote-based annually around $2,000+/month. Integrates with Shopify, Magento, WooCommerce, Klaviyo, PayPal. Verify current status.

22. Modash pricing is $199–$499/month and is accessible for small businesses. Verify.

23. Collabstr is a self-serve marketplace where brands can browse pre-priced creator packages for free. Verify free tier limitations.

24. Afluencer is described as "the best free influencer marketing platform" for small businesses and startups. Verify what "free" actually covers and what its limitations are.

25. No existing influencer platform currently offers: (a) Bangla-language interface, (b) BDT pricing, (c) bKash/Nagad payment integration, (d) a structured index of Bangladeshi micro-influencers. Verify whether any platform has any of these features as of mid-2026.

26. Favikon is described as the only platform with comprehensive LinkedIn and Substack influencer coverage. Verify.

---

## SECTION D — Trust & Authenticity Claims

Verify the following fraud detection facts:

27. HypeAuditor uses a machine-learning model trained on over 53 behavioral patterns to detect low-quality or suspicious followers, with the ability to detect over 95% of known fraudulent activity. (Cited source: HypeAuditor blog)

28. Approximately 45% of Instagram accounts show signs of fraudulent activity. (Cited source: Influencer Marketing Hub, 2025 report)

29. Approximately 49% of Instagram influencers have engaged in some form of follower fraud. (Cited source: CHEQ report)

30. Campaigns targeting influencers with more than 30% fake followers often see 58% lower conversion rates.

31. Brands would lose around $1.3 billion per year to influencer fraud. (Cited as a 2019 figure — verify whether an updated figure exists for 2024/2025)

32. Lessie AI offers a completely free Instagram and TikTok fake follower check with no signup required, returning credibility score, bot percentage, and engagement analysis. Verify this is still operational and free as of 2026.

---

## SECTION E — Technical & API Claims

These directly affect build decisions. Verify each precisely:

33. YouTube Data API v3: Free at 10,000 units/day. A search request costs 100 units; retrieving video details costs 1 unit. No monetary charge for basic use. Verify current quota limits and whether these numbers are accurate as of 2026.

34. YouTube Data API v3 provides: subscriber count, total views, video count, upload timestamps, engagement metrics (likes, comments), and channel category data — all accessible for any PUBLIC channel without the channel owner's OAuth consent. Verify what data is truly accessible for non-authenticated (public) channel lookups vs. what requires the channel owner to authorize.

35. Instagram Basic Display API: Verify its current status. Has it been fully deprecated? What is the current recommended API for accessing an Instagram user's own profile data (follower count, engagement) when the user authorizes your app via OAuth?

36. Facebook/Meta App Review: Verify that App Review is free to submit but required before non-test users can authorize your app for permissions beyond basic profile. Confirm the current timeline and requirements for App Review in 2026.

37. TikTok Login Kit / TikTok for Developers: Verify that an influencer can authorize your platform to read their TikTok profile data (follower count, video stats) via OAuth. Confirm whether this is free for development. Verify what App Review or approval process TikTok requires before going live.

38. BanglaBERT: Verify that BanglaBERT is available on HuggingFace as a free, downloadable model suitable for Bangla text classification tasks (specifically niche/content category classification for social media captions).

39. Gemini 2.5 Flash free tier: Verify current free tier limits (requests per day, tokens per minute, whether credit card is required). Confirm multilingual (Bengali) support quality.

40. Groq free tier: Verify current free tier availability for Llama 70B or equivalent model, including requests per day and Bengali language support.

41. Neo4j Community Edition: Verify it is free, self-hostable, and that Cypher query language supports the graph traversal patterns described (multi-hop relationship queries, shortest path, weighted edges). Confirm it has no node or relationship count limits in the community edition.

42. ChromaDB: Verify it is open-source, runs locally without any cloud dependency, and supports cosine similarity search over sentence-transformer embeddings.

43. bKash Merchant API: Verify the current process for integrating bKash payment into a third-party platform in Bangladesh. Specifically: Is there an official API? What is the approval process and timeline? Are there transaction fees? Is there a sandbox/test environment for development?

---

## SECTION F — Business Model & Unit Economics Claims

Verify the following assumptions that underpin the revenue model:

44. Upwork charges a service fee of 5–20% on freelancer earnings. Verify current fee structure as of 2026 — this is the benchmark for the proposed 8–12% commission on influencer campaigns.

45. The "escrow payment" model for protecting brands and influencers is used by Upwork, Fiverr, and similar marketplaces. Verify how escrow is typically implemented in digital services marketplaces and whether there are open-source escrow libraries or payment flow implementations available.

46. Micro-influencer programs are the fastest-growing budget line for mid-market brands globally. Verify with a specific data point or report.

47. ~60% of businesses run influencer programs in-house; ~40% use agencies. Verify this split and its source.

---

## SECTION G — South Asia & Emerging Market Scaling Claims

48. India has a functioning local influencer marketing ecosystem with platforms like Qoruz, vHub.ai, and others serving local markets. Verify which platforms are active, funded, and operational in India as of mid-2026 — these are your most direct regional comparables.

49. vHub.ai raised seed funding from Z21 Ventures and the Startup India Seed Fund Scheme. Verify current operational status.

50. Southeast Asian markets (Vietnam, Cambodia, Laos, Indonesia, Malaysia) lack structured influencer-brand intermediary platforms serving local micro-influencers with local payment rail integration. Verify whether any regional platforms cover these markets specifically.

---

## SECTION H — Cross-Cutting Research Questions

Answer each of these open questions that the original report did not fully resolve:

51. What are the legal requirements for operating a two-sided digital marketplace in Bangladesh? Specifically: business registration type, payment aggregator license requirements, and data protection obligations under Bangladesh's Digital Security Act or any newer legislation as of 2026.

52. What does TikTok's creator marketplace (TikTok Creator Marketplace) currently offer for brands, and does it operate in Bangladesh? If it does, how does it compare to the proposed platform's feature set?

53. Does Instagram's native "Creator Marketplace" (Meta's built-in brand-creator matching tool) operate in Bangladesh? What are its current features and limitations for local markets?

54. What is the current state of influencer marketing regulation in Bangladesh? Are there disclosure requirements (equivalent to FTC guidelines in the US) for paid partnerships? Any regulations that would affect platform operations?

55. Is there any evidence of Bangladeshi creator communities (Facebook groups, Discord servers, YouTube creator forums) where influencers actively discuss monetization and sponsorship seeking? This validates the "supply-side seeding" strategy described in the report.

---

## OUTPUT FORMAT REQUESTED

Present your findings as follows:

For each item (numbered 1–55):
**[Item Number] [VERIFIED / CONTRADICTED / PARTIALLY ACCURATE / UNVERIFIABLE / UPDATED]**
- Finding: [What you found]
- Correct figure (if different): [Updated data]
- Source: [Publication, URL, date]
- Business/Technical Impact: [One sentence on how this changes the plan if the claim is wrong]

At the end, provide:
- A "DECISION CRITICAL" list of findings (items where the claim was wrong and the correction materially changes a business or technical decision)
- A "LOW IMPACT" list (items that were confirmed or where minor inaccuracies don't affect the strategy)
- Any additional facts you found during research that were NOT in the original claims but are highly relevant to this business decision