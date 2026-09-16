# Sarthi

Advisory-only intelligence layer. Sarthi recommends; it never decides or acts.

## Pipeline

```
Collective data (Supabase + best-effort treasury balance)
  -> backend/src/lib/sarthi/context.ts   (buildSarthiContext)
  -> backend/src/lib/sarthi/provider.ts  (getSarthiProvider -> SarthiProvider.analyze)
  -> backend/src/lib/sarthi/analyzer.ts  (analyzeCollective: deterministic rules)
  -> sarthi_insights table (via POST /api/sarthi/analyze)
  -> optional proposal DRAFT (via POST /api/sarthi/proposal)
```

## MVP implementation

`analyzeCollective` is deterministic — plain rules over member count, role,
proposal fields (status, `created_by`, `recipient`, `amount`), activity
events, and treasury balance. No external AI API is required or used. This
is intentionally NOT described as AI/ML anywhere in the code or docs.

Every rule persists into the existing `sarthi_insights` shape
(`type`, `title`, `description`, `recommendation`, `priority`) with no
schema changes — richer evidence is expressed as concrete counts,
percentages, and (truncated) wallet addresses inside `description`, not as
new columns.

### Rules currently implemented (`backend/src/lib/sarthi/analyzer.ts`)

| Rule | Type | Evidentiary threshold | Priority |
|---|---|---|---|
| No proposals yet | `governance` | `members >= 3` and `proposals == 0` | medium |
| High rejection rate | `bottleneck` | `rejected >= 2` **and** `rejected/total >= 50%` | high |
| Idle treasury balance | `treasury` | on-chain balance `> 0` and `proposals == 0` | medium |
| Growing membership | `growth` | `>= 3` `MemberAdded` events in the last 30 days (not lifetime total) | low |
| Low voting participation | `participation` | `members >= 3`, `proposals >= 2`, and votes cast per proposal `< 30%` of membership | medium |
| Proposal authorship concentration | `governance` | `>= 4` proposals and one wallet authored `>= 60%` of them | medium (`>= 80%` -> high) |
| Admin role concentration | `governance` | `>= 5` members and admins are `>= 50%` of the roster | medium |
| Voting power concentration | `bottleneck` | `>= 5` recorded votes from `>= 2` distinct wallets, one wallet cast `>= 50%` | medium |
| Recurring shared recipient | `procurement` | the same proposal `recipient` appears in `>= 3` non-draft, non-rejected proposals authored by `>= 2` distinct members | medium |
| Approved proposals awaiting execution | `opportunity` | `>= 1` `APPROVED` proposal (exact count, not a ratio — see rationale below) | medium (high if `>= 3` backlog or treasury already covers the total) |

Every threshold above is deliberately more than a bare `> 0` check on a
noisy or inferred signal, so a single coincidence never produces an
insight — weak evidence produces no insight rather than a vague one. The
one exception, "approved proposals awaiting execution," uses an exact
count (`>= 1`) rather than a ratio: it reports a *directly observed fact*
(a proposal the collective already approved that hasn't reached
`EXECUTED`), not a statistical pattern inferred over noisy data, so there
is no meaningful sample-size concern to guard against.

### Priority rationale

- **low** — informational or a positive trend; nothing at risk.
- **medium** — an actionable opportunity, or an early-stage risk signal
  that merits attention but hasn't yet caused observable harm.
- **high** — either a materialized governance/financial risk (half of
  proposals already rejected, severe authorship concentration) or a
  decision the collective already made that is sitting idle with funds
  ready to act on it (an approved proposal, treasury sufficient to cover
  it, or a growing backlog of approved-but-idle proposals).

### What's implemented vs. what would need a data model change

