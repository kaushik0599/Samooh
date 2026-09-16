import { withErrorHandling, created } from "@/lib/api/response";
import { requireUuid, requireWalletAddress } from "@/lib/validation";
import { getSamoohById } from "@/lib/services/samooh.service";
import { createJoinRequest } from "@/lib/services/join-requests.service";

/**
 * Creates a JOIN REQUEST — this never makes the caller a member. Actual
 * membership is granted on-chain (or via an explicit admin approval flow);
 * this endpoint only records intent to join. See docs/API_SPEC.md.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await context.params;
    const samoohId = requireUuid(id, "id");
    await getSamoohById(samoohId); // 404s if the Samooh doesn't exist

    const body = await req.json();
    const walletAddress = requireWalletAddress(body.wallet_address, "wallet_address");

    const request = await createJoinRequest(samoohId, walletAddress);
    return created(request);
  });
}
