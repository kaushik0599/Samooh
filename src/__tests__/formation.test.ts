import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestSamoohFormation } from "@/lib/sarthi/formation";

test("suggestSamoohFormation derives a suggestion from onboarding data only", () => {
  const suggestion = suggestSamoohFormation({
    category: "Electronics Manufacturing",
    region: "Pune",
    needs: ["cheaper components"],
    objectives: ["collective procurement"],
  });

  assert.equal(suggestion.title, "Electronics Manufacturing Collective");
  assert.deepEqual(suggestion.objectives, ["collective procurement"]);
  assert.match(suggestion.purpose, /Pune/);
  assert.match(suggestion.reason, /Electronics Manufacturing/);
});

test("suggestSamoohFormation never mentions execution/voting/approval", () => {
  const suggestion = suggestSamoohFormation({
    category: "Textile Weaving",
    region: "Kolkata",
    needs: [],
    objectives: [],
  });

  const forbidden = /\b(vote|approve|reject|execute|transfer)\b/i;
  assert.equal(forbidden.test(suggestion.purpose), false);
  assert.equal(forbidden.test(suggestion.reason), false);
});
