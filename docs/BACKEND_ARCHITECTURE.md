# Backend Architecture

## Principle

"Sarthi recommends. Samooh decides. Smart contracts execute."

Supabase is a fast, queryable cache of collective metadata. The blockchain
is the sole authority for governance/treasury truth. If they disagree, the
blockchain wins — see `reconcileProposalStatus` in
`src/lib/services/reconcile.service.ts`.

## Layers

```
API ROUTE (src/app/api/**/route.ts)
  -> VALIDATION (src/lib/validation)
  -> SERVICE (src/lib/services)
  -> DATABASE (src/lib/supabase) / BLOCKCHAIN (src/lib/blockchain)
  -> NORMALIZED RESPONSE (src/lib/api/response.ts)
```

- `src/lib/supabase/` — Supabase server client (service-role key, server-only).
- `src/lib/blockchain/` — read-only ethers.js adapter, isolated from ABI
  assumptions (see BLOCKCHAIN_INTEGRATION.md). No signer, ever.
- `src/lib/sarthi/` — deterministic advisory analysis over collective data.
- `src/lib/services/` — business logic tying DB + blockchain + Sarthi together.
- `src/lib/validation/` — shared input validators (wallets, amounts, ids).
- `src/lib/discovery/` — deterministic, transparent Samooh matching/scoring.
- `src/types/` — single source of truth for shared types and enums.

## Non-negotiables

- The backend never holds a private key and never constructs an
  `ethers.Wallet`/signer. All state-changing transactions happen client-side.
- `POST /api/proposals` and `POST /api/sarthi/proposal` write metadata only
  (`status: DRAFT`). They cannot vote, approve, reject, execute, or move funds.
- Sarthi (`src/lib/sarthi/`) only ever returns advisory insight drafts.
- Proposal `status` returned by the API is reconciled against the chain,
  never trusted from the DB alone, whenever an `onchain_proposal_id` exists.
- `POST /api/samooh/[id]/join` only ever creates a `samooh_join_requests`
  row (`status: REQUESTED`). It never inserts into `members` — actual
  membership stays governed on-chain or by a separate explicit approval step.

See `src/__tests__/` for automated checks of these invariants.
