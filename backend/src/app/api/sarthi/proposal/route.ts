import { withErrorHandling, created } from "@/lib/api/response";
import {
  requireUuid,
  requireString,
  optionalString,
  optionalAmount,
  requireWalletAddress,
} from "@/lib/validation";
import { createProposal, type CreateProposalInput } from "@/lib/services/proposals.service";
import { parseJsonBody } from "../parse-body";

/**
 * Creates a proposal DRAFT pre-filled from a Sarthi idea. This never
 * touches the blockchain — onchain_proposal_id stays null until the user
 * submits the proposal on-chain through their own wallet, at which point
 * POST /api/proposals (or an update flow) records the resulting onchain id.
 * createProposal always persists a DRAFT status server-side (see
 * proposals.service.ts) — this route never reads or forwards a `status`
 * field from the request body, so a Sarthi-drafted proposal can never be
 * created as anything but a DRAFT.
 *
 * Pre-fill mapping ("Sarthi Idea -> Open -> Create Proposal -> pre-filled
 * form -> HUMAN EDITS -> HUMAN CONFIRMS -> GOVERNANCE", per
 * docs/IDENTITY_SPEC.md "Proposal lifecycle mapping"):
 *   - title            <- SarthiInsight.title (the caller already sends the
 *                         insight's own title; may be overridden before the
 *                         human confirms)
 *   - description       <- SarthiInsight.description, with
 *                         SarthiInsight.recommendation appended when both
 *                         are present, so the draft carries both the "what
 *                         we observed" and "what we suggest" halves of the
 *                         insight rather than losing one.
 *   - purpose          <- SarthiInsight.description (the insight's
 *                         description IS the real, evidence-based "why"
 *                         this proposal exists) when the caller doesn't
 *                         supply an explicit `purpose` override.
 *   - category         <- SarthiInsight.type (e.g. "treasury",
 *                         "governance", "procurement") when the caller
 *                         doesn't supply an explicit `category` override —
 *                         an honest, direct passthrough of a real field,
 *                         not a fabricated classification.
 *   - expected_outcome <- SarthiInsight.recommendation (literally what
 *                         Sarthi recommended, i.e. the outcome the proposal
 *                         aims for) when the caller doesn't supply an
 *                         explicit `expected_outcome` override.
 *   - voting_start / voting_end are intentionally left unset here — there
 *     is no honest evidentiary basis for Sarthi to pick specific dates;
 *     the human sets these when they confirm the proposal for governance.
 *
 * NOTE: `CreateProposalInput` (proposals.service.ts) does not yet declare
 * `purpose`/`category`/`expected_outcome` in its TS type as of this pass —
 * that's the other in-flight backend agent's file, owned by them, not
 * edited here. `database/migration.sql` already has these columns (see
 * docs/IDENTITY_SPEC.md), so they are included on a plain (non-annotated)
 * object below: TypeScript's excess-property check only applies to a
 * fresh object literal passed directly as an argument, not to a variable
 * reference, so this still type-checks against `CreateProposalInput` today
 * and will pick up compile-time field checking for free once that type is
 * extended.
 */

/** Pure, unit-testable half of the pre-fill mapping described above. */
export function buildProposalDraftFields(body: Record<string, unknown>): {
  description: string | null;
  purpose: string | null;
  category: string | null;
  expected_outcome: string | null;
} {
  const insightDescription = optionalString(body.description, "description", { max: 5000 });
  const insightRecommendation = optionalString(body.recommendation, "recommendation", {
    max: 5000,
  });
  const insightType = optionalString(body.type, "type", { max: 50 });

  const description =
    insightDescription && insightRecommendation
      ? `${insightDescription}\n\nRecommendation: ${insightRecommendation}`
      : (insightDescription ?? insightRecommendation);

  const purpose = optionalString(body.purpose, "purpose", { max: 5000 }) ?? insightDescription;
  const category = optionalString(body.category, "category", { max: 50 }) ?? insightType;
  const expected_outcome =
    optionalString(body.expected_outcome, "expected_outcome", { max: 5000 }) ??
    insightRecommendation;

  return { description, purpose, category, expected_outcome };
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const body = await parseJsonBody(req);
    const { description, purpose, category, expected_outcome } = buildProposalDraftFields(body);

    const baseInput: CreateProposalInput = {
      samooh_id: requireUuid(body.samooh_id, "samooh_id"),
      onchain_proposal_id: null,
      title: requireString(body.title, "title", { max: 200 }),
      description,
      amount: optionalAmount(body.amount, "amount"),
      recipient:
        body.recipient !== undefined && body.recipient !== null && body.recipient !== ""
          ? requireWalletAddress(body.recipient, "recipient")
          : null,
      created_by: requireWalletAddress(body.created_by, "created_by"),
    };

    // Widened (non-literal) input carrying the extra pre-fill fields the DB
    // already supports. See the NOTE above for why this still type-checks
    // against CreateProposalInput without editing proposals.service.ts.
    const input = { ...baseInput, purpose, category, expected_outcome };

    // This route never sets `status` itself — createProposal always
    // inserts DRAFT server-side (see proposals.service.ts). Never change
    // this to accept/forward a status field from the request body.
    const proposal = await createProposal(input);
    return created(proposal);
  });
}
