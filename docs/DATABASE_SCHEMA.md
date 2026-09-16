# Database Schema

Run `database/migration.sql` in the Supabase SQL Editor. Idempotent.

Supabase owns: user profiles, Samooh metadata, proposal metadata cache,
Sarthi insights, activity/indexing records.

Blockchain remains authoritative for: proposal status, votes, quorum,
treasury balance/transfers — the `proposals.status` column here is a
**cache**, reconciled against the chain by the API layer (see
`src/lib/services/reconcile.service.ts`).

## Tables

- **users** — `id, name (nullable), email, wallet_address (unique), created_at`.
  `name` is nullable because onboarding can create a user from a wallet
  address alone.
- **samoohs** — `id, name, description, creator_wallet, governance_contract, treasury_contract, network, category, purpose, region, objectives (text[]), membership_open, created_at`
- **members** — `id, samooh_id -> samoohs, wallet_address, role (admin|member), joined_at`, unique `(samooh_id, wallet_address)`
- **proposals** — `id, samooh_id -> samoohs, onchain_proposal_id, title, description, amount, recipient, status, created_by, created_at`, unique `(samooh_id, onchain_proposal_id)`
- **sarthi_insights** — `id, samooh_id -> samoohs, type, title, description, recommendation, priority, created_at`
- **activity** — `id, samooh_id -> samoohs, type, actor, description, transaction_hash, created_at`
- **user_onboarding_profiles** — `id, user_id -> users (unique), category, activity_type, region, needs (text[]), objectives (text[]), biggest_challenge, preference (JOIN|START|EITHER), created_at, updated_at`.
  Reuses `users` for identity instead of duplicating wallet/name.
- **samooh_join_requests** — `id, samooh_id -> samoohs, wallet_address, status (REQUESTED|APPROVED|REJECTED|CANCELLED), created_at, reviewed_at`.
  Creating a request never inserts into `members` — membership stays
  governed on-chain or by a separate explicit approval step.

## Constraints

- All wallet/contract/recipient columns are checked against `^0x[a-f0-9]{40}$`.
- `activity` has a partial unique index on `(samooh_id, type, transaction_hash)`
  (where `transaction_hash is not null`) — this is how the indexer
  deduplicates on-chain events on re-sync.
- `proposals.status` is constrained to the `ProposalStatus` enum in
  `src/types/index.ts`; keep both in sync if it ever changes.
- `samooh_join_requests` has a partial unique index on
  `(samooh_id, wallet_address)` for `status in ('REQUESTED','APPROVED')` —
  only one active request per wallet per Samooh; a rejected/cancelled one
  can be re-submitted.
