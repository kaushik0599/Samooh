# Backend Ownership Map

Concise reference for who owns what and where the hard boundaries are.
Full narrative docs live in the other `docs/*.md` files — this is the map.

## Ownership boundaries

| Area | Owns | Must not touch |
|---|---|---|
| API + DB (`backend/src/app/api/**`, `backend/src/lib/services/*.service.ts`, `database/`) | Routes, validation wiring, Supabase services, migrations | Blockchain adapter internals, Sarthi/discovery scoring logic |
| Blockchain (`backend/src/lib/blockchain/**`) | ethers provider, ABI, adapters, normalization, event indexing | Never adds a signer/private key/treasury-transfer endpoint. Never invents ABI/contract data. |
| Sarthi + Discovery (`backend/src/lib/sarthi/**`, `backend/src/lib/discovery/**`) | Deterministic analysis, matching/scoring, formation suggestions | Never writes governance/treasury state; never calls the blockchain adapter's write path (there isn't one) |
| QA/Security | Cross-cutting review only | Owns no files; verifies invariants and fixes integration bugs it finds |

## Files with a single designated owner (do not parallel-edit)

- `packages/types/src/index.ts` — Architect. Every other agent requests additions
  through the Architect rather than editing directly.
- `package.json`
- `docs/API_SPEC.md`

## Shared types (single source of truth: `packages/types/src/index.ts`)

`User`, `UserOnboardingProfile`, `Samooh`, `Member`, `Proposal`,
`ProposalStatus`, `ProposalStatusSource`, `ReconciledProposal`,
`SamoohJoinRequest`, `JoinRequestStatus`, `SamoohDiscoveryResult`,
`SarthiInsight`, `SamoohFormationSuggestion`, `Activity`, `ActivityType`,
`GovernanceState`, `TreasuryState`, `BlockchainProposal`.

## API contract

See `docs/API_SPEC.md` for the full list. Response envelope
(`{ success, data }` / `{ success, error }`) and status codes
(200/201/400/404/409/500) are fixed — do not deviate per-route.

## Source of truth

- **Database (Supabase)**: application metadata — users, onboarding
  profiles, Samooh descriptions/category/region, join-request records,
  Sarthi insights, activity log. Never authoritative for governance state.
- **Blockchain**: proposal status/votes/quorum/approval/execution,
  treasury balance, on-chain membership where implemented. Always wins
  over the DB cache on disagreement — see `reconcile.service.ts`.
- Every proposal read distinguishes *how* its status was obtained via
  `ReconciledProposal.status_source`: `LIVE_ONCHAIN` (just read from chain),
  `CACHE` (never submitted on-chain, DB value stands), or
  `BLOCKCHAIN_UNAVAILABLE` (chain not configured/unreachable — DB value
  shown, but explicitly not claimed as live).

## Sarthi boundaries

Advisory only. Can read collective/onboarding/discovery data and produce
insights, proposal drafts, and formation suggestions
(`SamoohFormationSuggestion`). Cannot vote, approve, reject, execute,
transfer funds, auto-create a Samooh, or auto-approve a member. Enforced
by construction (no such functions exist) and checked by
`backend/src/__tests__/sarthi-analyzer.test.ts` / `formation.test.ts` / `no-signer.test.ts`.

## Integration dependencies

- `GET /api/proposals/[samoohId]` depends on both the DB (`proposals.service`)
  and the blockchain adapter (`reconcile.service` → `getProposalStatus`).
- `GET /api/discover/samoohs` depends on onboarding profile + samoohs +
  member counts (all Supabase) — no blockchain dependency.
- `POST /api/sarthi/analyze` depends on DB (members/proposals/activity)
  and best-effort treasury balance (blockchain, degrades gracefully).
- `POST /api/samooh/[id]/join` is DB-only; it never writes `members` and
  has no blockchain dependency today. If membership becomes on-chain
  later, reconcile it the same way proposals are — on-chain membership
  must outrank the Supabase join-request cache.

## What can run in parallel

Safe in parallel: API/DB hardening, Sarthi/discovery hardening, blockchain
adapter review — as long as none of them touch the single-owner files
above without coordinating through the Architect first. Integration
(cross-boundary fixes) runs after parallel work stops, not during it.
