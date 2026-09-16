# Samooh

Samooh is DAO infrastructure for real-world collective economic
coordination. **Sarthi recommends. Samooh decides. Smart contracts
execute.** Supabase gives collectives ("Samoohs") a fast, queryable
metadata layer while the blockchain remains the sole source of truth for
governance and treasury state; a deterministic advisory layer (Sarthi)
surfaces insights and draft proposals but never acts on its own.

## Repository structure

```
SAMOOH/
├── frontend/    Next.js app (pages, components, wallet UI, API client)
├── backend/     Next.js API-only app (routes, services, Supabase, Sarthi, discovery, blockchain reads)
├── contracts/   Solidity/Hardhat — governance/treasury contracts, compiled + tested, see contracts/README.md
├── packages/
│   └── types/   Shared TypeScript types + blockchain ABI placeholders, imported by both apps
├── database/    Supabase SQL migration
└── docs/        Architecture, API, database, blockchain, Sarthi reference
```

`frontend/` and `backend/` are two independent Next.js apps, not one
project — the frontend calls the backend over HTTP
(`NEXT_PUBLIC_API_URL`), not same-origin, and each has its own
`package.json`/`node_modules`/env file. `packages/types` is a local
workspace package (via `file:` dependency, no npm registry involved) so
both apps share one source of truth for request/response shapes instead
of duplicating them.

## Quickstart

Backend first (frontend depends on it being reachable):

```bash
cd packages/types && npm install   # one-time, resolves its own deps
cd backend
npm install
cp .env.example .env.local   # fill in Supabase + RPC values
npm run dev                  # http://localhost:4000
```

In a separate terminal, run the Supabase migration once (`database/migration.sql`
in the Supabase SQL Editor, idempotent — safe to re-run), then:

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL defaults to http://localhost:4000
npm run dev                  # http://localhost:3000
```

## Scripts

Each app has its own:

| Command | Frontend | Backend |
|---|---|---|
| `npm run dev` | Next.js dev server (port 3000) | Next.js dev server (port 4000) |
| `npm run build` | Production build | Production build |
| `npm run start` | Start production server | Start production server |
| `npm run lint` | ESLint | ESLint |
| `npm run typecheck` | `tsc --noEmit` | `tsc --noEmit` |
| `npm test` | — (no frontend-only tests; all tests exercise backend logic) | `node --test` over `src/__tests__/*.test.ts` |

## Demo Mode

`frontend/.env.local`'s `NEXT_PUBLIC_DEMO_MODE=true` bypasses the wallet/
onboarding/Samooh gate on the 7 workspace routes (`/overview`, `/sarthi`,
`/proposals`, `/treasury`, `/members`, `/activity`, `/settings`), showing
realistic fixture data (`src/lib/demo/data.ts`) instead of calling the
backend — useful for demos/screenshots without a wallet or a configured
Supabase project. A persistent "DEMO MODE" banner marks every page it
affects. Set it to `false` (the default) for the real flow, which always
calls the real backend and never falls back to fixtures. Never enable it
in a real deployment.

## Known Supabase dependency

`backend/`'s Supabase-backed routes (onboarding, Samooh CRUD, members,
proposals, discovery, join requests, Sarthi, activity — i.e. everything
except `GET /api/health` and the blockchain-only reads) require
`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to be set in
`backend/.env.local` and `database/migration.sql` to have been run against
that project. Until then, those routes correctly validate the request and
then fail with a generic `500 Internal Server Error` / `INTERNAL_ERROR`
(see `backend/src/lib/supabase/client.ts` — the real error, "Missing
Supabase configuration...", is logged server-side only, per this
project's rule against leaking backend internals to the client). If the
frontend shows a generic failure message for one of these actions, check
`GET /api/health`'s `supabase` field first — `"not_configured"` means
this, not a frontend bug.

## Documentation

- [`docs/BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md) — layered
  backend architecture and the recommend/decide/execute principle, with the
  blockchain-wins reconciliation rule.
- [`docs/API_SPEC.md`](docs/API_SPEC.md) — API route reference (base URL,
  envelope, every endpoint) — the contract the frontend integrates against.
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — Supabase table
  reference and what Supabase owns vs. what the blockchain remains
  authoritative for.
- [`docs/BLOCKCHAIN_INTEGRATION.md`](docs/BLOCKCHAIN_INTEGRATION.md) — what
  the blockchain team must provide (contract addresses, ABIs) for the
  read-only ethers.js adapter.
- [`docs/SARTHI.md`](docs/SARTHI.md) — the advisory-only intelligence
  pipeline that recommends but never decides or acts.
- [`contracts/README.md`](contracts/README.md) — status of the Solidity/Hardhat
  work and how a real ABI hands off into the app once ready.

## Architecture at a glance

- The blockchain is the sole authority for governance/treasury state
  (votes, quorum, proposal status, balances); if Supabase and the chain
  disagree, the chain wins.
- Supabase is a fast, queryable cache of collective metadata, proposal
  status cache, Sarthi insights, and activity/indexing records — not
  the source of truth.
- Sarthi is advisory-only: it produces deterministic insights and draft
  proposals, and never writes governance/treasury state.
- Neither app ever holds a signer or private key; the backend's blockchain
  access is read-only, and the frontend's wallet integration is the only
  place a transaction is ever signed (by the user, via MetaMask).

## Status

Backend: 44/44 tests passing, typecheck/lint/build clean. Frontend:
typecheck/lint/build clean, full product journey wired against the real
backend API. Contracts: `SamoohGovernance`/`SamoohTreasury`/`SamoohFactory`
written, compiled, and 29/29 Hardhat tests passing locally; the real ABI
is wired into `packages/types/src/blockchain.ts` and both apps' read
adapters. Not yet deployed to Polygon Amoy — that needs the repo owner's
own funded testnet key — see `contracts/README.md`. Frontend write flows
(connect-wallet vote/execute/deposit transactions) are not yet built; the
contract instances (`frontend/src/lib/wallet/contracts.ts`) are ready for
that once an Amoy address is configured.
