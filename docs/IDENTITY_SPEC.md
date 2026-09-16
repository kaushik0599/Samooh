# Identity, Treasury Accounting & Block Ledger Spec

Authoritative shared contract for this expansion, written before any
parallel implementation work — per project convention, nobody invents a
competing data model independently. `database/migration.sql` and
`packages/types/src/index.ts` already implement everything described
here; this doc explains the *why* and the exact formulas/behavior any
service must follow.

## Application IDs

Every important entity gets a stable, human-readable `display_id`,
additive to its existing uuid `id` (uuid stays the real relational key —
FKs, uniqueness, everything internal still uses it). Format:
`SMH-<KIND>-######`, generated from a dedicated Postgres sequence with a
column default (`nextval(...)`), so it's assigned atomically on insert
with no application-level race condition.

| Entity | Table | Prefix | Example |
|---|---|---|---|
| Person | `users` | `SMH-P-` | `SMH-P-000381` |
| Samooh | `samoohs` | `SMH-S-` | `SMH-S-000007` |
| Proposal | `proposals` | `SMH-PR-` | `SMH-PR-000142` |
| Governance | `governance_identities` (new) | `SMH-G-` | `SMH-G-000024` |
| Treasury | `treasury_accounts` (new) | `SMH-TR-` | `SMH-TR-000001` |
| Ledger entry | `activity` (extended, NOT a new table) | `SMH-TX-` | `SMH-TX-000821` |
| Impact record | `impact_records` (new) | `SMH-IM-` | `SMH-IM-000042` |

**Always display `display_id` to a person, never the raw uuid or the raw
wallet address as the primary identity.** The wallet is shown as
secondary, explained information (see UI section).

## Why governance_identities / treasury_accounts are new tables, not new columns on samoohs

A Samooh's `governance_contract`/`treasury_contract` addresses already
lived as columns on `samoohs`. Two reasons this wasn't enough and a real
(small, 1:1, non-redundant) table was worth adding instead of just
tacking on more columns:

1. The ledger (`activity`) needs to link a row to "the governance
   instance" or "the treasury account" via a normal FK
   (`governance_id`/`treasury_id`), which needs a table to point at.
2. Governance/treasury each carry their own identity, deployment
   provenance (tx hash, block), and rules (quorum %, voting period) that
   don't belong as loose columns on the Samooh entity conceptually, and
   letting them be genuinely null (undeployed/unknown) without touching
   `samoohs`' own required fields keeps the Samooh row itself simple.

Both tables are exactly 1:1 with `samoohs` today (one Governance +
Treasury pair per Samooh, from `SamoohFactory`), enforced by a `unique
(samooh_id)` constraint. `contract_address` is NOT NULL on both — because
`samoohs.governance_contract`/`treasury_contract` are themselves NOT NULL
already (a Samooh cannot be created without them — see
`frontend/src/components/samooh/StartSamooh.tsx`), so this is never a
guess, only a mirror of already-required data. **What's genuinely
optional and stays null until real**: `deployment_tx_hash`,
`deployment_block`, `voting_period_seconds` — nothing populates these yet
because the current Samooh-creation flow doesn't call
`SamoohFactory.createSamooh()` from the frontend (it takes an
already-deployed pair of addresses directly — see
`docs/BLOCKCHAIN_INTEGRATION.md`). Until that changes, these three
columns are honestly `null`, and the API/UI must render "Not recorded"
rather than inventing a transaction hash. **This is a known gap, not
silently patched** — see the final report's REMAINING section for what
Claude's blockchain integration would need to add (calling the factory
from a signed frontend transaction, capturing the receipt) to fill it in
for real.

## Why the Block Ledger is `activity`, extended — not a new table

`activity` already records every governance/treasury on-chain event
(`ProposalCreated`, `VoteCast`, `ProposalApproved`, `ProposalRejected`,
`ProposalExecuted`, `MemberAdded`, `MemberRemoved`, `TreasuryDeposit`,
`TreasuryTransfer`) with `actor`/`transaction_hash`/`description`. The
Block Ledger is a richer *view* of exactly this data — not a parallel
concept. Extending it (added: `display_id`, `amount`, `token`, `status`,
`block_number`, `proposal_id`, `governance_id`, `treasury_id`) and adding
a `LedgerService` on top (filtering, detail assembly, summary totals) is
strictly reuse; creating a second `transactions`/`ledger_entries` table
alongside `activity` would just be two sources of truth for the same
facts. `ContributionService`/"Contribution Ledger" in the original
request is likewise **not** a separate table — a contribution is exactly
an `activity` row with `type = 'TreasuryDeposit'`; `amount`/`token` now
being real columns (not buried in free text) makes that queryable
directly.

