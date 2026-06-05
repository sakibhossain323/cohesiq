# Cohesiq Frontend

This is the Next.js App Router frontend for the Cohesiq platform.

## Architecture & Conventions

**Please refer to the root `AGENTS.md` and `README.md` for detailed architectural rules.** 

This project strictly follows the **Server Component -> Client Island** pattern.
- Data fetching occurs on the server (`page.tsx`).
- Interactions are handled in colocated `_components/`.
- Mutations are handled by colocated Server Actions in `_actions/`.

---

## Environment Setup

Before running the application, you must configure your local environment variables.

1. Copy the `.env.example` file to a new file named `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and provide your Clerk API keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`). 

3. Pay close attention to the `BACKEND_API_URL` and `NEXT_PUBLIC_API_URL` configuration inside the `.env.example` file. This dictates how the frontend communicates with the FastAPI backend across server and client boundaries.

### ⚠️ The Two-Variable API URL Dataflow

This is the most common source of staging breakage. Understand it before making changes:

```text
Browser (local dev env)          Next.js Server (remote)      FastAPI (remote)
        │                                │                          │
        │  click "Save"                  │                          │
        │──────────────────────────────►│                          │
        │                                │  BACKEND_API_URL         │
        │                                │  http://backend:8000     │
        │                                │─────────────────────────►│
        │                                │◄─────────────────────────│
        │◄──────────────────────────────│                          │
```

- **`BACKEND_API_URL`** — used by Server Components and Server Actions (code that runs on the remote server). The Next.js container and the FastAPI container share a Docker network, so `http://backend:8000` works in all environments. **This value never changes.**

- **`NEXT_PUBLIC_API_URL`** — used by client components (code that runs in the user's browser). The browser cannot reach `http://backend:8000` because that hostname only exists inside Docker. In staging, this must be set to the publicly accessible address of your FastAPI backend.

Detailed documentation for data fetching and mutation patterns can be found in `AGENTS.md`.

---

## Running the App

You have two options for running the frontend:

### Option A: Docker Compose (Recommended)

Running via Docker Compose from the repository root is the recommended approach. It ensures both the frontend and backend run seamlessly together in an isolated network.

```bash
# Run from the repository root, NOT from this frontend directory
cd ../..
docker compose up --build
```
The frontend will be available at [http://localhost:3000](http://localhost:3000).

### Option B: Local Development (Non-Dockerized)

If you need to run the Next.js server locally for isolated UI development or debugging without Docker, follow these steps:

```bash
# 1. Install dependencies
pnpm install

# 2. Start the development server
pnpm run dev
```

> **Note:** If you run the frontend locally via `pnpm run dev`, you must ensure your local `NEXT_PUBLIC_API_URL` and `BACKEND_API_URL` point to a running FastAPI backend (either running locally or on a remote staging server).

---

## Available Scripts

- `pnpm run dev`: Starts the local development server.
- `pnpm run build`: Builds the application for production.
- `pnpm run start`: Starts the production server.
- `pnpm run lint`: Runs ESLint for code quality.
