import { getSupabaseServerClient } from "@/lib/supabase/client";
import { ConflictError } from "@/lib/api/response";
import type { JoinRequestStatus, SamoohJoinRequest } from "@samooh/types";

const ACTIVE_STATUSES: JoinRequestStatus[] = ["REQUESTED", "APPROVED"];

/**
 * Creates a JOIN REQUEST only — never adds the wallet to `members`.
 * Actual membership stays governed on-chain (or by an explicit admin
 * approval flow); the DB partial unique index enforces "one active
 * request per wallet per Samooh" alongside this application-level check.
 */
export async function createJoinRequest(
  samoohId: string,
  walletAddress: string
): Promise<SamoohJoinRequest> {
  const supabase = getSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("samooh_join_requests")
    .select()
    .eq("samooh_id", samoohId)
    .eq("wallet_address", walletAddress)
    .in("status", ACTIVE_STATUSES)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to check existing join request: ${lookupError.message}`);
  }
  if (existing) {
    throw new ConflictError("An active join request already exists for this Samooh");
  }

  const { data, error } = await supabase
    .from("samooh_join_requests")
    .insert({ samooh_id: samoohId, wallet_address: walletAddress, status: "REQUESTED" })
    .select()
    .single();

  if (error) {
    // Race with a concurrent request hitting the DB unique index.
    if (error.code === "23505") {
      throw new ConflictError("An active join request already exists for this Samooh");
    }
    throw new Error(`Failed to create join request: ${error.message}`);
  }

  return data as SamoohJoinRequest;
}

export async function updateJoinRequestStatus(
  id: string,
  status: Extract<JoinRequestStatus, "APPROVED" | "REJECTED" | "CANCELLED">
): Promise<SamoohJoinRequest> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("samooh_join_requests")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update join request: ${error.message}`);
  return data as SamoohJoinRequest;
}
