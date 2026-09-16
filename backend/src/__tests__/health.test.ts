import { test } from "node:test";
import assert from "node:assert/strict";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isBlockchainConfigured } from "@/lib/blockchain";

test("isSupabaseConfigured is false without both env vars set", () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  assert.equal(isSupabaseConfigured(), false);

  if (prevUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
  if (prevKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
});

test("isBlockchainConfigured is false without RPC/contract env vars set", () => {
  const keys = [
    "POLYGON_AMOY_RPC_URL",
    "NEXT_PUBLIC_GOVERNANCE_CONTRACT",
    "NEXT_PUBLIC_TREASURY_CONTRACT",
  ] as const;
  const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  for (const k of keys) delete process.env[k];

  assert.equal(isBlockchainConfigured(), false);

  for (const k of keys) {
    if (prev[k] !== undefined) process.env[k] = prev[k];
  }
});
