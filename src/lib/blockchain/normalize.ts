import type { BlockchainProposal, ProposalStatus } from "@/types";

/**
 * Isolates every assumption about the Governance contract's raw return
 * shape. This is the ONE place that needs updating once the blockchain
 * team confirms the real struct/enum layout (see
 * docs/BLOCKCHAIN_INTEGRATION.md). Nothing outside this file assumes a
 * specific ABI shape.
 *
 * Expected raw shape (to be confirmed against the real contract):
 *   { proposalId, status: uint8, votesFor, votesAgainst, quorum,
 *     recipient, amount, executed }
 * Assumed status enum: 0=CREATED 1=VOTING 2=APPROVED 3=REJECTED
 *                       4=EXECUTED 5=EXPIRED
 */
const STATUS_BY_ENUM: Record<number, ProposalStatus> = {
  0: "CREATED",
  1: "VOTING",
  2: "APPROVED",
  3: "REJECTED",
  4: "EXECUTED",
  5: "EXPIRED",
};

export function normalizeProposalStatus(rawStatus: number): ProposalStatus {
  return STATUS_BY_ENUM[rawStatus] ?? "VOTING";
}

export interface RawProposal {
  proposalId: bigint | string;
  status: number;
  votesFor: bigint | string;
  votesAgainst: bigint | string;
  quorum: bigint | string;
  recipient: string | null;
  amount: bigint | string | null;
  executed: boolean;
}

export function normalizeProposal(raw: RawProposal): BlockchainProposal {
  return {
    onchainProposalId: String(raw.proposalId),
    status: normalizeProposalStatus(Number(raw.status)),
    votesFor: String(raw.votesFor),
    votesAgainst: String(raw.votesAgainst),
    quorum: String(raw.quorum),
    recipient: raw.recipient,
    amount: raw.amount === null ? null : String(raw.amount),
    executed: raw.executed,
  };
}
