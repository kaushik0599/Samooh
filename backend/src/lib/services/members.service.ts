import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { Member } from "@samooh/types";

export async function listMembers(samoohId: string): Promise<Member[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .select()
    .eq("samooh_id", samoohId)
    .order("joined_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch members: ${error.message}`);
  return (data ?? []) as Member[];
}

/** Member counts for every Samooh at once — used by discovery scoring. */
export async function countMembersBySamooh(): Promise<Record<string, number>> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("members").select("samooh_id");

  if (error) throw new Error(`Failed to count members: ${error.message}`);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { samooh_id: string }).samooh_id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
