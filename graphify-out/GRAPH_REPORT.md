# Graph Report - cohesiq  (2026-05-30)

## Corpus Check
- 185 files · ~85,510 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1568 nodes · 3569 edges · 120 communities (109 shown, 11 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 635 edges (avg confidence: 0.51)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2a40c47b`
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
- [[_COMMUNITY_Global UI Navigation & Controls|Global UI Navigation & Controls]]
- [[_COMMUNITY_Modals & Action Dialogs|Modals & Action Dialogs]]
- [[_COMMUNITY_Alert Dialog UI Primitives|Alert Dialog UI Primitives]]
- [[_COMMUNITY_Rates & Deliverables Tables|Rates & Deliverables Tables]]
- [[_COMMUNITY_TypeScript Compiler Config|TypeScript Compiler Config]]
- [[_COMMUNITY_ButtonGroup UI Components|ButtonGroup UI Components]]
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
- [[_COMMUNITY_Drawer UI Components|Drawer UI Components]]
- [[_COMMUNITY_Chart UI Components|Chart UI Components]]
- [[_COMMUNITY_Research Claims Outline|Research Claims Outline]]
- [[_COMMUNITY_Scaling Playbooks & Appendices|Scaling Playbooks & Appendices]]
- [[_COMMUNITY_Future Roadmap Specs|Future Roadmap Specs]]
- [[_COMMUNITY_Navigation Menu UI Components|Navigation Menu UI Components]]
- [[_COMMUNITY_Tailwind & Styling Config|Tailwind & Styling Config]]
- [[_COMMUNITY_Package Scripts|Package Scripts]]
- [[_COMMUNITY_Campaign Schema Design Specs|Campaign Schema Design Specs]]
- [[_COMMUNITY_Architecture Risks & Pitfalls|Architecture Risks & Pitfalls]]
- [[_COMMUNITY_Breadcrumb UI Components|Breadcrumb UI Components]]
- [[_COMMUNITY_Empty State UI Components|Empty State UI Components]]
- [[_COMMUNITY_Alembic Database Migrations|Alembic Database Migrations]]
- [[_COMMUNITY_Social APIs Integration Design|Social APIs Integration Design]]
- [[_COMMUNITY_API Integration Feasibility|API Integration Feasibility]]
- [[_COMMUNITY_Toggle Group UI Components|Toggle Group UI Components]]
- [[_COMMUNITY_v0 Component Import Readme|v0 Component Import Readme]]
- [[_COMMUNITY_Competitive Analysis|Competitive Analysis]]
- [[_COMMUNITY_Bangladesh Creator Market Data|Bangladesh Creator Market Data]]
- [[_COMMUNITY_System Architecture Design|System Architecture Design]]
- [[_COMMUNITY_Product Design Value Thesis|Product Design Value Thesis]]
- [[_COMMUNITY_Database Seed Configurations|Database Seed Configurations]]
- [[_COMMUNITY_Alert UI Components|Alert UI Components]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_FastAPI Application Settings|FastAPI Application Settings]]
- [[_COMMUNITY_Monetization Business Model|Monetization Business Model]]
- [[_COMMUNITY_FastAPI Metadata|FastAPI Metadata]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Business Model Analogies|Business Model Analogies]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 119|Community 119]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 287 edges
2. `get_db` - 59 edges
3. `CreatorProfile` - 57 edges
4. `SocialProfileCreate` - 34 edges
5. `SocialProfileUpdate` - 34 edges
6. `RateCardCreate` - 34 edges
7. `RateCardUpdate` - 34 edges
8. `PortfolioItemCreate` - 34 edges
9. `CollabHistoryCreate` - 34 edges
10. `CreatorProfileUpdate` - 34 edges

## Surprising Connections (you probably didn't know these)
- `int` --uses--> `get_db`  [INFERRED]
  backend/app/brands/router.py → backend/app/common/dependencies.py
- `BrandProfileUpdate` --uses--> `get_db`  [INFERRED]
  backend/app/brands/router.py → backend/app/common/dependencies.py
- `ReviewCreate` --uses--> `get_db`  [INFERRED]
  backend/app/campaigns/router.py → backend/app/common/dependencies.py
- `User` --uses--> `get_db`  [INFERRED]
  backend/app/main.py → backend/app/common/dependencies.py
- `get_current_user` --uses--> `get_db`  [INFERRED]
  backend/app/main.py → backend/app/common/dependencies.py

## Communities (120 total, 11 thin omitted)

### Community 0 - "FastAPI Models & Authentication"
Cohesion: 0.11
Nodes (114): login(), me(), onboarding_sync(), Register a new creator or brand account. Returns a JWT on success., Register a new creator or brand account. Returns a JWT on success., Authenticate and return a JWT access token., Authenticate and return a JWT access token., Return the currently authenticated user's info. (+106 more)

### Community 1 - "API Endpoint Routers"
Cohesion: 0.13
Nodes (23): brand_reviews(), creator_applications(), creator_reviews(), Creator views their own application history., Creator views their own application history., Public reviews for a creator., Public reviews for a creator., Public reviews for a brand. (+15 more)

### Community 2 - "Base UI Components"
Cohesion: 0.06
Nodes (47): cn(), AccordionContent(), AccordionItem(), AccordionTrigger(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList() (+39 more)

### Community 3 - "Dashboard Layout & Navigation"
Cohesion: 0.06
Nodes (42): useIsMobile(), DashboardLayout(), DashboardLayoutProps, Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader() (+34 more)

### Community 4 - "Frontend Package Configuration"
Cohesion: 0.04
Nodes (51): dependencies, autoprefixer, class-variance-authority, @clerk/nextjs, clsx, cmdk, date-fns, embla-carousel-react (+43 more)

### Community 5 - "B2B SaaS Project Scope Docs"
Cohesion: 0.12
Nodes (17): agents.md — Influencer Matching Platform, Architecture: Modular Monolith, code:block1 (Each domain owns:), code:python (# Example: creators/service.py), code:block18 (STEP 1 — Foundation), code:block19 (YouTube API sync     → service reads creator_social_profiles), code:block2 (/), code:yaml (version: "3.9") (+9 more)

### Community 6 - "Integrations Feasibility Research"
Cohesion: 0.04
Nodes (46): 0. Executive Summary — Read Before Writing Any Code, 10. Data Lifecycle Summary, 11. Build Sequence, 1.1 Public Layer (API Key Only — No OAuth, No Compliance Review), 1.2 Private Layer (OAuth — `yt-analytics.readonly` scope), 1. YouTube — Data Availability Map, 2.1 Business Discovery API (No Direct Creator OAuth), 2.2 Instagram Graph API with Creator OAuth (`instagram_manage_insights`) (+38 more)

### Community 7 - "State Actions & Typography"
Cohesion: 0.06
Nodes (40): _geist, _geistMono, metadata, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch() (+32 more)

### Community 8 - "Frontend Page Architecture"
Cohesion: 0.05
Nodes (42): 1. Landing Page, 1. Strict Layer Separation, 2. Browse Creators, 2. Single Responsibility Components, 3. Creator Public Profile, 3. Swappable API Layer, 4. Browse Campaigns, 4. No Logic in Pages/Views (+34 more)

### Community 9 - "Feature Components & Cards"
Cohesion: 0.20
Nodes (20): CreatorCardProps, CreatorProfileHeader(), CreatorProfileHeaderProps, CreatorProfilePageProps, Creator, NicheBadge(), sizeClasses, StarRating() (+12 more)

### Community 10 - "Frontend API Queries"
Cohesion: 0.13
Nodes (9): getCampaigns(), getCreators(), CampaignFilters(), CreatorCard(), CreatorFilters(), EmptyState(), EmptyStateProps, LoadingSkeleton() (+1 more)

### Community 11 - "Application Status Configs"
Cohesion: 0.07
Nodes (43): completeOnboarding(), CampaignFiltersComponentProps, niches, platforms, statuses, CreatorFiltersProps, languages, niches (+35 more)

### Community 12 - "HTTP Get Utilities"
Cohesion: 0.17
Nodes (30): get, get, get, get, get, get, get, get (+22 more)

### Community 13 - "Applications & Brands Client API"
Cohesion: 0.09
Nodes (41): getApplicationById(), getApplications(), getApplicationsByBrandId(), getApplicationsByCampaignId(), getApplicationsByCreatorId(), mapApplicationResponse(), updateApplicationStatus(), getBrandById() (+33 more)

### Community 14 - "Backend Pydantic Schemas"
Cohesion: 0.09
Nodes (42): User, ApplicationCreate, ApplicationStatusUpdate, AsyncSession, CampaignCreate, CampaignStatusUpdate, CampaignUpdate, ReviewCreate (+34 more)

### Community 15 - "HTTP Post Utilities"
Cohesion: 0.17
Nodes (29): description, post, post, post, post, post, post, post (+21 more)

### Community 16 - "Authentication Schemas"
Cohesion: 0.13
Nodes (22): LoginRequest, OnboardingRequest, RegisterRequest, UserOut, str, BaseModel, BrandProfileOut, BrandProfileUpdate (+14 more)

### Community 17 - "Auth & Security Services"
Cohesion: 0.21
Nodes (22): AsyncSession, authenticate_user(), create_access_token(), get_user_by_email(), get_user_by_id(), hash_password(), Create a User row and the corresponding profile row.     Returns (user, access_t, register_user() (+14 more)

### Community 18 - "Meta Compliance & API Audits"
Cohesion: 0.08
Nodes (23): App Verification and Compliance Pitfalls, Business Discovery API for Public Scanning, Conclusion, Data Normalization Strategy and Geographic Resolution, Data Thresholds, Privacy Masking, and Evasion Tactics, Google Cloud Security Assessment (CASA Tier 2), Introduction to the System Architecture and Regional Context, Meta App Review and PPCA Authorization (+15 more)

### Community 19 - "Global UI Navigation & Controls"
Cohesion: 0.15
Nodes (18): ApplicationStatusBadge(), ApplicationStatusBadgeProps, statusConfig, BrandCard(), CampaignCard(), CampaignCardProps, DeliverableTable(), CampaignDetailPage() (+10 more)

### Community 20 - "Modals & Action Dialogs"
Cohesion: 0.12
Nodes (17): ApplyModal(), ApplyModalProps, Command(), CommandDialog(), CommandGroup(), CommandInput(), CommandItem(), CommandList() (+9 more)

### Community 21 - "Alert Dialog UI Primitives"
Cohesion: 0.09
Nodes (18): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay(), AlertDialogTitle() (+10 more)

### Community 22 - "Rates & Deliverables Tables"
Cohesion: 0.17
Nodes (17): deliverableLabels, DeliverableTableProps, deliverableLabels, RateCardTable(), RateCardTableProps, CampaignDeliverable, CreatorRateCard, DeliverableType (+9 more)

### Community 23 - "TypeScript Compiler Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 24 - "ButtonGroup UI Components"
Cohesion: 0.13
Nodes (17): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Item(), ItemActions(), ItemContent(), ItemDescription() (+9 more)

### Community 25 - "Frontend Import Aliases"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 26 - "Database Table Mappings"
Cohesion: 0.11
Nodes (17): code:block1 (users), code:sql (-- A creator applies to a campaign. This is the core transac), code:sql (-- Bidirectional reviews after a collaboration is completed.), code:sql (-- Platform type: fixed list. Adding a new platform = add en), code:sql (-- Find available creators in a niche for a given follower r), code:block21 (users (1) ──────────── (1) creator_profiles), code:block26 (1.  Enable extensions:        uuid-ossp, pgcrypto (or use ge), Core Database Schema (+9 more)

### Community 27 - "HTTP Delete Utilities"
Cohesion: 0.25
Nodes (16): description, delete, delete, delete, delete, operationId, parameters, responses (+8 more)

### Community 28 - "Social Profiles UI Components"
Cohesion: 0.21
Nodes (12): SocialProfileCard(), SocialProfileCardProps, CreatorSocialProfile, PlatformType, formatFollowerCount(), FollowerCount(), FollowerCountProps, getPlatformLabel() (+4 more)

### Community 29 - "Context Menu UI Components"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 30 - "Dropdown Menu UI Components"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 31 - "HTTP Put Utilities"
Cohesion: 0.32
Nodes (15): description, put, put, put, put, put, /brands/{brand_id}, description (+7 more)

### Community 32 - "HTTP Patch Utilities"
Cohesion: 0.13
Nodes (15): content, description, content, content, schema, patch, application/json, operationId (+7 more)

### Community 33 - "Database Schema Design Specs"
Cohesion: 0.13
Nodes (15): 4.1 Core Profile, 4.2 Creator Social Profiles, 4.3 Creator Niches, 4.4 Creator Languages, 4.5 Creator Rate Cards, 4.6 Creator Portfolio Items, 4.7 Creator Past Collaboration History, code:sql (-- What the creator charges per deliverable type per platfor) (+7 more)

### Community 34 - "Market & Competitive Analysis"
Cohesion: 0.14
Nodes (13): ADDITIONAL RELEVANT FACTS DISCOVERED, DECISION CRITICAL FINDINGS, LOW IMPACT FINDINGS, SECTION A - Bangladesh Market Claims, SECTION B - Global Influencer Market Claims, SECTION C - Competitive Landscape Claims, SECTION D - Trust & Authenticity Claims, SECTION E - Technical & API Claims (+5 more)

### Community 35 - "Carousel UI Components"
Cohesion: 0.19
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 36 - "Form Input Controls"
Cohesion: 0.23
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+2 more)

### Community 37 - "Drawer UI Components"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

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
Cohesion: 0.20
Nodes (10): Adding AI match scores, Adding API-verified social stats (no schema change), Adding content embeddings for semantic matching (pgvector), Adding payments and escrow, Adding the graph layer (Neo4j), code:sql (-- Add to creator_social_profiles:), code:sql (-- Add to creator_social_profiles or creator_profiles:), code:sql (-- New table, does not touch any existing table:) (+2 more)

### Community 42 - "Navigation Menu UI Components"
Cohesion: 0.37
Nodes (18): AsyncSession, Depends, get_current_user, get_db, ReviewCreate, User, UUID, apply_to_campaign() (+10 more)

### Community 43 - "Tailwind & Styling Config"
Cohesion: 0.22
Nodes (9): devDependencies, postcss, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/node, @types/react, @types/react-dom (+1 more)

### Community 44 - "Package Scripts"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 45 - "Campaign Schema Design Specs"
Cohesion: 0.22
Nodes (8): 6.1 Campaign Table, 6.2 Campaign Niche Targets, 6.3 Campaign Language Targets, 6.4 Campaign Deliverable Requirements, code:sql (-- A campaign can target multiple niches.), code:sql (-- Languages the campaign content should be in.), code:sql (-- Specific deliverables the brand expects (can be multiple ), Step 6: Campaigns

### Community 46 - "Architecture Risks & Pitfalls"
Cohesion: 0.25
Nodes (8): 8. Critical Blind Spots (Updated & Expanded), 🔴 Blind Spot #1 — HypeScout Is the Real Opponent, 🔴 Blind Spot #2 — Instagram Onboarding Drop-Off Will Be High, 🔴 Blind Spot #3 — Meta App Review Is a Fixed ~1-Month Blocker, 🔴 Blind Spot #4 — The KOS Shift Is Coming and Must Be Architected Now, 🔴 Blind Spot #5 — TTCM and Instagram Creator Marketplace Are Free Competitors, 🔴 Blind Spot #6 — Payment Batching Is Non-Trivial Infrastructure, 🟡 Blind Spot #7 — Cold Start Partially Solved, But Facebook Supply Remains Manual

### Community 47 - "Breadcrumb UI Components"
Cohesion: 0.16
Nodes (17): AsyncSession, Depends, get_db, str, bytes, Request, clerk_webhook(), _handle_user_created() (+9 more)

### Community 48 - "Empty State UI Components"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

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

### Community 58 - "Database Seed Configurations"
Cohesion: 0.40
Nodes (5): 2.1 Niches, 2.2 Languages, code:sql (-- Content/industry niches. Stored as rows so new niches nee), code:sql (-- ISO 639-1 language codes. Pre-seeded with languages relev), Step 2: Lookup Tables

### Community 59 - "Alert UI Components"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

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
Cohesion: 0.15
Nodes (12): API Routes to Implement, Auth Routes, Brand Routes, Campaign Routes, code:block10 (?niche=technology), code:block11 (GET    /brands/                         -- browse brands), code:block12 (GET    /campaigns/                      -- browse active cam), code:block13 (?niche=food) (+4 more)

### Community 74 - "Business Model Analogies"
Cohesion: 0.67
Nodes (3): 9. The Upwork Analogy — Revised Assessment, Where It Breaks, Where It Holds

### Community 99 - "Community 99"
Cohesion: 0.25
Nodes (8): AsyncSession, Depends, bearer_scheme, get_current_user(), get_jwks(), Decode the JWT Bearer token and return the User ORM object.     Raises 401 if to, Decode the JWT Bearer token and return the User ORM object.     Supports both Cl, HTTPAuthorizationCredentials

### Community 100 - "Community 100"
Cohesion: 0.22
Nodes (8): code:bash (git clone <repository_url>), code:bash (docker compose up --build), Cohesiq, Documentation, Prerequisites, Project Structure, Quick Start, Tech Stack

### Community 101 - "Community 101"
Cohesion: 0.29
Nodes (15): AsyncSession, BrandProfileUpdate, Depends, get_current_user, get_db, int, User, UUID (+7 more)

### Community 102 - "Community 102"
Cohesion: 0.24
Nodes (9): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea() (+1 more)

### Community 103 - "Community 103"
Cohesion: 0.25
Nodes (8): Brand Dashboard, Brand Registration Flow (single page), Browse Campaigns Page, Browse Creators Page, Campaign Creation Form, Creator Dashboard, Creator Registration Flow (multi-step), Frontend Pages

### Community 104 - "Community 104"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 105 - "Community 105"
Cohesion: 0.29
Nodes (6): AI Agent Instructions for Cohesiq, Core Architecture & Stack Conventions, Development & Execution Rules, Documentation Sync, Environment Variables, Project Overview

### Community 106 - "Community 106"
Cohesion: 0.29
Nodes (7): Backend Implementation, code:python (import uuid), code:python (from sqlalchemy.ext.asyncio import create_async_engine, asyn), code:python (from pydantic_settings import BaseSettings), common/models.py — Base Model, config.py, database.py

### Community 107 - "Community 107"
Cohesion: 0.33
Nodes (5): config, dashboardUrl, isOnboardingRoute, isProtectedRoute, onboardingUrl

### Community 109 - "Community 109"
Cohesion: 0.29
Nodes (12): AsyncSession, BrandProfileUpdate, int, str, UUID, BrandProfile, create_brand_profile(), get_brand() (+4 more)

### Community 110 - "Community 110"
Cohesion: 0.67
Nodes (3): code:block16 (fastapi==0.115.0), code:block17 (next@15.1.0), Requirements

## Knowledge Gaps
- **424 isolated node(s):** `Config`, `AsyncSession`, `str`, `BrandProfileUpdate`, `int` (+419 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Base UI Components` to `Dashboard Layout & Navigation`, `State Actions & Typography`, `Feature Components & Cards`, `Frontend API Queries`, `Application Status Configs`, `Global UI Navigation & Controls`, `Modals & Action Dialogs`, `Alert Dialog UI Primitives`, `Rates & Deliverables Tables`, `ButtonGroup UI Components`, `Social Profiles UI Components`, `Context Menu UI Components`, `Dropdown Menu UI Components`, `Carousel UI Components`, `Form Input Controls`, `Drawer UI Components`, `Chart UI Components`, `Empty State UI Components`, `Toggle Group UI Components`, `Alert UI Components`, `Community 60`, `Community 65`, `Community 102`, `Community 104`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `get_db` connect `API Endpoint Routers` to `FastAPI Models & Authentication`, `Community 99`, `Community 101`, `Navigation Menu UI Components`, `Breadcrumb UI Components`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `CreatorProfile` connect `FastAPI Models & Authentication` to `Auth & Security Services`, `Backend Pydantic Schemas`, `Breadcrumb UI Components`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 58 inferred relationships involving `get_db` (e.g. with `AsyncSession` and `Depends`) actually correct?**
  _`get_db` has 58 INFERRED edges - model-reasoned connections that need verification._
- **Are the 55 inferred relationships involving `CreatorProfile` (e.g. with `AsyncSession` and `Depends`) actually correct?**
  _`CreatorProfile` has 55 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config`, `Creator views their own application history.`, `Public reviews for a creator.` to the rest of the system?**
  _460 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `FastAPI Models & Authentication` be split into smaller, more focused modules?**
  _Cohesion score 0.11166500498504486 - nodes in this community are weakly interconnected._