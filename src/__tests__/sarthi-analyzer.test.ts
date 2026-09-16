import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeCollective } from "@/lib/sarthi/analyzer";
import type { SarthiContext } from "@/lib/sarthi/context";
import type { Member, Proposal, Samooh } from "@/types";

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
