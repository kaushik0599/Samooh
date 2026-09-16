import { ValidationError } from "@/lib/api/response";

/**
 * Parses a request body as JSON and ensures it's a plain object before any
 * field is read off it. Reuses the existing ValidationError -> 400
 * VALIDATION_ERROR envelope (see lib/api/response.ts) rather than inventing
 * a new response shape. Without this, malformed JSON or a non-object body
 * (null, an array, a bare string/number) would throw a raw TypeError/
 * SyntaxError that withErrorHandling can only report as a generic 500.
 */
export async function parseJsonBody(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object");
  }
  return body as Record<string, unknown>;
}
