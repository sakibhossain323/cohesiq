# Frontend Page Reference

This document lists the current Next.js frontend pages, their route paths, and the main fields / buttons / UI components they contain.

## Public pages

### `/`
- File: `frontend/cohesiq-v0/app/(public)/page.tsx`
- Purpose: landing/homepage
- Contents:
  - hero section with editorial copy and oversized title
  - niche signal summary and editorial visuals
  - static content sections for the engine, creator index, and brand value proposition
  - no form fields
  - primary desktop links/buttons are inside the page hero/layout as content anchor links, not submitted forms

### `/creators`
- File: `frontend/cohesiq-v0/app/(public)/creators/page.tsx`
- Purpose: browse creator roster
- Contents:
  - server-side fetch of creators via `getCreators`
  - `CreatorsClient` component renders creator cards and filter controls
  - active search/filter state passed as `activeFilters`
  - no direct input form fields in this page file

### `/creators/[id]`
- File: `frontend/cohesiq-v0/app/(public)/creators/[id]/page.tsx`
- Purpose: creator public profile detail
- Contents:
  - renders `CreatorDetailView` component for creator details
  - page delegates display and actions to the shared detail component

### `/campaigns`
- File: `frontend/cohesiq-v0/app/(public)/campaigns/page.tsx`
- Purpose: browse public campaigns
- Contents:
  - server-side fetch of campaigns via `getCampaigns`
  - `CampaignsClient` component renders campaign cards and filters
  - active status defaults to `active`
  - no direct input form fields in this page file

### `/campaigns/[id]`
- File: `frontend/cohesiq-v0/app/(public)/campaigns/[id]/page.tsx`
- Purpose: campaign detail page
- Contents:
  - renders `CampaignDetailView` component for campaign information
  - delegates display/UI to the shared detail component

## Auth onboarding pages

### `/onboarding`
- Files: `frontend/cohesiq-v0/app/(auth)/onboarding/page.tsx` and `frontend/cohesiq-v0/app/(auth)/onboarding/_components/OnboardingRoleSelect.tsx`
- Purpose: choose creator vs brand onboarding path
- Contents:
  - two cards for role selection:
    - Creator card: "I am a Creator"
    - Brand card: "I represent a Brand"
  - buttons:
    - `Select Creator`
    - `Select Brand`
  - uses `useOnboarding()` provider state to set role and route accordingly

### `/onboarding/creator/personal-info`
- File: `frontend/cohesiq-v0/app/(auth)/onboarding/creator/personal-info/page.tsx`
- Purpose: creator personal profile setup
- Fields:
  - `displayName` (required)
  - `tagline`
  - `bio`
  - `city`
  - `gender` (select)
- Buttons:
  - `Next Step`
- Components:
  - `Input`
  - `Textarea`
  - `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`
  - `Label`

### `/onboarding/creator/niches`
- File: `frontend/cohesiq-v0/app/(auth)/onboarding/creator/niches/page.tsx`
- Purpose: creator niche selection
- Fields:
  - `primaryNiche` (select)
  - `subNiches` (checkbox list, up to 3)
- Buttons:
  - `Back`
  - `Next Step`
- Components:
  - `Select`
  - `Checkbox`
  - `Label`

### `/onboarding/creator/platforms`
- File: `frontend/cohesiq-v0/app/(auth)/onboarding/creator/platforms/page.tsx`
- Purpose: connect creator social platforms
- Fields:
  - `platform` (select)
  - `handle` / username
  - `profileUrl`
- Buttons:
  - `Add to List`
  - `Back`
  - `Complete Onboarding`
- UI blocks:
  - added platforms list display
  - add-new-platform form section
- Components:
  - `Select`
  - `Input`
  - `Label`
  - `Button`

### `/onboarding/brand/profile`
- File: `frontend/cohesiq-v0/app/(auth)/onboarding/brand/profile/page.tsx`
- Purpose: brand profile setup
- Fields:
  - `brandName` (required)
  - `description`
  - `website`
  - `city`
- Buttons:
  - `Complete Onboarding`
- Components:
  - `Input`
  - `Textarea`
  - `Label`
  - `Button`

## Creator dashboard pages

### `/creator/dashboard`
- File: `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/page.tsx`
- Purpose: creator landing/dashboard
- Contents:
  - profile summary sidebar
  - `My Applications` table with:
    - campaign title link
    - brand name
    - applied date
    - proposed rate
    - status badge
  - `Suggested Campaigns` cards
  - buttons:
    - `Browse Campaigns`
    - `View Public Profile`
- Components:
  - `CampaignCard`
  - `ApplicationStatusBadge`
  - `Card`, `CardHeader`, `CardTitle`, `CardContent`
  - `Avatar`, `AvatarImage`, `AvatarFallback`
  - `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`
  - `EmptyState`
  - `StarRating`
  - `NicheBadge`
  - `ProfileStrengthMeter`

### `/creator/dashboard/profile`
- File: `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/profile/page.tsx`
- Purpose: creator profile page placeholder
- Contents:
  - currently shows "Profile not found" if no creator profile exists
  - no editable form fields in the current file

