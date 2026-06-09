# Cohesiq

Cohesiq is a next-generation B2B SaaS Influencer Matching Platform designed to seamlessly connect brands with the right content creators. It features a budget-aware matching engine, AI-powered semantic search, and an end-to-end campaign management dashboard.

## Core Features
- **Intelligent Matching**: Uses a tier-aware scoring system combining budget constraints, follower metrics, and AI embeddings for perfect brand-creator alignment.
- **Dual Dashboards**: Dedicated portals for Brands (to discover creators, post campaigns, and track applications) and Creators (to build portfolios, discover campaigns, and manage contracts).
- **Secure Authentication**: Fully managed authentication via Clerk, utilizing robust RS256 JWT validation on the backend.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS v4, shadcn/ui.
- **Backend:** FastAPI, Python 3.12.
- **Database:** PostgreSQL 16 (accessed via SQLAlchemy 2.0 Async + asyncpg).
- **Authentication:** Clerk (RS256 JWTs).
- **Containerization:** Docker Compose for local development.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) and Docker Compose
- [Node.js](https://nodejs.org/en/) 20+ (for local frontend tooling/linting)
- A [Clerk](https://clerk.com/) account for authentication keys.

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd cohesiq
   ```

2. **Environment Variables:**
   - The platform requires environment variables for both the backend and frontend.
   - **Docker Compose**: At the repository root, copy `.env.example` to `.env`. If your machine already has Postgres on `5432`, set `POSTGRES_HOST_PORT=5433` or another free port.
   - **Frontend**: Navigate to `frontend/cohesiq-v0/`, copy `.env.example` to `.env.local`, and fill in your Clerk API keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`). Ensure you read the [Frontend README](frontend/cohesiq-v0/README.md) to understand the dual-variable API configuration.
   - **Backend**: Navigate to `backend/`, copy `.env.example` to `.env` (if applicable), and configure your database and Clerk JWT verification keys.

3. **Running the Application:**
   - The entire stack is containerized for consistency. Start it from the repository root:
     ```bash
     docker compose up --build
     ```

4. **Access the Application:**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Architecture

Cohesiq uses a decoupled full-stack architecture, utilizing Docker to orchestrate the environment.

### 1. Frontend (`/frontend/cohesiq-v0/`)
- **Next.js 16 App Router**: Heavily leverages React Server Components for performance.
- **Strict Colocation**: Follows a strict "Server Component -> Client Island" pattern. Data fetching happens exclusively on the server (`page.tsx`), while interactive UI and Server Actions are colocated in `_components/` and `_actions/` directories.
- 📖 **Read more**: [Frontend Architecture & Setup](frontend/cohesiq-v0/README.md)

### 2. Backend (`/backend/`)
- **FastAPI (Python 3.12)**: A performant, async API layer.
- **Domain-Driven Design (DDD)**: Organized into distinct domains: `auth`, `brands`, `creators`, and `campaigns`.
- **SQLAlchemy 2.0 Async**: Fully asynchronous database interactions.

### 3. Database & Data Model
- **PostgreSQL 16**: The single source of truth, managed via Alembic migrations.
- **Documentation**: The complete schema map is available in `/docs/schema.md`. Always refer to this before altering models.
## Data Seeding

The canonical seed lives at `db/seed.sql` — a symlink to the latest snapshot in `db/snapshots/`. Snapshots are data-only dumps of ~86 real Bangladeshi creators with live YouTube/Instagram/TikTok data. Load once after first `docker compose up`:

```bash
docker compose exec -T postgres psql -U cohesiq -d cohesiq < db/seed.sql
```

To reset and re-seed from scratch:

```bash
docker compose exec backend python -m scripts.reset_db                          # wipe all data (schema-agnostic)
docker compose exec -T postgres psql -U cohesiq -d cohesiq < db/seed.sql        # restore from latest snapshot
docker compose exec backend python -m scripts.sync_clerk_users                  # re-link @test.com Clerk accounts (optional)
```

See [`docs/seeding.md`](docs/seeding.md) for the full breakdown — snapshot structure, what survives a reset, how to regenerate, and why the older scripts are no longer used.

## AI & Agentic Tooling

For developers using AI coding assistants (like Cursor, Windsurf, or Google AI), this repository utilizes **Model Context Protocol (MCP)** servers to enhance agent awareness:

1. **Context7**: Used for fetching real-time, up-to-date documentation for Next.js, FastAPI, and other dependencies.
2. **Graphify**: Used to generate and query an AST-based knowledge graph of the entire repository (`graphify-out/`).

**Installation:** Ensure you have both the `context7` and `graphify` MCP servers configured in your agent environment before making large-scale architectural changes. 

## Documentation

For deep-dives into the database schema and future AI roadmap, please see the markdown files in the `/docs/` directory. If you are an AI assistant contributing to this repository, please strictly adhere to the rules outlined in `AGENTS.md`.
