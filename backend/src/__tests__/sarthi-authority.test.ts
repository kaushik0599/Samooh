import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Complements no-signer.test.ts (which already walks the whole backend
// source tree for PRIVATE_KEY / `new Wallet(...)`). This test is scoped
// specifically to the Sarthi advisory layer and additionally checks that it
// never *calls* a write-style governance/treasury action, since Sarthi must
// only ever read data and write advisory metadata (insights / DRAFT
// proposals) — never vote, approve, reject, execute, or transfer funds.

const SARTHI_DIRS = [
  join(__dirname, "..", "lib", "sarthi"),
  join(__dirname, "..", "app", "api", "sarthi"),
];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) files.push(full);
  }
  return files;
}

function sarthiFiles(): string[] {
  return SARTHI_DIRS.flatMap(walk);
}

test("Sarthi source files exist in the expected locations", () => {
  const files = sarthiFiles();
  assert.ok(files.length > 0, "expected to find Sarthi source files to scan");
});

test("Sarthi never constructs a signer or reads a private key", () => {
  const offenders: string[] = [];
  for (const file of sarthiFiles()) {
    const content = readFileSync(file, "utf8");
    if (/PRIVATE_KEY/.test(content) || /new\s+Wallet\s*\(/.test(content) || /\bSigner\b/.test(content)) {
      offenders.push(file);
    }
  }
  assert.deepEqual(offenders, []);
});

test("Sarthi never calls a vote/approve/reject/execute/transfer write function", () => {
  // Matches an identifier-call like `voteOnProposal(`, `transferFunds(`,
  // `.approve(` etc. Deliberately requires `(` immediately after the word
  // (no whitespace) so it doesn't false-positive on read-only data like
  // `a.type === "VoteCast"`, `status === "REJECTED"`, or English prose in
  // comments/descriptions such as "a single rejection (normal...)".
  const WRITE_CALL = /\b(vote|approve|reject|execute|transfer)\w*\(/i;
  const offenders: string[] = [];
  for (const file of sarthiFiles()) {
    const content = readFileSync(file, "utf8");
    if (WRITE_CALL.test(content)) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});

test("Sarthi's API routes only ever persist advisory metadata (insights or DRAFT proposals)", () => {
  const analyzeRoute = readFileSync(
    join(__dirname, "..", "app", "api", "sarthi", "analyze", "route.ts"),
    "utf8"
  );
  const proposalRoute = readFileSync(
    join(__dirname, "..", "app", "api", "sarthi", "proposal", "route.ts"),
    "utf8"
  );

  // /api/sarthi/analyze only writes sarthi_insights via saveSarthiInsight.
  assert.match(analyzeRoute, /saveSarthiInsight/);

  // /api/sarthi/proposal only writes proposals via createProposal, which
  // (see proposals.service.ts) always inserts status: "DRAFT" server-side —
  // the route body never accepts or forwards a `status` field.
  assert.match(proposalRoute, /createProposal/);
  assert.equal(/\bstatus\s*:/.test(proposalRoute), false, "route must not set status itself");
});
