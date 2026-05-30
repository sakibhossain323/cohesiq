# Graph Report - cohesiq  (2026-05-30)

## Corpus Check
- 215 files · ~114,018 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1720 nodes · 4795 edges · 111 communities (101 shown, 10 thin omitted)
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 1072 edges (avg confidence: 0.51)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `92b37f38`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_FastAPI Models & Authentication|FastAPI Models & Authentication]]
- [[_COMMUNITY_API Endpoint Routers|API Endpoint Routers]]
- [[_COMMUNITY_Base UI Components|Base UI Components]]
- [[_COMMUNITY_Dashboard Layout & Navigation|Dashboard Layout & Navigation]]
- [[_COMMUNITY_Frontend Package Configuration|Frontend Package Configuration]]
- [[_COMMUNITY_B2B SaaS Project Scope Docs|B2B SaaS Project Scope Docs]]
- [[_COMMUNITY_Integrations Feasibility Research|Integrations Feasibility Research]]
- [[_COMMUNITY_State Actions & Typography|State Actions & Typography]]
- [[_COMMUNITY_Frontend Page Architecture|Frontend Page Architecture]]
- [[_COMMUNITY_Feature Components & Cards|Feature Components & Cards]]
- [[_COMMUNITY_Frontend API Queries|Frontend API Queries]]
- [[_COMMUNITY_Application Status Configs|Application Status Configs]]
- [[_COMMUNITY_HTTP Get Utilities|HTTP Get Utilities]]
- [[_COMMUNITY_Applications & Brands Client API|Applications & Brands Client API]]
- [[_COMMUNITY_Backend Pydantic Schemas|Backend Pydantic Schemas]]
- [[_COMMUNITY_HTTP Post Utilities|HTTP Post Utilities]]
- [[_COMMUNITY_Authentication Schemas|Authentication Schemas]]
- [[_COMMUNITY_Auth & Security Services|Auth & Security Services]]
- [[_COMMUNITY_Meta Compliance & API Audits|Meta Compliance & API Audits]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Modals & Action Dialogs|Modals & Action Dialogs]]
- [[_COMMUNITY_Alert Dialog UI Primitives|Alert Dialog UI Primitives]]
- [[_COMMUNITY_Rates & Deliverables Tables|Rates & Deliverables Tables]]
- [[_COMMUNITY_TypeScript Compiler Config|TypeScript Compiler Config]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Frontend Import Aliases|Frontend Import Aliases]]
- [[_COMMUNITY_Database Table Mappings|Database Table Mappings]]
- [[_COMMUNITY_HTTP Delete Utilities|HTTP Delete Utilities]]
- [[_COMMUNITY_Social Profiles UI Components|Social Profiles UI Components]]
- [[_COMMUNITY_Context Menu UI Components|Context Menu UI Components]]
- [[_COMMUNITY_Dropdown Menu UI Components|Dropdown Menu UI Components]]
- [[_COMMUNITY_HTTP Put Utilities|HTTP Put Utilities]]
- [[_COMMUNITY_HTTP Patch Utilities|HTTP Patch Utilities]]
- [[_COMMUNITY_Database Schema Design Specs|Database Schema Design Specs]]
- [[_COMMUNITY_Market & Competitive Analysis|Market & Competitive Analysis]]
- [[_COMMUNITY_Carousel UI Components|Carousel UI Components]]
- [[_COMMUNITY_Form Input Controls|Form Input Controls]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Chart UI Components|Chart UI Components]]
- [[_COMMUNITY_Research Claims Outline|Research Claims Outline]]
- [[_COMMUNITY_Scaling Playbooks & Appendices|Scaling Playbooks & Appendices]]
- [[_COMMUNITY_Future Roadmap Specs|Future Roadmap Specs]]
- [[_COMMUNITY_Tailwind & Styling Config|Tailwind & Styling Config]]
- [[_COMMUNITY_Package Scripts|Package Scripts]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Architecture Risks & Pitfalls|Architecture Risks & Pitfalls]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Alembic Database Migrations|Alembic Database Migrations]]
- [[_COMMUNITY_Social APIs Integration Design|Social APIs Integration Design]]
- [[_COMMUNITY_API Integration Feasibility|API Integration Feasibility]]
- [[_COMMUNITY_Toggle Group UI Components|Toggle Group UI Components]]
- [[_COMMUNITY_v0 Component Import Readme|v0 Component Import Readme]]
- [[_COMMUNITY_Competitive Analysis|Competitive Analysis]]
- [[_COMMUNITY_Bangladesh Creator Market Data|Bangladesh Creator Market Data]]
- [[_COMMUNITY_System Architecture Design|System Architecture Design]]
- [[_COMMUNITY_Product Design Value Thesis|Product Design Value Thesis]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_FastAPI Application Settings|FastAPI Application Settings]]
- [[_COMMUNITY_Monetization Business Model|Monetization Business Model]]
- [[_COMMUNITY_FastAPI Metadata|FastAPI Metadata]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 119|Community 119]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 287 edges
2. `CreatorProfile` - 80 edges
3. `get_db` - 64 edges
4. `Button()` - 36 edges
5. `SocialProfileCreate` - 35 edges
6. `SocialProfileUpdate` - 35 edges
7. `RateCardCreate` - 35 edges
8. `RateCardUpdate` - 35 edges
9. `PortfolioItemCreate` - 35 edges
10. `CollabHistoryCreate` - 35 edges

