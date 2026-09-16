import { getSupabaseServerClient } from "@/lib/supabase/client";
import { getUserByWallet } from "@/lib/services/users.service";
import { getTreasuryDepositTotal } from "@/lib/services/treasury-accounting.service";
import type { MemberRole, User } from "@samooh/types";

export interface PersonIdentitySamoohMembership {
  samooh_id: string;
  role: MemberRole;
}

/**
 * A Person's identity summary for the "Person" identity view described in
 * docs/IDENTITY_SPEC.md. Not a shared type in packages/types because it's
 * an assembled, API-facing shape rather than a DB row.
 */
export interface PersonIdentity {
  user: User;
  samoohs: PersonIdentitySamoohMembership[];
  /** This wallet's total TreasuryDeposit contribution across every Samooh, reusing treasury-accounting.service.ts. */
  total_contribution: string;
  /** Count of VoteCast activity rows by this wallet, across the Samoohs it's a member of. */
  voting_history_count: number;
}

/**
 * Returns null when the wallet has no `users` row yet — never fabricates an
 * identity for a wallet that hasn't actually connected/onboarded. Callers
 * (routes) decide how to present that (404, "not onboarded yet", etc).
 */
export async function getPersonIdentity(walletAddress: string): Promise<PersonIdentity | null> {
  const user = await getUserByWallet(walletAddress);
  if (!user) return null;

  const supabase = getSupabaseServerClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("members")
    .select("samooh_id, role")
    .eq("wallet_address", walletAddress);
  if (membershipError) {
    throw new Error(`Failed to fetch memberships: ${membershipError.message}`);
  }

  const samoohIds = (memberships ?? []).map((m) => m.samooh_id as string);

  const [totalContribution, votingHistoryCount] = await Promise.all([
    getTreasuryDepositTotal({ walletAddress }),
    countVotesCast(walletAddress, samoohIds),
  ]);

  return {
    user,
    samoohs: (memberships ?? []).map((m) => ({
      samooh_id: m.samooh_id as string,
      role: m.role as MemberRole,
    })),
    total_contribution: totalContribution,
    voting_history_count: votingHistoryCount,
  };
}

async function countVotesCast(walletAddress: string, samoohIds: string[]): Promise<number> {
  if (samoohIds.length === 0) return 0;

  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("activity")
    .select("id", { count: "exact", head: true })
    .eq("type", "VoteCast")
    .eq("actor", walletAddress)
    .in("samooh_id", samoohIds);
  if (error) throw new Error(`Failed to count voting history: ${error.message}`);
  return count ?? 0;
}
