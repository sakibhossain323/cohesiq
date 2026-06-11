"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePollingOptions {
  /** Set to false to pause polling without unmounting. Defaults to true. */
  enabled?: boolean;
}

interface UsePollingResult {
  /** Timestamp of the last successful poll. null before the first success. */
  lastUpdated: Date | null;
  /** True while a poll is in flight. */
  isRefreshing: boolean;
  /** Call manually to trigger an immediate fetch outside the interval. */
  refresh: () => void;
}

/**
 * Fires `fn` immediately on mount (when enabled=true) then repeats every
 * `intervalMs` milliseconds. Skips a tick if the previous fetch is still in
 * flight so requests never pile up.
 *
 * Cleans up the interval and cancels in-flight tracking on unmount.
 */
export function usePolling(
  fn: () => Promise<void>,
  intervalMs: number,
  { enabled = true }: UsePollingOptions = {},
): UsePollingResult {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const inFlight = useRef(false);
  const unmounted = useRef(false);
  const savedFn = useRef(fn);

  // Remember the latest fn so we don't have to add it to effect dependencies
  useEffect(() => {
    savedFn.current = fn;
  }, [fn]);

  const run = useCallback(async () => {
    if (inFlight.current || unmounted.current) return;
    inFlight.current = true;
    setIsRefreshing(true);
    try {
      await savedFn.current();
      if (!unmounted.current) setLastUpdated(new Date());
    } finally {
      inFlight.current = false;
      if (!unmounted.current) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    unmounted.current = false;
    if (!enabled) return;

    // Fire immediately on mount / when enabled becomes true.
    run();

    const id = setInterval(run, intervalMs);
    return () => {
      clearInterval(id);
      // Don't set unmounted here — only set it in the cleanup below.
    };
  }, [enabled, intervalMs, run]);

  // Separate effect just to mark unmount so in-flight fetches don't setState.
  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  return { lastUpdated, isRefreshing, refresh: run };
}
