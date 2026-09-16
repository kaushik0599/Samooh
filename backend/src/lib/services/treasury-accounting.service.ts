import { getSupabaseServerClient } from "@/lib/supabase/client";
import { getTreasuryBalance, BlockchainNotConfiguredError } from "@/lib/blockchain";
import { NotFoundError } from "@/lib/api/response";
import type { TreasurySummary, ProposalFundingProgress } from "@samooh/types";

/**
 * Amounts are stored as Postgres `numeric` and handled as decimal strings
 * end-to-end elsewhere in this codebase (see requireAmount in
 * src/lib/validation) to avoid float precision loss against on-chain token
 * amounts. There's no arbitrary-precision decimal library in this project,
 * so summation here goes through `Number` like the rest of the codebase
 * does — acceptable for this MVP's amounts, not a new precision guarantee.
 */
export function sumAmounts(rows: Array<{ amount: string | number | null }>): string {
  const total = rows.reduce(
    (acc, row) => acc + (row.amount !== null && row.amount !== undefined ? Number(row.amount) : 0),
    0
  );
  return String(total);
}

/**
 * Sum of TreasuryDeposit activity amounts, optionally scoped to one Samooh
 * and/or one wallet. Shared by this service's `getTreasurySummary`
 * (per-Samooh `total_contributions`/`user_contribution`) and
 * identity.service.ts's `getPersonIdentity` (a person's total contribution
 * across every Samooh they've ever deposited into), so the underlying
 * query lives in exactly one place — see docs/IDENTITY_SPEC.md.
 */
export async function getTreasuryDepositTotal(filters: {
  samoohId?: string;
  walletAddress?: string;
}): Promise<string> {
  const supabase = getSupabaseServerClient();
  let query = supabase.from("activity").select("amount").eq("type", "TreasuryDeposit");
  if (filters.samoohId) query = query.eq("samooh_id", filters.samoohId);
  if (filters.walletAddress) query = query.eq("actor", filters.walletAddress.toLowerCase());

  const { data, error } = await query;
  if (error) throw new Error(`Failed to sum treasury deposits: ${error.message}`);
  return sumAmounts((data ?? []) as Array<{ amount: string | number | null }>);
}

/** Count of distinct actors among TreasuryDeposit activity rows for a Samooh. */
export async function getTreasuryContributorCount(samoohId: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("activity")
    .select("actor")
    .eq("samooh_id", samoohId)
    .eq("type", "TreasuryDeposit");
  if (error) throw new Error(`Failed to count treasury contributors: ${error.message}`);

  const distinctActors = new Set(
    (data ?? [])
      .map((row) => (row as { actor: string | null }).actor)
      .filter((actor): actor is string => Boolean(actor))
  );
  return distinctActors.size;
}

/**
 * Sum of `proposals.amount` for proposals currently APPROVED but not yet
 * EXECUTED — the moment a proposal executes, its amount leaves "committed"
 * because it's already reflected in the live on-chain balance. See
 * docs/IDENTITY_SPEC.md's treasury accounting formulas.
 */
async function getCommittedAmount(samoohId: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("amount")
    .eq("samooh_id", samoohId)
    .eq("status", "APPROVED");
  if (error) throw new Error(`Failed to sum committed proposal amounts: ${error.message}`);
  return sumAmounts((data ?? []) as Array<{ amount: string | number | null }>);
}

/**
 * Live on-chain treasury balance for a Samooh's treasury contract. Never
 * falls back to a derived number pretending to be the real balance: `null`
 * means "unknown right now," not zero. Mirrors reconcile.service.ts's
 * handling of blockchain reads — a specific BlockchainNotConfiguredError
 * and any other RPC failure both degrade to `null` rather than 500ing the
 * whole treasury summary.
 */
async function readLiveBalance(contractAddress: string): Promise<string | null> {
  try {
    const state = await getTreasuryBalance(contractAddress);
    return state.balance;
  } catch (err) {
    if (err instanceof BlockchainNotConfiguredError) {
      return null;
    }
    console.error("Failed to read live treasury balance:", err);
    return null;
  }
}

/**
 * Implements exactly the formulas documented in docs/IDENTITY_SPEC.md's
 * "Treasury accounting formulas" section. `user_contribution` is only
 * computed when a wallet address is supplied.
 */
export async function getTreasurySummary(
  samoohId: string,
  walletAddress?: string
): Promise<TreasurySummary> {
  const supabase = getSupabaseServerClient();

  const { data: treasuryAccount, error: treasuryError } = await supabase
    .from("treasury_accounts")
    .select()
    .eq("samooh_id", samoohId)
    .maybeSingle();
  if (treasuryError) {
    throw new Error(`Failed to fetch treasury account: ${treasuryError.message}`);
  }
  if (!treasuryAccount) {
    throw new NotFoundError("Treasury account not found for this Samooh");
  }

  const [totalContributions, committed, contributorCount, userContribution, balance] =
    await Promise.all([
      getTreasuryDepositTotal({ samoohId }),
      getCommittedAmount(samoohId),
      getTreasuryContributorCount(samoohId),
      walletAddress ? getTreasuryDepositTotal({ samoohId, walletAddress }) : Promise.resolve(null),
      readLiveBalance(treasuryAccount.contract_address as string),
    ]);

  const available = balance !== null ? String(Number(balance) - Number(committed)) : null;

  return {
    samooh_id: samoohId,
    treasury_id: treasuryAccount.id as string,
    display_id: treasuryAccount.display_id as string,
    contract_address: treasuryAccount.contract_address as string,
    network: treasuryAccount.network as string,
    balance,
    total_contributions: totalContributions,
    committed,
    available,
    contributor_count: contributorCount,
    user_contribution: userContribution,
  };
}

/**
 * Coverage-by-treasury-balance, NOT per-proposal earmarked crowdfunding —
 * see ProposalFundingProgress's doc comment in packages/types. Reuses
 * getTreasurySummary (rather than re-deriving balance/committed) so the two
 * never disagree; `covered_by_treasury` is the Samooh's `available` figure
 * (balance minus everything else already committed), and
 * `percent_covered = min(100, floor(covered_by_treasury / requested * 100))`
 * per docs/IDENTITY_SPEC.md, exactly, with no extra clamping invented here.
 */
export async function getProposalFundingProgress(
  proposalId: string
): Promise<ProposalFundingProgress> {
  const supabase = getSupabaseServerClient();
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("id, samooh_id, amount")
    .eq("id", proposalId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch proposal: ${error.message}`);
  if (!proposal) throw new NotFoundError("Proposal not found");

  const requested = (proposal.amount as string | null) ?? null;

  let coveredByTreasury: string | null = null;
  try {
    const summary = await getTreasurySummary(proposal.samooh_id as string);
    coveredByTreasury = summary.available;
  } catch (err) {
    if (err instanceof NotFoundError) {
      // No treasury_accounts row for this Samooh — honestly unknown, not 0.
      coveredByTreasury = null;
    } else {
      throw err;
    }
  }

  let percentCovered: number | null = null;
  if (requested !== null && coveredByTreasury !== null && Number(requested) > 0) {
    percentCovered = Math.min(
      100,
      Math.floor((Number(coveredByTreasury) / Number(requested)) * 100)
    );
  }

  return {
    proposal_id: proposalId,
    requested,
    covered_by_treasury: coveredByTreasury,
    percent_covered: percentCovered,
  };
}
