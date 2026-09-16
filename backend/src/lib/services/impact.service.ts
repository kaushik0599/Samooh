import { getSupabaseServerClient } from "@/lib/supabase/client";
import { NotFoundError, ValidationError } from "@/lib/api/response";
import type { ImpactRecord, ImpactStatus } from "@samooh/types";

export interface UpsertImpactRecordInput {
  capital_deployed?: string | null;
  deployed_at?: string | null;
  objective?: string | null;
  expected_outcome?: string | null;
  actual_outcome?: string | null;
  status?: ImpactStatus;
  progress_percentage?: number | null;
}

/**
 * null means "not yet tracked" — the expected/common case for most
 * proposals, not an error. A proposal with no row here renders "Impact
 * tracking not yet available", never a fabricated number.
 */
export async function getImpactRecord(proposalId: string): Promise<ImpactRecord | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("impact_records")
    .select()
    .eq("proposal_id", proposalId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch impact record: ${error.message}`);
  return (data as ImpactRecord) ?? null;
}

/**
 * Creates or partially updates the (at most one) impact record for a
 * proposal. Only verifies the proposal is EXECUTED — recording impact on a
 * proposal that hasn't executed yet doesn't make sense (see
 * docs/IDENTITY_SPEC.md's Impact tracking section). `input` should only
 * contain the fields the caller actually wants to set (see the /api/impact
 * route, which omits untouched keys entirely) so this stays a true partial
 * update via Supabase's upsert.
 */
export async function upsertImpactRecord(
  proposalId: string,
  input: UpsertImpactRecordInput
): Promise<ImpactRecord> {
  const supabase = getSupabaseServerClient();

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("id, status")
    .eq("id", proposalId)
    .maybeSingle();
  if (proposalError) {
    throw new Error(`Failed to fetch proposal: ${proposalError.message}`);
  }
  if (!proposal) {
    throw new NotFoundError("Proposal not found");
  }
  if (proposal.status !== "EXECUTED") {
    throw new ValidationError(
      "Impact can only be recorded for a proposal that has been EXECUTED"
    );
  }

  const { data, error } = await supabase
    .from("impact_records")
    .upsert(
      { proposal_id: proposalId, ...input, updated_at: new Date().toISOString() },
      { onConflict: "proposal_id" }
    )
    .select()
    .single();
  if (error) throw new Error(`Failed to upsert impact record: ${error.message}`);
  return data as ImpactRecord;
}