### `/creator/dashboard/collaborations`
- File: `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/collaborations/page.tsx`
- Purpose: creator collaborations view
- Contents:
  - placeholder UI when creator profile is missing
  - no form fields in the current file

### `/creator/dashboard/messages`
- File: `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/messages/page.tsx`
- Purpose: creator messages view
- Contents:
  - page structure only; likely message list placeholder
  - does not expose form fields in this file

### `/creator/dashboard/campaigns`
- File: `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/campaigns/page.tsx`
- Purpose: list creator-facing campaigns
- Contents:
  - campaign discovery list rendered by `CreatorCampaignsClient`
  - page file is mostly layout and title

### `/creator/dashboard/campaigns/[id]`
- File: `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/campaigns/[id]/page.tsx`
- Purpose: creator campaign detail page
- Contents:
  - detail UI via component(s) inside the campaign route folder

## Brand dashboard pages

### `/brand/dashboard`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/page.tsx`
- Purpose: brand landing dashboard
- Contents:
  - active campaign counters
  - pending applications count
  - unread messages count
  - recent campaigns list with `View` buttons
  - buttons:
    - `Find Creators`
    - `Create Campaign`
  - call-to-action links to brand creator search and campaign list
- Components:
  - `Card`, `CardHeader`, `CardTitle`, `CardContent`
  - `Button`
  - `ResetOnboardingButton`

### `/brand/dashboard/profile`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/profile/page.tsx`
- Purpose: brand profile page placeholder
- Contents:
  - may render brand profile details or onboarding state
  - currently not a form page in the inspected route

### `/brand/dashboard/messages`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/messages/page.tsx`
- Purpose: brand messages page
- Contents:
  - likely message list container
  - no direct form fields in the route file

### `/brand/dashboard/collaborations`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/collaborations/page.tsx`
- Purpose: collaboration history or active collaborations view
- Contents:
  - no direct form fields in the current file

### `/brand/dashboard/creators`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/creators/page.tsx`
- Purpose: search creators for invites
- Contents:
  - server-side fetch of creators via `getCreators`
  - `BrandCreatorsClient` renders creator search results and invite UI

### `/brand/dashboard/creators/[id]`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/creators/[id]/page.tsx`
- Purpose: creator detail for brand view
- Contents:
  - render detail view and invite controls inside the route folder

### `/brand/dashboard/creators/compare`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/creators/compare/page.tsx`
- Purpose: compare two creators side-by-side
- Contents:
  - comparison client component
  - no direct field form in route file

### `/brand/dashboard/campaigns`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/page.tsx`
- Purpose: list brand campaigns
- Contents:
  - campaign list table or cards rendered by route components
  - page is layout/title wrapper

### `/brand/dashboard/campaigns/[id]`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/page.tsx`
- Purpose: campaign detail for brand
- Contents:
  - campaign detail components inside route folder
  - matches and analytics subcomponents are in nested `_components`

### `/brand/dashboard/campaigns/[id]/edit`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/edit/page.tsx`
- Purpose: edit campaign page
- Contents:
  - assumes form fields for campaign update
  - route exists, but the inspected file likely delegates to an edit form component

### `/brand/dashboard/campaigns/[id]/matches`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/matches/page.tsx`
- Purpose: view matches for a campaign
- Contents:
  - `MatchesClient` component renders match list and actions

### `/brand/dashboard/campaigns/new`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/new/page.tsx`
- Purpose: create a new campaign
- Fields:
  - `title`
  - `description`
  - `campaign_type`
  - `visibility`
  - `budget_per_creator_max`
  - `creator_min_followers`
  - `number_of_creators`
  - `primary_niche_id`
  - `application_deadline`
  - `hashtags`
  - `tracking_notes`
  - `kpi_reach`
  - `kpi_engagement_rate`
  - `kpi_conversions`
  - `kpi_roi_target`
- Buttons:
  - `Back to Campaigns`
  - `Create New Campaign` / submit
  - plus a `BriefAnalyzerCard` action that auto-fills fields
- Components:
  - `Input`
  - `Textarea`
  - `Select`
  - `Button`
  - `Card`, `CardHeader`, `CardTitle`, `CardContent`
  - `Alert`
  - `BriefAnalyzerCard`

### `/brand/dashboard/campaigns/roi-calculator`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/roi-calculator/page.tsx`
- Purpose: campaign ROI calculator
- Contents:
  - likely calculator inputs and result display
  - no direct form details from the inspected route

### `/brand/dashboard/campaigns/rate-benchmark`
- File: `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/rate-benchmark/page.tsx`
- Purpose: rate benchmark comparison
- Contents:
  - likely benchmark UI for campaign pricing
  - no direct form details from the inspected route

## Notes
- Pages with `page.tsx` that delegate to shared components generally use client components for interactive filtering or detail display.
- The strongest form definitions are in onboarding and the brand campaign creation page.
- Many dashboard routes currently render placeholders when profile data is missing.
