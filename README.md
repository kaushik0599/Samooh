# Samooh

Samooh is DAO infrastructure for real-world collective economic
coordination. **Sarthi recommends. Samooh decides. Smart contracts
execute.** The backend gives collectives ("Samoohs") a fast, queryable
metadata layer in Supabase while treating the blockchain as the sole
source of truth for governance and treasury state, with a deterministic
advisory layer (Sarthi) that surfaces insights and draft proposals but
never acts on its own.

## Tech stack

- [Next.js](https://nextjs.org/) `^15.0.3` (API routes only, no frontend in this repo)
- TypeScript `^5.6.3`
- [Supabase](https://supabase.com/) / PostgreSQL (`@supabase/supabase-js` `^2.45.4`)
- [ethers.js](https://docs.ethers.org/v6/) `^6.13.4`, targeting Polygon Amoy (chain id `80002`)

## Quickstart

```bash
npm install
cp .env.example .env.local   # fill in Supabase + RPC values below
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
POLYGON_AMOY_RPC_URL=
NEXT_PUBLIC_CHAIN_ID=80002
NEXT_PUBLIC_GOVERNANCE_CONTRACT=
NEXT_PUBLIC_TREASURY_CONTRACT=
```

Then, in the Supabase SQL Editor, run `database/migration.sql` (idempotent —
safe to re-run). Finally:

```bash
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the test suite (`node --test` over `src/__tests__/*.test.ts`) |

## Documentation

- [`docs/BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md) — layered
  backend architecture and the recommend/decide/execute principle, with the
  blockchain-wins reconciliation rule.
- [`docs/API_SPEC.md`](docs/API_SPEC.md) — API route reference, including
  the shared success/error response envelope.
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — Supabase table
  reference and what Supabase owns vs. what the blockchain remains
  authoritative for.
- [`docs/BLOCKCHAIN_INTEGRATION.md`](docs/BLOCKCHAIN_INTEGRATION.md) — what
  the blockchain team must provide (contract addresses, ABIs) for the
  read-only ethers.js adapter.
- [`docs/SARTHI.md`](docs/SARTHI.md) — the advisory-only intelligence
  pipeline that recommends but never decides or acts.
- [`docs/BACKEND_MASTER_PLAN.md`](docs/BACKEND_MASTER_PLAN.md) — snapshot
  and phase plan for the current hardening/completion round.
- [`docs/BACKEND_MULTIAGENT.md`](docs/BACKEND_MULTIAGENT.md) — ownership
  map of which areas/files belong to which part of the backend.

## Architecture at a glance

- The blockchain is the sole authority for governance/treasury state
  (votes, quorum, proposal status, balances); if Supabase and the chain
  disagree, the chain wins.
- Supabase is a fast, queryable cache of collective metadata, proposal
  status cache, Sarthi insights, and activity/indexing records — not
  the source of truth.
- Sarthi is advisory-only: it produces deterministic insights and draft
  proposals, and never writes governance/treasury state.
- The backend never holds a signer or private key and has no
  write/transaction-signing path to the blockchain.

## Status

44/44 tests passing, typecheck/lint/build clean. The blockchain adapter is
read-only and complete but blocked on the real Governance/Treasury ABI
from the blockchain team (see `docs/BLOCKCHAIN_INTEGRATION.md`).
