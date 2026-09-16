import { Contract } from "ethers";
import { getProvider } from "../provider";
import { getBlockchainConfig } from "../config";
import { GOVERNANCE_ABI } from "../abi/governance.abi";
import { BlockchainNotConfiguredError, requireConfiguredAddress } from "../errors";
import { normalizeProposal, type RawProposal } from "../normalize";
import type { BlockchainProposal, GovernanceState, Member } from "@/types";

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
  if (GOVERNANCE_ABI.length === 0) {
    throw new BlockchainNotConfiguredError("Governance contract ABI");
  }
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
  const quorumReached = BigInt(proposal.votesFor) >= BigInt(proposal.quorum || "0");
  return { proposal, quorumReached };
}

export async function getQuorum(
  onchainProposalId: string,
  contractAddress?: string
): Promise<string> {
  const proposal = await getProposal(onchainProposalId, contractAddress);
  return proposal.quorum;
}

export async function getMembers(): Promise<Member[]> {
  // Membership is app-level (Supabase) unless/until the Governance contract
  // exposes an enumerable members list. Left as an explicit not-configured
  // call rather than guessing a function signature.
  throw new BlockchainNotConfiguredError("On-chain member enumeration");
}
