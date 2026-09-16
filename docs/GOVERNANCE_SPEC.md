# SAMOOH Governance Contract Spec

This is the canonical interface both the Solidity contracts and every
consumer (`backend/src/lib/blockchain/**`, `frontend/src/lib/wallet/**`)
must conform to. Written before any Solidity, per project convention —
nobody invents an interface independently; this document is it.

## Scope

MVP governance for one Samooh's collective decision-making. Deliberately
minimal: no governance token, no delegation, no proposal categories, no
upgradeability. One wallet = one voting identity, membership controlled by
governance itself (not by the backend).

## Contracts

- **`SamoohGovernance`** — membership, proposals, voting, execution
  authorization.
- **`SamoohTreasury`** — holds native POL, accepts deposits, only releases
  funds when instructed by its paired `SamoohGovernance` contract.
- **`SamoohFactory`** — deploys one `SamoohGovernance` + one
  `SamoohTreasury` pair per Samooh, wires them to each other.

## Membership

- `addMember(address)` / `removeMember(address)` — callable only by the
  contract owner (the deployer/admin address passed to the constructor,
  e.g. the Samooh's creator wallet — see "Access control" below). This is
  the MVP mechanism; it is not the backend, and not arbitrary — see
  Security Invariants.
- Duplicate `addMember` on an existing member reverts (`AlreadyMember`).
- `removeMember` on a non-member reverts (`NotMember`).
- Membership is a simple `mapping(address => bool)` plus an enumerable
  array for `getMembers()` and `memberCount()` (needed for quorum math).
- A member removed after voting on a still-open proposal does **not**
  retroactively invalidate their vote (their vote already counted at cast
  time) — this is standard governance behavior and keeps the contract
  simple; not treated as a bug.

## Proposals

```solidity
struct Proposal {
    uint256 id;
    address proposer;
    address recipient;      // 0x0 if the proposal has no fund transfer
    uint256 amount;          // wei; 0 if no fund transfer
    string  metadataURI;     // off-chain reference (e.g. the Supabase proposal id/description pointer) — the chain never stores free-text description
    uint256 createdAt;
    uint256 votingDeadline;
    uint256 votesFor;
    uint256 votesAgainst;
    uint256 quorumVotesRequired;  // snapshotted at creation: ceil(memberCount * 50 / 100)
    ProposalState state;
    bool executed;
}

enum ProposalState { Active, Approved, Rejected, Expired, Executed }
```

- `createProposal(address recipient, uint256 amount, string metadataURI, uint256 votingPeriodSeconds)` — only callable by a member. Snapshots `quorumVotesRequired` from the CURRENT `memberCount()` at creation time (not recomputed later — a proposal's quorum bar doesn't move if membership changes mid-vote). Reverts if `recipient` is set but `amount == 0` or vice versa is fine (a proposal can be recipient=0x0/amount=0 for a non-financial decision) — only revert on `amount > 0 && recipient == address(0)`.
- `vote(uint256 proposalId, bool support)` — only callable by a member, only while `state == Active` and `block.timestamp <= votingDeadline`. One vote per member per proposal (`mapping(uint256 => mapping(address => bool)) hasVotedMap`). Reverts on: non-member (`NotMember`), already voted (`AlreadyVoted`), proposal not Active (`ProposalNotActive`), deadline passed (`VotingClosed`).
- **Quorum**: `quorumVotesRequired = ceil(memberCount * 50 / 100)` at creation, i.e. `(memberCount * 50 + 99) / 100`. Quorum is met when `votesFor + votesAgainst >= quorumVotesRequired` — total participation, not just yes-votes. (Note: this corrects a conflation in the original adapter stub, which compared `votesFor >= quorum`; see "Reconciliation with existing backend code" below.)
- **Approval**: once quorum is met, approved when `votesFor > votesAgainst` (simple majority of votes cast, not of all members). Tie (`votesFor == votesAgainst`) is **not** approved.
- **State resolution**: state transitions from `Active` to `Approved`/`Rejected`/`Expired` lazily — computed on read via `getProposalState(id)` (a view function, always accurate) AND finalized on-chain the first time `vote()` or `executeProposal()` is called after the deadline passes, OR immediately inside `vote()` if the vote just satisfied quorum+approval and the deadline hasn't passed yet is intentionally NOT early-resolved (voting always runs the full period, so a proposal can't flip from apparent-approval to rejection if late votes change the outcome — this is the simplest correct MVP rule: **resolution only happens at or after `votingDeadline`**).
  - After `votingDeadline`: quorum met AND approved → `Approved`. Quorum met AND not approved → `Rejected`. Quorum not met → `Expired`.
