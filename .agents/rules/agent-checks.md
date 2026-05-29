# General Safety Checks & Best Practices

Whenever you make a modification to this repository, you must adhere to the following checklist to ensure that you don't break existing functionality:

1. **Check Docker Status (`docker compose ps`)**: If you make a backend environment change, a dependency change, or a FastAPI structural change, you must verify that the backend container is still running and healthy. Do not assume the server restarted cleanly.
2. **Check Logs (`docker compose logs --tail 50 backend`)**: Look for traceback errors in the backend logs immediately after a reload. Often, broken imports or missing environment variables crash the server silently in the background.
3. **Verify Imports Globally (`grep_search`)**: If you delete or rename a constant (like `ALGORITHM` or `SECRET_KEY`), or a function, you must do a workspace-wide search to verify that no other service is currently importing it. Do not just delete and hope for the best.
4. **Compile the Frontend**: Next.js App Router is very sensitive. If you remove an export or modify a component, you must ensure the frontend successfully compiles and there are no "Export not found" errors in the terminal logs.
5. **Database Sync**: Remember that the frontend (`cohesiq-v0`) and backend are separate. If the frontend submits data, ensure the exact field names match what the Pydantic schemas expect on the backend.
