import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { Activity, ActivityType } from "@samooh/types";

export interface RecordActivityInput {
  samooh_id: string;
  type: ActivityType;
  actor: string | null;
  description: string;
  transaction_hash: string | null;
  /** Structured amount/token and entity links — the Block Ledger fields. All optional/nullable. */
  amount?: string | null;
  /** Defaults to 'MATIC' when omitted, matching the column default. */
  token?: string;
  proposal_id?: string | null;
  governance_id?: string | null;
  treasury_id?: string | null;
}

/**
 * Insert an activity row, relying on the unique index
 * (samooh_id, type, transaction_hash) for on-chain event deduplication.
 * A conflict means this event was already indexed — treated as success.
 */
export async function recordActivity(input: RecordActivityInput): Promise<Activity | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("activity")
    .upsert(
      {
        ...input,
        amount: input.amount ?? null,
        token: input.token ?? "MATIC",
        proposal_id: input.proposal_id ?? null,
        governance_id: input.governance_id ?? null,
        treasury_id: input.treasury_id ?? null,
      },
      {
        onConflict: "samooh_id,type,transaction_hash",
        ignoreDuplicates: true,
      }
    )
    .select()
    .maybeSingle();

  if (error) throw new Error(`Failed to record activity: ${error.message}`);
  return (data as Activity) ?? null;
}

export async function listActivity(samoohId: string): Promise<Activity[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("activity")
    .select()
    .eq("samooh_id", samoohId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch activity: ${error.message}`);
  return (data ?? []) as Activity[];
}