`status` defaults to `'CONFIRMED'` for both new and backfilled rows,
because `activity` has only ever been written for things that already
happened on-chain or as a real metadata action — there was never a
pending/speculative row before this change, so `CONFIRMED` is the
correct default, not a guess. `PENDING`/`FAILED` exist for future use
(e.g. an optimistic row written before a transaction confirms) but
nothing in this pass writes them yet — don't claim pending-state UI is
wired unless it actually is.

## Treasury accounting formulas

Implemented in `TreasuryAccountingService` (`backend/src/lib/services/treasury-accounting.service.ts`):

- `total_contributions` = `sum(activity.amount) where type = 'TreasuryDeposit' and samooh_id = X`
- `committed` = `sum(proposals.amount) where samooh_id = X and status = 'APPROVED'` (approved, not yet executed — the moment a proposal executes, its amount leaves "committed" because it's now reflected in the live on-chain `balance` already having been debited; do not double count an EXECUTED proposal's amount in `committed`)
- `balance` = live on-chain read via the existing `getTreasuryBalance` adapter (`backend/src/lib/blockchain`); `null` if unconfigured/unreachable — never falls back to `total_contributions` or any derived number pretending to be the real balance
- `available` = `balance - committed` when `balance` is not null, else `null`
- `user_contribution` = `sum(activity.amount) where type = 'TreasuryDeposit' and samooh_id = X and lower(actor) = lower(wallet)`, only computed when a wallet is provided
- `contributor_count` = count of distinct `actor` among `TreasuryDeposit` activity rows for the Samooh

`ProposalFundingProgress.percent_covered` = `min(100, floor(balance_available / requested * 100))` when both are known, else `null`. This is coverage-by-treasury-balance, not proposal-earmarked crowdfunding — see the type's doc comment in `packages/types`. Do not build a UI that implies members individually funded *this* proposal unless a real earmarking mechanism is added later (it is not part of this pass).

## Proposal lifecycle mapping

The existing DB enum (`DRAFT | CREATED | VOTING | APPROVED | REJECTED | EXECUTED | EXPIRED`) is **not renamed** — too much already depends on the exact strings (blockchain reconciliation, existing tests). Map the requested conceptual lifecycle onto it in the UI layer only:

`DRAFT` → DRAFT · `CREATED` → SUBMITTED (metadata persisted, not yet on-chain — rare/transient in practice since most proposals go DRAFT→VOTING directly once submitted on-chain) · `VOTING` → ACTIVE · `APPROVED`/`REJECTED`/`EXPIRED` → unchanged · `EXECUTED` → EXECUTED, and once an `impact_records` row exists and has `status != 'NOT_STARTED'`, the UI may additionally badge it "TRACKING" — that's a UI-layer label, not a new DB status.

## Impact tracking

`impact_records` has at most one row per proposal, created **only** when a member explicitly records real post-execution data through the impact API (no automatic creation at execution time, no seeded placeholder row). A proposal with no row simply renders "Impact tracking not yet available" — never a fabricated capital/ROI number. There is intentionally no ROI/growth-rate column: the spec explicitly forbids inventing one, and no real formula for it exists yet given available data; if `capital_deployed` and a later real outcome measurement both exist, a simple, clearly-labeled ratio may be computed and shown as "Estimate", never presented as a historical fact.

## Sarthi idea fields

`sarthi_insights` gained `evidence jsonb[] `, `estimated_cost`, `cost_currency`, `timeline`, `risk_level`, `confidence` — all nullable/optional. A rule that can't honestly populate one of these leaves it null; the API/UI render "Estimate unavailable" rather than omit the field silently or fabricate a plausible-looking number. See `docs/SARTHI.md` for the full rule table.

## Person identity

`users.display_id` (`SMH-P-######`) is assigned automatically on user creation (same sequence-default mechanism). The existing onboarding flow already creates a `users` row keyed by wallet address on first connect (`backend/src/lib/services/users.service.ts` — check the exact function name before assuming); nothing about *when* a Person record is created changes, only that it now carries a display id from the moment it's created. The frontend must show `display_id` prominently (e.g. "Ashray — SAMOOH ID: SMH-P-000381") and treat the wallet address as secondary, explained detail behind a "View wallet details" affordance — never the primary label.