## Surprising Connections (you probably didn't know these)
- `ApplicationCreate` --uses--> `CreatorProfile`  [INFERRED]
  backend/app/campaigns/service.py → backend/app/creators/models.py
- `ApplicationInviteCreate` --uses--> `CreatorProfile`  [INFERRED]
  backend/app/campaigns/service.py → backend/app/creators/models.py
- `ApplicationRespondInvite` --uses--> `CreatorProfile`  [INFERRED]
  backend/app/campaigns/service.py → backend/app/creators/models.py
- `ApplicationStatusUpdate` --uses--> `CreatorProfile`  [INFERRED]
  backend/app/campaigns/service.py → backend/app/creators/models.py
- `CampaignCreate` --uses--> `CreatorProfile`  [INFERRED]
  backend/app/campaigns/service.py → backend/app/creators/models.py

## Communities (111 total, 10 thin omitted)

### Community 0 - "FastAPI Models & Authentication"
Cohesion: 0.12
Nodes (109): RegisterRequest, AsyncSession, bool, CollabHistoryCreate, CreatorProfileUpdate, Depends, get_current_user, get_db (+101 more)

### Community 1 - "API Endpoint Routers"
Cohesion: 0.06
Nodes (83): brand_reviews(), creator_applications(), creator_reviews(), Creator views their own application history., Public reviews for a creator., Public reviews for a brand., User, login() (+75 more)

