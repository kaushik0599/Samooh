import { getSupabaseServerClient } from "@/lib/supabase/client";
import { NotFoundError, ValidationError } from "@/lib/api/response";
import { isUuid } from "@/lib/validation";
import { listActivity } from "@/lib/services/activity.service";
import { sumAmounts } from "@/lib/services/treasury-accounting.service";
import type { Activity, ActivityType } from "@samooh/types";

/**
 * UI-facing filter categories for the Block Ledger. Not a strict partition
 * of ActivityType — GOVERNANCE is the broad parent of everything the
 * Governance contract emits (proposal lifecycle + votes + membership
 * changes), while PROPOSALS/VOTES/MEMBERSHIP are its narrower sub-filters,
 * matching how a person would actually want to drill down from a top-level
 * tab into a specific kind of governance action. TREASURY is every
 * treasury-contract event; CONTRIBUTIONS is specifically the TreasuryDeposit
 * subset of TREASURY (money coming in, not moving out or between accounts).
 * The frontend must use exactly this mapping so its filter tabs agree with
 * what this API returns — see docs/IDENTITY_SPEC.md's Block Ledger section.
 */
export type LedgerCategory =
  | "ALL"
  | "GOVERNANCE"
  | "PROPOSALS"
  | "VOTES"
  | "TREASURY"
  | "CONTRIBUTIONS"
  | "MEMBERSHIP";

const GOVERNANCE_TYPES: ActivityType[] = [
  "ProposalCreated",
  "VoteCast",
  "ProposalApproved",
  "ProposalRejected",
  "ProposalExecuted",
  "MemberAdded",
  "MemberRemoved",
];

export const LEDGER_CATEGORY_TYPES: Record<LedgerCategory, ActivityType[] | null> = {
  ALL: null,
  GOVERNANCE: GOVERNANCE_TYPES,
  PROPOSALS: ["ProposalCreated", "ProposalApproved", "ProposalRejected", "ProposalExecuted"],
  VOTES: ["VoteCast"],
  TREASURY: ["TreasuryDeposit", "TreasuryTransfer"],
  CONTRIBUTIONS: ["TreasuryDeposit"],
  MEMBERSHIP: ["MemberAdded", "MemberRemoved"],
};

/**
 * Maps a `?type=` query value (case-insensitive category name) to the
 * concrete ActivityType values to filter by. Returns `undefined` for "ALL"
 * (no filter). Throws ValidationError for an unrecognized category so a
 * typo in the frontend's filter tab fails loudly instead of silently
 * returning everything.
 */
export function resolveLedgerCategory(raw: string): ActivityType[] | undefined {
  const key = raw.trim().toUpperCase() as LedgerCategory;
  if (!(key in LEDGER_CATEGORY_TYPES)) {
    throw new ValidationError(
      `type must be one of: ${Object.keys(LEDGER_CATEGORY_TYPES).join(", ")}`
    );
  }
  return LEDGER_CATEGORY_TYPES[key] ?? undefined;
}

/**
 * Wraps activity.service.ts's listActivity — reused, not reimplemented —
 * and filters in-process by ActivityType. In-process filtering matches
 * this codebase's existing pattern for small candidate sets (see
 * discovery.service.ts's in-process scoring) and keeps activity.service.ts
 * as the single place that queries the `activity` table.
 */
export async function listLedgerEntries(
  samoohId: string,
  filters?: { types?: ActivityType[] }
): Promise<Activity[]> {
  const entries = await listActivity(samoohId);
  if (!filters?.types || filters.types.length === 0) return entries;
  const typeSet = new Set(filters.types);
  return entries.filter((entry) => typeSet.has(entry.type));
}

/**
 * Single ledger entry detail, scoped to its Samooh. Looked up by `id`
 * (uuid) when `entryIdOrDisplayId` looks like one, otherwise by
 * `display_id` — the frontend links to ledger entries by `display_id`
 * (SMH-TX-######, see docs/IDENTITY_SPEC.md: never the raw uuid as the
 * primary identity), so this is the path most calls take in practice, but
 * accepting a uuid too keeps this usable from anywhere else in the backend
 * that already has the row id.
 */
export async function getLedgerEntry(
  samoohId: string,
  entryIdOrDisplayId: string
): Promise<Activity> {
  const supabase = getSupabaseServerClient();
  let query = supabase.from("activity").select().eq("samooh_id", samoohId);
  query = isUuid(entryIdOrDisplayId)
    ? query.eq("id", entryIdOrDisplayId)
    : query.eq("display_id", entryIdOrDisplayId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to fetch ledger entry: ${error.message}`);
  if (!data) throw new NotFoundError("Ledger entry not found");
  return data as Activity;
}

export interface LedgerSummary {
  samooh_id: string;
  total_transactions: number;
  total_contributions: string;
  total_governance_actions: number;
  total_treasury_movement: string;
}

/**
 * Summary totals for the Block Ledger home view's summary cards. Derived
 * from a single listActivity call rather than several separate aggregate
 * queries — the candidate set is small enough for this MVP (see
 * discovery.service.ts's same reasoning) and it keeps every number here
 * mutually consistent (computed from exactly the same snapshot of rows).
 */
export async function getLedgerSummary(samoohId: string): Promise<LedgerSummary> {
  const entries = await listActivity(samoohId);

  const governanceTypeSet = new Set(GOVERNANCE_TYPES);
  const totalGovernanceActions = entries.filter((entry) => governanceTypeSet.has(entry.type)).length;

  const contributions = entries.filter((entry) => entry.type === "TreasuryDeposit");
  const treasuryMovement = entries.filter(
    (entry) => entry.type === "TreasuryDeposit" || entry.type === "TreasuryTransfer"
  );

  return {
    samooh_id: samoohId,
    total_transactions: entries.length,
    total_contributions: sumAmounts(contributions),
    total_governance_actions: totalGovernanceActions,
    total_treasury_movement: sumAmounts(treasuryMovement),
  };
}
