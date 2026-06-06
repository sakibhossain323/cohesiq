# General Safety Checks & Best Practices

Whenever you make a modification to this repository, you must adhere to the following checklist to ensure that you don't break existing functionality:

1. **Check Docker Status (`docker compose ps`)**: If you make a backend environment change, a dependency change, or a FastAPI structural change, you must verify that the backend container is still running and healthy. Do not assume the server restarted cleanly.
2. **Check Logs (`docker compose logs --tail 50 backend`)**: Look for traceback errors in the backend logs immediately after a reload. Often, broken imports or missing environment variables crash the server silently in the background.
3. **Verify Imports Globally (`grep_search`)**: If you delete or rename a constant (like `ALGORITHM` or `SECRET_KEY`), or a function, you must do a workspace-wide search to verify that no other service is currently importing it. Do not just delete and hope for the best.
4. **Compile the Frontend**: Next.js App Router is very sensitive. If you remove an export or modify a component, you must ensure the frontend successfully compiles and there are no "Export not found" errors in the terminal logs.
5. **Database Sync**: Remember that the frontend (`cohesiq-v0`) and backend are separate. If the frontend submits data, ensure the exact field names match what the Pydantic schemas expect on the backend.
6. **[CRITICAL] Frontend Colocation & Client Island Convention**: Next.js App Router rules are strictly enforced.
   - **Colocation**: ALWAYS place feature-specific Client Components inside a `_components/` directory, and Server Actions inside an `_actions/` directory, adjacent to the `page.tsx` they serve. NEVER use a global `components/` or `actions/` folder for feature-specific code.
   - **Data Fetching**: NEVER use `useEffect` or `useState` for data fetching or pagination. All data fetching MUST happen in the async `page.tsx` Server Component.
   - **Interactivity**: Isolate stateful UI (buttons, forms, dialogs) into `"use client"` Client Islands. Pass the server-fetched data down to these islands as props.
7. **Environment Variable Contract**: Ensure `process.env.BACKEND_API_URL` is ONLY used on the server, and `process.env.NEXT_PUBLIC_API_URL` is ONLY used in the browser. Do not mix these up.
8. **[CRITICAL] Design System Tokens**: Before finalising any frontend change, verify that no hardcoded colors (hex literals), arbitrary font sizes, or raw `px` spacing values were introduced. All styling MUST use `--brand-*`, `--color-*`, `--n-*`, `--space-*`, `--text-*`, or `--radius-*` tokens (or their Tailwind equivalents exposed via `@theme inline`). See `docs/design-system.md` for the full token reference.
