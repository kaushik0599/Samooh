import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeCollective } from "@/lib/sarthi/analyzer";
import type { SarthiContext } from "@/lib/sarthi/context";
import type { Activity, Member, Proposal, Samooh } from "@/types";

const samooh: Samooh = {
  id: "s1",
  name: "Test Samooh",
  description: null,
  creator_wallet: "0x1234567890123456789012345678901234567890",
  governance_contract: "0x1234567890123456789012345678901234567890",
  treasury_contract: "0x1234567890123456789012345678901234567890",
  network: "polygon-amoy",
  category: null,
  purpose: null,
  region: null,
  objectives: [],
  membership_open: true,
  created_at: new Date().toISOString(),
};

function member(wallet: string): Member {
  return {
    id: wallet,
    samooh_id: "s1",
    wallet_address: wallet,
    role: "member",
    joined_at: new Date().toISOString(),
  };
}

function proposal(id: string, status: Proposal["status"] = "VOTING"): Proposal {
  return {
    id,
    samooh_id: "s1",
    onchain_proposal_id: id,
    title: `Proposal ${id}`,
    description: null,
    amount: null,
    recipient: null,
    status,
    created_by: "0x1234567890123456789012345678901234567890",
    created_at: new Date().toISOString(),
  };
}

function memberAddedActivity(id: string): Activity {
  return {
    id,
    samooh_id: "s1",
    type: "MemberAdded",
    actor: "0x1234567890123456789012345678901234567890",
    description: "A member joined",
    transaction_hash: null,
    created_at: new Date().toISOString(),
  };
}

test("analyzeCollective flags no-proposals-yet when members exist but no proposals", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc")],
    proposals: [],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  assert.ok(insights.some((i) => i.type === "governance"));
});

test("analyzeCollective never proposes voting, approving, or executing", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc")],
    proposals: [],
    activity: [],
    treasuryBalance: "10.5",
  };

  const insights = analyzeCollective(ctx);
  const forbidden = /\b(vote|approve|reject|execute|transfer)\b/i;
  for (const insight of insights) {
    assert.equal(forbidden.test(insight.recommendation), false, insight.recommendation);
  }
});

test("analyzeCollective's low-participation insight never says 'vote' as an action word", () => {
  // Regression test: this branch's recommendation used to read "Encourage
  // members to vote on open proposals", which trips the forbidden-word
  // invariant below even though it's just urging humans to vote, not Sarthi
  // itself. No prior test exercised this branch (needs proposals.length > 0
  // with low relative VoteCast activity), so the bug shipped silently.
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc"), member("0xd")],
    proposals: [proposal("1")],
    activity: [], // zero VoteCast events -> low participation branch fires
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  const participation = insights.find((i) => i.type === "participation");
  assert.ok(participation, "expected a participation insight to fire");

  const forbidden = /\b(vote|approve|reject|execute|transfer)\b/i;
  assert.equal(forbidden.test(participation!.recommendation), false, participation!.recommendation);
});

test("analyzeCollective flags a bottleneck when at least half of proposals are rejected", () => {
  // Needs rejected.length >= 2 AND rejected/total >= 0.5 - no prior test
  // exercised this branch.
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc")],
    proposals: [
      proposal("1", "REJECTED"),
      proposal("2", "REJECTED"),
      proposal("3", "VOTING"),
    ],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  const bottleneck = insights.find((i) => i.type === "bottleneck");
  assert.ok(bottleneck, "expected a bottleneck insight to fire");
  assert.equal(bottleneck!.priority, "high");
});

test("analyzeCollective does not flag a bottleneck when rejections are below half", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc")],
    proposals: [
      proposal("1", "REJECTED"),
      proposal("2", "VOTING"),
      proposal("3", "APPROVED"),
    ],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  assert.equal(insights.some((i) => i.type === "bottleneck"), false);
});

test("analyzeCollective flags growing membership after 3+ MemberAdded activity events", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc")],
    proposals: [],
    activity: [
      memberAddedActivity("act1"),
      memberAddedActivity("act2"),
      memberAddedActivity("act3"),
    ],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  const growth = insights.find((i) => i.type === "growth");
  assert.ok(growth, "expected a growth insight to fire");
  assert.equal(growth!.priority, "low");
});

test("analyzeCollective produces no insights for an empty, inactive samooh", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [],
    proposals: [],
    activity: [],
    treasuryBalance: null,
  };

  assert.deepEqual(analyzeCollective(ctx), []);
});
