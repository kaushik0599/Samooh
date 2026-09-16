// Shared backend types. Centralized to avoid duplicated status strings across files.

export type UUID = string;

/**
 * Stable, human-readable application identity, e.g. `SMH-P-000381` for a
 * Person. Distinct from `id` (the internal uuid) — never rely on `id` as
 * a user-facing identity; always display `display_id`. See
 * docs/IDENTITY_SPEC.md.
 */
export type DisplayId = string;

export interface User {
  id: UUID;
  display_id: DisplayId;
  name: string | null;
  email: string | null;
  wallet_address: string;
  created_at: string;
}

export interface Samooh {
  id: UUID;
  display_id: DisplayId;
  name: string;
  description: string | null;
  creator_wallet: string;
  governance_contract: string;
  treasury_contract: string;
  network: string;
  category: string | null;
  purpose: string | null;
  region: string | null;
  objectives: string[];
  membership_open: boolean;
  created_at: string;
}

/**
 * A Samooh's governance instance identity — separate from the Samooh
 * itself so it can carry its own display id, deployment provenance, and
 * voting-rule metadata. 1:1 with Samooh today (one Governance contract per
 * Samooh, via SamoohFactory). Deployment fields are null until a real,
 * verified on-chain deployment is recorded — never guessed.
 */
export interface GovernanceIdentity {
  id: UUID;
  display_id: DisplayId;
  samooh_id: UUID;
  contract_address: string;
  network: string;
  chain_id: number;
  quorum_percentage: number;
  voting_period_seconds: number | null;
  deployment_tx_hash: string | null;
  deployment_block: string | null;
  created_at: string;
}

/** A Samooh's treasury account identity. 1:1 with Samooh today. */
export interface TreasuryAccount {
  id: UUID;
  display_id: DisplayId;
  samooh_id: UUID;
  contract_address: string;
  network: string;
  created_at: string;
}

export type MemberRole = "admin" | "member";

export interface Member {
  id: UUID;
  samooh_id: UUID;
  wallet_address: string;
  role: MemberRole;
  joined_at: string;
}

/**
 * Proposal lifecycle. Blockchain is the authority for everything past CREATED;
 * Supabase's `status` column is a cache that must be reconciled against
 * on-chain state, never trusted on its own. See BLOCKCHAIN_INTEGRATION.md.
 */
export type ProposalStatus =
  | "DRAFT"
  | "CREATED"
  | "VOTING"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED"
  | "EXPIRED";

export interface Proposal {
  id: UUID;
  display_id: DisplayId;
  samooh_id: UUID;
  governance_id: UUID | null;
  onchain_proposal_id: string | null;
  title: string;
  description: string | null;
  purpose: string | null;
  category: string | null;
  expected_outcome: string | null;
  amount: string | null;
  recipient: string | null;
  voting_start: string | null;
  voting_end: string | null;
  status: ProposalStatus;
  created_by: string;
  created_at: string;
}

/**
 * Where a reconciled proposal's `status` actually came from — lets callers
 * tell a live on-chain read apart from a stale/offline fallback instead of
 * silently trusting the DB cache. See reconcile.service.ts.
 */
export type ProposalStatusSource = "LIVE_ONCHAIN" | "CACHE" | "BLOCKCHAIN_UNAVAILABLE";

export interface ReconciledProposal extends Proposal {
  status_source: ProposalStatusSource;
}

export type SarthiInsightType =
  | "opportunity"
  | "procurement"
  | "resource"
  | "treasury"
  | "participation"
  | "bottleneck"
  | "growth"
  | "governance";

export type SarthiPriority = "low" | "medium" | "high";

export type SarthiRiskLevel = "low" | "medium" | "high";
export type SarthiConfidence = "low" | "medium" | "high";

export interface SarthiInsight {
  id: UUID;
  samooh_id: UUID;
  type: SarthiInsightType;
  title: string;
  description: string;
  recommendation: string;
  priority: SarthiPriority;
  /** Concrete, real data points supporting this insight — never generic advice. */
  evidence: string[];
  /** Null when no honest cost estimate can be derived from real data. */
  estimated_cost: string | null;
  cost_currency: string | null;
  /** Free-text horizon, e.g. "30 days" — null when not estimable. */
  timeline: string | null;
  risk_level: SarthiRiskLevel | null;
  /** How confident Sarthi is in this read of the data, when that's a meaningful thing to state. */
  confidence: SarthiConfidence | null;
  created_at: string;
}

export type ActivityType =
  | "ProposalCreated"
  | "VoteCast"
  | "ProposalApproved"
  | "ProposalRejected"
  | "ProposalExecuted"
  | "MemberAdded"
  | "MemberRemoved"
  | "TreasuryDeposit"
  | "TreasuryTransfer";

