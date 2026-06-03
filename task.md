# Tasks: Cohesiq Plan Audit and Completion Backlog

Input: `docs/plan.md`, `docs/schema.md`, current codebase audit.

Prerequisites: `docs/plan.md`, `docs/schema.md`, `AGENTS.md`.

Tests: Not explicitly requested. This file does not add test-writing tasks, but includes validation checkpoints where required by the project instructions.

Organization: Tasks are grouped by user story and implementation phase so each area can be completed and validated independently.

Format: `[Status] [ID] [P?] [Story] Description`

Legend:
- `[x]` Implemented
- `[~]` Partially implemented
- `[ ]` Not implemented
- `[P]` Can run in parallel with other tasks in the same phase

## Implementation Audit

Audited against the current codebase on 2026-06-04.

| Plan feature | Status | Evidence |
| --- | --- | --- |
| Docker Compose for Postgres, backend, frontend | [~] | `docker-compose.yml` runs `postgres`, `backend`, and `frontend`. It does not include the planned `pgvector/pgvector:pg16` image or `neo4j` service. |
| PostgreSQL relational schema via Alembic | [x] | `backend/alembic/versions/0001_enums_and_lookups.py` through `backend/alembic/versions/0012_clerk_integration.py`, plus `53f8d9a8a155_add_ai_match_scores_table.py`. |
| Planned pgvector, YouTube snapshot/video, creator metrics tables | [ ] | No ORM models or migrations for `youtube_channel_snapshots`, `youtube_videos`, `creator_metrics`, vector columns, or pgvector extension. |
| Clerk authentication and backend JWT validation | [x] | `frontend/cohesiq-v0/proxy.ts`, `backend/app/common/dependencies.py`, `backend/app/webhooks/router.py`. |
| Multi-step onboarding with context and backend sync | [x] | `frontend/cohesiq-v0/components/providers/OnboardingProvider.tsx`, `frontend/cohesiq-v0/app/(auth)/onboarding/`, `backend/app/auth/router.py`. |
| Dashboard layouts | [x] | `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/layout.tsx`, `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/layout.tsx`. |
| Brand campaign creation | [~] | `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/new/page.tsx` and `backend/app/campaigns/router.py` exist. The form is simplified and does not yet include target language, multi-platform disabled controls, dual follower slider, 50-word quality indicator, or deliverable detail capture from `docs/plan.md`. |
| Creator public profiles | [~] | `frontend/cohesiq-v0/app/(public)/creators/[id]/page.tsx` and `frontend/cohesiq-v0/components/creator/CreatorDetailView.tsx` exist. Review rendering uses placeholder frontend review APIs in `frontend/cohesiq-v0/lib/api/reviews.ts`. |
| Campaign browse and application logic | [~] | Backend application routes, creator browse pages, brand application views, and invite/respond flows exist. Messages, active contracts, and frontend reviews remain placeholder or incomplete. |
| Creator profile and platform management | [~] | Manual social profile CRUD exists in `backend/app/creators/router.py` and `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/profile/_components/CreatorProfileClient.tsx`. Automated sync is explicitly "Coming Soon". |
| Matching pure functions | [x] | `backend/app/services/matching.py` contains pure scoring helpers and `compute_match_score`. |
| Campaign run-matching endpoint | [~] | `POST /campaigns/{campaign_id}/run-matching` and `GET /campaigns/{campaign_id}/matches` exist in `backend/app/campaigns/router.py`; implementation uses relational creator data and heuristic rationales, not the full planned YouTube metrics, Neo4j conflict checks, persisted embeddings, or async LLM rationale flow. |
| Semantic similarity fallback | [~] | `backend/app/services/semantic_match.py` supports Gemini embeddings when keys exist and falls back to token similarity. It is not the planned `EmbeddingService`, does not use `sentence-transformers`, and does not persist embeddings. |
| LLM service for creator niche classification | [ ] | No `backend/app/services/llm.py` with `classify_creator_niche`; `backend/app/services/llm_matching.py` is a separate experimental matching helper. |
| YouTubeService and creator YouTube sync | [ ] | No `backend/app/services/youtube.py`, no `/creators/{id}/connect-youtube`, no `/creators/{id}/sync`, and no YouTube metrics tables. |
| Neo4j graph driver and graph sync | [ ] | No `backend/app/graph.py`, no `backend/app/services/graph_sync.py`, no Neo4j service in `docker-compose.yml`. |
| Seed scripts | [~] | `backend/scripts/generate_seed_data.py`, `backend/scripts/sync_clerk_users.py`, `backend/scripts/seed_db.py`, and `backend/scripts/reset_db.py` exist. They seed rich demo data but do not run/verify the current `/campaigns/{id}/run-matching` workflow end to end. |
| Typed frontend API client | [~] | API modules exist in `frontend/cohesiq-v0/lib/api/`, but several functions still use `any`, reviews are placeholders, and at least one unused helper has method/body mismatch. |
| TanStack Query data fetching | [ ] | `@tanstack/react-query` is not listed in `frontend/cohesiq-v0/package.json` and no `useQuery` usage was found. The app mostly uses Server Components, Server Actions, and `fetchApi`. |

