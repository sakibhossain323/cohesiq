# Admin Panel — Implementation Runbook

> **Last updated: 2026-06-09**
> Phase F (base panel), Phase G (moderation + pagination), and Phase H-partial (user delete + identity) are **complete**.
> Active next work: remaining Phase H items — see bottom of this file.
> See [`tasks-sakib.md`](tasks-sakib.md) for the full checklist.

## Current state (as-built)

| Area | What exists |
|---|---|
| Auth gate | `proxy.ts` + `require_admin` FastAPI dep — Clerk `publicMetadata.role === 'admin'` |
| Layout | Reuses `DashboardLayout` (brand/creator sidebar pattern, Clerk `UserButton` for sign-out) |
| Dashboard `/admin` | Platform stats: 6 overview cards (users, creators, brands, campaigns, active campaigns, applications) + 2 activity cards (signups/applications last 7 days) |
| Users `/admin/users` | Filterable table (search email, role, is_active, clerk_id, profile status); suspend/unsuspend toggle; **hard delete with DB cascade**; paginated 20/page |
| Campaigns `/admin/campaigns` | Filterable table (status, visibility); inline status override; paginated 20/page |
| Reviews `/admin/reviews` | Table with rating stars, public/private badge; delete action; paginated 20/page |
| Pagination | `Paginated[T]` generic on backend; `AdminPaginationBar` client component with ellipsis; filter params preserved across pages |
| Auto-migrations | `entrypoint.sh` runs `alembic upgrade head` on every container start |

## Phase H — Completed items (2026-06-09 session)

| # | Task | Status |
|---|---|---|
| H-S01 | `DELETE /admin/users/{user_id}` — hard delete with full PostgreSQL CASCADE; self-delete guard (400 if admin deletes own account) | `[x]` |
| H-S02 | `AdminUserOut` schema extended — `clerk_id`, `has_profile` (checks creator/brand profile exists) | `[x]` |
| H-S03 | Users table UI — added Clerk ID column (monospace, truncated with hover tooltip), Profile status badge (Complete/Pending), red Delete button with confirm dialog | `[x]` |
| H-S04 | Hydration fix — `toLocaleDateString('en-US', { timeZone: 'UTC' })` across all three admin client components (users, campaigns, reviews) | `[x]` |
| H-S05 | `ResetOnboardingButton` — fixed stuck "Resetting…" button; added `session.reload()` to force Clerk JWT refresh before navigating to `/onboarding`, preventing stale-token redirect loop | `[x]` |

## Phase H — Remaining tasks

| # | Task | Notes |
|---|---|---|
| H01 | Admin chat interface | Anthropic API + `tool_use` in the browser admin page; no MCP needed for the frontend path |
| H02 | MCP server for DB insights | Python/FastAPI SSE-based MCP sharing backend deps; decision pending on whether to build separate service or embed |
| H03 | Applications oversight | Basic counts visible on dashboard; detailed view deferred |
| H04 | RAG / GraphRAG | Navid's domain; blocked on pgvector/Neo4j (Phase-E layers, see `plan.md`) |

---

## What you are building
A master-access admin panel: a role-gated `/admin` section in the existing Next.js app +
read-only `/admin/*` endpoints on the existing FastAPI backend. **No new container, no new env
var, no DB migration.** Additive only — the single shared edits are `proxy.ts` and `main.py`.

## Security model (already decided — do not change)
- Admin identity = Clerk `publicMetadata.role === 'admin'`, set once in the Clerk dashboard.
- Frontend gate: middleware (`proxy.ts`) reads `sessionClaims.metadata.role`.
- Backend gate (authoritative): `require_admin` reads the same `metadata.role` claim from the
  validated Clerk JWT and fails closed.
- Safe because `publicMetadata` is server-write-only (users cannot self-elevate from the browser).
- Because Clerk metadata lives in Clerk's cloud, setting it once covers **every environment**
  (local + EC2) that uses the same Clerk instance — no per-environment setup.

---

## STEP F00 — One-time provisioning (manual, do first)
1. Clerk dashboard → Users → `admin@cohesiq.com` → **Public metadata** → set exactly:
   ```json
   { "role": "admin", "onboardingComplete": true }
   ```
2. Confirm local `.env` and the EC2 `.env` use the **same** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   and `CLERK_SECRET_KEY` (same Clerk instance), and backend `CLERK_ISSUER_URL` matches.
3. If already signed in as the admin, sign out and back in so the new claim is in the token
   (session tokens cache ~60s).

---

## BACKEND

### STEP F01 — `require_admin` dependency
File: `backend/app/common/dependencies.py` — **append at the end** (all imports it needs
already exist at the top of the file):
```python
async def require_admin(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    current_user=Depends(get_current_user),
):
    """Allow only Clerk users whose publicMetadata.role == 'admin'.
    Reads the 'metadata' claim from the Clerk session token (same claim the Next.js
    middleware reads). Fails closed if the claim is absent."""
    role = None
    if settings.clerk_issuer_url:
        try:
            jwks = get_jwks()
            claims = jwt.decode(
                credentials.credentials,
                key=jwks,
                algorithms=["RS256"],
                issuer=settings.clerk_issuer_url,
                options={"verify_aud": False},
            )
            role = claims.get("metadata", {}).get("role")
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    else:
        # Local HS256 dev tokens carry no Clerk metadata — fall back to the DB role.
        role = getattr(current_user, "role", None)
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
```

