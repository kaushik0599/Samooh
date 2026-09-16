import { getSupabaseServerClient } from "@/lib/supabase/client";
import { ConflictError } from "@/lib/api/response";
import type { Proposal } from "@/types";

export interface CreateProposalInput {
  samooh_id: string;
  onchain_proposal_id: string | null;
  title: string;
  description: string | null;
  amount: string | null;
  recipient: string | null;
  created_by: string;
}

/**
 * Persists proposal METADATA only. Status always starts at DRAFT here — the
 * only way a proposal becomes CREATED/VOTING/APPROVED/etc. is by reconciling
 * against blockchain state, never by direct client input. See
 * BLOCKCHAIN_INTEGRATION.md and the ProposalStatus rule in src/types.
 */
export async function createProposal(input: CreateProposalInput): Promise<Proposal> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("proposals")
    .insert({ ...input, status: "DRAFT" })
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
