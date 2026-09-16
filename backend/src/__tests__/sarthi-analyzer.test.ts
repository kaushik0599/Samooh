import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeCollective } from "@/lib/sarthi/analyzer";
import type { SarthiContext } from "@/lib/sarthi/context";
import type { Activity, Member, MemberRole, Proposal, Samooh } from "@samooh/types";

const samooh: Samooh = {
  id: "s1",
  display_id: "SMH-S-000001",
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

function member(wallet: string, role: MemberRole = "member"): Member {
  return {
    id: wallet,
    samooh_id: "s1",
    wallet_address: wallet,
    role,
    joined_at: new Date().toISOString(),
  };
}

function proposal(
  id: string,
  status: Proposal["status"] = "VOTING",
  overrides: Partial<Pick<Proposal, "created_by" | "recipient" | "amount" | "title">> = {}
): Proposal {
  return {
    id,
    display_id: `SMH-PR-${id.padStart(6, "0")}`,
    samooh_id: "s1",
    governance_id: null,
    onchain_proposal_id: id,
    title: overrides.title ?? `Proposal ${id}`,
    description: null,
    purpose: null,
    category: null,
    expected_outcome: null,
    amount: overrides.amount ?? null,
    recipient: overrides.recipient ?? null,
    voting_start: null,
    voting_end: null,
    status,
    created_by: overrides.created_by ?? "0x1234567890123456789012345678901234567890",
    created_at: new Date().toISOString(),
  };
}

function memberAddedActivity(id: string): Activity {
  return {
    id,
    display_id: `SMH-TX-${id}`,
    samooh_id: "s1",
    type: "MemberAdded",
    actor: "0x1234567890123456789012345678901234567890",
    description: "A member joined",
    transaction_hash: null,
    amount: null,
    token: "MATIC",
    status: "CONFIRMED",
    block_number: null,
    proposal_id: null,
    governance_id: null,
    treasury_id: null,
    created_at: new Date().toISOString(),
  };
}

function voteCastActivity(id: string, actor: string): Activity {
  return {
    id,
    display_id: `SMH-TX-${id}`,
    samooh_id: "s1",
    type: "VoteCast",
    actor,
    description: "A vote was cast",
    transaction_hash: null,
    amount: null,
    token: "MATIC",
    status: "CONFIRMED",
    block_number: null,
    proposal_id: null,
    governance_id: null,
    treasury_id: null,
    created_at: new Date().toISOString(),
  };
}

const FORBIDDEN_ACTION_WORDS = /\b(vote|approve|reject|execute|transfer)\b/i;

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
  for (const insight of insights) {
    assert.equal(FORBIDDEN_ACTION_WORDS.test(insight.recommendation), false, insight.recommendation);
  }
});

test("analyzeCollective's low-participation insight never says 'vote' as an action word", () => {
  // Regression test: this branch's recommendation used to read "Encourage
  // members to vote on open proposals", which trips the forbidden-word
  // invariant below even though it's just urging humans to vote, not Sarthi
  // itself. Needs proposals.length >= 2 (the participation rule's
  // evidentiary floor) with low relative VoteCast activity.
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc"), member("0xd")],
    proposals: [proposal("1"), proposal("2")],
    activity: [], // zero VoteCast events -> low participation branch fires
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  const participation = insights.find((i) => i.type === "participation");
  assert.ok(participation, "expected a participation insight to fire");
  assert.equal(FORBIDDEN_ACTION_WORDS.test(participation!.recommendation), false, participation!.recommendation);
});

test("analyzeCollective flags a bottleneck when at least half of proposals are rejected", () => {
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
  const bottleneck = insights.find((i) => i.type === "bottleneck" && i.title === "High proposal rejection rate");
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
  assert.equal(insights.some((i) => i.title === "High proposal rejection rate"), false);
});

test("analyzeCollective flags growing membership after 3+ recent MemberAdded activity events", () => {
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

test("analyzeCollective produces no insights for a single member with no history (insufficient data, no crash)", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa")],
    proposals: [],
    activity: [],
    treasuryBalance: null,
  };

  assert.doesNotThrow(() => analyzeCollective(ctx));
  assert.deepEqual(analyzeCollective(ctx), []);
});

test("analyzeCollective flags proposal authorship concentration at >=60% of proposals from one wallet", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc")],
    proposals: [
      proposal("1", "VOTING", { created_by: "0xa" }),
      proposal("2", "VOTING", { created_by: "0xa" }),
      proposal("3", "VOTING", { created_by: "0xa" }),
      proposal("4", "VOTING", { created_by: "0xb" }),
    ],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  const concentration = insights.find((i) => i.title === "Proposal authorship is concentrated");
  assert.ok(concentration, "expected proposal authorship concentration to fire");
  assert.equal(concentration!.type, "governance");
  assert.equal(concentration!.priority, "medium"); // 3/4 = 75% -> medium, not >=80%
  assert.match(concentration!.description, /3 of 4 proposals/);
});

