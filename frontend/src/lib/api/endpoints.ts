import { apiGet, apiPost } from "./client";
import type {
  Activity,
  Member,
  OnboardingPreference,
  Proposal,
  ReconciledProposal,
  Samooh,
  SamoohDiscoveryResult,
  SamoohFormationSuggestion,
  SamoohJoinRequest,
  SarthiInsight,
  User,
  UserOnboardingProfile,
} from "@samooh/types";

/**
 * One typed function per route documented in docs/API_SPEC.md — nothing
 * more. Do not add a function here unless the backend route it calls
 * actually exists; see that doc for the exact request/response shapes.
 */

export function getSamooh(id: string): Promise<Samooh> {
  return apiGet<Samooh>(`/api/samooh/${id}`);
}

export function getMembers(samoohId: string): Promise<Member[]> {
  return apiGet<Member[]>(`/api/members/${samoohId}`);
}

export function getProposals(samoohId: string): Promise<ReconciledProposal[]> {
  return apiGet<ReconciledProposal[]>(`/api/proposals/${samoohId}`);
}

export function getActivity(samoohId: string): Promise<Activity[]> {
  return apiGet<Activity[]>(`/api/activity/${samoohId}`);
}

export interface CreateSamoohInput {
  name: string;
  description?: string;
  creator_wallet: string;
  governance_contract: string;
  treasury_contract: string;
  network?: string;
  category?: string;
  purpose?: string;
  region?: string;
  objectives?: string[];
  membership_open?: boolean;
}

export function createSamooh(input: CreateSamoohInput): Promise<Samooh> {
  return apiPost<Samooh>("/api/samooh", input);
}

export interface OnboardingInput {
  wallet_address: string;
  name?: string;
  category: string;
  activity_type?: string;
  region: string;
  needs?: string[];
  objectives?: string[];
  biggest_challenge?: string;
  preference: OnboardingPreference;
}

export function submitOnboarding(
  input: OnboardingInput
): Promise<{ user: User; profile: UserOnboardingProfile }> {
  return apiPost("/api/onboarding", input);
}

export interface DiscoverSamoohsResult {
  matches: SamoohDiscoveryResult[];
  recommendation: "JOIN_SAMOOH" | "START_SAMOOH";
  suggestion: SamoohFormationSuggestion | null;
}

export function discoverSamoohs(walletAddress: string): Promise<DiscoverSamoohsResult> {
  return apiGet<DiscoverSamoohsResult>(
    `/api/discover/samoohs?wallet_address=${encodeURIComponent(walletAddress)}`
  );
}

export function joinSamooh(samoohId: string, walletAddress: string): Promise<SamoohJoinRequest> {
  return apiPost<SamoohJoinRequest>(`/api/samooh/${samoohId}/join`, {
    wallet_address: walletAddress,
  });
}

export interface CreateProposalInput {
  samooh_id: string;
  onchain_proposal_id?: string;
  title: string;
  description?: string;
  amount?: string;
  recipient?: string;
  created_by: string;
}

export function createProposal(input: CreateProposalInput): Promise<Proposal> {
  return apiPost("/api/proposals", input);
}

export function runSarthiAnalysis(samoohId: string): Promise<SarthiInsight[]> {
  return apiPost<SarthiInsight[]>("/api/sarthi/analyze", { samooh_id: samoohId });
}

export interface SarthiProposalDraftInput {
  samooh_id: string;
  title: string;
  description?: string;
  amount?: string;
  recipient?: string;
  created_by: string;
}

export function draftProposalFromSarthi(input: SarthiProposalDraftInput): Promise<Proposal> {
  return apiPost("/api/sarthi/proposal", input);
}