## Phase 1: Foundational Hardening

Purpose: Fix blocking inconsistencies before expanding feature scope.

[ ] T001 [Foundation] Fix the local login response bug in `backend/app/auth/router.py` by creating a token with `backend/app/auth/service.py:create_access_token` before returning `TokenResponse`.

[ ] T002 [P] [Foundation] Align backend dependencies with actual imports in `backend/requirements.txt`: add `httpx` for `backend/scripts/sync_clerk_users.py` and `python-dotenv` for scripts that import `dotenv`.

[ ] T003 [P] [Foundation] Decide whether Phase 1 should remain relational-only or re-add pgvector/Neo4j, then sync `docs/plan.md`, `docs/schema.md`, `docker-compose.yml`, and `backend/.env.example` to that decision.

[ ] T004 [Foundation] Review and repair `backend/alembic/versions/53f8d9a8a155_add_ai_match_scores_table.py`; it appears to include broad auto-generated index/constraint drops unrelated to AI match scores.

[ ] T005 [P] [Foundation] Align environment examples across `backend/.env.example`, `frontend/cohesiq-v0/.env.example`, and `docker-compose.yml` for `CLERK_ISSUER_URL`, `CLERK_WEBHOOK_SECRET`, `GROQ_API_KEY`, `TAVILY_API_KEY`, `GEMINI_API_KEY`, and any future YouTube/Neo4j variables.

[ ] T006 [Foundation] After dependency, migration, or Docker changes, run `docker compose ps` and `docker compose logs --tail 50 backend` from the repository root and fix any startup errors.

Checkpoint: Foundation is consistent and the stack can start cleanly.

## Phase 2: User Story 1 - Brand Campaign Creation and Management (Priority: P1)

Goal: A brand can create, edit, activate, archive, and inspect campaigns with all fields needed by matching.

Independent Test: A signed-in brand creates a campaign, sees it in `/brand/dashboard/campaigns`, opens `/brand/dashboard/campaigns/{id}`, edits it, changes status, and the backend persists the same values.

[x] T007 [US1] Backend campaign CRUD exists in `backend/app/campaigns/router.py`, `backend/app/campaigns/service.py`, `backend/app/campaigns/schemas.py`, and `backend/app/campaigns/models.py`.

[x] T008 [US1] Brand campaign list/detail routes exist in `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/page.tsx` and `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/page.tsx`.

[~] T009 [US1] Campaign creation form exists in `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/new/page.tsx`, but is missing fields from `docs/plan.md`.

[ ] T010 [US1] Add target language selection, required platform controls, disabled Phase 2 platform tooltips, max follower input/slider, deliverable requirements, and brief quality indicator to `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/new/page.tsx`.

[ ] T011 [US1] Bring the edit form in `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/edit/page.tsx` to parity with the create form.

[ ] T012 [US1] Replace `any` campaign payloads in `frontend/cohesiq-v0/lib/api/campaigns.ts` with typed request/response types from `frontend/cohesiq-v0/lib/types.ts`.

[ ] T013 [US1] Persist and render campaign language targets, niche targets, and deliverable requirements end to end in `backend/app/campaigns/schemas.py`, `backend/app/campaigns/service.py`, `frontend/cohesiq-v0/lib/api/campaigns.ts`, and `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/_components/CampaignDetailClient.tsx`.

Checkpoint: Brand campaign creation is feature-complete and independently usable.

## Phase 3: User Story 2 - Creator Discovery and Public Profiles (Priority: P1)

Goal: Brands can browse creators, inspect creator profiles, and invite creators to campaigns.

Independent Test: A signed-in brand filters creators, opens a creator profile, selects one of its campaigns, sends an invitation, and sees the invitation on the campaign detail page.

