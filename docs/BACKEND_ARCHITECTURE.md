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
