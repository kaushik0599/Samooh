# Blockchain Integration Requirements

The backend's blockchain layer (`src/lib/blockchain/`) is a read-only
ethers.js adapter, isolated from ABI specifics so it can be updated in one
place once real contracts exist. It **never** holds a signer or private key.

## What the blockchain team must provide

1. **Contract addresses** (per network) for Governance and Treasury —
   set as `NEXT_PUBLIC_GOVERNANCE_CONTRACT` / `NEXT_PUBLIC_TREASURY_CONTRACT`,
   or stored per-Samooh in `samoohs.governance_contract` / `.treasury_contract`.
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

## Indexing

`POST /api/blockchain/sync` (`{ samooh_id, from_block }`) pulls Governance +
Treasury events since `from_block` and stores them as `activity` rows,
deduplicated by `(samooh_id, type, transaction_hash)`. Trigger it manually,
via cron, or from a frontend admin action — it's idempotent.

## What the backend will never do

- Sign or submit a transaction.
- Vote, approve, reject, or execute a proposal.
- Initiate a treasury transfer.

All of the above happen client-side, through the member's own wallet,
directly against the contracts.
