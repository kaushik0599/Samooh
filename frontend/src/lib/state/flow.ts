/**
 * Single source of truth for the SAMOOH product-journey states. Two kinds
 * of consumer share this one type instead of each defining their own
 * strings:
 *  - `deriveAccountFlowState` (below) computes the ACCOUNT-level stage
 *    (used by route guards / redirects — see AppStateProvider).
 *  - The discovery flow (app/(public)/discover) sets its own local state
 *    variable of this same type as it fetches (DISCOVERING -> MATCHES_FOUND
 *    | NO_MATCHES -> JOIN_REQUESTED), since that's a page-local interaction,
 *    not account-wide state.
 */
export type SamoohFlowState =
  | "NEW_USER"
  | "ONBOARDING"
  | "ONBOARDING_COMPLETE"
  | "DISCOVERING"
  | "MATCHES_FOUND"
  | "NO_MATCHES"
  | "JOIN_REQUESTED"
  | "MEMBER_CONFIRMED"
  | "SAMOOH_CREATION"
  | "SAMOOH_CREATED";

export interface AccountFlowInput {
  walletConnected: boolean;
  hasOnboardingProfile: boolean;
  /** Set once the user has a Samooh they're an active part of (joined or created). */
  hasActiveSamooh: boolean;
}

/**
 * Derives the account-level stage from facts we actually have — never
 * stored redundantly alongside those facts, so it can't drift out of sync
 * with them. Used for top-level routing decisions (e.g. "/", the root
 * layout, and the workspace layout's redirect guard).
 */
export function deriveAccountFlowState(input: AccountFlowInput): SamoohFlowState {
  if (!input.walletConnected) return "NEW_USER";
  if (!input.hasOnboardingProfile) return "ONBOARDING";
  if (!input.hasActiveSamooh) return "ONBOARDING_COMPLETE";
  return "MEMBER_CONFIRMED";
}
