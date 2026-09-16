"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiClientError } from "./client";

export type QueryState<T> =
  | { status: "loading"; data: undefined; error: undefined }
  | { status: "success"; data: T; error: undefined }
  | { status: "error"; data: undefined; error: ApiClientError };

/**
 * Single shared data-fetching pattern for every page that reads from
 * `/api/*` — avoids re-implementing loading/error/refetch state per page.
 * `fetcher` should be a stable function (wrap in useCallback at the call
 * site) or included via `deps`.
 */
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[]
): QueryState<T> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<T>>({
    status: "loading",
    data: undefined,
    error: undefined,
  });
  const [tick, setTick] = useState(0);

  const load = useCallback(() => {
    let cancelled = false;
    setState({ status: "loading", data: undefined, error: undefined });

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: "success", data, error: undefined });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error =
          err instanceof ApiClientError ? err : new ApiClientError("Unexpected error", 0);
        setState({ status: "error", data: undefined, error });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  useEffect(() => load(), [load]);

  return { ...state, refetch: () => setTick((t) => t + 1) };
}
