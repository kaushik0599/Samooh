import { withErrorHandling, ok } from "@/lib/api/response";
import { requireUuid } from "@/lib/validation";
import { ValidationError } from "@/lib/api/response";
import { syncSamoohActivity } from "@/lib/services/indexing.service";

/**
 * Manual/cron trigger for the activity indexer (section 11: "easy to
 * trigger later via API, cron, or manual sync"). Not part of the frontend
 * contract's core 8 endpoints; safe to call repeatedly (idempotent via
 * activity dedupe).
 */
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const body = await req.json();
    const samoohId = requireUuid(body.samooh_id, "samooh_id");

    const fromBlock = Number(body.from_block ?? 0);
    if (!Number.isInteger(fromBlock) || fromBlock < 0) {
      throw new ValidationError("from_block must be a non-negative integer");
    }

    const result = await syncSamoohActivity(samoohId, fromBlock);
    return ok(result);
  });
}
