# AI Agent Instructions for Cohesiq

This document contains strictly enforced conventions and rules for any AI agent or LLM operating within the `cohesiq` codebase. 

## Project Overview

Cohesiq is a B2B SaaS Influencer Matching Platform. It utilizes a Modular Monolith architecture for the backend (FastAPI + PostgreSQL) and a modern frontend (Next.js App Router). Authentication is fully managed via Clerk.

## Core Architecture & Stack Conventions

1. **Frontend (Next.js 16 App Router)**
   - Located in `/frontend/cohesiq-v0/`.
   - Uses `shadcn/ui` and `Tailwind CSS v4`.
   - Authentication is handled by `@clerk/nextjs`. Use `<SignedIn>`, `<SignedOut>`, and `auth()` server-side.
   - Use Server Actions for data mutations, not raw API routes.
   - For multi-step forms, use React Context Providers (e.g., `OnboardingProvider`) to manage state across routes before finalizing to the backend.

2. **Backend (FastAPI + SQLAlchemy 2.0 Async)**
   - Located in `/backend/`.
   - Follows Domain-Driven Design: `auth/`, `creators/`, `brands/`, `campaigns/`.
   - **No cross-domain imports in routers:** Always use the service layer for logic. Routers should only parse requests and format responses using Pydantic.
   - **JWT Validation:** The backend uses Clerk's JWKS to validate `Authorization: Bearer <token>` requests via RS256. See `common.dependencies.get_current_user`.
   - All external API calls MUST be asynchronous using `httpx`.

3. **Database (PostgreSQL 16 + Alembic)**
   - Schema defined purely relationally in `docs/schema.md`.
   - User identity is managed by Clerk. The `users` table maps `clerk_id` to our internal `user_id`.
   - Avoid nullable enums; use lookup tables (`niches`, `languages`) for extensible properties.

## Environment Variables

- `.env` files must NEVER be committed.
- Any time a new environment variable is added, it must also be added to `.env.example` in both `frontend` and `backend` (if applicable).
- Critical variables include `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `DATABASE_URL`.

## Development & Execution Rules

1. **Run via Docker Compose:**
   - The entire stack runs via `docker compose up --build` at the root directory.
   - Backend is accessible at `http://localhost:8000`. Frontend is at `http://localhost:3000`.
   - Never run `npm run dev` or `uvicorn` outside the Docker container unless explicitly debugging locally.

2. **Agent Safety & Verification Checks (Mandatory):**
   - **Verify Services:** After making backend or docker changes, ALWAYS check if containers are healthy using `docker compose ps` and `docker compose logs --tail 50 backend`. Do not assume the system restarted cleanly.
   - **Double Check Imports:** When deleting or moving variables/functions (e.g., `ALGORITHM`), use `grep_search` to verify you aren't breaking imports elsewhere in the codebase.
   - **Frontend Validation:** Next.js build errors (like "Export not found") indicate an immediate problem. Check `docker compose logs -t -f frontend` if necessary. Fix them before moving to the next task.
   - **No Assumptions:** If you are unsure about the database schema, ALWAYS read `docs/schema.md` or the actual SQLAlchemy models first.

## Documentation Sync

- Use `graphify` (if available via workflow) to maintain up-to-date knowledge of the codebase structure.
- When making substantial architectural or model changes, you MUST update `docs/schema.md` and `docs/plan.md`.
