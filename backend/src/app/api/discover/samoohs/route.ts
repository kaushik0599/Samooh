import { withErrorHandling, ok } from "@/lib/api/response";
import { requireWalletAddress } from "@/lib/validation";
import { discoverSamoohsForWallet } from "@/lib/services/discovery.service";

/**
 * GET /api/discover/samoohs?wallet_address=0x...
 * Requires a completed onboarding profile for that wallet (400 if missing).
 */
export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const walletAddress = requireWalletAddress(
      searchParams.get("wallet_address"),
      "wallet_address"
    );

    const result = await discoverSamoohsForWallet(walletAddress);
    return ok(result);
  });
}
