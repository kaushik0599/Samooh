import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function fail(message: string, status = 400) {
  return NextResponse.json<ApiResponse<never>>(
    { success: false, error: message },
    { status }
  );
}

/**
 * Wraps a route handler so unexpected errors never leak stack traces or
 * secrets to the client; details go to server logs only.
 */
export async function withErrorHandling(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    console.error(err);
    if (err instanceof ValidationError) {
      return fail(err.message, 400);
    }
    if (err instanceof NotFoundError) {
      return fail(err.message, 404);
    }
    if (err instanceof ConflictError) {
      return fail(err.message, 409);
    }
    return fail("Internal server error", 500);
  }
}

export class ValidationError extends Error {}
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
