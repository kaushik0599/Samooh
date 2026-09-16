import { test } from "node:test";
import assert from "node:assert/strict";
import { reconcileProposalStatus } from "@/lib/services/reconcile.service";
import type { Proposal } from "@/types";

const baseProposal: Proposal = {
  id: "p1",
  samooh_id: "s1",
  onchain_proposal_id: null,
  title: "Test proposal",
  description: null,
  amount: null,
  recipient: null,
  status: "APPROVED",
  created_by: "0x1234567890123456789012345678901234567890",
  created_at: new Date().toISOString(),
};

test("reconcileProposalStatus leaves DB status as-is when never submitted on-chain", async () => {
  const result = await reconcileProposalStatus(baseProposal);
  assert.equal(result.status, "APPROVED");
});

test("reconcileProposalStatus is a no-op when blockchain is not configured, even if onchain id is set", async () => {
  // Invariant: without a configured chain, we must not silently invent
  // authority the backend doesn't have — we fall back to the DB cache
  // rather than fabricating a status.
  const proposalWithOnchainId: Proposal = { ...baseProposal, onchain_proposal_id: "3" };
  const result = await reconcileProposalStatus(proposalWithOnchainId);
  assert.equal(result.status, "APPROVED");
});
