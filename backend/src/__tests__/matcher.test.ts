import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreMatch } from "@/lib/discovery/matcher";
import type { Samooh, UserOnboardingProfile } from "@samooh/types";

const profile: Pick<UserOnboardingProfile, "category" | "region" | "needs" | "objectives"> = {
  category: "Electronics Manufacturing",
  region: "Pune",
  needs: ["cheaper components", "bulk procurement"],
  objectives: ["collective procurement"],
};

function samooh(overrides: Partial<Samooh>): Pick<
  Samooh,
  "category" | "region" | "objectives" | "purpose" | "membership_open"
> {
  return {
    category: null,
    region: null,
    objectives: [],
    purpose: null,
    membership_open: true,
    ...overrides,
  };
}

test("scoreMatch rewards category, region, and objective overlap with reasons", () => {
  const s = samooh({
    category: "Electronics Manufacturing",
    region: "Pune",
    objectives: ["collective procurement", "shared logistics"],
  });

  const { score, reasons } = scoreMatch(profile, s);

  assert.ok(score > 0);
  assert.ok(reasons.includes("Same category"));
  assert.ok(reasons.includes("Nearby"));
  assert.ok(reasons.includes("Shared objectives"));
  assert.ok(reasons.includes("Open to new members"));
});

test("scoreMatch gives an unrelated Samooh only the open-membership bonus", () => {
  const s = samooh({ category: "Textile Weaving", region: "Kolkata" });
  const { score, reasons } = scoreMatch(profile, s);

  assert.equal(score, 5); // MATCH_WEIGHTS.MEMBERSHIP_OPEN_BONUS
  assert.deepEqual(reasons, ["Open to new members"]);
});

test("scoreMatch never exceeds 100", () => {
  const s = samooh({
    category: "Electronics Manufacturing",
    region: "Pune",
    objectives: ["cheaper components", "bulk procurement", "collective procurement"],
    purpose: "cheaper components bulk procurement collective procurement",
  });

  const { score } = scoreMatch(profile, s);
  assert.ok(score <= 100);
});

test("scoreMatch drops the open-membership reason for closed Samoohs", () => {
  const s = samooh({ category: "Electronics Manufacturing", membership_open: false });
  const { reasons } = scoreMatch(profile, s);
  assert.equal(reasons.includes("Open to new members"), false);
});
