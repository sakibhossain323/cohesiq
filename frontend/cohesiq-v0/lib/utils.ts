import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export function formatFollowerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function sanitizeImageUrl(url?: string): string | undefined {
  if (!url) return undefined;

  const normalized = url
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/^\/\//, "https://");

  try {
    const parsedUrl = new URL(normalized);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return undefined;
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const instagramHosts = ["cdninstagram.com", "fna.fbcdn.net", "fbcdn.net"];
    const isInstagramHost = instagramHosts.some(host => hostname === host || hostname.endsWith(`.${host}`));

    if (isInstagramHost) {
      return `/api/image-proxy?url=${encodeURIComponent(normalized)}`;
    }

    return normalized;
  } catch {
    return undefined;
  }
}

export function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}