[x] T014 [US2] Creator browse and public detail routes exist in `frontend/cohesiq-v0/app/(public)/creators/page.tsx`, `frontend/cohesiq-v0/app/(public)/creators/[id]/page.tsx`, and `frontend/cohesiq-v0/components/creator/CreatorDetailView.tsx`.

[x] T015 [US2] Backend creator filters and profile endpoints exist in `backend/app/creators/router.py` and `backend/app/creators/service.py`.

[x] T016 [US2] Brand creator discovery exists in `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/creators/page.tsx`.

[ ] T017 [US2] Wire creator reviews to real backend data by replacing placeholders in `frontend/cohesiq-v0/lib/api/reviews.ts` with calls to `GET /creators/{creator_id}/reviews` and `GET /brands/{brand_id}/reviews`.

[ ] T018 [US2] Render creator collaboration history from `backend/app/creators/models.py:CreatorCollaborationHistory` in `frontend/cohesiq-v0/components/creator/CreatorDetailView.tsx`.

[ ] T019 [US2] Make the "Invite" button in `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/matches/_components/MatchesClient.tsx` open or reuse `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/creators/[id]/_components/InviteModal.tsx`.

[ ] T020 [P] [US2] Remove or fix the unused mismatched helper in `frontend/cohesiq-v0/lib/api/creators.ts:updateSocialProfile` so it uses `PUT` and `JSON.stringify`, matching `backend/app/creators/router.py`.

Checkpoint: Creator discovery, profile inspection, and invitation initiation work without placeholder data.

## Phase 4: User Story 3 - Campaign Applications and Collaboration Workflow (Priority: P1)

Goal: Creators can apply to campaigns, brands can manage applications, and accepted work can move through collaboration states.

Independent Test: A creator applies to an active campaign; the brand sees the application, shortlists or accepts it; both dashboards show the updated status.

[x] T021 [US3] Backend application, invitation, and review models exist in `backend/app/campaigns/models.py`.

[x] T022 [US3] Backend application and invitation routes exist in `backend/app/campaigns/router.py`.

[x] T023 [US3] Creator campaign browse/detail UI exists in `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/campaigns/page.tsx` and `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/campaigns/[id]/page.tsx`.

[~] T024 [US3] Brand campaign detail tabs exist in `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/_components/CampaignDetailClient.tsx`, but invitations and active contracts are mostly empty states.

[ ] T025 [US3] Add brand-side status update controls for applications in `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/_components/CampaignDetailClient.tsx` using `frontend/cohesiq-v0/lib/api/applications.ts:updateApplicationStatus`.

[ ] T026 [US3] Implement active contract/deliverable tracking or explicitly rename the placeholder "Active Contracts" tab in `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/_components/CampaignDetailClient.tsx`.

[ ] T027 [US3] Add review submission UI after application completion using `POST /campaigns/reviews/` in `backend/app/campaigns/router.py`.

[ ] T028 [P] [US3] Either implement a minimal messaging backend/frontend flow or clearly keep messaging as a non-MVP placeholder in `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/messages/page.tsx` and `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/messages/page.tsx`.

Checkpoint: Application and collaboration state changes are visible to both sides.

## Phase 5: User Story 4 - AI Matching and Recommendations (Priority: P1)

Goal: A brand can generate ranked creator recommendations for a campaign with transparent score breakdowns and rationales.

Independent Test: A brand opens a campaign, runs matching, receives ranked creator recommendations, and can revisit the saved results.

[x] T029 [US4] Pure scoring functions are implemented in `backend/app/services/matching.py`.

[x] T030 [US4] Matching routes are exposed in `backend/app/campaigns/router.py` and consumed by `frontend/cohesiq-v0/lib/api/campaigns.ts`.

[~] T031 [US4] Matching UI exists in `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/matches/_components/MatchesClient.tsx`, but it does not show all planned score dimensions.

[ ] T032 [US4] Store and expose platform, recency, semantic similarity, and rank fields in `backend/app/campaigns/models.py:AIMatchScore`, `backend/app/campaigns/schemas.py:AIMatchScoreOut`, and `frontend/cohesiq-v0/lib/types.ts`.

[ ] T033 [US4] Update `backend/app/campaigns/service.py:run_campaign_matching` to persist complete score breakdowns, rank results, and update campaign status only according to the current product lifecycle.