### Community 2 - "Base UI Components"
Cohesion: 0.05
Nodes (47): cn(), AccordionContent(), AccordionItem(), AccordionTrigger(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList() (+39 more)

### Community 3 - "Dashboard Layout & Navigation"
Cohesion: 0.06
Nodes (42): useIsMobile(), DashboardLayout(), DashboardLayoutProps, Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader() (+34 more)

### Community 4 - "Frontend Package Configuration"
Cohesion: 0.04
Nodes (51): dependencies, autoprefixer, class-variance-authority, @clerk/nextjs, clsx, cmdk, date-fns, embla-carousel-react (+43 more)

### Community 5 - "B2B SaaS Project Scope Docs"
Cohesion: 0.14
Nodes (26): BrandCard(), BrandCardProps, ApplyModal(), CampaignCard(), CampaignDetailView(), DeliverableTable(), SocialProfileCard(), SocialProfileCardProps (+18 more)

### Community 6 - "Integrations Feasibility Research"
Cohesion: 0.04
Nodes (46): 0. Executive Summary — Read Before Writing Any Code, 10. Data Lifecycle Summary, 11. Build Sequence, 1.1 Public Layer (API Key Only — No OAuth, No Compliance Review), 1.2 Private Layer (OAuth — `yt-analytics.readonly` scope), 1. YouTube — Data Availability Map, 2.1 Business Discovery API (No Direct Creator OAuth), 2.2 Instagram Graph API with Creator OAuth (`instagram_manage_insights`) (+38 more)

### Community 7 - "State Actions & Typography"
Cohesion: 0.06
Nodes (38): metadata, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners (+30 more)

### Community 8 - "Frontend Page Architecture"
Cohesion: 0.05
Nodes (42): 1. Landing Page, 1. Strict Layer Separation, 2. Browse Creators, 2. Single Responsibility Components, 3. Creator Public Profile, 3. Swappable API Layer, 4. Browse Campaigns, 4. No Logic in Pages/Views (+34 more)

### Community 9 - "Feature Components & Cards"
Cohesion: 0.05
Nodes (41): Agent Frameworks & Orchestration · +0/7 · [OPTIONAL], Agentic Frameworks · [SKIP], AI Components, AI Detail Usage — Submission Form, AI Development Lifecycle (AI-DLC) · [HIGH VALUE — Free Points], Anything Else About Your AI Usage · [OPTIONAL], Build Priority Order, Challenge Definition (+33 more)

### Community 10 - "Frontend API Queries"
Cohesion: 0.12
Nodes (31): getPublicReviews(), CreatorDetailView(), CreatorDetailViewProps, CreatorProfileHeader(), RateCardTable(), MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_CONVERSATIONS (+23 more)

### Community 11 - "Application Status Configs"
Cohesion: 0.06
Nodes (53): completeOnboarding(), NICHE_MAP, InviteModal(), InviteModalProps, ApplyModalProps, niches, platforms, statuses (+45 more)

### Community 12 - "HTTP Get Utilities"
Cohesion: 0.17
Nodes (30): get, get, get, get, get, get, get, get (+22 more)

### Community 13 - "Applications & Brands Client API"
Cohesion: 0.18
Nodes (15): resetOnboarding(), getApplicationsByCreatorId(), getSuggestedCampaigns(), getCreatorById(), getMyCreatorProfile(), mapCreatorResponse(), NICHE_MAP, updateSocialProfile() (+7 more)

### Community 14 - "Backend Pydantic Schemas"
Cohesion: 0.08
Nodes (126): ApplicationCreate, ApplicationInviteCreate, ApplicationRespondInvite, ApplicationStatusUpdate, ApplicationCreate, ApplicationInviteCreate, ApplicationRespondInvite, ApplicationStatusUpdate (+118 more)

### Community 15 - "HTTP Post Utilities"
Cohesion: 0.17
Nodes (29): description, post, post, post, post, post, post, post (+21 more)

### Community 16 - "Authentication Schemas"
Cohesion: 0.08
Nodes (44): getApplicationsByBrandId(), getApplicationsByCampaignId(), mapApplicationResponse(), submitApplication(), SubmitApplicationPayload, updateApplicationStatus(), withdrawApplication(), getBrandById() (+36 more)

### Community 17 - "Auth & Security Services"
Cohesion: 0.15
Nodes (24): authenticate_user(), create_access_token(), get_user_by_email(), get_user_by_id(), hash_password(), Create a User row and the corresponding profile row.     Returns (user, access_t, register_user(), verify_password() (+16 more)

### Community 18 - "Meta Compliance & API Audits"
Cohesion: 0.08
Nodes (23): App Verification and Compliance Pitfalls, Business Discovery API for Public Scanning, Conclusion, Data Normalization Strategy and Geographic Resolution, Data Thresholds, Privacy Masking, and Evasion Tactics, Google Cloud Security Assessment (CASA Tier 2), Introduction to the System Architecture and Regional Context, Meta App Review and PPCA Authorization (+15 more)

### Community 19 - "Community 19"
Cohesion: 0.61
Nodes (7): float, str, _cosine_similarity(), get_gemini_embedding(), _jaccard_similarity(), semantic_similarity(), _token_set()

### Community 20 - "Modals & Action Dialogs"
Cohesion: 0.11
Nodes (18): ⏱️ 0:00–0:30 | Problem (The Vibe), ⏱️ 0:30–1:00 | Solution, ⏱️ 1:00–2:00 | Demo / Concept Flow, ⏱️ 2:00–2:30 | AI Approach, ⏱️ 2:30–3:00 | Impact & Next Step, 🔄 AI Development Lifecycle (AI-DLC), BuildFest AI Depth Score — Cohesiq Submission, 🌐 Data & AI Provenance (+10 more)

### Community 21 - "Alert Dialog UI Primitives"
Cohesion: 0.09
Nodes (19): AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay() (+11 more)

### Community 22 - "Rates & Deliverables Tables"
Cohesion: 0.11
Nodes (28): getCampaignsByBrandId(), ApplicationStatusBadge(), ApplicationStatusBadgeProps, statusConfig, CampaignDetailViewProps, CampaignStatusBadge(), deliverableLabels, DeliverableTableProps (+20 more)

### Community 23 - "TypeScript Compiler Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 25 - "Frontend Import Aliases"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 26 - "Database Table Mappings"
Cohesion: 0.06
Nodes (34): 2.1 Niches, 2.2 Languages, 4.1 Core Profile, 4.2 Creator Social Profiles, 4.3 Creator Niches, 4.4 Creator Languages, 4.5 Creator Rate Cards, 4.6 Creator Portfolio Items (+26 more)

### Community 27 - "HTTP Delete Utilities"
Cohesion: 0.25
Nodes (16): description, delete, delete, delete, delete, operationId, parameters, responses (+8 more)

### Community 28 - "Social Profiles UI Components"
Cohesion: 0.11
Nodes (18): getCampaigns(), getCreators(), CampaignFilters(), CampaignFiltersComponentProps, CreatorDiscoverCampaignsPage(), CreatorCard(), CreatorCardProps, CreatorFilters() (+10 more)

### Community 29 - "Context Menu UI Components"
Cohesion: 0.13
Nodes (16): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Field(), FieldContent(), FieldDescription(), FieldError() (+8 more)

### Community 30 - "Dropdown Menu UI Components"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 31 - "HTTP Put Utilities"
Cohesion: 0.32
Nodes (15): description, put, put, put, put, put, /brands/{brand_id}, description (+7 more)

### Community 32 - "HTTP Patch Utilities"
Cohesion: 0.13
Nodes (15): content, description, content, content, schema, patch, application/json, operationId (+7 more)

### Community 33 - "Database Schema Design Specs"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 34 - "Market & Competitive Analysis"
Cohesion: 0.14
Nodes (13): ADDITIONAL RELEVANT FACTS DISCOVERED, DECISION CRITICAL FINDINGS, LOW IMPACT FINDINGS, SECTION A - Bangladesh Market Claims, SECTION B - Global Influencer Market Claims, SECTION C - Competitive Landscape Claims, SECTION D - Trust & Authenticity Claims, SECTION E - Technical & API Claims (+5 more)

### Community 35 - "Carousel UI Components"
Cohesion: 0.19
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 36 - "Form Input Controls"
Cohesion: 0.18
Nodes (12): Item(), ItemActions(), ItemContent(), ItemDescription(), ItemFooter(), ItemGroup(), ItemHeader(), ItemMedia() (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (11): DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut() (+3 more)

### Community 38 - "Chart UI Components"
Cohesion: 0.22
Nodes (8): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), THEMES, useChart()

### Community 39 - "Research Claims Outline"
Cohesion: 0.20
Nodes (9): OUTPUT FORMAT REQUESTED, SECTION A — Bangladesh Market Claims, SECTION B — Global Influencer Market Claims, SECTION C — Competitive Landscape Claims, SECTION D — Trust & Authenticity Claims, SECTION E — Technical & API Claims, SECTION F — Business Model & Unit Economics Claims, SECTION G — South Asia & Emerging Market Scaling Claims (+1 more)

### Community 40 - "Scaling Playbooks & Appendices"
Cohesion: 0.20
Nodes (9): 10. Global Scaling Potential (Verified Numbers), 11. Grading Criteria Alignment, 12. Immediate Next Steps (Pre-Code), 6. Regulatory & Compliance Framework, Appendix — Verified Key Numbers for Pitch Deck, Changelog From Previous Version, Geographic Expansion Playbook, Influencer Matching Engine — Feasibility, Competitive & Strategic Analysis (+1 more)

### Community 41 - "Future Roadmap Specs"
Cohesion: 0.67
Nodes (3): 9. The Upwork Analogy — Revised Assessment, Where It Breaks, Where It Holds

### Community 43 - "Tailwind & Styling Config"
Cohesion: 0.22
Nodes (9): devDependencies, postcss, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/node, @types/react, @types/react-dom (+1 more)

### Community 44 - "Package Scripts"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 46 - "Architecture Risks & Pitfalls"
Cohesion: 0.25
Nodes (8): 8. Critical Blind Spots (Updated & Expanded), 🔴 Blind Spot #1 — HypeScout Is the Real Opponent, 🔴 Blind Spot #2 — Instagram Onboarding Drop-Off Will Be High, 🔴 Blind Spot #3 — Meta App Review Is a Fixed ~1-Month Blocker, 🔴 Blind Spot #4 — The KOS Shift Is Coming and Must Be Architected Now, 🔴 Blind Spot #5 — TTCM and Instagram Creator Marketplace Are Free Competitors, 🔴 Blind Spot #6 — Payment Batching Is Non-Trivial Infrastructure, 🟡 Blind Spot #7 — Cold Start Partially Solved, But Facebook Supply Remains Manual

### Community 47 - "Community 47"
Cohesion: 0.32
Nodes (15): float, int, str, compute_match_score(), get_tier(), MatchScores, Pure function. All inputs are pre-fetched primitives.     No database calls. Ful, Compare niche strings case-insensitively.     Primary niche match = 1.0, seconda (+7 more)

### Community 49 - "Alembic Database Migrations"
Cohesion: 0.33
Nodes (5): Run migrations in 'offline' mode., Run migrations in 'online' async mode., run_async_migrations(), run_migrations_offline(), run_migrations_online()

### Community 50 - "Social APIs Integration Design"
Cohesion: 0.29
Nodes (6): 1. YouTube (Data API v3 & Analytics API), 2. Instagram (Graph API - Professional/Creator Accounts Only), 3. Facebook (Graph API - Pages Only, Profiles Prohibited), I. TECHNICAL ARCHITECTURE SUMMARY TO ANALYZE, II. CORE RESEARCH INSTRUCTIONS & EDGE CASES TO INVESTIGATE, III. PRIMARY REFERENCE ENDPOINTS TO QUERY & CROSS-REFERENCE

### Community 51 - "API Integration Feasibility"
Cohesion: 0.29
Nodes (7): 4.1 YouTube — No Auth Required for Public Data ✅, 4.2 Instagram — Critical Architecture Change ❌, 4.3 Meta App Review — Timeline Updated, 4.4 TikTok OAuth ✅, 4.5 Trust & Authenticity — Corrected Tool Stack, 4.6 bKash Merchant API ✅, 4. Data Sources & API Feasibility

### Community 52 - "Toggle Group UI Components"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 53 - "v0 Component Import Readme"
Cohesion: 0.33
Nodes (5): Built with v0, code:bash (npm run dev), Getting Started, Learn More, v0-cohesiq-ui-build

### Community 54 - "Competitive Analysis"
Cohesion: 0.33
Nodes (6): 2.1 Global Platforms — Enterprise Tier (Updated Pricing), 2.2 SME-Accessible Global Platforms, 2.3 ❌ CRITICAL CORRECTION — HypeScout Is the Real Incumbent, 2.4 Native Platform Competitors — Newly Identified (Previously Missed), 2.5 Competitive Summary Table (Fully Updated), 2. Existing Competitive Landscape

### Community 55 - "Bangladesh Creator Market Data"
Cohesion: 0.33
Nodes (6): 3.1 Market Size & Growth ✅ VERIFIED, 3.2 The Creator Supply — Corrected, 3.3 Engagement Rates — Precise Verified Figures, 3.4 Influencer Rates — Corrected and Expanded, 3.5 Creator Communities — Supply-Side Seeding Validated ✅, 3. Bangladesh Market — Verified Data

### Community 56 - "System Architecture Design"
Cohesion: 0.33
Nodes (6): 5.1 Confirmed Free Stack, 5.2 Platform Architecture, 5.3 Knowledge Graph — Why GraphDB Is Architecturally Necessary, 5.4 Matching Score Weights, 5. Technical Architecture, code:block3 (┌───────────────────────────────────────────────────────────)

### Community 57 - "Product Design Value Thesis"
Cohesion: 0.40
Nodes (5): 1. The Idea — Reconstructed & Clarified, code:block1 (You → (scraping/API) → Social Platform → Influencer Data   [), code:block2 (Influencer → (OAuth / self-reported) → Your Platform → Brand), The Two-Sided Value Exchange, Why "Own Platform" Solves the Data Problem

### Community 59 - "Community 59"
Cohesion: 0.28
Nodes (8): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea()

### Community 61 - "FastAPI Application Settings"
Cohesion: 0.50
Nodes (3): Config, Settings, BaseSettings

### Community 62 - "Monetization Business Model"
Cohesion: 0.50
Nodes (4): 7.1 Commission Structure — Updated to Variable Model, 7.2 Revenue Streams, 7.3 IZEA's Cautionary Lesson, 7. Revised Business Model

### Community 63 - "FastAPI Metadata"
Cohesion: 0.50
Nodes (4): info, description, title, version

### Community 64 - "Community 64"
Cohesion: 0.38
Nodes (3): Footer(), Navbar(), navLinks

### Community 65 - "Community 65"
Cohesion: 0.23
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+2 more)

### Community 98 - "Community 98"
Cohesion: 0.33
Nodes (5): 1. Separation of Real & Synthetic Creator Data, 2. Transition to Fast LLM Extraction Models, 3. Business Data Reset Layer, 4. Diverse Seeding Profiles for Demos, Major Architecture & Data Seeding Decisions (May 2026)

### Community 100 - "Community 100"
Cohesion: 0.25
Nodes (7): Cohesiq, Data Seeding, Documentation, Prerequisites, Project Structure, Quick Start, Tech Stack

### Community 105 - "Community 105"
Cohesion: 0.22
Nodes (8): AI Agent Instructions for Cohesiq, Core Architecture & Stack Conventions, Current Implementation Snapshot (May 30, 2026), Data Seeding & Mock Data, Development & Execution Rules, Documentation Sync, Environment Variables, Project Overview

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): config, isOnboardingRoute, isProtectedRoute

### Community 112 - "Community 112"
Cohesion: 0.38
Nodes (5): STATUS_CONFIG, Tabs(), TabsContent(), TabsList(), TabsTrigger()

## Knowledge Gaps
- **472 isolated node(s):** `🌍 Public Summary`, `🎯 The Problem Statement`, `🌐 Data & AI Provenance`, `🛠️ Tooling & IDE`, `📝 Prompt Usage` (+467 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Base UI Components` to `Dashboard Layout & Navigation`, `B2B SaaS Project Scope Docs`, `State Actions & Typography`, `Frontend API Queries`, `Application Status Configs`, `Alert Dialog UI Primitives`, `Rates & Deliverables Tables`, `Community 24`, `Social Profiles UI Components`, `Context Menu UI Components`, `Dropdown Menu UI Components`, `Database Schema Design Specs`, `Carousel UI Components`, `Form Input Controls`, `Community 37`, `Chart UI Components`, `Community 45`, `Toggle Group UI Components`, `Community 59`, `Community 60`, `Community 64`, `Community 65`, `Community 112`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `CreatorProfile` connect `FastAPI Models & Authentication` to `API Endpoint Routers`, `Backend Pydantic Schemas`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `get_db` connect `API Endpoint Routers` to `FastAPI Models & Authentication`, `Backend Pydantic Schemas`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 78 inferred relationships involving `CreatorProfile` (e.g. with `AsyncSession` and `Depends`) actually correct?**
  _`CreatorProfile` has 78 INFERRED edges - model-reasoned connections that need verification._
- **Are the 63 inferred relationships involving `get_db` (e.g. with `AsyncSession` and `Depends`) actually correct?**
  _`get_db` has 63 INFERRED edges - model-reasoned connections that need verification._
- **What connects `🌍 Public Summary`, `🎯 The Problem Statement`, `🌐 Data & AI Provenance` to the rest of the system?**
  _507 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `FastAPI Models & Authentication` be split into smaller, more focused modules?**
  _Cohesion score 0.11609458428680397 - nodes in this community are weakly interconnected._