The request behind this hardening pass asked for procurement / shared
resource matching based on members' actual needs (e.g. "four members in
the same region need the same logistics service"). That is **not**
implemented, and would be dishonest to fake: `Member` in the current
schema only has `wallet_address`, `role`, and `joined_at` — there is no
per-member category, region, or declared-need field. `category`,
`region`, and `objectives` exist only at the `Samooh` level (shared by the
whole collective, not distinguishing one member's needs from another's),
and `UserOnboardingProfile` (`needs`/`objectives`/`category`/`region`) is
tied to a user's onboarding intake, not to their membership record, and
isn't joined into `SarthiContext` today.

What **is** implemented instead is the "Recurring shared recipient" rule
above: it looks at the one place cross-member overlap is actually
queryable today — `Proposal.recipient` plus `Proposal.created_by` — and
flags when multiple *different members* have proposed to the same
external recipient. That's real, structured, deterministic evidence of a
shared vendor/beneficiary relationship, just not the richer "shared
member-level procurement need" the request described.

To implement true per-member procurement/shared-resource matching later,
the data model would need one of:
- a per-member profile (category/region/needs) attached to `members` or
  linking `user_onboarding_profiles` to a samooh membership, or
- a structured tag/category field on proposals (e.g. `procurement_category`)
  so proposals across members can be grouped by *type of need*, not just
  by literal recipient address.

Neither was added here — `database/migration.sql` was intentionally left
unchanged for this pass.

## Swapping in a real AI provider later

`SarthiProvider` (`backend/src/lib/sarthi/provider.ts`) is the only seam callers
depend on. Add a new class implementing `analyze(ctx): Promise<SarthiInsightDraft[]>`
and switch `getSarthiProvider()` to return it — no other file changes.

## Formation suggestions (discovery)

`backend/src/lib/sarthi/formation.ts:suggestSamoohFormation` is a second,
independent deterministic rule: when `GET /api/discover/samoohs` finds no
relevant Samooh, it derives a `SamoohFormationSuggestion` (title, purpose,
objectives, reason) from the user's onboarding profile alone — no DB
writes, no Samooh created. It only shapes the API response so the frontend
can prefill a "Start a Samooh" form; a human still submits it via the
existing `POST /api/samooh`. This mechanism is unchanged by this pass.

## Proposal drafting

`POST /api/sarthi/proposal` turns a Sarthi recommendation into a proposal
row. `createProposal` (`backend/src/lib/services/proposals.service.ts`)
always inserts `status: "DRAFT"` server-side — the route body has no
`status` field, so nothing a client sends can make a Sarthi-drafted
proposal anything but a `DRAFT`. Sarthi cannot submit it on-chain; a human
still does that themselves through their own wallet, and a later
reconciliation records the resulting on-chain state.

## API hardening

Both `POST /api/sarthi/analyze` and `POST /api/sarthi/proposal` parse
their body through `backend/src/app/api/sarthi/parse-body.ts`
(`parseJsonBody`), which turns malformed JSON or a non-object body (null,
an array, a bare primitive) into the existing `ValidationError` ->
`400 VALIDATION_ERROR` envelope (`lib/api/response.ts`) instead of an
opaque `500`. Field-level validation still goes through the shared
`lib/validation` helpers (`requireUuid`, `requireString`,
`requireWalletAddress`, `optionalAmount`, ...); no new response shape was
introduced.

## Hard limits (enforced by convention + tests)

Sarthi cannot vote, approve, reject, execute, or transfer funds. It only
ever produces `SarthiInsight` drafts (`POST /api/sarthi/analyze`) or a
proposal `DRAFT` (`POST /api/sarthi/proposal`) — both metadata-only writes.
See `backend/src/__tests__/sarthi-analyzer.test.ts` (rule behavior +
false-positive prevention) and `backend/src/__tests__/sarthi-authority.test.ts`
(no signer/private key, no vote/approve/reject/execute/transfer-style write
call anywhere under `lib/sarthi/**` or `app/api/sarthi/**`, and the API
routes only ever call `saveSarthiInsight` / `createProposal`).