[ ] T034 [US4] Update `frontend/cohesiq-v0/app/(dashboards)/brand/dashboard/campaigns/[id]/matches/_components/MatchesClient.tsx` to render the planned six breakdown bars: niche, engagement, budget, platform, language, and recency.

[ ] T035 [US4] Decide whether `backend/app/services/llm_matching.py` is deprecated or should be integrated; then update `backend/scripts/test_matching.py` to call the same matching path as `POST /campaigns/{campaign_id}/run-matching`.

[ ] T036 [P] [US4] Replace heuristic-only rationales in `backend/app/campaigns/service.py:generate_rationale` with a bounded LLM rationale service or document that heuristic rationale is the MVP behavior.

Checkpoint: Matching results are complete, repeatable, explainable, and aligned with the stored schema.

## Phase 6: User Story 5 - YouTube Sync and Creator Metrics (Priority: P2)

Goal: A creator can connect a YouTube channel and the platform can sync public metrics for matching.

Independent Test: A creator submits a YouTube channel URL, backend stores channel/video snapshots and computed metrics, and the creator dashboard shows synced values.

[ ] T037 [P] [US5] Add YouTube settings to `backend/app/config.py`, `backend/.env.example`, and `docker-compose.yml`: `YOUTUBE_API_KEY`, quota controls, and any cache settings.

[ ] T038 [P] [US5] Add `httpx`-based YouTube client in `backend/app/services/youtube.py` with `get_channel_stats`, `get_recent_videos`, `extract_channel_id_from_url`, and `resolve_handle_to_channel_id`.

[ ] T039 [US5] Add ORM models and Alembic migration for YouTube snapshots and videos in `backend/app/creators/models.py` and `backend/alembic/versions/`.

[ ] T040 [US5] Decide whether to implement a separate `creator_metrics` table or extend the existing `creator_social_profiles` model; document the decision in `docs/schema.md`.

[ ] T041 [US5] Add creator sync routes in `backend/app/creators/router.py`: `POST /creators/{creator_id}/connect-youtube` and `POST /creators/{creator_id}/sync`.

[ ] T042 [US5] Connect the dashboard sync button in `frontend/cohesiq-v0/app/(dashboards)/creator/dashboard/profile/_components/CreatorProfileClient.tsx` to the backend sync route instead of the current "Coming Soon" toast.

[ ] T043 [US5] Update onboarding platform submission in `frontend/cohesiq-v0/app/(auth)/onboarding/creator/platforms/page.tsx` if YouTube sync should happen during onboarding.

Checkpoint: Manual platform metrics can be replaced or refreshed by YouTube public data.

## Phase 7: User Story 6 - Embeddings and Creator Classification (Priority: P2)

Goal: Matching can use semantic similarity and LLM-derived creator metadata in a maintainable service layer.

Independent Test: A campaign with weak exact niche overlap can still surface semantically relevant creators, and creator niche/language metadata can be regenerated.

[~] T044 [US6] Gemini embedding fallback exists in `backend/app/services/semantic_match.py`, but it is synchronous and not persisted.

[ ] T045 [P] [US6] Create or formalize `backend/app/services/embedding.py` with a clear interface for Gemini embeddings or local sentence-transformer embeddings.

[ ] T046 [US6] Persist semantic similarity inputs/outputs either in `backend/app/campaigns/models.py:AIMatchScore` or a dedicated metrics table, then expose them via `backend/app/campaigns/schemas.py`.

[ ] T047 [P] [US6] Implement `backend/app/services/llm.py` with `classify_creator_niche` and `generate_match_rationale` or intentionally adapt `backend/app/services/llm_matching.py` into that role.

[ ] T048 [US6] Call creator classification from the YouTube sync flow in `backend/app/creators/service.py` once `US5` is implemented.

Checkpoint: Semantic and LLM behavior lives behind stable services and can be swapped without changing routers.

## Phase 8: User Story 7 - Neo4j Graph Matching Extension (Priority: P3)

Goal: Add graph-backed conflict checks and future relationship matching without disrupting relational MVP behavior.

Independent Test: Matching can skip a creator with a recent competitor collaboration found through graph relationships.

[ ] T049 [P] [US7] Add Neo4j service to `docker-compose.yml` and Neo4j dependencies/settings to `backend/requirements.txt`, `backend/app/config.py`, and `backend/.env.example`.

[ ] T050 [US7] Implement Neo4j driver singleton in `backend/app/graph.py`.

