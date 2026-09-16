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
 * Records proposal METADATA only. This endpoint never approves, votes,
 * executes, or moves treasury funds — those actions happen exclusively
 * on-chain via the user's own wallet. See docs/API_SPEC.md.
 */
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const body = await req.json();

    const input = {
      samooh_id: requireUuid(body.samooh_id, "samooh_id"),
      onchain_proposal_id: optionalString(
        body.onchain_proposal_id,
        "onchain_proposal_id",
        { max: 100 }
      ),
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
