import { NextResponse } from "next/server";

const allowedHosts = ["cdninstagram.com", "fna.fbcdn.net", "fbcdn.net"];

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isAllowedHost = allowedHosts.some(host => hostname === host || hostname.endsWith(`.${host}`));

  if (!isAllowedHost) {
    return NextResponse.json({ error: "URL host is not allowed" }, { status: 403 });
  }

  // fetch with retries and timeout
  async function fetchWithTimeout(u: string, timeoutMs = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(u, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CohesiqBot/1.0; +https://example.com)",
          Accept: "image/*,*/*;q=0.8",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(id);
    }
  }

  let response: Response | null = null;
  const attempts = 5;
  for (let i = 0; i < attempts; i++) {
    try {
      response = await fetchWithTimeout(parsedUrl.toString(), 5000 + i * 3000);
      if (response && response.ok) break;
    } catch (e) {
      // retry on network errors
    }
  }

  if (!response) {
    // return a small inline SVG placeholder so the UI displays an image instead of broken text
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-size="14">Image unavailable</text></svg>`;
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch image", status: response.status }, { status: response.status });
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
