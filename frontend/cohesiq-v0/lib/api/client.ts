const isServer = typeof window === 'undefined';

/**
 * API URL Resolution — Two-Variable Contract
 * ─────────────────────────────────────────────────────────────────────────────
 * This file is the SINGLE source of truth for all backend API calls.
 * Do NOT access process.env.BACKEND_API_URL or process.env.NEXT_PUBLIC_API_URL
 * anywhere else in the codebase. Always use fetchApi() from this module.
 *
 * SERVER (isServer = true) → BACKEND_API_URL
 *   Runs inside the Docker network (Server Components, Server Actions, Route
 *   Handlers). Communicates with FastAPI via the internal Docker service name.
 *   This value is IDENTICAL across all environments (local, staging, prod)
 *   because Docker networking is consistent.
 *   Default: http://backend:8000
 *
 * CLIENT (isServer = false) → NEXT_PUBLIC_API_URL
 *   Runs in the end-user's browser. Must be a PUBLICLY reachable URL.
 *   This MUST be set in .env for each environment:
 *     - Local dev: http://localhost:8000
 *     - Staging:   http://<staging-server-ip>:8000
 *   See frontend/cohesiq-v0/.env.example for reference.
 */
export const API_BASE_URL = isServer
  ? (process.env.BACKEND_API_URL || 'http://backend:8000')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

export interface FetchOptions extends RequestInit {
  token?: string;
}

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...restOptions } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(
      Object.entries(restOptions.headers || {}).map(([key, val]) => [key, String(val)])
    ),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...restOptions,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }
  
  // Empty response handling (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}
