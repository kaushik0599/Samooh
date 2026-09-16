import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getProposal,
  getProposalStatus,
  getVotingStatus,
  getQuorum,
  getMembers,
  getTreasuryBalance,
  getGovernanceEvents,
  getTreasuryEvents,
  BlockchainNotConfiguredError,
} from "@/lib/blockchain";

/**
 * ABIs in src/lib/blockchain/abi/{governance,treasury}.abi.ts are placeholder
 * empty arrays and no contract addresses are set in this test environment
 * (no .env file exists in this repo), so every adapter function must reject
 * synchronously with BlockchainNotConfiguredError before ever touching the
 * network — never hang, never throw a raw ethers/network error.
 */

const ENV_KEYS = [
  "POLYGON_AMOY_RPC_URL",
  "NEXT_PUBLIC_GOVERNANCE_CONTRACT",
  "NEXT_PUBLIC_TREASURY_CONTRACT",
] as const;

function withoutBlockchainEnv<T>(fn: () => Promise<T>): Promise<T> {
  const prev = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  return fn().finally(() => {
    for (const k of ENV_KEYS) {
      if (prev[k] !== undefined) process.env[k] = prev[k];
    }
  });
}

test("getProposal rejects with BlockchainNotConfiguredError when unconfigured", async () => {
  await withoutBlockchainEnv(() =>
    assert.rejects(() => getProposal("1"), BlockchainNotConfiguredError)
  );
});

test("getProposalStatus rejects with BlockchainNotConfiguredError when unconfigured", async () => {
  await withoutBlockchainEnv(() =>
    assert.rejects(() => getProposalStatus("1"), BlockchainNotConfiguredError)
  );
});

test("getVotingStatus rejects with BlockchainNotConfiguredError when unconfigured", async () => {
  await withoutBlockchainEnv(() =>
    assert.rejects(() => getVotingStatus("1"), BlockchainNotConfiguredError)
  );
});

test("getQuorum rejects with BlockchainNotConfiguredError when unconfigured", async () => {
  await withoutBlockchainEnv(() =>
    assert.rejects(() => getQuorum("1"), BlockchainNotConfiguredError)
  );
});

test("getMembers always rejects with BlockchainNotConfiguredError (no on-chain member enumeration)", async () => {
  await assert.rejects(() => getMembers(), BlockchainNotConfiguredError);
});

test("getTreasuryBalance rejects with BlockchainNotConfiguredError when unconfigured", async () => {
  await withoutBlockchainEnv(() =>
    assert.rejects(() => getTreasuryBalance(), BlockchainNotConfiguredError)
  );
});

test("getGovernanceEvents rejects with BlockchainNotConfiguredError when unconfigured", async () => {
  await withoutBlockchainEnv(() =>
    assert.rejects(() => getGovernanceEvents(0), BlockchainNotConfiguredError)
  );
});

test("getTreasuryEvents rejects with BlockchainNotConfiguredError when unconfigured", async () => {
  await withoutBlockchainEnv(() =>
    assert.rejects(() => getTreasuryEvents(0), BlockchainNotConfiguredError)
  );
});

test("getProposal still rejects with BlockchainNotConfiguredError when an address is supplied but the ABI is empty", async () => {
  // A per-Samooh contract address override is passed explicitly, so the
  // address check passes — this exercises the second guard (empty ABI),
  // which is otherwise unreachable given the address check runs first.
  await withoutBlockchainEnv(() =>
    assert.rejects(
      () => getProposal("1", "0x1234567890123456789012345678901234567890"),
      BlockchainNotConfiguredError
    )
  );
});

test("getProposal rejects with BlockchainNotConfiguredError when the supplied contract address is malformed", async () => {
  // A malformed NEXT_PUBLIC_GOVERNANCE_CONTRACT (or bad per-Samooh
  // override) must fail with our clear error, not a raw ethers error from
  // `new Contract(...)`.
  await withoutBlockchainEnv(() =>
    assert.rejects(() => getProposal("1", "not-an-address"), BlockchainNotConfiguredError)
  );
});

test("getTreasuryBalance rejects with BlockchainNotConfiguredError when the supplied contract address is malformed", async () => {
  await withoutBlockchainEnv(() =>
    assert.rejects(() => getTreasuryBalance("0xtooshort"), BlockchainNotConfiguredError)
  );
});
