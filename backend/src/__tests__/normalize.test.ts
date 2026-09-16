import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeProposal, normalizeProposalStatus } from "@/lib/blockchain/normalize";

test("normalizeProposalStatus maps known enum values (Active/Approved/Rejected/Expired/Executed)", () => {
  assert.equal(normalizeProposalStatus(0), "VOTING"); // Active
  assert.equal(normalizeProposalStatus(1), "APPROVED");
  assert.equal(normalizeProposalStatus(2), "REJECTED");
  assert.equal(normalizeProposalStatus(3), "EXPIRED");
  assert.equal(normalizeProposalStatus(4), "EXECUTED");
});

test("normalizeProposalStatus falls back to VOTING for unknown values", () => {
  assert.equal(normalizeProposalStatus(99), "VOTING");
});

test("normalizeProposal converts bigint fields to strings and maps struct field `id`", () => {
  const result = normalizeProposal({
    id: 7n,
    proposer: "0x1111111111111111111111111111111111111111",
    state: 1,
    votesFor: 100n,
    votesAgainst: 10n,
    quorumVotesRequired: 50n,
    recipient: "0x1234567890123456789012345678901234567890",
    amount: 1000n,
    metadataURI: "ipfs://x",
    createdAt: 0n,
    votingDeadline: 0n,
    executed: false,
  });

  assert.deepEqual(result, {
    onchainProposalId: "7",
    status: "APPROVED",
    votesFor: "100",
    votesAgainst: "10",
    quorum: "50",
    recipient: "0x1234567890123456789012345678901234567890",
    amount: "1000",
    executed: false,
  });
});

test("normalizeProposal nulls recipient/amount when recipient is the zero address (non-financial proposal)", () => {
  const result = normalizeProposal({
    id: 3n,
    proposer: "0x1111111111111111111111111111111111111111",
    state: 0,
    votesFor: 0n,
    votesAgainst: 0n,
    quorumVotesRequired: 1n,
    recipient: "0x0000000000000000000000000000000000000000",
    amount: 0n,
    metadataURI: "ipfs://x",
    createdAt: 0n,
    votingDeadline: 0n,
    executed: false,
  });

  assert.equal(result.recipient, null);
  assert.equal(result.amount, null);
});
