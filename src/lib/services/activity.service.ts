import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { Activity, ActivityType } from "@/types";

export interface RecordActivityInput {
  samooh_id: string;
  type: ActivityType;
  actor: string | null;
  description: string;
  transaction_hash: string | null;
}

/**
 * Insert an activity row, relying on the partial unique index
 * (samooh_id, type, transaction_hash) for on-chain event deduplication.
 * A conflict means this event was already indexed — treated as success.
 */
export async function recordActivity(input: RecordActivityInput): Promise<Activity | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("activity")
    .upsert(input, {
      onConflict: "samooh_id,type,transaction_hash",
      ignoreDuplicates: true,
    })
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
