# API Spec

Base URL: this backend runs as its own app (see `backend/`), on
`http://localhost:4000` in local dev. The frontend calls it via
`NEXT_PUBLIC_API_URL` (see `frontend/.env.example`) — every path below is
relative to that base URL, not same-origin. CORS is handled uniformly by
`backend/middleware.ts` for the origin in `FRONTEND_ORIGIN`
(`backend/.env.example`); no individual route configures it.

Base response envelope:

```json
// success
{ "success": true, "data": { } }
// error
{ "success": false, "error": "message" }
// error, with optional machine-readable category
{ "success": false, "error": "message", "code": "VALIDATION_ERROR" }
```

`code` is additive and optional — always ignorable by clients that only read
`error`. When present it is one of: `VALIDATION_ERROR` (400), `NOT_FOUND`
(404), `CONFLICT` (409), `INTERNAL_ERROR` (500).

Status codes: `200` read ok, `201` created, `400` validation error,
`404` not found, `409` conflict (e.g. duplicate join request), `500` server error.

## GET /api/samooh/[id]
Returns a `Samooh`. 404 if not found.

## GET /api/members/[samoohId]
Returns `Member[]`.

## GET /api/proposals/[samoohId]
Returns `ReconciledProposal[]` — each `Proposal` plus `status_source`:
`LIVE_ONCHAIN` (status just read from chain), `CACHE` (never submitted
on-chain, DB value stands), or `BLOCKCHAIN_UNAVAILABLE` (chain not
configured/unreachable — DB value shown but not claimed as live).

## GET /api/health
No params. Always `200`. Returns
`{ status: "ok", supabase: "configured"|"not_configured", blockchain: "configured"|"not_configured", timestamp }`.
Config-presence check only — no live DB/RPC round-trip.

## GET /api/activity/[samoohId]
Returns `Activity[]`, newest first.

## POST /api/samooh
Body: `{ name, description?, creator_wallet, governance_contract, treasury_contract, network?, category?, purpose?, region?, objectives?, membership_open? }`
Creates a `Samooh`. Returns `201` with the created row. The discovery
fields are optional so existing callers are unaffected.

## POST /api/onboarding
Body: `{ wallet_address, name?, category, activity_type?, region, needs?, objectives?, biggest_challenge?, preference }`
(`preference` is `JOIN | START | EITHER`.) Upserts the caller's `users` row
by wallet (creating it if new) and their `UserOnboardingProfile`. Returns
`201` with `{ user, profile }`. ~30-60s form, no long questionnaire.

## GET /api/discover/samoohs
Query: `?wallet_address=0x...`. Requires a completed onboarding profile for
that wallet (`400` otherwise). Runs deterministic matching (see
`backend/src/lib/discovery/matcher.ts`) against every Samooh and returns:
```json
{
  "success": true,
  "data": {
    "matches": [
      { "samooh": { "id": "...", "name": "...", "category": "...", "purpose": "...", "region": "...", "description": "...", "network": "..." },
        "memberCount": 4, "membershipOpen": true, "matchScore": 82,
        "reasons": ["Same category", "Nearby", "Shared objectives", "Open to new members"] }
    ],
    "recommendation": "JOIN_SAMOOH",
    "suggestion": null
  }
}
```
When no Samooh scores above the relevance threshold, `matches` is `[]`,
`recommendation` is `"START_SAMOOH"`, and `suggestion` is a deterministic,
advisory `SamoohFormationSuggestion` (title/purpose/objectives/reason)
derived from the onboarding profile — never auto-created.

## POST /api/samooh/[id]/join
Body: `{ wallet_address }`
Creates a `SamoohJoinRequest` with `status: REQUESTED` — **never** adds
the wallet to `members`. `409` if an active (`REQUESTED`/`APPROVED`)
request already exists for that wallet + Samooh. Actual membership stays
governed on-chain or by an explicit admin approval flow (not part of this
endpoint).

## POST /api/proposals
Body: `{ samooh_id, onchain_proposal_id?, title, description?, amount?, recipient?, created_by }`
Records proposal **metadata only** with `status: DRAFT`. Never
votes/approves/executes/transfers. Submitting on-chain and updating
`onchain_proposal_id` happens through the client wallet + a follow-up write.
`409` if a proposal with that `onchain_proposal_id` already exists for the Samooh.

## POST /api/sarthi/analyze
Body: `{ samooh_id }`
Runs Sarthi's deterministic analysis over the Samooh's current data
(members, proposals, activity, treasury balance) and persists the
resulting `SarthiInsight[]`. Returns `201` with the saved insights.

## POST /api/sarthi/proposal
Body: `{ samooh_id, title, description?, amount?, recipient?, created_by }`
Creates a proposal **draft** (same guarantees as `POST /api/proposals`)
from a Sarthi recommendation. Does not touch the chain.

## POST /api/blockchain/sync (internal/ops)
Body: `{ samooh_id, from_block? }`
Manually triggers the activity indexer for one Samooh (see
BLOCKCHAIN_INTEGRATION.md). Idempotent — safe to call repeatedly or via cron.

## Shared types

All request/response shapes reference `packages/types/src/index.ts`:
`User`, `Samooh`, `Member`, `Proposal`, `ReconciledProposal`,
`ProposalStatusSource`, `SarthiInsight`, `Activity`, `BlockchainProposal`,
`GovernanceState`, `TreasuryState`, `UserOnboardingProfile`,
`SamoohJoinRequest`, `SamoohDiscoveryResult`, `SamoohFormationSuggestion`.

`Proposal.status` lifecycle: `DRAFT -> CREATED -> VOTING -> APPROVED | REJECTED -> EXECUTED`,
or `EXPIRED` at any point after `CREATED`.
