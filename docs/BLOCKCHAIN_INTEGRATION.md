# Blockchain Integration Requirements

The backend's blockchain layer (`src/lib/blockchain/`) is a read-only
ethers.js adapter, isolated from ABI specifics so it can be updated in one
place once real contracts exist. It **never** holds a signer or private key.

## What the blockchain team must provide

1. **Contract addresses** (per network) for Governance and Treasury —
   set as `NEXT_PUBLIC_GOVERNANCE_CONTRACT` / `NEXT_PUBLIC_TREASURY_CONTRACT`,
   or stored per-Samooh in `samoohs.governance_contract` / `.treasury_contract`.
   Every adapter validates the address shape (`ethers.isAddress`) before
   constructing a contract instance — a missing or malformed address fails
   with a clear `BlockchainNotConfiguredError` instead of a raw ethers
   error (see `requireConfiguredAddress` in `src/lib/blockchain/errors.ts`).
2. **ABI** for both contracts — drop into
   `src/lib/blockchain/abi/governance.abi.ts` and `treasury.abi.ts`
   (currently empty placeholders; every adapter call throws
   `BlockchainNotConfiguredError` until filled in).
3. **Network**: Polygon Amoy, chain id `80002` (`NEXT_PUBLIC_CHAIN_ID`).

## Expected read functions (Governance)

The adapter (`adapters/governance.adapter.ts`) calls:
- `getProposal(proposalId) -> RawProposal` — see the exact shape assumed
  in `src/lib/blockchain/normalize.ts`:
  `{ proposalId, status: uint8, votesFor, votesAgainst, quorum, recipient, amount, executed }`
- Assumed status enum (confirm/replace in `normalize.ts`):
  `0=CREATED 1=VOTING 2=APPROVED 3=REJECTED 4=EXECUTED 5=EXPIRED`

## Expected events

Governance: `ProposalCreated`, `VoteCast`, `ProposalApproved`,
`ProposalRejected`, `ProposalExecuted`, `MemberAdded`, `MemberRemoved`.

Treasury: `TreasuryDeposit`, `TreasuryTransfer`.

Event args are read generically (`src/lib/blockchain/events.ts:extractActor`
tries common field names: `member/voter/proposer/actor/from/by`). Once the
real event signatures are known, tighten `extractActor` / `describeEvent`
to use the actual field names for richer activity descriptions.

## Reconciliation / status source

`GET /api/proposals/[samoohId]` never silently trusts the DB. Every
proposal it returns carries `status_source`:
- `LIVE_ONCHAIN` — status was just read from the configured contract.
- `CACHE` — proposal has no `onchain_proposal_id` yet (never submitted).
- `BLOCKCHAIN_UNAVAILABLE` — chain not configured, ABI missing, or the RPC
  call failed; the DB value is shown but explicitly not claimed as live.

See `src/lib/services/reconcile.service.ts`.

## Indexing

`POST /api/blockchain/sync` (`{ samooh_id, from_block }`) pulls Governance +
Treasury events since `from_block` and stores them as `activity` rows,
deduplicated by `(samooh_id, type, transaction_hash)`. Trigger it manually,
via cron, or from a frontend admin action — it's idempotent.

**No "last synced block" is tracked anywhere** (not in the DB, not in
memory). This is a deliberate simplicity choice for this project's scope,
not an oversight: the caller (cron job, admin UI, or operator) is
responsible for passing an appropriate `from_block` each time. A practical
consequence: re-running sync with the *same or an earlier* `from_block` is
always safe (the dedupe index makes it a no-op for already-indexed events),
but calling sync with a `from_block` that skips past a range containing
real events will silently miss them — there is no gap detection. If this
indexer is ever promoted beyond "lightweight manual/cron" status, a
persisted last-synced-block (or a cursor table) should be added at that
point.

If `syncSamoohActivity` throws partway through recording a batch of events
(e.g. a transient Supabase error on the Nth event), the events already
recorded before the failure stay committed — the failure is not swallowed;
it propagates through `withErrorHandling` as a 500 so the caller knows to
retry. Retrying with the same `from_block` is safe and cheap because
already-recorded events simply no-op against the dedupe index; only the
events that didn't get recorded end up inserted.

### Known limitation: duplicate same-type events within one transaction

`RawChainEvent` (`src/lib/blockchain/events.ts`) carries only
`{ eventName, transactionHash, args }` — no block number and no log index.
The dedupe key used by `recordActivity`
(`samooh_id, type, transaction_hash`) is therefore only unique **across
transactions**, not within one. If a real contract ever emits the *same*
event type more than once in a single transaction (e.g. a batched
`TreasuryDeposit`, or multiple `VoteCast` events from one multicall tx),
the second occurrence would collide with the first on `(type,
transaction_hash)` and be silently dropped by `ignoreDuplicates: true` —
losing that activity record.

We don't have the real Governance/Treasury ABI yet, so we can't confirm
whether the eventual contracts can actually produce this shape, and this
pass deliberately does not add speculative fields or guess at it.

Ready-to-apply fix, once the blockchain team confirms same-tx duplicate
events are possible: ethers v6's `Log` objects (what
`contract.queryFilter(...)` returns in
`src/lib/blockchain/adapters/events.adapter.ts`) already expose both
`log.blockNumber` and `log.index` (the log's index within the block) at no
extra RPC cost — no adapter-level querying changes needed to obtain them.
The fix would be: extend `RawChainEvent` with a `logIndex: number` field,
include it in the dedupe key
(`samooh_id, type, transaction_hash, log_index` or similar), and add a
matching column + unique index in `database/migration.sql`. This has not
been applied speculatively — it's scoped for whoever owns
`events.adapter.ts` / `database/migration.sql` once real event signatures
land and same-tx duplication is confirmed as a real possibility.

## What the backend will never do

- Sign or submit a transaction.
- Vote, approve, reject, or execute a proposal.
- Initiate a treasury transfer.

All of the above happen client-side, through the member's own wallet,
directly against the contracts.
