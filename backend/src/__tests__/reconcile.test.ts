import { test } from "node:test";
import assert from "node:assert/strict";
import { reconcileProposalStatus } from "@/lib/services/reconcile.service";
import type { Proposal } from "@samooh/types";

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

test("reconcileProposalStatus reports CACHE for a proposal never submitted on-chain", async () => {
  const result = await reconcileProposalStatus(baseProposal);
  assert.equal(result.status, "APPROVED");
  assert.equal(result.status_source, "CACHE");
});

test("reconcileProposalStatus reports BLOCKCHAIN_UNAVAILABLE (never fabricates live state) when chain is not configured, even with an onchain id", async () => {
  // Invariant: without a configured chain, we must not silently invent
  // authority the backend doesn't have — we fall back to the DB cache and
  // say so explicitly rather than claiming a live read.
  const proposalWithOnchainId: Proposal = { ...baseProposal, onchain_proposal_id: "3" };
  const result = await reconcileProposalStatus(proposalWithOnchainId);
  assert.equal(result.status, "APPROVED");
  assert.equal(result.status_source, "BLOCKCHAIN_UNAVAILABLE");
});
