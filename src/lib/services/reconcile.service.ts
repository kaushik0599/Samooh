import { getProposalStatus, isBlockchainConfigured, BlockchainNotConfiguredError } from "@/lib/blockchain";
import type { Proposal, ReconciledProposal } from "@/types";

/**
 * Blockchain is the sole authority for proposal status once it has an
 * on-chain id. The Supabase `status` column is a cache: if it disagrees
 * with the chain, the chain wins. A proposal with no onchain_proposal_id
 * yet has never been submitted on-chain, so the DB value (DRAFT) stands
 * and is correctly reported as CACHE, not fabricated as live chain state.
 */
export async function reconcileProposalStatus(
  proposal: Proposal,
  governanceContract?: string
): Promise<ReconciledProposal> {
  if (!proposal.onchain_proposal_id) {
    return { ...proposal, status_source: "CACHE" };
  }

  if (!isBlockchainConfigured()) {
    return { ...proposal, status_source: "BLOCKCHAIN_UNAVAILABLE" };
  }

  try {
    const onchainStatus = await getProposalStatus(
      proposal.onchain_proposal_id,
      governanceContract
    );
    return { ...proposal, status: onchainStatus, status_source: "LIVE_ONCHAIN" };
  } catch (err) {
    if (err instanceof BlockchainNotConfiguredError) {
      return { ...proposal, status_source: "BLOCKCHAIN_UNAVAILABLE" };
    }
    // RPC failure: surface the last-known cached status rather than failing
    // the whole request, but label it clearly as not live.
    console.error("Failed to reconcile proposal against chain:", err);
    return { ...proposal, status_source: "BLOCKCHAIN_UNAVAILABLE" };
  }
}
