# Backend Master Plan (this build round)

Companion to `docs/BACKEND_MULTIAGENT.md` (stable ownership model — read
that first). This doc is the snapshot + phase plan for the current
hardening/completion pass. Architect deliverable only — no code here.

## Baseline going in

24/24 tests, typecheck, lint, build all passing. 13 API routes, 8 DB
tables, read-only blockchain adapter (ABI pending from blockchain team),
deterministic Sarthi + discovery. Treat as protected baseline — this round
hardens and completes, it does not rewrite.

## Current inventory

- Routes (`backend/src/app/api/**/route.ts`): health, samooh (GET/POST),
  samooh/[id], samooh/[id]/join, members/[samoohId], proposals (GET/POST),
  proposals/[samoohId], activity/[samoohId], onboarding, discover/samoohs,
  sarthi/analyze, sarthi/proposal, blockchain/sync.
- Services (`backend/src/lib/services/*.service.ts`): samooh, members, proposals,
  activity, sarthi, users, onboarding, discovery, join-requests, reconcile,
  indexing.
- Blockchain (`backend/src/lib/blockchain/**`): provider, config, errors,
  normalize, events, adapters/{governance,treasury,events}, empty ABI
  placeholders.
- Sarthi/Discovery (`backend/src/lib/sarthi/**`, `backend/src/lib/discovery/**`):
  analyzer, context, provider, formation; matcher.
- Shared (`packages/types/src/index.ts`, `backend/src/lib/validation`, `backend/src/lib/api/response.ts`,
  `backend/src/lib/supabase/client.ts`).
- Tests (`backend/src/__tests__/*.test.ts`): validation, normalize, reconcile,
  sarthi-analyzer, matcher, formation, health, no-signer.

## Known integration risk points for this round

1. **API error shape**: this round's brief prefers
   `{ success: false, error: { code, message } }`, but the shipped contract
   is `{ success: false, error: string }` and frontend stability is a hard
   invariant across every round so far. Resolution: add an **optional**
   `code` field alongside the existing string `error` (additive, non-breaking)
   rather than restructuring `error` into an object. API Engineer owns this.
2. **Wallet normalization**: app-layer already lowercases every wallet
   before writing (`requireWalletAddress`), but the DB has no defense-in-depth
   check for that. DB Engineer may add a `= lower(...)` CHECK constraint
   per wallet/address column, additive via `alter table ... add constraint
   ... check (...) not valid; alter table ... validate constraint ...`
   guarded to skip if already present.
3. **Shared files** (`packages/types/src/index.ts`, `package.json`,
   `database/migration.sql` top-level ownership, `docs/API_SPEC.md`): single
   owner per file per `BACKEND_MULTIAGENT.md`. `packages/types/src/index.ts` and
   `package.json` stay with the orchestrator this round — specialists
   propose additions in their report instead of editing directly, to avoid
   concurrent-write conflicts across parallel agents.

## Phase plan

1. Architect (this doc) — done.
2. Parallel: DB Engineer (`database/migration.sql`, `backend/src/lib/services/*.service.ts`),
   API Engineer (`backend/src/app/api/**`, `backend/src/lib/validation`, `backend/src/lib/api/response.ts`,
   `docs/API_SPEC.md`), Blockchain Engineer (`backend/src/lib/blockchain/**`),
   Sarthi/Discovery Engineer (`backend/src/lib/sarthi/**`, `backend/src/lib/discovery/**`),
   Security Engineer (audit-only, no edits — findings feed Final Integration).
3. Orchestrator folds in any shared-type/dependency additions the
   specialists requested.
4. Orchestrator adds tests for whatever changed.
5. Final integration pass (imports, duplicate types, stale docs, env vars).
6. Full validation: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Round 3 — targeted follow-up

Baseline going in: 30/30 tests, typecheck/lint/build all green (result of
the round above, still uncommitted). Two real bugs were caught and fixed
last round: a partial-vs-full unique index mismatch with Supabase's
`upsert onConflict` (activity dedup would have thrown at runtime), and a
"vote" action-word slipping into Sarthi's participation-insight text.

Self-audit before spawning anything this round, to avoid redundant re-work
on areas just verified clean:

- **API / DB / Blockchain / Sarthi+Discovery**: got a full pass last round
  (Blockchain in particular: zero changes, fully verified clean). No
  intervening edits since. Re-spawning full audits here would be pure
  churn — skipped. Spot-checked directly instead: confirmed no
  `POST /api/treasury/withdraw`-style endpoint exists anywhere under
  `backend/src/app/api` (grepped); confirmed `indexing.service.ts`'s dedup now
  rides the corrected full unique index and is safe to call repeatedly.
- **Genuine gap found**: `RawChainEvent` (`backend/src/lib/blockchain/events.ts`)
  carries only `{eventName, transactionHash, args}` — no log index. If a
  real contract ever emits the same event type twice in one transaction
  (e.g. a batched treasury deposit), the `(samooh_id, type,
  transaction_hash)` dedup key would silently collide and drop the second
  event. Unknowable whether this can happen without the real ABI/event
  design — can't fix blind without fabricating assumptions about
  contracts that don't exist yet. Documented as a known limitation
  instead of speculatively re-widening the index again.
- **Genuine gap found**: adapter functions (`getProposal`,
  `getTreasuryBalance`, etc.) throwing `BlockchainNotConfiguredError` on
  missing ABI/address is fully synchronous before any network call —
  cheaply unit-testable — but no test exercised it directly (only the
  `isBlockchainConfigured()` boolean was tested).
- **Genuine gap found**: no root `README.md` — a hackathon judge/frontend
  dev landing in the repo has no entry point pointing at `docs/`.
- `ARCHITECTURE.md` / `TECHNICAL_SPEC.md` deliberately NOT created —
  `docs/BACKEND_ARCHITECTURE.md` already covers this; duplicating it at
  the root would violate "don't document features/files that don't need
  to exist."

This round's parallel specialists (scoped to the actual gaps above, not a
blanket re-audit): Reconciliation + Indexing Engineer, Test Engineer,
Security Engineer (re-check payload-size/replay angles not covered last
round), Documentation/DX Engineer (root README only).
