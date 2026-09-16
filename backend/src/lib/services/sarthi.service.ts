import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { SarthiInsight } from "@samooh/types";

export type CreateSarthiInsightInput = Omit<SarthiInsight, "id" | "created_at">;

export async function saveSarthiInsight(
  input: CreateSarthiInsightInput
): Promise<SarthiInsight> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("sarthi_insights")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to save Sarthi insight: ${error.message}`);
  return data as SarthiInsight;
}

export async function listSarthiInsights(samoohId: string): Promise<SarthiInsight[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("sarthi_insights")
    .select()
    .eq("samooh_id", samoohId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch Sarthi insights: ${error.message}`);
  return (data ?? []) as SarthiInsight[];
}
