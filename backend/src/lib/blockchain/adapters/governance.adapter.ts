import { Contract } from "ethers";
import { getProvider } from "../provider";
import { getBlockchainConfig } from "../config";
import { GOVERNANCE_ABI, requireConfiguredAddress } from "@samooh/types/blockchain";
import { normalizeProposal, type RawProposal } from "../normalize";
import type { BlockchainProposal, GovernanceState } from "@samooh/types";

/**
 * `contractAddress` defaults to the env-configured contract but can be
 * overridden per-Samooh (each Samooh may deploy its own Governance
 * contract instance — see samoohs.governance_contract).
 */
function getGovernanceContract(contractAddress?: string): Contract {
  const address = requireConfiguredAddress(
    contractAddress || getBlockchainConfig().governanceContract,
    "Governance contract address"
  );
  return new Contract(address, GOVERNANCE_ABI, getProvider());
}

export async function getProposal(
  onchainProposalId: string,
  contractAddress?: string
): Promise<BlockchainProposal> {
  const contract = getGovernanceContract(contractAddress);
  const raw = (await contract.getFunction("getProposal")(onchainProposalId)) as RawProposal;
  return normalizeProposal(raw);
}

export async function getProposalStatus(
  onchainProposalId: string,
  contractAddress?: string
): Promise<BlockchainProposal["status"]> {
  const proposal = await getProposal(onchainProposalId, contractAddress);
  return proposal.status;
}

export async function getVotingStatus(
  onchainProposalId: string,
  contractAddress?: string
): Promise<GovernanceState> {
  const proposal = await getProposal(onchainProposalId, contractAddress);
  // Quorum is about total participation, not just yes-votes — see
  // docs/GOVERNANCE_SPEC.md "Reconciliation with existing backend code".
  const totalVotes = BigInt(proposal.votesFor) + BigInt(proposal.votesAgainst);
  const quorumReached = totalVotes >= BigInt(proposal.quorum || "0");
  return { proposal, quorumReached };
}

export async function getQuorum(
  onchainProposalId: string,
  contractAddress?: string
): Promise<string> {
  const proposal = await getProposal(onchainProposalId, contractAddress);
  return proposal.quorum;
}

/**
 * Returns the on-chain member wallet addresses for a Governance contract
 * (`SamoohGovernance.getMembers()`). Intentionally returns raw addresses,
 * not the app's `Member[]` shape — a `Member` record also carries
 * `samooh_id`/`role`/`joined_at`, which don't exist on-chain and this
 * adapter must never fabricate. Callers that need full `Member` records
 * reconcile these addresses against Supabase's `members` table.
 */
export async function getMembers(contractAddress?: string): Promise<string[]> {
  const contract = getGovernanceContract(contractAddress);
  const addresses = (await contract.getFunction("getMembers")()) as string[];
  return addresses.map((address) => address);
}
