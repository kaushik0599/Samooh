"use client";

import { useApiQuery, type QueryState } from "@/lib/api/useApiQuery";
import { isDemoMode } from "./config";

/**
 * Same shape as useApiQuery, but returns fixture data instantly in Demo
 * Mode instead of hitting the real backend. Always calls useApiQuery
 * itself (never conditionally) to satisfy react-hooks/rules-of-hooks —
 * in Demo Mode the fetcher passed to it is swapped for an instant resolve
 * so no real network call is ever made, and the returned state is
 * overridden to the fixture regardless of that call's own timing.
 */
export function useWorkspaceData<T>(
  fetcher: () => Promise<T>,
  demoValue: T,
  deps: unknown[]
): QueryState<T> & { refetch: () => void } {
  const demo = isDemoMode();
  const query = useApiQuery(demo ? () => Promise.resolve(demoValue) : fetcher, deps);

  if (demo) {
    return { status: "success", data: demoValue, error: undefined, refetch: () => {} };
  }
  return query;
}
