import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeProposal, normalizeProposalStatus } from "@/lib/blockchain/normalize";

test("normalizeProposalStatus maps known enum values", () => {
  assert.equal(normalizeProposalStatus(0), "CREATED");
  assert.equal(normalizeProposalStatus(1), "VOTING");
  assert.equal(normalizeProposalStatus(2), "APPROVED");
  assert.equal(normalizeProposalStatus(3), "REJECTED");
  assert.equal(normalizeProposalStatus(4), "EXECUTED");
  assert.equal(normalizeProposalStatus(5), "EXPIRED");
});

test("normalizeProposalStatus falls back to VOTING for unknown values", () => {
  assert.equal(normalizeProposalStatus(99), "VOTING");
});

test("normalizeProposal converts bigint fields to strings", () => {
  const result = normalizeProposal({
    proposalId: 7n,
    status: 2,
    votesFor: 100n,
    votesAgainst: 10n,
    quorum: 50n,
    recipient: "0x1234567890123456789012345678901234567890",
    amount: 1000n,
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
