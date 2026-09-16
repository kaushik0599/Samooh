// Shared backend types. Centralized to avoid duplicated status strings across files.

export type UUID = string;

export interface User {
  id: UUID;
  name: string | null;
  email: string | null;
  wallet_address: string;
  created_at: string;
}

export interface Samooh {
  id: UUID;
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
  samooh_id: UUID;
  onchain_proposal_id: string | null;
  title: string;
  description: string | null;
  amount: string | null;
  recipient: string | null;
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

export interface SarthiInsight {
  id: UUID;
  samooh_id: UUID;
  type: SarthiInsightType;
  title: string;
  description: string;
  recommendation: string;
  priority: SarthiPriority;
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

export interface Activity {
  id: UUID;
  samooh_id: UUID;
  type: ActivityType;
  actor: string | null;
  description: string;
  transaction_hash: string | null;
  created_at: string;
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
