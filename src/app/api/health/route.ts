import { withErrorHandling, ok } from "@/lib/api/response";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isBlockchainConfigured } from "@/lib/blockchain";

/**
 * Config-presence check only (no live DB/RPC round-trip) — cheap, always
 * fast, safe to poll. Does not imply proposal reads are LIVE_ONCHAIN; see
 * ReconciledProposal.status_source for that per-request guarantee.
 */
export async function GET() {
  return withErrorHandling(async () => {
    return ok({
      status: "ok",
      supabase: isSupabaseConfigured() ? "configured" : "not_configured",
      blockchain: isBlockchainConfigured() ? "configured" : "not_configured",
      timestamp: new Date().toISOString(),
    });
  });
}
