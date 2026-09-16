import { getSupabaseServerClient } from "@/lib/supabase/client";
import { ConflictError } from "@/lib/api/response";
import type { Proposal } from "@samooh/types";

export interface CreateProposalInput {
  samooh_id: string;
  onchain_proposal_id: string | null;
  title: string;
  description: string | null;
  /** Structured "idea" fields for the proposal-detail view. All optional/nullable. */
  purpose?: string | null;
  category?: string | null;
  expected_outcome?: string | null;
  amount: string | null;
  recipient: string | null;
  voting_start?: string | null;
  voting_end?: string | null;
  created_by: string;
}

/**
 * Persists proposal METADATA only. Status always starts at DRAFT here — the
 * only way a proposal becomes CREATED/VOTING/APPROVED/etc. is by reconciling
 * against blockchain state, never by direct client input. See
 * BLOCKCHAIN_INTEGRATION.md and the ProposalStatus rule in src/types.
 *
 * `governance_id` is never client-supplied. It's resolved here from the
 * proposal's Samooh's `governance_identities` row so a proposal can never
 * be inserted pointing at a fabricated or mismatched governance instance —
 * see docs/IDENTITY_SPEC.md. Every Samooh is guaranteed to have this row
 * (created alongside it, or backfilled by the migration), but a proposal
 * is still allowed to be created with a null governance_id in the
 * defensive case that lookup somehow comes back empty, rather than
 * blocking proposal creation entirely over a data-integrity gap elsewhere.
 */
export async function createProposal(input: CreateProposalInput): Promise<Proposal> {
  const supabase = getSupabaseServerClient();

  const { data: governanceIdentity, error: governanceError } = await supabase
    .from("governance_identities")
    .select("id")
    .eq("samooh_id", input.samooh_id)
    .maybeSingle();
  if (governanceError) {
    throw new Error(`Failed to resolve governance identity: ${governanceError.message}`);
  }

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      ...input,
      purpose: input.purpose ?? null,
      category: input.category ?? null,
      expected_outcome: input.expected_outcome ?? null,
      voting_start: input.voting_start ?? null,
      voting_end: input.voting_end ?? null,
      governance_id: (governanceIdentity?.id as string | undefined) ?? null,
      status: "DRAFT",
    })
    .select()
    .single();

  if (error) {
    // proposals_unique_onchain_id (samooh_id, onchain_proposal_id): another
    // proposal for this on-chain id was already persisted, possibly via a
    // concurrent request.
    if (error.code === "23505") {
      throw new ConflictError("A proposal with this on-chain id already exists for this Samooh");
    }
    throw new Error(`Failed to create proposal: ${error.message}`);
  }
  return data as Proposal;
}

export async function listProposals(samoohId: string): Promise<Proposal[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("proposals")
    .select()
    .eq("samooh_id", samoohId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch proposals: ${error.message}`);
  return (data ?? []) as Proposal[];
}
