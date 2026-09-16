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

/**
 * Creates the Samooh row, then its Governance and Treasury identity rows
 * (governance_identities / treasury_accounts — see docs/IDENTITY_SPEC.md).
 * Those two tables are 1:1 with `samoohs` and mirror the already-required
 * `governance_contract`/`treasury_contract` addresses, so this is never a
 * guess — but it IS a second and third write. There is no multi-statement
 * transaction primitive set up for this Supabase client elsewhere in the
 * codebase (see src/lib/supabase/client.ts — plain `createClient`, no RPC
 * wrapper), so these are sequential inserts rather than one atomic
 * transaction. If either follow-up insert fails, we throw clearly instead
 * of swallowing the error: a Samooh without its governance/treasury
 * identity rows is exactly the broken invariant this schema exists to
 * prevent, and the caller needs to know creation didn't fully succeed.
 */
export async function createSamooh(input: CreateSamoohInput): Promise<Samooh> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("samoohs")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create samooh: ${error.message}`);
  const samooh = data as Samooh;

  const { error: governanceError } = await supabase.from("governance_identities").insert({
    samooh_id: samooh.id,
    contract_address: samooh.governance_contract,
    network: samooh.network,
  });
  if (governanceError) {
    throw new Error(
      `Samooh ${samooh.id} was created but its governance identity row failed to save: ${governanceError.message}`
    );
  }

  const { error: treasuryError } = await supabase.from("treasury_accounts").insert({
    samooh_id: samooh.id,
    contract_address: samooh.treasury_contract,
    network: samooh.network,
  });
  if (treasuryError) {
    throw new Error(
      `Samooh ${samooh.id} was created but its treasury account row failed to save: ${treasuryError.message}`
    );
  }

  return samooh;
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
