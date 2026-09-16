import type { BlockchainProposal, ProposalStatus } from "@samooh/types";
import { ZeroAddress } from "ethers";

/**
 * Isolates every assumption about the Governance contract's raw return
 * shape. Struct layout and status enum below match the real, deployed
 * `SamoohGovernance.Proposal` struct (contracts/contracts/SamoohGovernance.sol),
 * compiled and tested — see docs/GOVERNANCE_SPEC.md, "Reconciliation with
 * existing backend code" for what changed here versus the pre-contract
 * assumption this file used to encode.
 *
 * Contract enum `ProposalState`: Active=0, Approved=1, Rejected=2,
 * Expired=3, Executed=4. There is no standalone on-chain "created but not
 * yet open for voting" state — a proposal is Active immediately, which
 * maps to the app's "VOTING" `ProposalStatus`. `ProposalStatus.CREATED`
 * still exists as a type (pre-chain-submission DB lifecycle only); it is
 * simply never produced by this chain-facing mapping.
 */
const STATUS_BY_ENUM: Record<number, ProposalStatus> = {
  0: "VOTING",
  1: "APPROVED",
  2: "REJECTED",
  3: "EXPIRED",
  4: "EXECUTED",
};

export function normalizeProposalStatus(rawStatus: number): ProposalStatus {
  return STATUS_BY_ENUM[rawStatus] ?? "VOTING";
}

/**
 * Mirrors `SamoohGovernance.Proposal` exactly (field name `id`, not
 * `proposalId` — the contract struct field is `id`; ethers v6 returns
 * named struct properties matching the Solidity field names verbatim).
 */
export interface RawProposal {
  id: bigint | string;
  proposer: string;
  recipient: string;
  amount: bigint | string;
  metadataURI: string;
  createdAt: bigint | string;
  votingDeadline: bigint | string;
  votesFor: bigint | string;
  votesAgainst: bigint | string;
  quorumVotesRequired: bigint | string;
  state: number;
  executed: boolean;
}

export function normalizeProposal(raw: RawProposal): BlockchainProposal {
  const hasRecipient = raw.recipient.toLowerCase() !== ZeroAddress.toLowerCase();
  return {
    onchainProposalId: String(raw.id),
    status: normalizeProposalStatus(Number(raw.state)),
    votesFor: String(raw.votesFor),
    votesAgainst: String(raw.votesAgainst),
    quorum: String(raw.quorumVotesRequired),
    recipient: hasRecipient ? raw.recipient : null,
    amount: hasRecipient ? String(raw.amount) : null,
    executed: raw.executed,
  };
}