test("analyzeCollective does not flag authorship concentration with fewer than 4 proposals", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb")],
    proposals: [
      proposal("1", "VOTING", { created_by: "0xa" }),
      proposal("2", "VOTING", { created_by: "0xa" }),
      proposal("3", "VOTING", { created_by: "0xa" }),
    ],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  assert.equal(insights.some((i) => i.title === "Proposal authorship is concentrated"), false);
});

test("analyzeCollective flags admin role concentration at >=50% of >=5 members", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [
      member("0xa", "admin"),
      member("0xb", "admin"),
      member("0xc", "admin"),
      member("0xd", "member"),
      member("0xe", "member"),
    ],
    proposals: [],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  const adminConcentration = insights.find((i) => i.title === "Admin role is concentrated");
  assert.ok(adminConcentration, "expected admin concentration to fire");
  assert.equal(adminConcentration!.type, "governance");
  assert.match(adminConcentration!.description, /3 of 5 members/);
});

test("analyzeCollective does not flag admin concentration under 5 members", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa", "admin"), member("0xb", "admin"), member("0xc", "member")],
    proposals: [],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  assert.equal(insights.some((i) => i.title === "Admin role is concentrated"), false);
});

test("analyzeCollective flags voting power concentration when one wallet casts >=50% of >=5 recorded votes", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc")],
    proposals: [],
    activity: [
      voteCastActivity("v1", "0xa"),
      voteCastActivity("v2", "0xa"),
      voteCastActivity("v3", "0xa"),
      voteCastActivity("v4", "0xb"),
      voteCastActivity("v5", "0xc"),
    ],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  const voterConcentration = insights.find((i) => i.title === "Voting power is concentrated");
  assert.ok(voterConcentration, "expected voting power concentration to fire");
  assert.equal(voterConcentration!.type, "bottleneck");
  assert.equal(FORBIDDEN_ACTION_WORDS.test(voterConcentration!.recommendation), false);
});

test("analyzeCollective does not flag voter concentration under 5 recorded votes", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb")],
    proposals: [],
    activity: [voteCastActivity("v1", "0xa"), voteCastActivity("v2", "0xa")],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  assert.equal(insights.some((i) => i.title === "Voting power is concentrated"), false);
});

test("analyzeCollective flags a recurring shared recipient across proposals from different members", () => {
  // 6 members; 3 of them each author a proposal to the same recipient.
  // This is real, structured evidence (recipient + created_by), not
  // fabricated per-member "procurement need" data.
  const ctx: SarthiContext = {
    samooh,
    members: [
      member("0xa"),
      member("0xb"),
      member("0xc"),
      member("0xd"),
      member("0xe"),
      member("0xf"),
    ],
    proposals: [
      proposal("1", "VOTING", { created_by: "0xa", recipient: "0xvendor", amount: "10" }),
      proposal("2", "CREATED", { created_by: "0xb", recipient: "0xvendor", amount: "15" }),
      proposal("3", "APPROVED", { created_by: "0xc", recipient: "0xvendor", amount: "5" }),
    ],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  const procurement = insights.find((i) => i.type === "procurement");
  assert.ok(procurement, "expected a procurement insight to fire");
  assert.match(procurement!.description, /3 proposals from 3 different members/);
  assert.match(procurement!.description, /30 MATIC/);
});

test("analyzeCollective does not flag procurement when recipients don't overlap across members (false positive prevention)", () => {
  // 8 members, each proposal goes to a distinct recipient -> no shared
  // pattern, so no procurement insight should fire.
  const ctx: SarthiContext = {
    samooh,
    members: [
      member("0xa"),
      member("0xb"),
      member("0xc"),
      member("0xd"),
      member("0xe"),
      member("0xf"),
      member("0xg"),
      member("0xh"),
    ],
    proposals: [
      proposal("1", "VOTING", { created_by: "0xa", recipient: "0xvendor1" }),
      proposal("2", "VOTING", { created_by: "0xb", recipient: "0xvendor2" }),
      proposal("3", "VOTING", { created_by: "0xc", recipient: "0xvendor3" }),
    ],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  assert.equal(insights.some((i) => i.type === "procurement"), false);
});

test("analyzeCollective does not flag procurement when the same member repeatedly proposes to one recipient (not shared)", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb")],
    proposals: [
      proposal("1", "VOTING", { created_by: "0xa", recipient: "0xvendor" }),
      proposal("2", "VOTING", { created_by: "0xa", recipient: "0xvendor" }),
      proposal("3", "VOTING", { created_by: "0xa", recipient: "0xvendor" }),
    ],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  assert.equal(insights.some((i) => i.type === "procurement"), false);
});

test("analyzeCollective flags low participation for 10 members with only 2 recorded votes", () => {
  const ctx: SarthiContext = {
    samooh,
    members: Array.from({ length: 10 }, (_, i) => member(`0x${i}`)),
    proposals: [proposal("1"), proposal("2")],
    activity: [voteCastActivity("v1", "0x0"), voteCastActivity("v2", "0x1")],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  const participation = insights.find((i) => i.type === "participation");
  assert.ok(participation, "expected a participation insight to fire");
  assert.match(participation!.description, /Only 2 votes recorded across 2 proposals for 10 members/);
});

test("analyzeCollective flags approved proposals awaiting execution", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc")],
    proposals: [proposal("1", "APPROVED", { title: "Fund community event", amount: "20" })],
    activity: [],
    treasuryBalance: "50",
  };

  const insights = analyzeCollective(ctx);
  const opportunity = insights.find((i) => i.type === "opportunity");
  assert.ok(opportunity, "expected an opportunity insight to fire");
  assert.equal(opportunity!.priority, "high"); // funds ready: 50 >= 20
  assert.match(opportunity!.description, /Fund community event/);
  assert.equal(FORBIDDEN_ACTION_WORDS.test(opportunity!.recommendation), false);
});

