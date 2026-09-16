import { getProposalStatus, isBlockchainConfigured, BlockchainNotConfiguredError } from "@/lib/blockchain";
import type { Proposal } from "@/types";

/**
 * Blockchain is the sole authority for proposal status once it has an
 * on-chain id. The Supabase `status` column is a cache: if it disagrees
 * with the chain, the chain wins. A proposal with no onchain_proposal_id
 * yet has never been submitted on-chain, so the DB value (DRAFT) stands.
 */
export async function reconcileProposalStatus(
  proposal: Proposal,
  governanceContract?: string
): Promise<Proposal> {
  if (!proposal.onchain_proposal_id || !isBlockchainConfigured()) {
    return proposal;
  }

  try {
    const onchainStatus = await getProposalStatus(
      proposal.onchain_proposal_id,
      governanceContract
    );
    return { ...proposal, status: onchainStatus };
  } catch (err) {
    if (err instanceof BlockchainNotConfiguredError) {
      return proposal;
    }
    // RPC failure: surface the last-known cached status rather than failing
    // the whole request.
    console.error("Failed to reconcile proposal against chain:", err);
    return proposal;
  }
}