export type LedgerEntryStatus = "PENDING" | "CONFIRMED" | "FAILED";

/**
 * `activity` doubles as the Block Ledger — no separate transactions table.
 * Every row is a real recorded event (on-chain-derived, or an off-chain
 * metadata action); `status` defaults to CONFIRMED because activity has
 * always only been written for things that already happened.
 */
export interface Activity {
  id: UUID;
  display_id: DisplayId;
  samooh_id: UUID;
  type: ActivityType;
  actor: string | null;
  description: string;
  transaction_hash: string | null;
  amount: string | null;
  token: string;
  status: LedgerEntryStatus;
  block_number: string | null;
  proposal_id: UUID | null;
  governance_id: UUID | null;
  treasury_id: UUID | null;
  created_at: string;
}

export type ImpactStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "UNDER_REVIEW";

/**
 * At most one row per proposal, created only once a member records real
 * post-execution data. A proposal with no ImpactRecord simply has no
 * impact data yet — the API/UI must say "not yet available", never
 * fabricate a number.
 */
export interface ImpactRecord {
  id: UUID;
  display_id: DisplayId;
  proposal_id: UUID;
  capital_deployed: string | null;
  deployed_at: string | null;
  objective: string | null;
  expected_outcome: string | null;
  actual_outcome: string | null;
  status: ImpactStatus;
  progress_percentage: number | null;
  created_at: string;
  updated_at: string;
}

// --- Blockchain-normalized state (read-only, derived from chain calls) ---

export interface BlockchainProposal {
  onchainProposalId: string;
  status: ProposalStatus;
  votesFor: string;
  votesAgainst: string;
  quorum: string;
  recipient: string | null;
  amount: string | null;
  executed: boolean;
}

export interface GovernanceState {
  proposal: BlockchainProposal | null;
  quorumReached: boolean;
}

export interface TreasuryState {
  balance: string;
  network: string;
  treasuryContract: string;
}

/**
 * Computed treasury accounting summary — see
 * backend/src/lib/services/treasury-accounting.service.ts for the exact
 * formulas. `balance`/`available` are null only when the live on-chain
 * balance couldn't be read (never fabricated as 0 or the last-known
 * value); everything else is derived from `activity`/`proposals` rows,
 * which are always real.
 */
export interface TreasurySummary {
  samooh_id: UUID;
  treasury_id: UUID;
  display_id: DisplayId;
  contract_address: string;
  network: string;
  /** Live on-chain balance, null if the blockchain read failed/unconfigured. */
  balance: string | null;
  /** Sum of all TreasuryDeposit activity amounts ever recorded. */
  total_contributions: string;
  /** Sum of `amount` for proposals currently APPROVED but not yet EXECUTED. */
  committed: string;
  /** balance - committed; null whenever `balance` is null. */
  available: string | null;
  contributor_count: number;
  /** This wallet's share of total_contributions; null if no wallet given. */
  user_contribution: string | null;
}

/**
 * How much of a specific proposal's requested amount the treasury can
 * currently cover. This is a coverage ratio against the treasury's live
 * balance, NOT per-proposal earmarked crowdfunding — the deployed
 * Treasury contract has no concept of a contribution being tied to one
 * proposal, so "contributed" here honestly means "covered by treasury
 * funds available right now," not "raised for this proposal specifically."
 */
export interface ProposalFundingProgress {
  proposal_id: UUID;
  requested: string | null;
  covered_by_treasury: string | null;
  percent_covered: number | null;
}

// --- Onboarding / discovery ---

export type OnboardingPreference = "JOIN" | "START" | "EITHER";

export interface UserOnboardingProfile {
  id: UUID;
  user_id: UUID;
  category: string;
  activity_type: string | null;
  region: string;
  needs: string[];
  objectives: string[];
  biggest_challenge: string | null;
  preference: OnboardingPreference;
  created_at: string;
  updated_at: string;
}

export type JoinRequestStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface SamoohJoinRequest {
  id: UUID;
  samooh_id: UUID;
  wallet_address: string;
  status: JoinRequestStatus;
  created_at: string;
  reviewed_at: string | null;
}

/**
 * A discovery match. Deliberately omits anything member-private — only
 * fields already public on Samooh, plus a derived member count and score.
 */
export interface SamoohDiscoveryResult {
  samooh: Pick<
    Samooh,
    "id" | "name" | "description" | "category" | "purpose" | "region" | "network"
  >;
  memberCount: number;
  membershipOpen: boolean;
  matchScore: number;
  reasons: string[];
}

/** Advisory-only, deterministic — see src/lib/sarthi/formation.ts. */
export interface SamoohFormationSuggestion {
  title: string;
  purpose: string;
  objectives: string[];
  reason: string;
}

// --- API envelope ---

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  /** Optional machine-readable category — additive, always safe to ignore. */
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
