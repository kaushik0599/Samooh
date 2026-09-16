# Backend Architecture

## Principle

"Sarthi recommends. Samooh decides. Smart contracts execute."

Supabase is a fast, queryable cache of collective metadata. The blockchain
is the sole authority for governance/treasury truth. If they disagree, the
blockchain wins — see `reconcileProposalStatus` in
`backend/src/lib/services/reconcile.service.ts`.

## Layers

```
API ROUTE (backend/src/app/api/**/route.ts)
  -> VALIDATION (backend/src/lib/validation)
  -> SERVICE (backend/src/lib/services)
  -> DATABASE (backend/src/lib/supabase) / BLOCKCHAIN (backend/src/lib/blockchain)
  -> NORMALIZED RESPONSE (backend/src/lib/api/response.ts)
```

- `backend/src/lib/supabase/` — Supabase server client (service-role key, server-only).
- `backend/src/lib/blockchain/` — read-only ethers.js adapter, isolated from ABI
  assumptions (see BLOCKCHAIN_INTEGRATION.md). No signer, ever.
- `backend/src/lib/sarthi/` — deterministic advisory analysis over collective data.
- `backend/src/lib/services/` — business logic tying DB + blockchain + Sarthi together.
- `backend/src/lib/validation/` — shared input validators (wallets, amounts, ids).
- `backend/src/lib/discovery/` — deterministic, transparent Samooh matching/scoring.
- `packages/types/src/` — single source of truth for shared types and enums,
  imported by both `backend/` and `frontend/` (a workspace package, not
  duplicated — see `packages/types/package.json`). Also holds the shared,
  non-secret blockchain ABI placeholders (`src/blockchain.ts`) both apps
  read.
- `backend/middleware.ts` — CORS for `/api/*`, since `frontend/` now calls
  this backend cross-origin as a separate app rather than same-origin.

## Non-negotiables

- The backend never holds a private key and never constructs an
  `ethers.Wallet`/signer. All state-changing transactions happen client-side.
- `POST /api/proposals` and `POST /api/sarthi/proposal` write metadata only
  (`status: DRAFT`). They cannot vote, approve, reject, execute, or move funds.
- Sarthi (`backend/src/lib/sarthi/`) only ever returns advisory insight drafts.
- Proposal `status` returned by the API is reconciled against the chain,
  never trusted from the DB alone, whenever an `onchain_proposal_id` exists.
- `POST /api/samooh/[id]/join` only ever creates a `samooh_join_requests`
  row (`status: REQUESTED`). It never inserts into `members` — actual
  membership stays governed on-chain or by a separate explicit approval step.

See `backend/src/__tests__/` for automated checks of these invariants.

## Supabase dependency

Every Supabase-backed route (everything except `GET /api/health` and the
blockchain-only reads) fails with a plain `500 Internal Server Error` /
`INTERNAL_ERROR` if `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
aren't set — `getSupabaseServerClient()` (`backend/src/lib/supabase/client.ts`)
throws before any query runs, `withErrorHandling` catches it, logs the real
"Missing Supabase configuration..." message server-side only, and returns
the generic 500 (never leaking that detail to the client, same as any
other unexpected error — see `response.ts`). This is expected, correct
behavior while Supabase isn't configured yet, not a bug. `GET /api/health`
always reports whether Supabase is configured (`data.supabase`) without
needing a real query, so it's the fastest way to confirm this is the
cause of an otherwise-generic frontend failure.

## Trust Model

**There is no wallet-signature authentication in this backend.** Every
`wallet_address` / `created_by` / `creator_wallet` / `recipient` field
accepted by an API route (body or query param) is **claimed identity only**
— it is checked for well-formed shape (`0x` + 40 hex chars) but never
cryptographically verified against a signature. The backend cannot prove
that the caller controls the private key for any address it submits.

This is an accepted MVP limitation, not an oversight, and it is safe under
the current design specifically because:

- The backend never holds a signer/private key and never executes a
  state-changing transaction. Anything with real financial or governance
  effect (voting, approving, executing, moving treasury funds, becoming a
  member) happens exclusively on-chain, signed client-side by the user's
  own wallet — see "Non-negotiables" above.
- Everything reachable by an unverified `wallet_address` today is metadata:
  a proposal *draft* (`status: DRAFT`, no on-chain effect until the user
  separately submits on-chain), a join *request* (`status: REQUESTED`,
  never membership), onboarding preferences, and Sarthi's advisory context.
  Worst case of a spoofed identity here is misleading off-chain metadata
  (e.g. a proposal drafted with someone else's address as `created_by`),
  not fund loss or unauthorized on-chain action.

**Consequence for frontend integrators:** do not treat any `wallet_address`,
`created_by`, `creator_wallet`, or `recipient` value returned by this API as
proof that the named wallet actually initiated the request. Treat it as a
label supplied by the caller, equivalent to an unverified form field.

**What real auth would require later**, if this backend ever needs to trust
identity for something with real effect: wallet-signature verification on
write requests (e.g. a SIWE-style challenge — sign a server-issued nonce,
verify the recovered address matches the claimed `wallet_address`, bind it
to a short-lived session/token), applied per-route to whichever endpoints
gain real effect. That is explicitly out of scope for this hardening pass.