### STEP F02 — admin package
File: `backend/app/admin/__init__.py` — **create empty**.

### STEP F03 — admin schemas
File: `backend/app/admin/schemas.py` — **create**:
```python
import uuid
from datetime import datetime

from pydantic import BaseModel


class AdminStats(BaseModel):
    total_users: int
    total_creators: int
    total_brands: int
    total_admins: int
    total_campaigns: int
    total_applications: int


class AdminUserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminCampaignOut(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    visibility: str
    brand_id: uuid.UUID
    budget_per_creator_max: int
    created_at: datetime

    model_config = {"from_attributes": True}
```

### STEP F04 — admin service (unscoped queries)
File: `backend/app/admin/service.py` — **create**:
```python
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.campaigns.models import Campaign, CampaignApplication


async def _count(db: AsyncSession, stmt) -> int:
    return (await db.execute(stmt)).scalar_one()


async def get_platform_stats(db: AsyncSession) -> dict:
    return {
        "total_users": await _count(db, select(func.count()).select_from(User)),
        "total_creators": await _count(
            db, select(func.count()).select_from(User).where(User.role == "creator")
        ),
        "total_brands": await _count(
            db, select(func.count()).select_from(User).where(User.role == "brand")
        ),
        "total_admins": await _count(
            db, select(func.count()).select_from(User).where(User.role == "admin")
        ),
        "total_campaigns": await _count(db, select(func.count()).select_from(Campaign)),
        "total_applications": await _count(
            db, select(func.count()).select_from(CampaignApplication)
        ),
    }


async def list_all_users(db: AsyncSession, limit: int = 100, offset: int = 0) -> list[User]:
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all())


async def list_all_campaigns(db: AsyncSession, limit: int = 100, offset: int = 0) -> list[Campaign]:
    result = await db.execute(
        select(Campaign).order_by(Campaign.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all())
```

### STEP F05 — admin router (every route gated)
File: `backend/app/admin/router.py` — **create**:
```python
from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import service
from app.admin.schemas import AdminCampaignOut, AdminStats, AdminUserOut
from app.common.dependencies import get_db, require_admin

router = APIRouter()


@router.get("/stats", response_model=AdminStats, dependencies=[Depends(require_admin)])
async def admin_stats(db: Annotated[AsyncSession, Depends(get_db)]):
    return await service.get_platform_stats(db)


@router.get("/users", response_model=List[AdminUserOut], dependencies=[Depends(require_admin)])
async def admin_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 100,
    offset: int = 0,
):
    return await service.list_all_users(db, limit=limit, offset=offset)


@router.get("/campaigns", response_model=List[AdminCampaignOut], dependencies=[Depends(require_admin)])
async def admin_campaigns(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 100,
    offset: int = 0,
):
    return await service.list_all_campaigns(db, limit=limit, offset=offset)
```

### STEP F06 — register the router
File: `backend/app/main.py` — add immediately after the youtube router registration
(after `app.include_router(youtube_router, ...)`):
```python
from app.admin.router import router as admin_router
app.include_router(admin_router, prefix="/admin", tags=["admin"])
```

---

## FRONTEND

### STEP F07 — middleware gate
File: `frontend/cohesiq-v0/proxy.ts` — **replace the whole file** with:
```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/(brand|creator)/dashboard(.*)'])
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isBrandDashboardRoute = createRouteMatcher(['/brand/dashboard(.*)'])
const isCreatorDashboardRoute = createRouteMatcher(['/creator/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl?.pathname?.startsWith('/api/image-proxy')) {
    return NextResponse.next()
  }
  // Public routes: skip auth entirely
  if (!isProtectedRoute(req) && !isOnboardingRoute(req) && !isAdminRoute(req)) {
    return NextResponse.next()
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  // Admin routes: only Clerk publicMetadata.role === 'admin'. Handled BEFORE the
  // onboarding/role logic so the admin is never bounced to /onboarding.
  if (isAdminRoute(req)) {
    if (sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  if (isProtectedRoute(req) && !sessionClaims?.metadata?.onboardingComplete) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  if (isProtectedRoute(req) && sessionClaims?.metadata?.onboardingComplete) {
    const role = sessionClaims?.metadata?.role
    if (role === 'creator' && isBrandDashboardRoute(req)) {
      return NextResponse.redirect(new URL('/creator/dashboard', req.url))
    }
    if (role === 'brand' && isCreatorDashboardRoute(req)) {
      return NextResponse.redirect(new URL('/brand/dashboard', req.url))
    }
  }

  if (isOnboardingRoute(req) && sessionClaims?.metadata?.onboardingComplete) {
    const role = sessionClaims?.metadata?.role === 'brand' ? 'brand' : 'creator'
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/(.*)',
  ],
}
```
Only 3 things changed vs. the original: the `isAdminRoute` matcher, `&& !isAdminRoute(req)` in
the public guard, and the admin branch after the `!userId` check. Everything else is identical.

