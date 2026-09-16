import { ValidationError } from "@/lib/api/response";

const WALLET_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isWalletAddress(value: unknown): value is string {
  return typeof value === "string" && WALLET_ADDRESS_RE.test(value);
}

export function isTxHash(value: unknown): value is string {
  return typeof value === "string" && TX_HASH_RE.test(value);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function requireWalletAddress(value: unknown, field: string): string {
  if (!isWalletAddress(value)) {
    throw new ValidationError(`${field} must be a valid wallet address`);
  }
  return value.toLowerCase();
}

export function requireUuid(value: unknown, field: string): string {
  if (!isUuid(value)) {
    throw new ValidationError(`${field} must be a valid id`);
  }
  return value;
}

export function requireString(
  value: unknown,
  field: string,
  { min = 1, max = 5000 }: { min?: number; max?: number } = {}
): string {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) {
    throw new ValidationError(
      `${field} must be a string between ${min} and ${max} characters`
    );
  }
  return value.trim();
}

export function optionalString(
  value: unknown,
  field: string,
  opts: { min?: number; max?: number } = {}
): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireString(value, field, opts);
}

/**
 * Amounts are handled as decimal strings end-to-end (never JS numbers) to
 * avoid floating point precision loss against on-chain token amounts.
 */
export function requireAmount(value: unknown, field: string): string {
  if (
    typeof value !== "string" && typeof value !== "number"
  ) {
    throw new ValidationError(`${field} must be a numeric amount`);
  }
  const str = String(value);
  if (!/^\d+(\.\d+)?$/.test(str) || Number(str) <= 0) {
    throw new ValidationError(`${field} must be a positive numeric amount`);
  }
  return str;
}

export function optionalAmount(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireAmount(value, field);
}

export function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[]
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function optionalStringArray(
  value: unknown,
  field: string,
  { maxItems = 20, maxLength = 100 }: { maxItems?: number; maxLength?: number } = {}
): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new ValidationError(`${field} must be an array of at most ${maxItems} strings`);
  }
  return value.map((item, i) => requireString(item, `${field}[${i}]`, { max: maxLength }));
}