[ ] T051 [US7] Implement graph sync helpers in `backend/app/services/graph_sync.py` for creators, brands, campaigns, collaborations, and match edges.

[ ] T052 [US7] Add graph conflict checks to `backend/app/campaigns/service.py:run_campaign_matching` without adding platform-specific conditionals.

[ ] T053 [P] [US7] Document graph setup and sync behavior in `docs/schema.md` and `docs/plan.md`.

Checkpoint: Graph features are additive and do not break the relational MVP.

## Phase 9: User Story 8 - Seeded Demo Data and Verification (Priority: P2)

Goal: A fresh Docker environment can be seeded into a credible demo state with brands, creators, campaigns, and match results.

Independent Test: Run the seed sequence in Docker, open brand and creator dashboards, and verify at least one campaign has generated recommendations.

[~] T054 [US8] Data generation and seed scripts exist in `backend/scripts/generate_seed_data.py`, `backend/scripts/sync_clerk_users.py`, `backend/scripts/seed_db.py`, and `backend/scripts/reset_db.py`.

[ ] T055 [US8] Update `backend/scripts/seed_db.py` to seed creator languages, rate cards, portfolio items, application examples, and enough fields for high-quality matching.

[ ] T056 [US8] Update `backend/scripts/test_matching.py` to call `backend/app/campaigns/service.py:run_campaign_matching` or the HTTP endpoint used by the app.

[ ] T057 [US8] Run the documented sequence from `README.md`: `generate_seed_data.py`, `sync_clerk_users.py`, `seed_db.py`, and matching verification.

[ ] T058 [US8] After running seed or backend changes, verify containers with `docker compose ps` and `docker compose logs --tail 50 backend`.

Checkpoint: Demo data proves the main marketplace and matching flows.

## Phase N: Polish and Cross-Cutting Concerns

Purpose: Cleanup and validation after the desired user stories are complete.

[ ] T059 [P] Replace remaining broad `any` usage in `frontend/cohesiq-v0/lib/api/*.ts` and route components with shared types from `frontend/cohesiq-v0/lib/types.ts`.

[ ] T060 [P] Resolve stale or current TypeScript build issues by running `pnpm build` inside the frontend container and fixing errors in `frontend/cohesiq-v0/app/`, `frontend/cohesiq-v0/components/`, and `frontend/cohesiq-v0/lib/`.

[ ] T061 [P] Decide whether TanStack Query remains part of the frontend plan; either install/use it in `frontend/cohesiq-v0/package.json` or remove it from `docs/plan.md`.

[ ] T062 [P] Update `docs/plan.md` after completing each phase so the roadmap status reflects the current codebase.

[ ] T063 [P] Run a full Docker validation after backend, frontend, or Docker changes: `docker compose ps`, `docker compose logs --tail 50 backend`, and frontend logs if build/runtime errors appear.

## Dependencies and Execution Order

Phase 1 blocks all remaining work because dependency, migration, and documentation mismatches can break every later feature.

User Story 1 and User Story 2 can proceed after Phase 1. They touch mostly separate frontend pages and backend services.

User Story 3 depends on User Story 1 and User Story 2 because applications require active campaigns and creator profiles.

User Story 4 can proceed after Phase 1 and benefits from User Story 2 data, but the full recommendation UX depends on stable creator/campaign fields.

User Story 5 and User Story 6 can proceed after Phase 1, but creator classification in User Story 6 depends on the sync flow from User Story 5 if classification should use real YouTube data.

User Story 7 depends on a stable relational model and should follow the MVP matching work unless graph conflict detection is required for demo day.

User Story 8 should run after whichever stories are needed for the demo are complete.

Polish tasks should run after the desired user stories for the milestone are complete.

## Parallel Opportunities

Tasks marked `[P]` can generally run in parallel when they touch different files.

Frontend form completion in `US1`, creator review/profile completion in `US2`, and backend matching persistence in `US4` can be split across developers after Phase 1.

YouTube service implementation, embedding service design, and Neo4j Docker setup can be explored in parallel, but they should converge through documented interfaces before being wired into matching.

## Notes

The current codebase is closer to the later relational marketplace architecture in `docs/schema.md` than to the initial pgvector/Neo4j/YouTube-heavy plan in the first half of `docs/plan.md`.

The highest-value immediate path is: finish Phase 1 hardening, complete brand campaign form parity, wire reviews/invitations cleanly, and make the existing matching engine fully transparent before adding YouTube sync or Neo4j.
