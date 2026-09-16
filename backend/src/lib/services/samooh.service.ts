import { getSupabaseServerClient } from "@/lib/supabase/client";
import { NotFoundError } from "@/lib/api/response";
import type { Samooh } from "@samooh/types";

export interface CreateSamoohInput {
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
}

export async function createSamooh(input: CreateSamoohInput): Promise<Samooh> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("samoohs")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create samooh: ${error.message}`);
  return data as Samooh;
}

/**
 * Fetches all Samoohs for discovery scoring. The candidate set stays small
 * enough for a hackathon MVP that in-process scoring (rather than a DB-side
 * ranking query) is simplest and fully transparent — see discovery.service.ts.
 */
export async function listAllSamoohs(): Promise<Samooh[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("samoohs").select();

  if (error) throw new Error(`Failed to fetch samoohs: ${error.message}`);
  return (data ?? []) as Samooh[];
}

export async function getSamoohById(id: string): Promise<Samooh> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("samoohs")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch samooh: ${error.message}`);
  if (!data) throw new NotFoundError("Samooh not found");
  return data as Samooh;
}