- `executeProposal(uint256 id)` — callable by any member (not restricted to the proposer — keeps this permissionless once approved, so execution doesn't depend on one person being online). Reverts unless: `state == Approved` (this itself requires the deadline to have passed, per above), `!executed`, and (if `amount > 0`) the Treasury has sufficient balance. On success: calls `SamoohTreasury.executeTransfer(id, recipient, amount)` if `amount > 0`, sets `executed = true`, sets `state = Executed`, emits `ProposalExecuted`.

## Events

Exact names and parameter order — the backend indexer
(`backend/src/lib/blockchain/events.ts`) already expects these names, and
`extractActor` already looks for an arg literally named `proposer`/`voter`/
`member` — parameter names below are chosen to match that without needing
backend changes.

```solidity
event MemberAdded(address indexed member, uint256 timestamp);
event MemberRemoved(address indexed member, uint256 timestamp);
event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address recipient, uint256 amount, uint256 votingDeadline);
event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
event ProposalApproved(uint256 indexed proposalId, uint256 votesFor, uint256 votesAgainst);
event ProposalRejected(uint256 indexed proposalId, uint256 votesFor, uint256 votesAgainst);
event ProposalExecuted(uint256 indexed proposalId, address recipient, uint256 amount);
```

(`ProposalApproved`/`ProposalRejected` fire when `getProposalState` first
resolves that outcome — practically, the first `vote()` or
`executeProposal()` call after the deadline that observes the resolved
state, since there's no keeper/cron. `executeProposal` always calls
`getProposalState` first, so `Approved`/`Rejected` will reliably fire no
later than whenever someone next calls `vote` or `executeProposal` on that
id — acceptable for MVP; documented as a known "someone has to poke it"
limitation, not a keeper-based auto-resolution, to avoid over-engineering.)

## Read functions (view)

```solidity
function getProposal(uint256 id) external view returns (Proposal memory);
function getProposalState(uint256 id) external view returns (ProposalState);
function getVoteCounts(uint256 id) external view returns (uint256 votesFor, uint256 votesAgainst);
function hasVoted(uint256 id, address voter) external view returns (bool);
function getQuorum(uint256 id) external view returns (uint256 required, uint256 current);
function memberCount() external view returns (uint256);
function isMember(address account) external view returns (bool);
function getMembers() external view returns (address[] memory);
```

`getProposal`'s returned struct field names above (`proposalId` is NOT a
struct field — see below) map directly onto
`backend/src/lib/blockchain/normalize.ts`'s `RawProposal`. **Correction
made to that file as part of this work**: the struct field is `id`, not
`proposalId` (matches natural Solidity struct naming); `normalize.ts` is
updated accordingly rather than forcing the contract into an awkward name
to match a pre-ABI guess.

## Treasury

```solidity
function deposit() external payable;
function getBalance() external view returns (uint256);
function executeTransfer(uint256 proposalId, address recipient, uint256 amount) external; // onlyGovernance
```

```solidity
event TreasuryDeposit(address indexed from, uint256 amount);
event TreasuryTransfer(uint256 indexed proposalId, address indexed recipient, uint256 amount);
```

- `executeTransfer` has an `onlyGovernance` modifier — the treasury is
  constructed with (or later wired to) exactly one `SamoohGovernance`
  address, and reverts (`NotGovernance`) if called by anything else,
  including the treasury's own deployer. **There is no owner-only
  withdrawal path.** This is the core "no backend backdoor, no admin
  backdoor" guarantee.
- Reentrancy: `executeTransfer` follows checks-effects-interactions
  (balance check → interaction) and additionally uses OpenZeppelin's
  `ReentrancyGuard` on both `executeTransfer` and `deposit` (deposit
  doesn't strictly need it, but it's cheap insurance against future
  changes) since real POL is moved here — no exceptions to this even for
  an MVP.

## Factory

```solidity
function createSamooh(address admin, address[] calldata initialMembers) external returns (address governance, address treasury);
event SamoohCreated(address indexed governance, address indexed treasury, address indexed admin);
```

`admin` becomes the `SamoohGovernance` owner (member-management
authority) for that instance; `initialMembers` seeds the member list
(typically just `admin` for MVP — the Samooh creator).

## Access control

- **Governance owner** (member add/remove): OpenZeppelin `Ownable`,
  constructor-set to the address passed by the factory. This is a real,
  intentional MVP simplification — not "arbitrary backend authority"
  (the backend never holds this key; it's the Samooh creator's own
  wallet, same trust level as `creator_wallet` already has in
  `samoohs.creator_wallet`). A future iteration could replace this with
  a member-vote-gated `addMember`/`removeMember`; out of scope here, and
  documented as such rather than silently pretended to be governance-gated
  today.
- **Everything else** (create proposal, vote, execute) is member-gated,
  never owner-gated.

## Reconciliation with existing backend code

Two real corrections this work makes to already-written (but never
previously verified against a real contract) backend code, both because
this spec is now ground truth where before it was a documented
assumption:

1. `normalize.ts`'s status enum drops the standalone `CREATED` state — a
   proposal is immediately `Active` (mapped to the app's `"VOTING"`
   `ProposalStatus`) the moment it's created; there is no on-chain
   "created but not yet open for voting" state. `packages/types`'s
   `ProposalStatus` type itself is unchanged (still has `DRAFT`/`CREATED`
   for the pre-chain-submission DB lifecycle) — only the chain-enum-to-
   `ProposalStatus` mapping in `normalize.ts` changes, collapsing chain
   `Active` → app `"VOTING"` directly.
2. `governance.adapter.ts`'s `getVotingStatus` previously computed
   `quorumReached = votesFor >= quorum`. Per this spec, quorum is about
   total participation, not yes-votes: corrected to
   `quorumReached = (votesFor + votesAgainst) >= quorum`.

## What stays exactly as documented in `docs/BLOCKCHAIN_INTEGRATION.md`

- Backend remains 100% read-only (no signer, ever).
- Network: Polygon Amoy, chain id `80002`.
- Known limitation carried forward: `RawChainEvent` has no log index, so
  two identical events in one transaction would collide in the activity
  dedupe key. Nothing here makes that more or less likely — noted again
  for completeness, not re-solved speculatively.
