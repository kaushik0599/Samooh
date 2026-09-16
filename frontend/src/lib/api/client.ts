import type { ApiResponse } from "@samooh/types";

/**
 * Thrown for both HTTP-level failures and `{ success: false }` API
 * responses, so callers can handle both with one catch block.
 */
export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

/**
 * The backend now runs as its own Next.js app (see backend/), so this is a
 * cross-origin fetch, not a same-origin one — NEXT_PUBLIC_API_URL points
 * at it (http://localhost:4000 in local dev, see .env.example). Still
 * unwraps the `{ success, data }` / `{ success, error }` envelope every
 * route already returns (see docs/API_SPEC.md); never invents fields
 * beyond what that spec documents.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (networkErr) {
    // The browser's own error (e.g. "Failed to fetch") usually says WHY:
    // backend not running, wrong NEXT_PUBLIC_API_URL, or CORS rejected the
    // request. Log it — it's the single most useful line when the backend
    // is unreachable, and this app never had it visible before.
    console.error(`[api] ${path} — network error (is the backend running at ${API_BASE_URL || "(same-origin)"}?):`, networkErr);
    throw new ApiClientError("Network error — could not reach the server", 0);
  }

  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiClientError("Received an invalid response from the server", res.status);
  }

  if (!body.success) {
    const err = new ApiClientError(body.error, res.status, body.code);
    // Log every API-level failure with its real status/code — this is
    // data the backend already sent over the network, not a new exposure;
    // it just stops UI catch blocks from being the only place it's seen.
    console.error(`[api] ${path} failed — ${res.status} ${body.code ?? ""}: ${body.error}`);
    throw err;
  }

  return body.data;
}

/**
 * For a caller's catch block: a clean, human-readable message in
 * production, with the real status/code appended in development so a
 * generic-looking failure (e.g. "Could not save your profile.") is never
 * the only information available without opening devtools. Never a fake
 * "success" and never any data beyond what the backend already returned
 * to this client.
 */
export function describeApiError(fallbackMessage: string, err: unknown): string {
  if (process.env.NODE_ENV !== "development") return fallbackMessage;
  if (err instanceof ApiClientError) {
    const codePart = err.code ? ` ${err.code}` : "";
    return `${fallbackMessage} (${err.status}${codePart}: ${err.message})`;
  }
  if (err instanceof Error) return `${fallbackMessage} (${err.message})`;
  return fallbackMessage;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetchApi<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return fetchApi<T>(path, { method: "POST", body: JSON.stringify(body) });
}
