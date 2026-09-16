# Contracts

A working Hardhat project implementing `docs/GOVERNANCE_SPEC.md` — the
authoritative interface both this folder and the app's blockchain adapters
conform to.

- `contracts/` — `SamoohGovernance.sol`, `SamoohTreasury.sol`,
  `SamoohFactory.sol`.
- `test/governance.test.ts` — 29 passing tests (membership, proposals,
  voting, quorum/approval math, execution, treasury security invariants,
  full end-to-end flow) run against Hardhat's local network.
- `scripts/deploy.ts` — deploys `SamoohFactory` and creates one sample
  Samooh through it, as a sanity check.
- `artifacts/contracts/*.sol/*.json` — real compiled ABI + bytecode.

## Status

- Compiled and fully tested locally: `npx hardhat compile && npx hardhat test`
  → 29/29 passing.
- `scripts/deploy.ts` verified against Hardhat's local network (**not**
  Polygon Amoy — see below).
- **Polygon Amoy deployment has NOT been performed.** `hardhat.config.ts`
  is wired for it (chain id `80002`, reads `POLYGON_AMOY_RPC_URL` /
  `PRIVATE_KEY` from `contracts/.env`, never hardcoded/committed — see
  `.env.example`), but no funded private key is available in this
  environment. Deploying requires the repo owner to supply their own
  funded Amoy account.

## Handoff to the app

`packages/types/src/blockchain.ts` now holds the **real** compiled ABI
(`GOVERNANCE_ABI`, `TREASURY_ABI`, `FACTORY_ABI`), copied directly from
`contracts/artifacts/contracts/*.sol/*.json` — not placeholders anymore.
`backend/src/lib/blockchain/normalize.ts` and
`.../adapters/governance.adapter.ts` were updated to match the real
struct/enum layout (see `docs/GOVERNANCE_SPEC.md`, "Reconciliation with
existing backend code").

Once Amoy deployment happens:

1. Set `NEXT_PUBLIC_GOVERNANCE_CONTRACT` / `NEXT_PUBLIC_TREASURY_CONTRACT`
   in both `frontend/.env.local` and `backend/.env.local` to the deployed
   addresses.
2. Nothing else needs to change — the ABI is already wired end-to-end.
