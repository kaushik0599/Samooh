import { withErrorHandling, created } from "@/lib/api/response";
import {
  requireUuid,
  requireString,
  optionalString,
  optionalAmount,
  requireWalletAddress,
} from "@/lib/validation";
import { createProposal } from "@/lib/services/proposals.service";

/**
 * Creates a proposal DRAFT from a Sarthi recommendation. This never touches
 * the blockchain — onchain_proposal_id stays null until the user submits
 * the proposal on-chain through their own wallet, at which point
 * POST /api/proposals (or an update flow) records the resulting onchain id.
 */
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const body = await req.json();

    const input = {
      samooh_id: requireUuid(body.samooh_id, "samooh_id"),
      onchain_proposal_id: null,
      title: requireString(body.title, "title", { max: 200 }),
      description: optionalString(body.description, "description", { max: 5000 }),
      amount: optionalAmount(body.amount, "amount"),
      recipient:
        body.recipient !== undefined && body.recipient !== null && body.recipient !== ""
          ? requireWalletAddress(body.recipient, "recipient")
          : null,
      created_by: requireWalletAddress(body.created_by, "created_by"),
    };

    const proposal = await createProposal(input);
    return created(proposal);
  });
}