test("analyzeCollective's approved-awaiting-execution insight is medium priority without a backlog or ready funds", () => {
  const ctx: SarthiContext = {
    samooh,
    members: [member("0xa"), member("0xb"), member("0xc")],
    proposals: [proposal("1", "APPROVED", { amount: "20" })],
    activity: [],
    treasuryBalance: null,
  };

  const insights = analyzeCollective(ctx);
  const opportunity = insights.find((i) => i.type === "opportunity");
  assert.ok(opportunity);
  assert.equal(opportunity!.priority, "medium");
});

test("analyzeCollective produces multiple simultaneous insights that are each independently correct", () => {
  const admins = ["0xa1", "0xa2", "0xa3", "0xa4", "0xa5", "0xa6"];
  const plain = ["0xm1", "0xm2", "0xm3", "0xm4"];
  const members: Member[] = [
    ...admins.map((w) => member(w, "admin")),
    ...plain.map((w) => member(w, "member")),
  ];

  const proposals: Proposal[] = [
    proposal("1", "VOTING", { created_by: "0xa1", recipient: "0xvendor", amount: "10" }),
    proposal("2", "VOTING", { created_by: "0xa2", recipient: "0xvendor", amount: "15" }),
    proposal("3", "CREATED", { created_by: "0xa3", recipient: "0xvendor" }),
    proposal("4", "APPROVED", { created_by: "0xa1", title: "Community fund", amount: "20" }),
    proposal("5", "VOTING", { created_by: "0xa1" }),
  ];

  const activity: Activity[] = [
    memberAddedActivity("act1"),
    memberAddedActivity("act2"),
    memberAddedActivity("act3"),
  ];

  const ctx: SarthiContext = { samooh, members, proposals, activity, treasuryBalance: "100" };
  const insights = analyzeCollective(ctx);

  // proposal authorship concentration: 0xa1 authored 3 of 5 (60%) -> medium
  const authorship = insights.find((i) => i.title === "Proposal authorship is concentrated");
  assert.ok(authorship);
  assert.equal(authorship!.priority, "medium");
  assert.match(authorship!.description, /3 of 5 proposals/);

  // admin concentration: 6 of 10 members are admin (60%)
  const adminConcentration = insights.find((i) => i.title === "Admin role is concentrated");
  assert.ok(adminConcentration);
  assert.match(adminConcentration!.description, /6 of 10 members/);

  // procurement: 3 proposals to 0xvendor from 3 distinct members
  const procurement = insights.find((i) => i.type === "procurement");
  assert.ok(procurement);
  assert.match(procurement!.description, /3 proposals from 3 different members/);

  // opportunity: 1 approved proposal, funds ready (100 >= 20) -> high
  const opportunity = insights.find((i) => i.type === "opportunity");
  assert.ok(opportunity);
  assert.equal(opportunity!.priority, "high");
  assert.match(opportunity!.description, /Community fund/);

  // growth: 3 recent MemberAdded events
  const growth = insights.find((i) => i.type === "growth");
  assert.ok(growth);

  // participation: 10 members, 5 proposals, zero recorded votes
  const participation = insights.find((i) => i.type === "participation");
  assert.ok(participation);

  // no-proposals-yet and idle-treasury must NOT fire (proposals exist)
  assert.equal(insights.some((i) => i.title === "No proposals yet"), false);
  assert.equal(insights.some((i) => i.title === "Idle treasury balance"), false);

  // every recommendation stays inside Sarthi's advisory boundary
  for (const insight of insights) {
    assert.equal(FORBIDDEN_ACTION_WORDS.test(insight.recommendation), false, insight.recommendation);
  }
});