### STEP F08 — admin API client
File: `frontend/cohesiq-v0/lib/api/admin.ts` — **create**:
```ts
import { fetchApi } from "./client";

export interface AdminStats {
  total_users: number;
  total_creators: number;
  total_brands: number;
  total_admins: number;
  total_campaigns: number;
  total_applications: number;
}
export interface AdminUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}
export interface AdminCampaign {
  id: string;
  title: string;
  status: string;
  visibility: string;
  brand_id: string;
  budget_per_creator_max: number;
  created_at: string;
}

export const getAdminStats = (token: string) => fetchApi<AdminStats>("/admin/stats", { token });
export const getAdminUsers = (token: string) => fetchApi<AdminUser[]>("/admin/users", { token });
export const getAdminCampaigns = (token: string) => fetchApi<AdminCampaign[]>("/admin/campaigns", { token });
```

### STEP F09 — admin shell layout
File: `frontend/cohesiq-v0/app/(admin)/admin/layout.tsx` — **create**:
```tsx
import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r p-6">
        <h2 className="font-display text-lg mb-4">Admin</h2>
        <nav className="flex flex-col gap-1">
          <Link href="/admin" className="px-3 py-2 rounded-md hover:bg-muted">Dashboard</Link>
          <Link href="/admin/users" className="px-3 py-2 rounded-md hover:bg-muted">Users</Link>
          <Link href="/admin/campaigns" className="px-3 py-2 rounded-md hover:bg-muted">Campaigns</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

### STEP F10 — dashboard page (stats)
File: `frontend/cohesiq-v0/app/(admin)/admin/page.tsx` — **create**:
```tsx
import { auth } from "@clerk/nextjs/server";
import { getAdminStats } from "@/lib/api/admin";

export default async function AdminDashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return <p>Not authorized.</p>;

  const stats = await getAdminStats(token);
  const cards = [
    { label: "Users", value: stats.total_users },
    { label: "Creators", value: stats.total_creators },
    { label: "Brands", value: stats.total_brands },
    { label: "Admins", value: stats.total_admins },
    { label: "Campaigns", value: stats.total_campaigns },
    { label: "Applications", value: stats.total_applications },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Platform Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="border rounded-lg p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="text-3xl font-semibold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### STEP F11 — users page
File: `frontend/cohesiq-v0/app/(admin)/admin/users/page.tsx` — **create**:
```tsx
import { auth } from "@clerk/nextjs/server";
import { getAdminUsers } from "@/lib/api/admin";

export default async function AdminUsersPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return <p>Not authorized.</p>;

  const users = await getAdminUsers(token);
  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Users ({users.length})</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4">Active</th>
            <th className="py-2 pr-4">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="py-2 pr-4">{u.email}</td>
              <td className="py-2 pr-4">{u.role}</td>
              <td className="py-2 pr-4">{u.is_active ? "Yes" : "No"}</td>
              <td className="py-2 pr-4">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### STEP F12 — campaigns page
File: `frontend/cohesiq-v0/app/(admin)/admin/campaigns/page.tsx` — **create**:
```tsx
import { auth } from "@clerk/nextjs/server";
import { getAdminCampaigns } from "@/lib/api/admin";

export default async function AdminCampaignsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return <p>Not authorized.</p>;

  const campaigns = await getAdminCampaigns(token);
  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Campaigns ({campaigns.length})</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Title</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Visibility</th>
            <th className="py-2 pr-4">Max Budget</th>
            <th className="py-2 pr-4">Created</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2 pr-4">{c.title}</td>
              <td className="py-2 pr-4">{c.status}</td>
              <td className="py-2 pr-4">{c.visibility}</td>
              <td className="py-2 pr-4">{c.budget_per_creator_max}</td>
              <td className="py-2 pr-4">{new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## STEP F13 — Verify end-to-end
1. `docker compose up --build`; `docker compose ps` all healthy; `docker compose logs --tail 50 backend` clean.
2. Sign in as `admin@cohesiq.com` → visit `/admin` → dashboard, `/admin/users`, `/admin/campaigns` all render.
3. Sign in as a normal brand/creator → `/admin` redirects to `/`; `GET /admin/stats` with their token → **403**.
4. Unauthenticated `GET /admin/stats` → **401**.
5. Regression: `/brand/dashboard` and `/creator/dashboard` still work normally.
6. `graphify update .`; then mark F01–F13 `[x]` in the banner of `docs/tasks/tasks-sakib.md`.

## Notes / deferred (NOT for this pass)
- Tables are read-only Server Components (no client islands) — keep it simple. Search/filter,
  suspend-user, and campaign-status-override are follow-ups.
- Styling uses minimal utility classes; align to `docs/design-system.md` tokens in a polish pass.
- No DB migration, no new env var, no `docker-compose.yml`/Caddy change.
