const isServer = typeof window === 'undefined';
// Use the internal Docker network name 'backend' when fetching from the Next.js server
export const API_BASE_URL = isServer 
  ? 'http://backend:8000' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // We'll add auth token here later
  
  const response = await fetch(url, {
    ...options,
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
