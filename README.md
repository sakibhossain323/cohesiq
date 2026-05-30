# Cohesiq

Cohesiq is a next-generation B2B SaaS Influencer Matching Platform designed to seamlessly connect brands with the right content creators. 

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

2. **Set up Environment Variables:**
   - Copy the example `.env` files for both the root and frontend directories (if applicable) and fill in your Clerk keys.
   - Specifically, ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are provided to the frontend container, and `CLERK_ISSUER_URL` is available to the backend container.

3. **Run the stack via Docker Compose:**
   ```bash
   docker compose up --build
   ```

4. **Access the Application:**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Structure

- `/frontend/cohesiq-v0/`: Contains the Next.js frontend application.
- `/backend/`: Contains the FastAPI backend, structured using Domain-Driven Design (auth, creators, brands, campaigns).
- `/docs/`: Contains detailed architecture and schema documentation, including `schema.md` (Database Truth) and `plan.md` (Roadmap).

## Data Seeding

To populate the database with realistic AI-generated demo data and sync your Clerk users, run the following commands sequentially inside the backend container:

1. **Generate Seed Data:** Uses Tavily and Groq to generate ~100 realistic Bangladeshi creators and brands (JSON files saved to `backend/data/`).
   ```bash
   docker compose exec backend python -m scripts.generate_seed_data
   ```
2. **Sync Clerk Users:** Fetches users from Clerk and assigns `brand` or `creator` roles to those with `@test.com` emails.
   ```bash
   docker compose exec backend python -m scripts.sync_clerk_users
   ```
3. **Seed Database:** Purges old business data, maps test users to the generated profiles, and seeds mock campaigns.
   ```bash
   docker compose exec backend python -m scripts.seed_db
   ```

## Documentation

For deep-dives into the database schema and future AI roadmap, please see the markdown files in the `/docs/` directory. If you are an AI assistant contributing to this repository, please strictly adhere to the rules outlined in `AGENTS.md`.
